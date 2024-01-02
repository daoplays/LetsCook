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
    get_current_blockhash,
    send_transaction,
    serialise_BuyTickets_instruction,
    myU64,
    run_launch_data_GPA,
    serialise_basic_instruction,
    LaunchInstruction,
    run_join_data_GPA,
    JoinData,
    uInt8ToLEBytes,
    postData,
} from "../../components/Solana/state";
import { PROGRAM, SYSTEM_KEY, RPC_NODE } from "../../components/Solana/constants";
import { Dispatch, SetStateAction, useCallback, useEffect, useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, Transaction, TransactionInstruction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { MdOutlineContentCopy } from "react-icons/md";
import { PieChart } from "react-minimal-pie-chart";
import { Fee } from "@raydium-io/raydium-sdk";
import bs58 from "bs58";
import BN from "bn.js";
import Image from "next/image";
import twitter from "../../public/socialIcons/twitter.svg";
import telegram from "../../public/socialIcons/telegram.svg";
import website from "../../public/socialIcons/website.svg";
import Link from "next/link";

import styles from "../styles/Launch.module.css";
import useResponsive from "../../hooks/useResponsive";
import UseWalletConnection from "../../hooks/useWallet";
import trimAddress from "../../hooks/trimAddress";
import WoodenButton from "../../components/Buttons/woodenButton";
import { useRouter } from "next/router";

const MintPage = () => {
    const router = useRouter();
    const wallet = useWallet();
    const { xs, sm, md, lg } = useResponsive();
    const { handleConnectWallet } = UseWalletConnection();

    const [totalCost, setTotalCost] = useState(0);
    const [ticketPrice, setTicketPrice] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const [launchData, setLaunchData] = useState<LaunchData | null>(null);
    const [join_data, setJoinData] = useState<JoinData | null>(null);

    const checkLaunchData = useRef<boolean>(true);

    const { pageName } = router.query;

    const run_join_data_GPA2 = useCallback(async () => {
        let index_buffer = uInt8ToLEBytes(3);
        let account_bytes = bs58.encode(index_buffer);
        let wallet_bytes = PublicKey.default.toBase58();

        console.log("wallet", wallet.publicKey !== null ? wallet.publicKey.toString() : "null");
        if (wallet.publicKey !== null) {
            wallet_bytes = wallet.publicKey.toBase58();
        }

        var body = {
            id: 1,
            jsonrpc: "2.0",
            method: "getProgramAccounts",
            params: [
                PROGRAM.toString(),
                {
                    filters: [{ memcmp: { offset: 0, bytes: account_bytes } }, { memcmp: { offset: 1, bytes: wallet_bytes } }],
                    encoding: "base64",
                    commitment: "confirmed",
                },
            ],
        };

        var program_accounts_result;
        try {
            program_accounts_result = await postData(RPC_NODE, "", body);
        } catch (error) {
            console.log(error);
            return [];
        }

        console.log("check join accounts");
        console.log(program_accounts_result["result"]);

        let result: JoinData[] = [];
        for (let i = 0; i < program_accounts_result["result"]?.length; i++) {
            //console.log(program_accounts_result["result"][i]);
            let encoded_data = program_accounts_result["result"][i]["account"]["data"][0];
            let decoded_data = Buffer.from(encoded_data, "base64");
            try {
                const [joiner] = JoinData.struct.deserialize(decoded_data);
                result.push(joiner);
            } catch (error) {
                console.log(error);
            }
        }

        if (result.length > 0) {
            let joiner_map = new Map<number, JoinData>();
            for (let i = 0; i < result.length; i++) {
                joiner_map.set(bignum_to_num(result[i].game_id), result[i]);
            }

            if (joiner_map !== null && joiner_map.has(bignum_to_num(launchData.game_id))) {
                setJoinData(joiner_map.get(bignum_to_num(launchData.game_id)));
            }
        }
    }, [wallet]);

    let win_prob = 0;

    if (join_data === null) {
        console.log("no joiner info");
    }

    if (join_data !== null) {
        console.log("joiner", bignum_to_num(join_data.game_id), bignum_to_num(launchData.game_id));
        win_prob = (join_data.num_tickets - join_data.num_claimed_tickets) / (launchData.tickets_sold - launchData.tickets_claimed);
    }

    const fetchLaunchData = useCallback(async () => {
        if (!checkLaunchData.current) return;

        try {
            setIsLoading(true);
            const list = await run_launch_data_GPA("");

            const launchItem = list.find((item: LaunchData) => (item.page_name.toString() === pageName ? pageName : ""));

            if (launchItem) {
                setLaunchData(launchItem);
            }
        } catch (error) {
            console.error("Error fetching launch data:", error);
        } finally {
            setIsLoading(false);
        }

        await run_join_data_GPA2();
        checkLaunchData.current = false;
    }, [pageName, run_join_data_GPA2]);

    useEffect(() => {
        checkLaunchData.current = true;
    }, [wallet]);

    useEffect(() => {
        fetchLaunchData();
    }, [fetchLaunchData]);

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

    const RefundTickets = useCallback(async () => {
        if (wallet.publicKey === null) {
            handleConnectWallet();
        }

        if (wallet.signTransaction === undefined) return;

        if (wallet.publicKey.toString() == launchData.seller.toString()) {
            alert("Launch creator cannot buy tickets");
            return;
        }

        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launchData.page_name), Buffer.from("Launch")], PROGRAM)[0];

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        let temp_wsol_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), launchData.mint_address.toBytes(), Buffer.from("Temp")],
            PROGRAM,
        )[0];

        let program_sol_account = PublicKey.findProgramAddressSync([Buffer.from("sol_account")], PROGRAM)[0];

        const game_id = new myU64(launchData.game_id);
        const [game_id_buf] = myU64.struct.serialize(game_id);
        console.log("game id ", launchData.game_id, game_id_buf);
        console.log("Mint", launchData.mint_address.toString());
        console.log("sol", launchData.sol_address.toString());

        let user_join_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), game_id_buf, Buffer.from("Joiner")],
            PROGRAM,
        )[0];

        let wrapped_sol_mint = new PublicKey("So11111111111111111111111111111111111111112");

        const instruction_data = serialise_basic_instruction(LaunchInstruction.claim_refund);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_join_account, isSigner: false, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },
            { pubkey: launchData.sol_address, isSigner: false, isWritable: true },
            { pubkey: temp_wsol_account, isSigner: false, isWritable: true },
            { pubkey: wrapped_sol_mint, isSigner: false, isWritable: true },
            { pubkey: program_sol_account, isSigner: false, isWritable: true },
        ];

        account_vector.push({ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: true });
        account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: true });

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(list_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            let signature = transaction_response.result;

            console.log("join sig: ", signature);
        } catch (error) {
            console.log(error);
            return;
        }
    }, [wallet]);

    const BuyTickets = useCallback(async () => {
        if (wallet.publicKey === null) {
            handleConnectWallet();
        }

        if (wallet.signTransaction === undefined) return;

        if (wallet.publicKey.toString() == launchData.seller.toString()) {
            alert("Launch creator cannot buy tickets");
            return;
        }

        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launchData.page_name), Buffer.from("Launch")], PROGRAM)[0];

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        const game_id = new myU64(launchData.game_id);
        const [game_id_buf] = myU64.struct.serialize(game_id);
        // console.log("game id ", launchData.game_id, game_id_buf);
        // console.log("Mint", launchData.mint_address.toString());
        // console.log("sol", launchData.sol_address.toString());

        let user_join_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), game_id_buf, Buffer.from("Joiner")],
            PROGRAM,
        )[0];

        const instruction_data = serialise_BuyTickets_instruction(value);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_data_account, isSigner: false, isWritable: true },
            { pubkey: user_join_account, isSigner: false, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },
            { pubkey: launchData.sol_address, isSigner: false, isWritable: true },
        ];

        account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: true });
        account_vector.push({ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: true });

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(list_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            let signature = transaction_response.result;

            // console.log("join sig: ", signature);
        } catch (error) {
            console.log(error);
            return;
        }
    }, [wallet, value]);

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

    const Links = () => (
        <HStack gap={3}>
            <Link href={launchData.twitter} target="_blank">
                <Image src={twitter.src} alt="Twitter Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
            </Link>
            <Link href={launchData.telegram} target="_blank">
                <Image src={telegram.src} alt="Telegram Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
            </Link>
            <Link href={launchData.website} target="_blank">
                <Image src={website.src} alt="Website Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
            </Link>
        </HStack>
    );

    if (!launchData) {
        return <div>Loading...</div>;
    }

    const distribution = launchData.distribution
        ? launchData.distribution
              .map((value, index) => ({
                  title: ["Let's Cook Raffle", "Liquidity Pool", "LP Rewards", "Airdrops", "Team", "Others"][index],
                  value,
                  color: ["#FF5151", "#489CFF", "#74DD5A", "#FFEF5E", "#B96CF6", "#FF994E"][index],
              }))
              .filter((item) => item.value > 0)
        : [];

    let splitLaunchDate = new Date(bignum_to_num(launchData.launch_date)).toUTCString().split(" ");
    let launchDate = splitLaunchDate[0] + " " + splitLaunchDate[1] + " " + splitLaunchDate[2] + " " + splitLaunchDate[3];

    let splitEndDate = new Date(bignum_to_num(launchData.end_date)).toUTCString().split(" ");
    let endDate = splitEndDate[0] + " " + splitEndDate[1] + " " + splitEndDate[2] + " " + splitEndDate[3];

    let one_mint = (bignum_to_num(launchData.total_supply) * (launchData.distribution[0] / 100)) / launchData.num_mints;
    let one_mint_frac = one_mint / bignum_to_num(launchData.total_supply);
    let current_time = new Date().getTime();

    const PRE_LAUNCH = current_time < launchData.launch_date;
    const ACTIVE = current_time >= launchData.launch_date && current_time < launchData.end_date;
    const MINTED_OUT = current_time >= launchData.end_date && launchData.tickets_sold >= launchData.num_mints;
    const MINT_FAILED = current_time >= launchData.end_date && launchData.tickets_sold < launchData.num_mints;

    return (
        <main style={{ padding: "50px 0" }}>
            <Center>
                <VStack spacing={3} px={sm ? 3 : 0} my={xs ? "25px" : "50px"} width={sm ? "100%" : "80%"}>
                    <VStack>
                        {/* Token Logo - Mobile View  */}
                        <Image
                            src={launchData.icon}
                            width={200}
                            height={200}
                            alt={`${launchData.name} LOGO`}
                            hidden={!md}
                            style={{ borderRadius: "50%" }}
                        />

                        {/* Token Name  */}
                        <Text m={0} fontSize={md ? 35 : 60} color="white" className="font-face-kg">
                            ${launchData.name}
                        </Text>

                        <HStack spacing={3} align="center" justify="center">
                            {/* Contract Address  */}
                            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={sm ? "large" : "x-large"}>
                                {md ? trimAddress(launchData.mint_address.toString()) : launchData.mint_address.toString()}
                            </Text>

                            {/* Copy Button for Contract Address  */}
                            <Tooltip label="Copy Contract Address" hasArrow fontSize="large" offset={[0, 10]}>
                                <div
                                    style={{ cursor: "pointer" }}
                                    onClick={() => navigator.clipboard.writeText(launchData.mint_address.toString())}
                                >
                                    <MdOutlineContentCopy color="white" size={sm ? 25 : 40} />
                                </div>
                            </Tooltip>

                            {/* Solscan Link */}
                            <Tooltip label="View in explorer" hasArrow fontSize="large" offset={[0, 10]}>
                                <Link
                                    href={`https://solscan.io/account/${launchData.mint_address.toString()}?cluster=devnet`}
                                    target="_blank"
                                >
                                    <Image src="/images/solscan.png" width={sm ? 25 : 40} height={sm ? 30 : 40} alt="Solscan icon" />
                                </Link>
                            </Tooltip>
                        </HStack>
                    </VStack>

                    <Flex
                        w={md ? "fit-content" : 1024}
                        flexDirection={md ? "column" : "row"}
                        align="center"
                        justify={md ? "center" : "space-between"}
                        h="100%"
                    >
                        <HStack w="fit-content" gap={5}>
                            {/* Token Logo - Desktop View  */}
                            <Image
                                src={launchData.icon}
                                width={md ? 130 : 200}
                                height={md ? 130 : 200}
                                alt="$SAUCE LOGO"
                                hidden={md}
                                style={{ borderRadius: "50%" }}
                            />

                            {/* Token Description and Social Links  */}
                            <VStack gap={md ? 1 : 2} alignItems={md ? "center" : "left"}>
                                <Text
                                    fontFamily="ReemKufiRegular"
                                    fontSize={sm ? "large" : "x-large"}
                                    color="white"
                                    maxW={sm ? "100%" : md ? "600px" : "850px"}
                                    mr={md ? 0 : 25}
                                    lineHeight={1.15}
                                    align={md ? "center" : "start"}
                                    m={0}
                                >
                                    {launchData.description}
                                </Text>
                                <HStack mt={3} hidden={sm}>
                                    {!md && <Links />}
                                </HStack>
                            </VStack>
                        </HStack>
                    </Flex>

                    {/* Open & Close Date  */}
                    <HStack mt={xs ? 5 : 0} spacing={5}>
                        <Text m={0} color={"white"} fontFamily="ReemKufiRegular" align={"center"} fontSize={md ? "large" : "xx-large"}>
                            Opens: {launchDate}
                        </Text>
                        <Divider orientation="vertical" height={md ? 50 : lg ? 75 : 50} color="white" />
                        <Text m={0} color={"white"} fontFamily="ReemKufiRegular" align={"center"} fontSize={md ? "large" : "xx-large"}>
                            Closes: {endDate}
                        </Text>
                    </HStack>

                    <VStack
                        gap={50}
                        p={md ? 25 : 50}
                        bg="rgba(255, 255, 255, 0.20)"
                        borderRadius={12}
                        border="1px solid white"
                        h="fit-content"
                        mx={3}
                    >
                        <Flex w="100%" gap={xs ? 50 : lg ? 45 : 100} justify="space-between" direction={md ? "column" : "row"}>
                            <VStack align="start" gap={xs ? 3 : 5}>
                                {/* Ticket Price  */}
                                <HStack>
                                    <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                        Price per ticket: {bignum_to_num(launchData.ticket_price) / LAMPORTS_PER_SOL}
                                    </Text>
                                    <Image src="/images/sol.png" width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                                </HStack>

                                {/* Winning Tickets  */}
                                <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                    Total Winning Tickets: {launchData.mints_won}
                                </Text>

                                {/* Tokens per winning ticket */}
                                <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                    Tokens Per Winning Ticket: {one_mint} <br />({one_mint_frac}% of total supply)
                                </Text>

                                {/* Auto refund function */}
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
                                    {/* Total Cost & States */}
                                    <Text
                                        m="0"
                                        color="white"
                                        className="font-face-kg"
                                        textAlign={"center"}
                                        fontSize={lg ? "x-large" : "xxx-large"}
                                    >
                                        {PRE_LAUNCH
                                            ? "Warming Up"
                                            : ACTIVE
                                              ? `Total: ${totalCost}`
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
                                    onClick={
                                        MINT_FAILED
                                            ? () => {
                                                  RefundTickets();
                                              }
                                            : () => {}
                                    }
                                >
                                    {(MINTED_OUT || MINT_FAILED) && (
                                        <VStack>
                                            <WoodenButton
                                                // pass action here (check tickets / refund tickets)
                                                label={MINTED_OUT ? "Check Tickets" : MINT_FAILED ? "Refund Tickets" : ""}
                                                size={28}
                                            />
                                            {MINTED_OUT && (
                                                <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                                    {win_prob}% chance per ticket
                                                </Text>
                                            )}
                                        </VStack>
                                    )}
                                </Box>

                                {/* Mint Quantity  */}
                                <HStack maxW="320px" hidden={MINTED_OUT || MINT_FAILED}>
                                    <Button {...dec} size="lg" isDisabled={PRE_LAUNCH}>
                                        -
                                    </Button>

                                    <Input
                                        {...input}
                                        size="lg"
                                        fontSize="x-large"
                                        color="white"
                                        alignItems="center"
                                        justifyContent="center"
                                        isDisabled={PRE_LAUNCH}
                                    />
                                    <Button {...inc} size="lg" isDisabled={PRE_LAUNCH}>
                                        +
                                    </Button>
                                </HStack>

                                {/* Mint Button  */}
                                <Button
                                    size="lg"
                                    isDisabled={PRE_LAUNCH}
                                    hidden={MINTED_OUT || MINT_FAILED}
                                    onClick={() => {
                                        BuyTickets();
                                    }}
                                >
                                    {wallet.publicKey === null ? "Connect Wallet" : "Mint"}
                                </Button>

                                {/* Platform fee  */}
                                {!PRE_LAUNCH ? (
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
                            {/* Mint Progress  */}
                            <Progress
                                mb={2}
                                w="100%"
                                h={25}
                                borderRadius={12}
                                colorScheme={
                                    PRE_LAUNCH ? "none" : ACTIVE ? "whatsapp" : MINTED_OUT ? "linkedin" : MINT_FAILED ? "red" : "none"
                                }
                                size="sm"
                                value={Math.min(launchData.tickets_sold, launchData.num_mints)}
                            />

                            {/* Total tickets sold  */}
                            <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                Tickets Sold: {launchData.tickets_sold}
                            </Text>
                            {/* Liquidity  */}
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

                    {/* Token Distribution  */}
                    <VStack w="100%" mt={12}>
                        <Text m={0} fontSize={md ? "xl" : 30} color="white" className="font-face-kg">
                            Distribution
                        </Text>
                        <HStack align="center" justify="center" style={{ cursor: "pointer" }}>
                            {/* Token Supply  */}
                            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={md ? "large" : "x-large"}>
                                Total Supply: {bignum_to_num(launchData.total_supply)}
                            </Text>
                        </HStack>

                        <Flex align="center" justify="center" flexDirection={md ? "column" : "row"} w="100%" gap={xs ? 3 : 12} mt={3}>
                            <VStack gap={6} align="start">
                                {distribution.map((i) => {
                                    if (i.value <= 0) return;
                                    return (
                                        <HStack gap={4} key={i.title}>
                                            <Box borderRadius={6} bg={i.color} h={35} w={35} />{" "}
                                            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={md ? "large" : "x-large"}>
                                                {i.title} - {i.value}%
                                            </Text>
                                        </HStack>
                                    );
                                })}
                            </VStack>{" "}
                            <PieChart
                                animate={true}
                                totalValue={100}
                                data={distribution}
                                style={{ width: xs ? "100%" : "400px", height: "400px" }}
                            />
                        </Flex>
                    </VStack>
                </VStack>
            </Center>
        </main>
    );
};

export default MintPage;
