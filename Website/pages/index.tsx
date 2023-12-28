import { Center, VStack, Text, Box, HStack, ModalOverlay, Flex, Skeleton, TableContainer } from "@chakra-ui/react";

import "react-datepicker/dist/react-datepicker.css";

import { Dispatch, SetStateAction, useCallback, useEffect, useState, useRef } from "react";
import Table from "react-bootstrap/Table";

import { Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { useWallet } from "@solana/wallet-adapter-react";

import { FaTwitter, FaTwitch } from "react-icons/fa";
import { TfiReload } from "react-icons/tfi";

import twitter from "../public/socialIcons/twitter.svg";
import telegram from "../public/socialIcons/telegram.svg";
import discord from "../public/socialIcons/discord.svg";
import website from "../public/socialIcons/website.svg";

import bs58 from "bs58";

import { METAPLEX_META, DEBUG, SYSTEM_KEY, PROGRAM, Screen } from "../components/Solana/constants";
import {
    run_launch_data_GPA,
    LaunchData,
    LaunchDataUserInput,
    defaultUserInput,
    get_current_blockhash,
    send_transaction,
    uInt32ToLEBytes,
    serialise_CreateLaunch_instruction,
    bignum_to_num,
    UserData,
    run_user_data_GPA,
} from "../components/Solana/state";
import Navigation from "../components/Navigation";
import { FAQScreen } from "../components/faq";
import { TokenScreen } from "../components/token";
import { LaunchScreen } from "../components/launch_page";

import Footer from "../components/Footer";
import { TermsModal } from "../components/Solana/modals";
import { arweave_json_upload, arweave_upload } from "../components/Solana/arweave";

import logo from "../public/images/sauce.png";
import styles from "../components/css/featured.module.css";
import { LaunchDetails } from "../components/launch_details";
import { LaunchBook } from "../components/launch_book";
import { Leaderboard } from "../components/leaderboard";
import Link from "next/link";
import useResponsive from "../hooks/useResponsive";

const ArenaGameCard = ({
    launch,
    setLaunchData,
    setScreen,
    index,
}: {
    launch: LaunchData;
    setLaunchData: Dispatch<SetStateAction<LaunchData>>;
    setScreen: Dispatch<SetStateAction<Screen>>;
    index: number;
}) => {
    console.log(launch.icon)
    const { sm, md, lg } = useResponsive();
    let name = launch.name;
    let splitDate = new Date(bignum_to_num(launch.launch_date)).toUTCString().split(" ");
    let date = splitDate[0] + " " + splitDate[1] + " " + splitDate[2] + " " + splitDate[3];
    return (
        <tr
            style={{
                cursor: "pointer",
                height: "60px",
                transition: "background-color 0.3s",
            }}
            onClick={() => {
                setLaunchData(launch);
                setScreen(Screen.TOKEN_SCREEN);
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = ""; // Reset to default background color
            }}
        >
            <td style={{ minWidth: sm ? "90px" : "120px" }}>
                <Center>
                    <Box m={3} bg="#8EFF84" w={md ? 45 : 75} h={md ? 45 : 75} borderRadius={10}>
                    <img src={launch.icon} width={md ? 30 : 40} />
                    </Box>
                </Center>
            </td>
            <td style={{ minWidth: sm ? "150px" : "200px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {name}
                </Text>
            </td>
            <td style={{ minWidth: "200px" }}>
                <HStack justify="center" gap={3}>
                    <Link href="#">
                        <img src={twitter.src} width={md ? 30 : 40} />
                    </Link>
                    <Link href="#">
                        <img src={telegram.src} width={md ? 30 : 40} />
                    </Link>
                    <Link href="#">
                        <img src={discord.src} width={md ? 30 : 40} />
                    </Link>
                    <Link href="#">
                        <img src={website.src} width={md ? 30 : 40} />
                    </Link>
                </HStack>
            </td>
            <td style={{ minWidth: sm ? "120px" : "150px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    100%
                </Text>
            </td>
            <td style={{ minWidth: sm ? "170px" : "200px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    100 SOL
                </Text>
            </td>
            <td style={{ minWidth: sm ? "150px" : "200px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {date}
                </Text>
            </td>
            <td />
        </tr>
    );
};

const Listings = ({
    launch_list,
    setLaunchData,
    setScreen,
}: {
    launch_list: LaunchData[];
    setLaunchData: Dispatch<SetStateAction<LaunchData>>;
    setScreen: Dispatch<SetStateAction<Screen>>;
}) => {
    if (launch_list.length === 0) {
        return <></>;
    }

    return (
        <>
            {launch_list.map((item: LaunchData, index) => (
                <ArenaGameCard key={index} launch={item} setLaunchData={setLaunchData} setScreen={setScreen} index={index} />
            ))}
        </>
    );
};

function LetsCook() {
    const wallet = useWallet();
    const { sm, md, lg } = useResponsive();

    // refs for checking signatures
    const signature_interval = useRef<number | null>(null);
    const current_signature = useRef<string | null>(null);
    const signature_check_count = useRef<number>(0);
    const [transaction_failed, setTransactionFailed] = useState<boolean>(false);

    const [processing_transaction, setProcessingTransaction] = useState<boolean>(false);
    const [show_new_game, setShowNewGame] = useState<boolean>(false);

    const game_interval = useRef<number | null>(null);
    const [launch_data, setLaunchData] = useState<LaunchData[]>([]);
    const [user_data, setUserData] = useState<UserData[]>([]);

    const check_launch_data = useRef<boolean>(true);
    const [current_launch_data, setCurrentLaunchData] = useState<LaunchData | null>(null);
    const [current_user_data, setCurrentUserData] = useState<UserData | null>(null);

    const [screen, setScreen] = useState<Screen>(Screen.HOME_SCREEN);

    const newLaunchData = useRef<LaunchDataUserInput>(defaultUserInput);

    const CheckLaunchData = useCallback(async () => {
        if (!check_launch_data.current) return;

        let list = await run_launch_data_GPA("");
        console.log(list);
        setLaunchData(list);

        let user_list = await run_user_data_GPA("");
        console.log(user_list);
        setUserData(user_list);
        check_launch_data.current = false;
    }, []);

    const ListGameOnArena = useCallback(async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        //setProcessingTransaction(true);
        setTransactionFailed(false);

        console.log(newLaunchData.current);

        // first upload the png file to arweave and get the url
        let image_url = await arweave_upload(newLaunchData.current.icon);
        let meta_data_url = await arweave_json_upload(newLaunchData.current.name, "LC", newLaunchData.current.icon);
        console.log("list game with url", image_url, meta_data_url);

        newLaunchData.current.uri = meta_data_url;

        let arena_account = PublicKey.findProgramAddressSync([Buffer.from("arena_account")], PROGRAM)[0];

        let launch_data_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), Buffer.from(newLaunchData.current.name), Buffer.from("Game")],
            PROGRAM,
        )[0];

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        let fees_account = new PublicKey("FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD");

        const token_mint_keypair = Keypair.generate();
        var token_mint_pubkey = token_mint_keypair.publicKey;
        let token_meta_key = PublicKey.findProgramAddressSync(
            [Buffer.from("metadata"), METAPLEX_META.toBuffer(), token_mint_pubkey.toBuffer()],
            METAPLEX_META,
        )[0];

        let token_raffle_account_key = await getAssociatedTokenAddress(
            token_mint_pubkey, // mint
            arena_account, // owner
            true, // allow owner off curve
        );

        let user_token_account_key = await getAssociatedTokenAddress(
            token_mint_pubkey, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );

        let wrapped_sol_seed = token_mint_pubkey.toBase58().slice(0,32)
        let wrapped_sol_account =  await PublicKey.createWithSeed(arena_account, wrapped_sol_seed, TOKEN_PROGRAM_ID)
        let wrapped_sol_mint = new PublicKey("So11111111111111111111111111111111111111112");

        if (DEBUG) {
            console.log("arena: ", arena_account.toString());
            console.log("game_data_account: ", launch_data_account.toString());
            console.log("sol_data_account: ", fees_account.toString());
            console.log("wsol seed", wrapped_sol_seed)
        }


        const instruction_data = serialise_CreateLaunch_instruction(newLaunchData.current);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_data_account, isSigner: false, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },

            { pubkey: wrapped_sol_mint, isSigner: false, isWritable: true },
            { pubkey: wrapped_sol_account, isSigner: false, isWritable: true },

            { pubkey: fees_account, isSigner: false, isWritable: true },
            { pubkey: arena_account, isSigner: false, isWritable: true },

            { pubkey: token_mint_pubkey, isSigner: true, isWritable: true },
            { pubkey: user_token_account_key, isSigner: false, isWritable: true },
            { pubkey: token_raffle_account_key, isSigner: false, isWritable: true },
            { pubkey: token_meta_key, isSigner: false, isWritable: true },
        ];

        account_vector.push({ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: true });
        account_vector.push({ pubkey: METAPLEX_META, isSigner: false, isWritable: false });

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(list_instruction);

        transaction.partialSign(token_mint_keypair);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            if (transaction_response.result === "INVALID") {
                console.log(transaction_response);
                setProcessingTransaction(false);
                setTransactionFailed(true);
                return;
            }

            let signature = transaction_response.result;

            if (DEBUG) {
                console.log("list signature: ", signature);
            }

            current_signature.current = signature;
            signature_check_count.current = 0;
        } catch (error) {
            console.log(error);
            setProcessingTransaction(false);
            return;
        }

        setShowNewGame(false);
    }, [wallet]);

    // interval for checking state
    useEffect(() => {
        if (game_interval.current === null) {
            game_interval.current = window.setInterval(CheckLaunchData, 5000);
        } else {
            window.clearInterval(game_interval.current);
            game_interval.current = null;
        }
        // here's the cleanup function
        return () => {
            if (game_interval.current !== null) {
                window.clearInterval(game_interval.current);
                game_interval.current = null;
            }
        };
    }, [CheckLaunchData]);

    const Featured = () => {
        const Links = () => (
            <HStack gap={3}>
                <Link href="#">
                    <img src={twitter.src} width={md ? 30 : 40} />
                </Link>
                <Link href="#">
                    <img src={telegram.src} width={md ? 30 : 40} />
                </Link>
                <Link href="#">
                    <img src={discord.src} width={md ? 30 : 40} />
                </Link>
                <Link href="#">
                    <img src={website.src} width={md ? 30 : 40} />
                </Link>
            </HStack>
        );

        return (
            <Box h={md ? 300 : 320} bg="url(/images/Banner.png)" bgSize="cover">
                <Box bg="linear-gradient(180deg, rgba(255,255,255,0) -40%, rgba(0,0,0,1) 110%)" w="100%" h="100%">
                    <Flex
                        flexDirection={md ? "column" : "row"}
                        align="center"
                        justify={md ? "center" : "space-between"}
                        px={sm ? 3 : 12}
                        pb={5}
                        h="100%"
                    >
                        <HStack w="fit-content" gap={md ? 5 : 8}>
                            <img
                                src={logo.src}
                                width="auto"
                                alt="$SAUCE LOGO"
                                style={{ maxHeight: md ? 130 : 200, maxWidth: md ? 130 : 200 }}
                                hidden={md}
                            />
                            <VStack gap={md ? 1 : 3} alignItems={md ? "center" : "left"}>
                                <Flex ml={-5} gap={md ? 2 : 6}>
                                    <img
                                        src={logo.src}
                                        width="auto"
                                        alt="$SAUCE LOGO"
                                        style={{ maxHeight: 50, maxWidth: 50 }}
                                        hidden={!md}
                                    />
                                    <Text m={0} fontSize={md ? 35 : 60} color="white" className="font-face-kg">
                                        $Sauce
                                    </Text>
                                    {!md && <Links />}
                                </Flex>
                                <Text
                                    fontFamily="ReemKufiRegular"
                                    fontSize={md ? "large" : "x-large"}
                                    color="white"
                                    maxW={sm ? "100%" : md ? "600px" : "850px"}
                                    mr={md ? 0 : 25}
                                    lineHeight={1.15}
                                    align={md ? "center" : "start"}
                                >
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus dapibus massa vitae magna elementum,
                                    sit amet sagittis urna imperdiet.
                                </Text>
                            </VStack>
                        </HStack>
                        {md && <Links />}
                        <Box
                            h={md ? 45 : 90}
                            w={md ? 150 : 280}
                            mt={4}
                            bg="url(/images/Wood\ Panel.png)"
                            backgroundSize="cover"
                            borderRadius={md ? 10 : 20}
                            px={5}
                        >
                            <VStack h="100%" align="center" justify="center">
                                <Text
                                    m={0}
                                    w={md ? "fit-content" : 240}
                                    fontSize={md ? "medium" : 35}
                                    color="#683309"
                                    className="font-face-kg"
                                >
                                    Mint Live
                                </Text>
                            </VStack>
                        </Box>
                    </Flex>
                </Box>
            </Box>
        );
    };

    const GameTable = () => {
        const { sm } = useResponsive();
        const tableHeaders = ["LOGO", "TICKER", "SOCIALS", "HYPE", "MIN. LIQUIDITY", "LAUNCH"];

        return (
            <TableContainer>
                <table width="100%" className="custom-centered-table font-face-rk">
                    <thead>
                        <tr style={{ height: "50px", borderTop: "1px solid #868E96", borderBottom: "1px solid #868E96" }}>
                            {tableHeaders.map((i) => (
                                <th key={i}>
                                    <Text fontSize={sm ? "medium" : "large"} m={0}>
                                        {i}
                                    </Text>
                                </th>
                            ))}

                            <th>
                                <Box
                                    mr={sm ? 4 : 8}
                                    as="button"
                                    onClick={() => {
                                        check_launch_data.current = true;
                                        CheckLaunchData();
                                    }}
                                >
                                    <TfiReload size={20} />
                                </Box>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <Listings launch_list={launch_data} setLaunchData={setCurrentLaunchData} setScreen={setScreen} />
                    </tbody>
                </table>
            </TableContainer>
        );
    };

    const HomeScreen = () => {
        return (
            <>
                <Featured />
                <GameTable />
            </>
        );
    };

    return (
        <main style={{ padding: "50px 0" }}>
            <Navigation setScreen={setScreen} />
            {screen === Screen.HOME_SCREEN && <HomeScreen />}

            {screen === Screen.FAQ_SCREEN && <FAQScreen />}
            {screen === Screen.LAUNCH_BOOK && (
                <LaunchBook setScreen={setScreen} newLaunch={newLaunchData} ListGameOnArena={ListGameOnArena} />
            )}
            {screen === Screen.LAUNCH_DETAILS && <LaunchDetails setScreen={setScreen} newLaunch={newLaunchData} />}
            {screen === Screen.LAUNCH_SCREEN && <LaunchScreen setScreen={setScreen} newLaunch={newLaunchData} />}
            {screen === Screen.TOKEN_SCREEN && current_launch_data !== null && <TokenScreen launch_data={current_launch_data} />}
            {screen === Screen.LEADERBOARD && <Leaderboard user_data={user_data} />}
            <Footer />
        </main>
    );
}

export default function Home() {
    return <LetsCook />;
}
