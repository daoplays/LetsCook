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
import { LaunchData, bignum_to_num, myU64, JoinData, request_raw_account_data } from "../../components/Solana/state";
import { PROGRAM, RPC_NODE, WSS_NODE } from "../../components/Solana/constants";
import { useCallback, useEffect, useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";
import { MdOutlineContentCopy } from "react-icons/md";
import { PieChart } from "react-minimal-pie-chart";
import { useRouter } from "next/router";
import Image from "next/image";
import useResponsive from "../../hooks/useResponsive";
import UseWalletConnection from "../../hooks/useWallet";
import trimAddress from "../../hooks/trimAddress";
import WoodenButton from "../../components/Buttons/woodenButton";
import PageNotFound from "../../components/pageNotFound";
import useCheckTickets from "../../hooks/useCheckTickets";
import useBuyTickets from "../../hooks/useBuyTickets";
import useClaimTickets from "../../hooks/useClaimTokens";
import useRefundTickets from "../../hooks/useRefundTickets";
import Links from "../../components/Buttons/links";
import FeaturedBanner from "../../components/featuredBanner";
import Timespan from "../../components/launchPreview/timespan";
import TokenDistribution from "../../components/launchPreview/tokenDistribution";
import useDetermineCookState, { CookState } from "../../hooks/useDetermineCookState";
import Loader from "../../components/loader";
import { WarningModal } from "../../components/Solana/modals";

const MintPage = () => {
    const wallet = useWallet();
    const router = useRouter();
    const { pageName } = router.query;
    const { xs, sm, md, lg } = useResponsive();
    const { handleConnectWallet } = UseWalletConnection();

    const [totalCost, setTotalCost] = useState(0);
    const [ticketPrice, setTicketPrice] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const [launchData, setLaunchData] = useState<LaunchData | null>(null);
    const [join_data, setJoinData] = useState<JoinData | null>(null);
    const [cookState, setCookState] = useState<CookState | null>(null);

    let current_time = new Date().getTime();

    const { getInputProps, getIncrementButtonProps, getDecrementButtonProps } = useNumberInput({
        step: 1,
        defaultValue: 1,
        min: 1,
        max: 100,
    });

    const inc = getIncrementButtonProps();
    const dec = getDecrementButtonProps();
    const input = getInputProps();

    const { value } = input;

    const { BuyTickets, openWarning, isWarningOpened, closeWarning } = useBuyTickets({ launchData, value });
    const { CheckTickets } = useCheckTickets(launchData);
    const { ClaimTokens } = useClaimTickets(launchData);
    const { RefundTickets } = useRefundTickets(launchData);

    const cook_state = useDetermineCookState({ current_time, launchData, join_data });

    const checkLaunchData = useRef<boolean>(true);

    // updates to token page are checked using a websocket to get real time updates
    const join_account_ws_id = useRef<number | null>(null);
    const launch_account_ws_id = useRef<number | null>(null);

    // when page unloads unsub from any active websocket listeners
    useEffect(() => {
        return () => {
            console.log("in use effect return");
            const unsub = async () => {
                const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });
                if (join_account_ws_id.current !== null) {
                    await connection.removeAccountChangeListener(join_account_ws_id.current);
                    join_account_ws_id.current = null;
                }
                if (launch_account_ws_id.current !== null) {
                    await connection.removeAccountChangeListener(launch_account_ws_id.current);
                    launch_account_ws_id.current = null;
                }
                await connection.removeAccountChangeListener(launch_account_ws_id.current);
            };
            unsub();
        };
    }, []);

    const check_launch_update = useCallback(
        async (result: any) => {
            console.log(result);
            // if we have a subscription field check against ws_id

            let event_data = result.data;

            console.log("have event data", event_data, launch_account_ws_id.current);
            let account_data = Buffer.from(event_data, "base64");

            const [updated_data] = LaunchData.struct.deserialize(account_data);

            console.log(updated_data);

            if (updated_data.num_interactions > launchData.num_interactions) {
                setLaunchData(updated_data);
            }
        },
        [launchData],
    );

    const check_join_update = useCallback(
        async (result: any) => {
            console.log(result);
            // if we have a subscription field check against ws_id

            let event_data = result.data;

            console.log("have event data", event_data, join_account_ws_id.current);
            let account_data = Buffer.from(event_data, "base64");
            try {
                const [updated_data] = JoinData.struct.deserialize(account_data);

                console.log(updated_data);

                if (join_data === null) {
                    setJoinData(updated_data);
                    return;
                }

                if (updated_data.num_tickets > join_data.num_tickets || updated_data.num_claimed_tickets > join_data.num_claimed_tickets) {
                    setJoinData(updated_data);
                }
            } catch (error) {
                console.log("error reading join data");
                setJoinData(null);
            }
        },
        [join_data],
    );

    // launch account subscription handler
    useEffect(() => {
        if (launchData === null) return;

        const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });

        if (launch_account_ws_id.current === null) {
            console.log("subscribe 1");
            let launch_data_account = PublicKey.findProgramAddressSync(
                [Buffer.from(launchData.page_name), Buffer.from("Launch")],
                PROGRAM,
            )[0];

            launch_account_ws_id.current = connection.onAccountChange(launch_data_account, check_launch_update, "confirmed");
        }

        if (join_account_ws_id.current === null && wallet !== null && wallet.publicKey !== null) {
            console.log("subscribe 2");
            const game_id = new myU64(launchData.game_id);
            const [game_id_buf] = myU64.struct.serialize(game_id);

            let user_join_account = PublicKey.findProgramAddressSync(
                [wallet.publicKey.toBytes(), game_id_buf, Buffer.from("Joiner")],
                PROGRAM,
            )[0];

            join_account_ws_id.current = connection.onAccountChange(user_join_account, check_join_update, "confirmed");
        }
    }, [wallet, launchData, check_join_update, check_launch_update]);

    let win_prob = 0;

    //if (join_data === null) {
    //    console.log("no joiner info");
    // }

    if (launchData !== null && launchData.tickets_sold > launchData.tickets_claimed) {
        //console.log("joiner", bignum_to_num(join_data.game_id), bignum_to_num(launchData.game_id));
        win_prob = (launchData.num_mints - launchData.mints_won) / (launchData.tickets_sold - launchData.tickets_claimed);
    }

    const fetchLaunchData = useCallback(async () => {
        if (!checkLaunchData.current) return;
        if (pageName === undefined || pageName === null) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        let new_launch_data: [LaunchData | null, number] = [launchData, 0];

        if (launchData === null) {
            try {
                let page_name = pageName ? pageName : "";
                let launch_data_account = PublicKey.findProgramAddressSync(
                    [Buffer.from(page_name.toString()), Buffer.from("Launch")],
                    PROGRAM,
                )[0];

                const launch_account_data = await request_raw_account_data("", launch_data_account);

                new_launch_data = LaunchData.struct.deserialize(launch_account_data);

                //console.log(new_launch_data);

                setLaunchData(new_launch_data[0]);
            } catch (error) {
                console.error("Error fetching launch data:", error);
            }
        }

        if (wallet === null || wallet.publicKey === null) {
            setIsLoading(false);
            return;
        }

        const game_id = new myU64(new_launch_data[0]?.game_id);
        const [game_id_buf] = myU64.struct.serialize(game_id);

        let user_join_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), game_id_buf, Buffer.from("Joiner")],
            PROGRAM,
        )[0];

        if (join_data === null) {
            //console.log("check join data")
            try {
                const join_account_data = await request_raw_account_data("", user_join_account);

                if (join_account_data === null) {
                    setIsLoading(false);
                    checkLaunchData.current = false;
                    return;
                }

                const [new_join_data] = JoinData.struct.deserialize(join_account_data);

                console.log(new_join_data);

                setJoinData(new_join_data);
            } catch (error) {
                console.error("Error fetching join data:", error);
                setIsLoading(false);
                checkLaunchData.current = false;
            }
        }
        checkLaunchData.current = false;
        setIsLoading(false);
    }, [wallet, pageName, launchData, join_data]);

    useEffect(() => {
        checkLaunchData.current = true;
    }, [wallet]);

    useEffect(() => {
        fetchLaunchData();
    }, [fetchLaunchData, pageName]);

    useEffect(() => {
        if (launchData) {
            setTicketPrice(bignum_to_num(launchData.ticket_price) / LAMPORTS_PER_SOL);
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

    console.log(launchData);

    if (!pageName) return;

    if (isLoading || launchData === null) return <Loader />;

    if (!launchData) return <PageNotFound />;

    let one_mint = (bignum_to_num(launchData.total_supply) * (launchData.distribution[0] / 100)) / launchData.num_mints;
    let one_mint_frac = one_mint / bignum_to_num(launchData.total_supply);

    const ACTIVE = [CookState.ACTIVE_NO_TICKETS, CookState.ACTIVE_TICKETS].includes(cookState);
    const MINTED_OUT = [
        CookState.MINT_SUCCEEDED_NO_TICKETS,
        CookState.MINT_SUCCEDED_TICKETS_TO_CHECK,
        CookState.MINT_SUCCEEDED_TICKETS_CHECKED_NO_LP,
        CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP,
        CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP_TIMEOUT,
    ].includes(cookState);
    const MINT_FAILED = [CookState.MINT_FAILED_NOT_REFUNDED, CookState.MINT_FAILED_REFUNDED].includes(cookState);

    return (
        <main style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)" }}>
            <FeaturedBanner featuredLaunch={launchData} />
            <Center>
                <VStack spacing={5} my={3} px={5} width={sm ? "100%" : "80%"}>
                    <Timespan launchData={launchData} />

                    <VStack
                        gap={50}
                        p={md ? 25 : 50}
                        bg="rgba(255, 255, 255, 0.20)"
                        borderRadius={12}
                        border="1px solid white"
                        h="fit-content"
                        style={{ maxWidth: "980px" }}
                    >
                        <Flex w="100%" gap={xs ? 50 : lg ? 45 : 100} justify="space-between" direction={md ? "column" : "row"}>
                            <VStack align="start" gap={xs ? 3 : 5}>
                                <HStack>
                                    <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                        Price per ticket: {bignum_to_num(launchData.ticket_price) / LAMPORTS_PER_SOL}
                                    </Text>
                                    <Image src="/images/sol.png" width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                                </HStack>

                                <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                    Total Winning Tickets: {launchData.mints_won}
                                </Text>

                                <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                    Tokens Per Winning Ticket: {one_mint} <br />({one_mint_frac}% of total supply)
                                </Text>

                                <HStack align="center" gap={3}>
                                    <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                        Auto Refund:
                                    </Text>
                                    <Checkbox size="lg" isChecked colorScheme="green" />
                                    <Tooltip
                                        label="You will get a refund if liquidity threshhold is not reached."
                                        hasArrow
                                        w={270}
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
                                                ? "Cooked Out!"
                                                : MINT_FAILED
                                                  ? "Cook Failed"
                                                  : "none"}
                                    </Text>
                                    {ACTIVE && <Image src="/images/sol.png" width={40} height={40} alt="SOL Icon" />}
                                </HStack>

                                <Box
                                    mt={-3}
                                    onClick={() => {
                                        console.log(wallet.publicKey);
                                        if (wallet.publicKey === null) {
                                            handleConnectWallet();
                                        } else {
                                            if (cook_state === CookState.MINT_SUCCEDED_TICKETS_TO_CHECK) {
                                                CheckTickets();
                                            } else if (
                                                (cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_NO_LP &&
                                                    join_data?.ticket_status === 0) ||
                                                cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP
                                            ) {
                                                ClaimTokens();
                                            } else if (
                                                cook_state === CookState.MINT_FAILED_NOT_REFUNDED ||
                                                CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP_TIMEOUT
                                            ) {
                                                RefundTickets();
                                            }
                                        }
                                    }}
                                >
                                    {(MINTED_OUT || MINT_FAILED) && (
                                        <VStack>
                                            <Box mt={4}>
                                                <WoodenButton
                                                    label={
                                                        cook_state === CookState.MINT_SUCCEDED_TICKETS_TO_CHECK
                                                            ? "Check Tickets"
                                                            : cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP &&
                                                                join_data.ticket_status === 1
                                                              ? "Claim Tokens"
                                                              : cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP &&
                                                                  join_data.ticket_status === 0
                                                                ? "Claim Tokens and Refund"
                                                                : cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_NO_LP &&
                                                                    join_data.ticket_status === 0
                                                                  ? "Refund Losing Tickets"
                                                                  : cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_NO_LP &&
                                                                      join_data.ticket_status === 1
                                                                    ? "Waiting for LP"
                                                                    : cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP_TIMEOUT
                                                                      ? "LP Timeout, Refund remaining tickets"
                                                                      : cook_state === CookState.MINT_FAILED_NOT_REFUNDED
                                                                        ? "Refund Tickets"
                                                                        : ""
                                                    }
                                                    size={28}
                                                />
                                            </Box>
                                            {MINTED_OUT && (
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
                                    {wallet.publicKey === null ? "Connect Wallet" : "Mint"}
                                </Button>

                                {!(cookState === CookState.PRE_LAUNCH) ? (
                                    <VStack hidden={MINTED_OUT || MINT_FAILED}>
                                        <HStack>
                                            <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                                Platform fee: 0.01
                                            </Text>
                                            <Image src="/images/sol.png" width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                                        </HStack>
                                        <Text m="0" mt={-3} color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                            per ticket
                                        </Text>
                                    </VStack>
                                ) : (
                                    <Text m="0" color="white" fontSize="large" fontFamily="ReemKufiRegular">
                                        Tickets are not yet available for purchase.
                                    </Text>
                                )}
                            </VStack>
                        </Flex>

                        <VStack w={xs ? "100%" : "85%"}>
                            <Progress
                                hasStripe={MINTED_OUT}
                                mb={2}
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
                                value={(100 * Math.min(launchData.tickets_sold, launchData.num_mints)) / launchData.num_mints}
                            />

                            <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                Tickets Sold: {launchData.tickets_sold}
                            </Text>

                            <Flex direction={md ? "column" : "row"}>
                                <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                    Guaranteed Liquidity:
                                </Text>
                                <HStack justify="center">
                                    <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                        &nbsp;
                                        {(Math.min(launchData.num_mints, launchData.tickets_sold) * launchData.ticket_price) /
                                            LAMPORTS_PER_SOL}
                                        /{(launchData.num_mints * launchData.ticket_price) / LAMPORTS_PER_SOL}
                                    </Text>
                                    <Image src="/images/sol.png" width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                                </HStack>
                            </Flex>
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
    );
};

export default MintPage;
