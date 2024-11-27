import {
    Center,
    VStack,
    Text,
    Box,
    HStack,
    Flex,
    Tooltip,
    Checkbox,
    Input,
    Button,
    useNumberInput,
    Progress,
    Divider,
} from "@chakra-ui/react";
import {
    LaunchData,
    bignum_to_num,
    myU64,
    JoinData,
    request_raw_account_data,
    MintData,
    getLaunchTypeIndex,
    ListingData,
} from "../../components/Solana/state";
import { PROGRAM, Config } from "../../components/Solana/constants";
import { useCallback, useEffect, useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";
import { MdOutlineContentCopy } from "react-icons/md";
import { PieChart } from "react-minimal-pie-chart";
import { useRouter } from "next/router";
import Image from "next/image";
import useResponsive from "../../hooks/useResponsive";
import UseWalletConnection from "../../hooks/useWallet";
import trimAddress from "../../utils/trimAddress";
import WoodenButton from "../../components/Buttons/woodenButton";
import PageNotFound from "../../components/pageNotFound";
import useInitAMM from "../../hooks/jupiter/useInitAMM";
import useCheckTickets from "../../hooks/launch/useCheckTickets";
import useBuyTickets from "../../hooks/launch/useBuyTickets";
import useClaimTickets from "../../hooks/launch/useClaimTokens";
import useRefundTickets from "../../hooks/launch/useRefundTickets";
import FeaturedBanner from "../../components/featuredBanner";
import Timespan from "../../components/launchPreview/timespan";
import TokenDistribution from "../../components/launchPreview/tokenDistribution";
import useDetermineCookState, { CookState } from "../../hooks/useDetermineCookState";
import Loader from "../../components/loader";
import { WarningModal } from "../../components/Solana/modals";
import { ButtonString } from "../../components/user_status";
import Head from "next/head";
import useAppRoot from "../../context/useAppRoot";
import { getSolscanLink } from "../../utils/getSolscanLink";
import Link from "next/link";
import formatPrice from "../../utils/formatPrice";

const TokenMintPage = () => {
    const wallet = useWallet();
    const router = useRouter();
    const { mintData, launchList, joinData, listingData } = useAppRoot();

    const { pageName } = router.query;
    const { xs, sm, md, lg } = useResponsive();
    const { handleConnectWallet } = UseWalletConnection();

    const [totalCost, setTotalCost] = useState(0);
    const [ticketPrice, setTicketPrice] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const [launchData, setLaunchData] = useState<LaunchData | null>(null);
    const [listing, setListing] = useState<ListingData | null>(null);
    const [join_data, setJoinData] = useState<JoinData | null>(null);

    const [cookState, setCookState] = useState<CookState | null>(null);
    const [whitelist, setWhitelist] = useState<MintData | null>(null);
    const [launch_type, setLaunchType] = useState<number>(0);
    const [tokens_per_ticket, setTokensPerTicket] = useState<number>(0);

    let current_time = new Date().getTime();

    const { getInputProps, getIncrementButtonProps, getDecrementButtonProps } = useNumberInput({
        step: 1,
        defaultValue: 1,
        min: 1,
        max: 1000,
    });

    const inc = getIncrementButtonProps();
    const dec = getDecrementButtonProps();
    const input = getInputProps();

    const { value } = input;

    const { BuyTickets, openWarning, isWarningOpened, closeWarning } = useBuyTickets({ launchData, value });
    const { CheckTickets, isLoading: isCheckingTickets } = useCheckTickets(launchData);
    const { ClaimTokens, isLoading: isClamingTokens } = useClaimTickets(launchData);
    const { RefundTickets, isLoading: isRefundingTickets } = useRefundTickets(listing, launchData);
    const { InitAMM, isLoading: isInitLoading } = useInitAMM(launchData);

    const cook_state = useDetermineCookState({ current_time, launchData, join_data });

    let win_prob = 0;

    if (launchData !== null && launchData.tickets_sold > launchData.tickets_claimed) {
        //console.log("joiner", bignum_to_num(join_data.game_id), bignum_to_num(launchData.game_id));
        win_prob = (launchData.num_mints - launchData.mints_won) / (launchData.tickets_sold - launchData.tickets_claimed);
    }

    //console.log("launch", launchData);

    useEffect(() => {
        if (listingData === null || launchList === null) return;

        let launch = launchList.get(pageName.toString());
        if (!launch) return;
        
        setLaunchData(launch);
        setListing(listingData.get(launch.listing.toString()));
    }, [listingData, launchList, pageName]);

    useEffect(() => {
        if (joinData === null) return;
        let join = joinData.get(pageName.toString());
        if (join !== undefined && join !== null) setJoinData(join);
    }, [joinData, pageName]);

    useEffect(() => {
        if (mintData !== null && launchData !== null) {
            for (let i = 0; i < launchData.plugins.length; i++) {
                if (launchData.plugins[i]["__kind"] === "Whitelist") {
                    let whitelist_mint: PublicKey = launchData.plugins[i]["key"];
                    //console.log("have whitelist ", whitelist_mint.toString());
                    setWhitelist(mintData.get(whitelist_mint.toString()));
                }
            }
        }
    }, [mintData, launchData]);

    useEffect(() => {
        if (launchData) {
            let launch_type = launchData.launch_meta["__kind"];
            let launch_index = getLaunchTypeIndex(launch_type);
            setLaunchType(launch_index);

            setTicketPrice(bignum_to_num(launchData.ticket_price) / LAMPORTS_PER_SOL);

            if (launch_index !== 2 || launchData.tickets_sold < launchData.num_mints) {
                let one_mint = (bignum_to_num(launchData.total_supply) * (launchData.distribution[0] / 100)) / launchData.num_mints;
                setTokensPerTicket(one_mint);
            } else {
                let one_mint = (bignum_to_num(launchData.total_supply) * (launchData.distribution[0] / 100)) / launchData.tickets_sold;
                setTokensPerTicket(one_mint);
            }
        }
    }, [launchData]);

    useEffect(() => {
        if (launchData) {
            setTotalCost(value * ticketPrice);
        }
    }, [value, ticketPrice, launchData]);

    useEffect(() => {
        if (launchData) {
            setCookState(cook_state);
        }
    }, [cook_state, launchData]);

    //console.log(launchData);

    if (!pageName) return;

    if (isLoading || launchData === null || listing === null) return <Loader />;

    if (!launchData) return <PageNotFound />;

    let one_mint_frac = (100 * tokens_per_ticket) / bignum_to_num(launchData.total_supply);

    const ACTIVE = [CookState.ACTIVE_NO_TICKETS, CookState.ACTIVE_TICKETS].includes(cookState);
    const MINTED_OUT = [
        CookState.MINT_SUCCEEDED_NO_TICKETS,
        CookState.MINT_SUCCEDED_TICKETS_TO_CHECK,
        CookState.MINT_SUCCEEDED_TICKETS_CHECKED_NO_LP,
        CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP,
        CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP_TIMEOUT,
    ].includes(cookState);
    const MINT_FAILED = [CookState.MINT_FAILED_NOT_REFUNDED, CookState.MINT_FAILED_REFUNDED].includes(cookState);

    const ticketLabel = (join_data !== null ? join_data.num_tickets : 0) <= 1 ? "ticket" : "tickets";

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | {launchData.page_name}</title>
            </Head>
            <main style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)" }}>
                <FeaturedBanner featuredLaunch={launchData} featuredListing={listing} isHomePage={false} />
                <Center>
                    <VStack spacing={5} my={3} px={5} width={md ? "100%" : "80%"}>
                        <Timespan launchData={launchData} />

                        <VStack
                            gap={50}
                            p={md ? 25 : 50}
                            bg="rgba(255, 255, 255, 0.20)"
                            borderRadius={12}
                            border="1px solid white"
                            h="fit-content"
                            w={lg ? "100%" : "980px"}
                            style={{ maxWidth: lg ? "100%" : "980px" }}
                        >
                            <Flex w="100%" gap={xs ? 50 : lg ? 45 : 75} justify="space-between" direction={md ? "column" : "row"}>
                                <VStack align={md ? "center" : "start"} gap={xs ? 3 : 5}>
                                    <HStack>
                                        <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                            Price per ticket: {bignum_to_num(launchData.ticket_price) / LAMPORTS_PER_SOL}
                                        </Text>
                                        <Image
                                            src={Config.token_image}
                                            width={30}
                                            height={30}
                                            alt="Token Icon"
                                            style={{ marginLeft: -3 }}
                                        />
                                    </HStack>

                                    <Text
                                        m="0"
                                        color="white"
                                        fontSize="x-large"
                                        fontFamily="ReemKufiRegular"
                                        align={md ? "center" : "start"}
                                    >
                                        Tickets Sold: {launchData.tickets_sold}
                                    </Text>
                                    {launch_type !== 2 && (
                                        <Text
                                            m="0"
                                            color="white"
                                            fontSize="x-large"
                                            fontFamily="ReemKufiRegular"
                                            align={md ? "center" : "start"}
                                        >
                                            Total Winning Tickets: {launchData.num_mints.toLocaleString()}
                                        </Text>
                                    )}
                                    <Text
                                        m="0"
                                        color="white"
                                        fontSize="x-large"
                                        fontFamily="ReemKufiRegular"
                                        align={md ? "center" : "start"}
                                    >
                                        Tokens Per Winning Ticket: {formatPrice(tokens_per_ticket, Math.min(3, listing.decimals))}
                                        <br />({one_mint_frac.toFixed(4)}% of total supply)
                                    </Text>

                                    <HStack align="center" gap={3}>
                                        <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                            Insurance:
                                        </Text>
                                        <Checkbox size="lg" isChecked colorScheme="green" />
                                        <Tooltip
                                            label="You will get a refund for any losing tickets or if the cook fails to reach the Guaranteed Liquidity."
                                            hasArrow
                                            w={300}
                                            fontSize="large"
                                            offset={[0, 10]}
                                        >
                                            <Image width={25} height={25} src="/images/help.png" alt="Help" />
                                        </Tooltip>
                                    </HStack>
                                </VStack>

                                <VStack align="center" justify="center" gap={3}>
                                    <HStack>
                                        <Text
                                            m="0"
                                            color="white"
                                            className="font-face-kg"
                                            textAlign={"center"}
                                            fontSize={lg ? "x-large" : "xxx-large"}
                                        >
                                            {cookState === CookState.PRE_LAUNCH
                                                ? "Warming Up"
                                                : ACTIVE
                                                  ? `Total: ${totalCost.toFixed(2)}`
                                                  : MINTED_OUT
                                                    ? "Cook Out!"
                                                    : MINT_FAILED
                                                      ? "Cook Failed"
                                                      : "none"}
                                        </Text>
                                        {ACTIVE && <Image src={Config.token_image} width={40} height={40} alt="Token Icon" />}
                                    </HStack>

                                    <Box
                                        mt={-3}
                                        onClick={() => {
                                            //console.log(wallet.publicKey);
                                            if (wallet.publicKey === null) {
                                                handleConnectWallet();
                                            } else {
                                                if (cook_state === CookState.MINT_SUCCEDED_TICKETS_TO_CHECK) {
                                                    //InitAMM();
                                                    if (!isCheckingTickets) {
                                                        CheckTickets();
                                                    }
                                                } else if (ButtonString(cook_state, join_data, launchData) === "Waiting for LP") {
                                                    InitAMM();

                                                    return;
                                                } else if (
                                                    (cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_NO_LP &&
                                                        join_data?.ticket_status === 0) ||
                                                    cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP
                                                ) {
                                                    if (!isClamingTokens) {
                                                        ClaimTokens();
                                                    }
                                                } else if (
                                                    cook_state === CookState.MINT_FAILED_NOT_REFUNDED ||
                                                    CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP_TIMEOUT
                                                ) {
                                                    if (!isRefundingTickets) {
                                                        RefundTickets();
                                                    }
                                                }
                                            }
                                        }}
                                    >
                                        {(MINTED_OUT || MINT_FAILED) && (
                                            <VStack>
                                                {cookState === CookState.MINT_FAILED_REFUNDED ||
                                                cookState === CookState.MINT_SUCCEEDED_NO_TICKETS ? (
                                                    <></>
                                                ) : (
                                                    <Box mt={4}>
                                                        <WoodenButton
                                                            isLoading={isCheckingTickets || isClamingTokens || isRefundingTickets}
                                                            label={ButtonString(cook_state, join_data, launchData)}
                                                            size={28}
                                                        />
                                                    </Box>
                                                )}

                                                {MINTED_OUT &&
                                                    launch_type !== 2 &&
                                                    join_data !== null &&
                                                    join_data.num_tickets > join_data.num_claimed_tickets && (
                                                        <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                                            {(100 * win_prob).toFixed(3)}% chance per ticket
                                                        </Text>
                                                    )}
                                            </VStack>
                                        )}
                                    </Box>

                                    <HStack maxW="320px" hidden={MINTED_OUT || MINT_FAILED}>
                                        <Button {...dec} size="lg" isDisabled={cookState === CookState.PRE_LAUNCH}>
                                            -
                                        </Button>

                                        <Input
                                            {...input}
                                            size="lg"
                                            fontSize="x-large"
                                            color="white"
                                            alignItems="center"
                                            justifyContent="center"
                                            isDisabled={cookState === CookState.PRE_LAUNCH}
                                        />
                                        <Button {...inc} size="lg" isDisabled={cookState === CookState.PRE_LAUNCH}>
                                            +
                                        </Button>
                                    </HStack>

                                    <Button
                                        size="lg"
                                        isDisabled={cookState === CookState.PRE_LAUNCH}
                                        hidden={MINTED_OUT || MINT_FAILED}
                                        onClick={() => {
                                            wallet.publicKey === null ? handleConnectWallet() : openWarning();
                                        }}
                                    >
                                        {wallet.publicKey === null ? "Connect Wallet" : "Buy Tickets"}
                                    </Button>

                                    {!(cookState === CookState.PRE_LAUNCH) ? (
                                        <VStack hidden={MINTED_OUT || MINT_FAILED}>
                                            <HStack alignItems="center">
                                                <Text m="0" color="white" fontSize="large" fontFamily="ReemKufiRegular">
                                                    Platform fee: {Config.platform_fee}
                                                </Text>
                                                <Image
                                                    src={Config.token_image}
                                                    width={20}
                                                    height={20}
                                                    alt="Token Icon"
                                                    style={{ marginLeft: -3 }}
                                                />
                                            </HStack>
                                            {whitelist !== null && (
                                                <HStack alignItems="center">
                                                    <Text m="0" color="white" fontSize="large" fontFamily="ReemKufiRegular">
                                                        Whitelist Required
                                                    </Text>
                                                    <Link
                                                        href={getSolscanLink(whitelist.mint.address, "Token")}
                                                        target="_blank"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Image
                                                            src={whitelist.icon}
                                                            width={20}
                                                            height={20}
                                                            alt="Token Icon"
                                                            style={{ marginLeft: -3 }}
                                                        />
                                                    </Link>
                                                </HStack>
                                            )}
                                        </VStack>
                                    ) : (
                                        <Text m="0" color="white" fontSize="large" fontFamily="ReemKufiRegular">
                                            Tickets are not yet available for purchase.
                                        </Text>
                                    )}
                                </VStack>
                            </Flex>

                            <VStack w={xs ? "100%" : "85%"}>
                                <Flex direction={md ? "column" : "row"}>
                                    <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                        Guaranteed Liquidity:
                                    </Text>
                                    <HStack justify="center">
                                        <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                            &nbsp;
                                            {(Math.min(launchData.num_mints, launchData.tickets_sold) * launchData.ticket_price) /
                                                LAMPORTS_PER_SOL}{" "}
                                            of {(launchData.num_mints * launchData.ticket_price) / LAMPORTS_PER_SOL}
                                        </Text>
                                        <Image
                                            src={Config.token_image}
                                            width={30}
                                            height={30}
                                            alt="Token Icon"
                                            style={{ marginLeft: -3 }}
                                        />
                                    </HStack>
                                </Flex>

                                <Progress
                                    hasStripe={MINTED_OUT}
                                    mb={3}
                                    w="100%"
                                    h={25}
                                    borderRadius={12}
                                    colorScheme={
                                        cookState === CookState.PRE_LAUNCH
                                            ? "none"
                                            : ACTIVE
                                              ? "whatsapp"
                                              : MINTED_OUT
                                                ? "linkedin"
                                                : MINT_FAILED
                                                  ? "red"
                                                  : "none"
                                    }
                                    size="sm"
                                    max={(launchData.num_mints * launchData.ticket_price) / LAMPORTS_PER_SOL}
                                    min={0}
                                    value={
                                        (Math.min(launchData.num_mints, launchData.tickets_sold) * launchData.ticket_price) /
                                        LAMPORTS_PER_SOL
                                    }
                                    boxShadow="0px 5px 15px 0px rgba(0,0,0,0.6) inset"
                                />
                                {(join_data === null || join_data.num_claimed_tickets === 0) && (
                                    <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                        You own {join_data !== null ? join_data.num_tickets : 0} {ticketLabel}{" "}
                                        {join_data !== null && join_data.num_claimed_tickets < join_data.num_tickets
                                            ? "(" + (join_data.num_tickets - join_data.num_claimed_tickets) + " to check)"
                                            : ""}
                                    </Text>
                                )}
                                {join_data !== null && join_data.num_claimed_tickets > 0 && (
                                    <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                        You Have {join_data.num_winning_tickets} Winning Tickets{" "}
                                        {join_data !== null && join_data.num_claimed_tickets < join_data.num_tickets
                                            ? "(" + (join_data.num_tickets - join_data.num_claimed_tickets) + " to check)"
                                            : ""}
                                    </Text>
                                )}
                            </VStack>
                        </VStack>

                        <TokenDistribution launchData={launchData} />
                    </VStack>
                </Center>
                <WarningModal
                    launchData={launchData}
                    value={value}
                    isWarningOpened={isWarningOpened}
                    closeWarning={closeWarning}
                    BuyTickets={BuyTickets}
                />
            </main>
        </>
    );
};

export default TokenMintPage;
