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
} from "./Solana/state";
import { Dispatch, SetStateAction, useCallback, useEffect, useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { MdOutlineContentCopy } from "react-icons/md";
import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE, MintPageState, PROGRAM, SYSTEM_KEY } from "./Solana/constants";
import { Raydium } from "./Solana/raydium";
import { PieChart } from "react-minimal-pie-chart";
import { Fee } from "@raydium-io/raydium-sdk";
import bs58 from "bs58";
import BN from "bn.js";
import logo from "../public/images/sauce.png";
import Image from "next/image";
import useResponsive from "../hooks/useResponsive";
import twitter from "../public/socialIcons/twitter.svg";
import telegram from "../public/socialIcons/telegram.svg";
import discord from "../public/socialIcons/discord.svg";
import website from "../public/socialIcons/website.svg";
import Link from "next/link";
import WoodenButton from "./Buttons/woodenButton";

export function TokenScreen({ launch_data }: { launch_data: LaunchData }) {
    const wallet = useWallet();
    const { xs, sm, md, lg } = useResponsive();
    const [tokenPage] = useState(MintPageState.MINT_FAILED);
    let name = launch_data.name;
    console.log(launch_data.mint_address.toString());

    const BuyTickets = useCallback(async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

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

        const instruction_data = serialise_BuyTickets_instruction(1);

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
    }, [wallet]);

    const { getInputProps, getIncrementButtonProps, getDecrementButtonProps } = useNumberInput({
        step: 1,
        defaultValue: 1,
        min: 1,
        max: 100,
    });

    const inc = getIncrementButtonProps();
    const dec = getDecrementButtonProps();
    const input = getInputProps();

    const distribution = [
        {
            title: "Let's Cook Raffle",
            value: 20,
            color: "#FF5151",
        },
        {
            title: "Liquidity Pool",
            value: 20,
            color: "#489CFF",
        },
        {
            title: "LP Rewards",
            value: 10,
            color: "#74DD5A",
        },
        {
            title: "Airdrops",
            value: 15,
            color: "#FFEF5E",
        },
        {
            title: "Team",
            value: 25,
            color: "#B96CF6",
        },
        {
            title: "Others",
            value: 10,
            color: "#FF994E",
        },
    ];

    const Links = () => (
        <HStack gap={3}>
            <Link href="#" target="_blank">
                <Image src={twitter.src} alt="Twitter Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
            </Link>
            <Link href="#" target="_blank">
                <Image src={telegram.src} alt="Telegram Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
            </Link>
            <Link href="#" target="_blank">
                <Image src={discord.src} alt="Discord Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
            </Link>
            <Link href="#" target="_blank">
                <Image src={website.src} alt="Website Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
            </Link>
        </HStack>
    );

    return (
        <Center>
            <VStack spacing={3} px={sm ? 3 : 0} my={xs ? "25px" : "50px"} width={sm ? "100%" : "80%"}>
                <VStack>
                    {/* Token Logo - Mobile View  */}
                    <Image src={logo.src} width={200} height={200} alt="$SAUCE LOGO" hidden={!md} />

                    {/* Token Name  */}
                    <Text m={0} fontSize={md ? 35 : 60} color="white" className="font-face-kg">
                        $Sauce
                    </Text>

                    <HStack spacing={3} align="center" justify="center">
                        {/* Contract Address  */}
                        <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={sm ? "large" : "x-large"}>
                            {md ? "H6bmfg...LupA2v" : "H6bmfgE1V7UHCf9VmuzEhsYgU6DkpAtMeqXwzjLupA2v"}
                        </Text>

                        {/* Copy Button for Contract Address  */}
                        <Tooltip label="Copy Contract Address" hasArrow fontSize="large" offset={[0, 10]}>
                            <div style={{ cursor: "pointer" }}>
                                <MdOutlineContentCopy color="white" size={sm ? 25 : 40} />
                            </div>
                        </Tooltip>

                        {/* Solscan Link */}
                        <Tooltip label="View in explorer" hasArrow fontSize="large" offset={[0, 10]}>
                            <Link href="" target="_blank">
                                <Image src="/images/solscan.png" width={sm ? 25 : 40} height={sm ? 30 : 40} alt="Solscan icon" />
                            </Link>
                        </Tooltip>
                    </HStack>
                </VStack>

                <Flex flexDirection={md ? "column" : "row"} align="center" justify={md ? "center" : "space-between"} h="100%">
                    <HStack w="fit-content" gap={5}>
                        {/* Token Logo - Desktop View  */}
                        <Image src={logo.src} width={md ? 130 : 200} height={md ? 130 : 200} alt="$SAUCE LOGO" hidden={md} />

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
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus dapibus massa vitae magna elementum, sit
                                amet sagittis urna imperdiet.
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
                        Opens: Dec 02, 2023 @10:00 UTC
                    </Text>
                    <Divider orientation="vertical" height={md ? 50 : lg ? 75 : 50} color="white" />
                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" align={"center"} fontSize={md ? "large" : "xx-large"}>
                        Closes: Dec 02, 2023 @10:00 UTC
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
                                    Price per ticket: 0.25
                                </Text>
                                <Image src="/images/sol.png" width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                            </HStack>

                            {/* Winning Tickets  */}
                            <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                Total Winning Tickets: 2,000
                            </Text>

                            {/* Tokens per winning ticket */}
                            <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                Tokens Per Winning Ticket: 1,000,000 <br />
                                (0.01% of total supply)
                            </Text>

                            {/* Auto refund function */}
                            <HStack align="center" gap={3}>
                                <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                    Auto Refund:
                                </Text>
                                <Checkbox size="lg" />
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
                                    {tokenPage === MintPageState.PRE_LAUNCH
                                        ? "Warming Up"
                                        : tokenPage === MintPageState.ACTIVE
                                          ? "Total: 0.52"
                                          : tokenPage === MintPageState.MINTED_OUT
                                            ? "Cooked Out!"
                                            : tokenPage === MintPageState.MINT_FAILED
                                              ? "Cook Failed"
                                              : "none"}
                                </Text>
                                {tokenPage === MintPageState.ACTIVE && (
                                    <Image src="/images/sol.png" width={40} height={40} alt="SOL Icon" />
                                )}
                            </HStack>

                            <Box mt={-3}>
                                {(tokenPage === MintPageState.MINTED_OUT || tokenPage === MintPageState.MINT_FAILED) && (
                                    <VStack>
                                        <WoodenButton
                                            // pass action here (check tickets / refund tickets)
                                            label={
                                                tokenPage === MintPageState.MINTED_OUT
                                                    ? "Check Tickets"
                                                    : tokenPage === MintPageState.MINT_FAILED
                                                      ? "Refund Tickets"
                                                      : ""
                                            }
                                            size={28}
                                        />
                                        {tokenPage === MintPageState.MINTED_OUT && (
                                            <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                                41.5% chance per ticket
                                            </Text>
                                        )}
                                    </VStack>
                                )}
                            </Box>

                            {/* Mint Quantity  */}
                            <HStack maxW="320px" hidden={tokenPage === MintPageState.MINTED_OUT || tokenPage === MintPageState.MINT_FAILED}>
                                <Button {...dec} size="lg" isDisabled={tokenPage === MintPageState.PRE_LAUNCH}>
                                    -
                                </Button>

                                <Input
                                    {...input}
                                    size="lg"
                                    fontSize="x-large"
                                    color="white"
                                    alignItems="center"
                                    justifyContent="center"
                                    isDisabled={tokenPage === MintPageState.PRE_LAUNCH}
                                />
                                <Button {...inc} size="lg" isDisabled={tokenPage === MintPageState.PRE_LAUNCH}>
                                    +
                                </Button>
                            </HStack>

                            {/* Mint Button  */}
                            <Button
                                size="lg"
                                isDisabled={tokenPage === MintPageState.PRE_LAUNCH}
                                hidden={tokenPage === MintPageState.MINTED_OUT || tokenPage === MintPageState.MINT_FAILED}
                            >
                                Mint
                            </Button>

                            {/* Platform fee  */}
                            <VStack hidden={tokenPage === MintPageState.MINTED_OUT || tokenPage === MintPageState.MINT_FAILED}>
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
                                tokenPage === MintPageState.PRE_LAUNCH
                                    ? "none"
                                    : tokenPage === MintPageState.ACTIVE
                                      ? "whatsapp"
                                      : tokenPage === MintPageState.MINTED_OUT
                                        ? "linkedin"
                                        : tokenPage === MintPageState.MINT_FAILED
                                          ? "red"
                                          : "none"
                            }
                            size="sm"
                            value={35}
                        />

                        {/* Total tickets sold  */}
                        <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                            Tickets Sold: 1400
                        </Text>
                        {/* Liquidity  */}
                        <Flex direction={md ? "column" : "row"}>
                            <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                Guaranteed Liquidity:
                            </Text>
                            <HStack justify="center">
                                <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                    &nbsp;350/500
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
                            Total Supply: 10B
                        </Text>
                    </HStack>

                    <Flex align="center" justify="center" flexDirection={md ? "column" : "row"} w="100%" gap={xs ? 3 : 12} mt={3}>
                        <PieChart
                            animate={true}
                            totalValue={100}
                            data={distribution}
                            style={{ width: xs ? "100%" : "400px", height: "400px" }}
                        />
                        <VStack gap={6} align="start">
                            {distribution.map((i) => (
                                <HStack gap={4}>
                                    <Box borderRadius={6} bg={i.color} h={35} w={35} />{" "}
                                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={md ? "large" : "x-large"}>
                                        {i.title}
                                    </Text>
                                </HStack>
                            ))}
                        </VStack>
                    </Flex>
                </VStack>
            </VStack>
        </Center>
    );
}
