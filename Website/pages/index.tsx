import { run_launch_data_GPA, LaunchData, bignum_to_num, UserData, run_user_data_GPA } from "../components/Solana/state";
import { Center, VStack, Text, Box, HStack, ModalOverlay, Flex, Skeleton, TableContainer, Tooltip } from "@chakra-ui/react";
import { Dispatch, SetStateAction, useCallback, useEffect, useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { TfiReload } from "react-icons/tfi";
import { HypeVote } from "../components/hypeVote";
import { Screen } from "../components/Solana/constants";
import logo from "../public/images/sauce.png";
import Link from "next/link";
import useResponsive from "../hooks/useResponsive";
import Image from "next/image";
import WoodenButton from "../components/Buttons/woodenButton";
import twitter from "../public/socialIcons/twitter.svg";
import telegram from "../public/socialIcons/telegram.svg";
import discord from "../public/socialIcons/discord.svg";
import website from "../public/socialIcons/website.svg";
import "react-datepicker/dist/react-datepicker.css";

const Home = () => {
    const wallet = useWallet();
    const { sm, md } = useResponsive();
    const [launch_data, setLaunchData] = useState<LaunchData[]>([]);
    const [user_data, setUserData] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const game_interval = useRef<number | null>(null);
    const check_launch_data = useRef<boolean>(true);
    const [current_launch_data, setCurrentLaunchData] = useState<LaunchData | null>(null);
    const [current_user_data, setCurrentUserData] = useState<UserData | null>(null);

    const [screen, setScreen] = useState<Screen>(Screen.HOME_SCREEN);

    const CheckLaunchData = useCallback(async () => {
        setIsLoading(true);
        if (!check_launch_data.current) return;

        let list = await run_launch_data_GPA("");
        console.log(list);
        setLaunchData(list);

        let user_list = await run_user_data_GPA("");
        console.log(user_list);
        setUserData(user_list);

        if (wallet.publicKey !== null) {
            for (let i = 0; i < user_list.length; i++) {
                if (user_list[i].user_key.toString() == wallet.publicKey.toString()) {
                    console.log("have current user", user_list[i]);
                    setCurrentUserData(user_list[i]);
                    break;
                }
            }
        }
        check_launch_data.current = false;
        setIsLoading(false);
    }, []);

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

    useEffect(() => {
        check_launch_data.current = true;
    }, [wallet]);

    const GameTable = () => {
        const { sm } = useResponsive();
        const tableHeaders = ["LOGO", "TICKER", "SOCIALS", "HYPE", "MIN. LIQUIDITY", "LAUNCH"];

        if (launch_data.length === 0) {
            return (
                <HStack justify="center">
                    <Text color="white" fontSize="xx-large">
                        Loading...
                    </Text>
                </HStack>
            );
        }

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
                        <Listings
                            launch_list={launch_data}
                            user_data={current_user_data}
                            setLaunchData={setCurrentLaunchData}
                            setScreen={setScreen}
                        />
                    </tbody>
                </table>
            </TableContainer>
        );
    };

    const Featured = () => {
        const Links = () => (
            <HStack gap={3}>
                <Link href="#">
                    <Image src={twitter.src} alt="Twitter Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
                </Link>
                <Link href="#">
                    <Image src={telegram.src} alt="Telegram Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
                </Link>
                <Link href="#">
                    <Image src={discord.src} alt="Discord Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
                </Link>
                <Link href="#">
                    <Image src={website.src} alt="Website Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
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
                            <Image src={logo.src} width={md ? 130 : 200} height={md ? 130 : 200} alt="$SAUCE LOGO" hidden={md} />
                            <VStack gap={md ? 1 : 3} alignItems={md ? "center" : "left"}>
                                <Flex ml={-5} gap={md ? 2 : 6}>
                                    <Image src={logo.src} width={50} height={50} alt="$SAUCE LOGO" hidden={!md} />
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
                        <WoodenButton label="Mint Live" size={35} />
                    </Flex>
                </Box>
            </Box>
        );
    };

    return (
        <main style={{ padding: "50px 0" }}>
            <Featured />
            <GameTable />
        </main>
    );
};

const ArenaGameCard = ({
    launch,
    user_data,
    setLaunchData,
    setScreen,
    index,
}: {
    launch: LaunchData;
    user_data: UserData | null;
    setLaunchData: Dispatch<SetStateAction<LaunchData>>;
    setScreen: Dispatch<SetStateAction<Screen>>;
    index: number;
}) => {
    console.log(launch);
    console.log(launch.seller.toString());
    console.log(launch.sol_address.toString());
    console.log(launch.team_wallet.toString());
    console.log(launch.mint_address.toString());

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
            onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = ""; // Reset to default background color
            }}
            onClick={() => (window.location.href = `/launch/${launch.mint_address}`)}
        >
            <td style={{ minWidth: sm ? "90px" : "120px" }}>
                <Center>
                    <Box m={5} bg="#8EFF84" w={md ? 45 : 75} h={md ? 45 : 75} borderRadius={10}>
                        <Image
                            alt="Launch icon"
                            src={launch.icon}
                            width={md ? 45 : 75}
                            height={md ? 45 : 75}
                            style={{ borderRadius: "8px" }}
                        />
                    </Box>
                </Center>
            </td>
            <td style={{ minWidth: sm ? "150px" : "200px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {name}
                </Text>
            </td>
            <td style={{ minWidth: "200px" }}>
                <HStack justify="center" gap={3} onClick={(e) => e.stopPropagation()}>
                    <Link href="#">
                        <Image alt="Twitter Icon" src={twitter.src} width={md ? 30 : 40} height={md ? 30 : 40} />
                    </Link>
                    <Link href="#">
                        <Image alt="Telegram Icon" src={telegram.src} width={md ? 30 : 40} height={md ? 30 : 40} />
                    </Link>
                    <Link href="#">
                        <Image alt="Discord Icon" src={discord.src} width={md ? 30 : 40} height={md ? 30 : 40} />
                    </Link>
                    <Link href="#">
                        <Image alt="Website Icon" src={website.src} width={md ? 30 : 40} height={md ? 30 : 40} />
                    </Link>
                </HStack>
            </td>
            <td style={{ minWidth: "120px" }}>
                <HypeVote launch_data={launch} user_data={user_data} />
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
    user_data,
    setLaunchData,
    setScreen,
}: {
    launch_list: LaunchData[];
    user_data: UserData | null;
    setLaunchData: Dispatch<SetStateAction<LaunchData>>;
    setScreen: Dispatch<SetStateAction<Screen>>;
}) => {
    return (
        <>
            {launch_list.map((item: LaunchData, index) => (
                <ArenaGameCard
                    key={index}
                    launch={item}
                    user_data={user_data}
                    setLaunchData={setLaunchData}
                    setScreen={setScreen}
                    index={index}
                />
            ))}
        </>
    );
};

export default Home;
