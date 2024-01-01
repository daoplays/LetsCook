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
    JoinData,
    serialise_basic_instruction,
    LaunchInstruction
} from "./Solana/state";
import { Dispatch, SetStateAction, useCallback, useEffect, useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, Transaction, TransactionInstruction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { MdOutlineContentCopy } from "react-icons/md";
import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE, PROGRAM, SYSTEM_KEY } from "./Solana/constants";
import { Raydium } from "./Solana/raydium";
import { PieChart } from "react-minimal-pie-chart";
import { Fee } from "@raydium-io/raydium-sdk";
import bs58 from "bs58";
import BN from "bn.js";
import Image from "next/image";
import useResponsive from "../hooks/useResponsive";
import twitter from "../public/socialIcons/twitter.svg";
import telegram from "../public/socialIcons/telegram.svg";
import website from "../public/socialIcons/website.svg";
import Link from "next/link";
import WoodenButton from "./Buttons/woodenButton";
import trimAddress from "../hooks/trimAddress";
import UseWalletConnection from "../hooks/useWallet";

import styles from "../styles/Launch.module.css";

export function TokenScreen({ launch_data, join_data }: { launch_data: LaunchData; join_data: JoinData | null }) {
    const { xs, sm, md, lg } = useResponsive();
    const { handleConnectWallet } = UseWalletConnection();
    const wallet = useWallet();

    const [totalCost, setTotalCost] = useState(0);


    let win_prob = 0;
    if (join_data === null){
        console.log("no joiner info")
    }
    if (join_data !== null) {
        console.log("joiner", bignum_to_num(join_data.game_id), bignum_to_num(launch_data.game_id));
        win_prob = (join_data.num_tickets - join_data.num_claimed_tickets) / (launch_data.tickets_sold - launch_data.tickets_claimed);
    }

    let name = launch_data.name;
    let ticketPrice = bignum_to_num(launch_data.ticket_price) / LAMPORTS_PER_SOL;

    console.log("dates");
    console.log(launch_data.launch_date.toString());
    console.log(launch_data.end_date.toString());
    console.log(launch_data.ticket_price.toString());
    let splitLaunchDate = new Date(bignum_to_num(launch_data.launch_date)).toUTCString().split(" ");
    let launchDate = splitLaunchDate[0] + " " + splitLaunchDate[1] + " " + splitLaunchDate[2] + " " + splitLaunchDate[3];

    let splitEndDate = new Date(bignum_to_num(launch_data.end_date)).toUTCString().split(" ");
    let endDate = splitEndDate[0] + " " + splitEndDate[1] + " " + splitEndDate[2] + " " + splitEndDate[3];

    let one_mint = (bignum_to_num(launch_data.total_supply) * (launch_data.distribution[0] / 100)) / launch_data.num_mints;
    let one_mint_frac = one_mint / bignum_to_num(launch_data.total_supply);
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

    const RefundTickets = useCallback(async () => {
        if (wallet.publicKey === null) {
            handleConnectWallet();
        }

        if (wallet.signTransaction === undefined) return;

        if (wallet.publicKey.toString() == launch_data.seller.toString()) {
            alert("Launch creator cannot buy tickets");
            return;
        }

        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launch_data.page_name), Buffer.from("Launch")], PROGRAM)[0];

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        let temp_wsol_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), launch_data.mint_address.toBytes(), Buffer.from("Temp")], PROGRAM)[0];

        let program_sol_account = PublicKey.findProgramAddressSync([Buffer.from("sol_account")], PROGRAM)[0];

        const game_id = new myU64(launch_data.game_id);
        const [game_id_buf] = myU64.struct.serialize(game_id);
        console.log("game id ", launch_data.game_id, game_id_buf);
        console.log("Mint", launch_data.mint_address.toString());
        console.log("sol", launch_data.sol_address.toString());

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
            { pubkey: launch_data.sol_address, isSigner: false, isWritable: true },
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

        if (wallet.publicKey.toString() == launch_data.seller.toString()) {
            alert("Launch creator cannot buy tickets");
            return;
        }

        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launch_data.page_name), Buffer.from("Launch")], PROGRAM)[0];

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        const game_id = new myU64(launch_data.game_id);
        const [game_id_buf] = myU64.struct.serialize(game_id);
        console.log("game id ", launch_data.game_id, game_id_buf);
        console.log("Mint", launch_data.mint_address.toString());
        console.log("sol", launch_data.sol_address.toString());

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
            { pubkey: launch_data.sol_address, isSigner: false, isWritable: true },
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

            console.log("join sig: ", signature);
        } catch (error) {
            console.log(error);
            return;
        }
    }, [wallet, value]);

    useEffect(() => {
        setTotalCost(value * ticketPrice);
    }, [value, ticketPrice]);

    const Links = () => (
        <HStack gap={3}>
            <Link href={launch_data.twitter} target="_blank">
                <Image src={twitter.src} alt="Twitter Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
            </Link>
            <Link href={launch_data.telegram} target="_blank">
                <Image src={telegram.src} alt="Telegram Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
            </Link>
            <Link href={launch_data.website} target="_blank">
                <Image src={website.src} alt="Website Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
            </Link>
        </HStack>
    );

    const distribution = [
        {
            title: "Let's Cook Raffle",
            value: launch_data.distribution[0],
            color: "#FF5151",
        },
        {
            title: "Liquidity Pool",
            value: launch_data.distribution[1],
            color: "#489CFF",
        },
        {
            title: "LP Rewards",
            value: launch_data.distribution[2],
            color: "#74DD5A",
        },
        {
            title: "Airdrops",
            value: launch_data.distribution[3],
            color: "#FFEF5E",
        },
        {
            title: "Team",
            value: launch_data.distribution[4],
            color: "#B96CF6",
        },
        {
            title: "Others",
            value: launch_data.distribution[5],
            color: "#FF994E",
        },
    ];

    const PRE_LAUNCH = current_time < launch_data.launch_date;
    const ACTIVE = current_time >= launch_data.launch_date && current_time < launch_data.end_date;
    const MINTED_OUT = current_time >= launch_data.end_date && launch_data.tickets_sold >= launch_data.num_mints;
    const MINT_FAILED = current_time >= launch_data.end_date && launch_data.tickets_sold < launch_data.num_mints;

    // const PRE_LAUNCH = true;
    // const ACTIVE = false;
    // const MINTED_OUT = false;
    // const MINT_FAILED = false;

    return (
        <Center>
            <VStack spacing={3} px={sm ? 3 : 0} my={xs ? "25px" : "50px"} width={sm ? "100%" : "80%"}>
                <VStack>
                    {/* Token Logo - Mobile View  */}
                    <Image
                        src={launch_data.icon}
                        width={200}
                        height={200}
                        alt={`${name} LOGO`}
                        hidden={!md}
                        style={{ borderRadius: "50%" }}
                    />

                    {/* Token Name  */}
                    <Text m={0} fontSize={md ? 35 : 60} color="white" className="font-face-kg">
                        ${name}
                    </Text>

                    <HStack spacing={3} align="center" justify="center">
                        {/* Contract Address  */}
                        <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={sm ? "large" : "x-large"}>
                            {md ? trimAddress(launch_data.mint_address.toString()) : launch_data.mint_address.toString()}
                        </Text>

                        {/* Copy Button for Contract Address  */}
                        <Tooltip label="Copy Contract Address" hasArrow fontSize="large" offset={[0, 10]}>
                            <div
                                style={{ cursor: "pointer" }}
                                onClick={() => navigator.clipboard.writeText(launch_data.mint_address.toString())}
                            >
                                <MdOutlineContentCopy color="white" size={sm ? 25 : 40} />
                            </div>
                        </Tooltip>

                        {/* Solscan Link */}
                        <Tooltip label="View in explorer" hasArrow fontSize="large" offset={[0, 10]}>
                            <Link href={`https://solscan.io/account/${launch_data.mint_address.toString()}?cluster=devnet`} target="_blank">
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
                            src={launch_data.icon}
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
                                {launch_data.description}
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
                                    Price per ticket: {bignum_to_num(launch_data.ticket_price) / LAMPORTS_PER_SOL}
                                </Text>
                                <Image src="/images/sol.png" width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                            </HStack>

                            {/* Winning Tickets  */}
                            <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                Total Winning Tickets: {launch_data.mints_won}
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

                            <Box mt={-3}
                            onClick={MINT_FAILED ? () => {
                                RefundTickets()
                            } : () => {}}
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
                            colorScheme={PRE_LAUNCH ? "none" : ACTIVE ? "whatsapp" : MINTED_OUT ? "linkedin" : MINT_FAILED ? "red" : "none"}
                            size="sm"
                            value={Math.min(launch_data.tickets_sold, launch_data.num_mints)}
                        />

                        {/* Total tickets sold  */}
                        <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                            Tickets Sold: {launch_data.tickets_sold}
                        </Text>
                        {/* Liquidity  */}
                        <Flex direction={md ? "column" : "row"}>
                            <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                Guaranteed Liquidity:
                            </Text>
                            <HStack justify="center">
                                <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                    &nbsp;
                                    {(Math.min(launch_data.num_mints, launch_data.tickets_sold) * launch_data.ticket_price) /
                                        LAMPORTS_PER_SOL}
                                    /{(launch_data.num_mints * launch_data.ticket_price) / LAMPORTS_PER_SOL}
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
                            Total Supply: {bignum_to_num(launch_data.total_supply)}
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
    );
}
