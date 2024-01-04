import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { LaunchData, RunLaunchDataGPA, RunUserDataGPA, UserData, bignum_to_num } from "./Solana/state";
import { useWallet } from "@solana/wallet-adapter-react";
import { Box, Center, HStack, Link, TableContainer, Text } from "@chakra-ui/react";
import { TfiReload } from "react-icons/tfi";
import { HypeVote } from "./hypeVote";
import useResponsive from "../hooks/useResponsive";
import Image from "next/image";
import twitter from "../public/socialIcons/twitter.svg";
import telegram from "../public/socialIcons/telegram.svg";
import discord from "../public/socialIcons/discord.svg";
import website from "../public/socialIcons/website.svg";

const GameTable = () => {
    const wallet = useWallet();
    const { sm, md } = useResponsive();
    const [launch_data, setLaunchData] = useState<LaunchData[]>([]);
    const [user_data, setUserData] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const game_interval = useRef<number | null>(null);
    const check_launch_data = useRef<boolean>(true);
    const [current_launch_data, setCurrentLaunchData] = useState<LaunchData | null>(null);
    const [featured_launch, setFeaturedLaunch] = useState<LaunchData | null>(null);
    const [current_user_data, setCurrentUserData] = useState<UserData | null>(null);

    const CheckLaunchData = useCallback(async () => {
        setIsLoading(true);
        if (!check_launch_data.current) return;

        let list = await RunLaunchDataGPA("");
        console.log(list);
        setLaunchData(list);
        setFeaturedLaunch(list[0]);

        let user_list = await RunUserDataGPA("");
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

    useEffect(() => {
        check_launch_data.current = true;
    }, [wallet]);

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
                    <Listings launch_list={launch_data} user_data={current_user_data} setLaunchData={setCurrentLaunchData} />
                </tbody>
            </table>
        </TableContainer>
    );
};

const ArenaGameCard = ({
    launch,
    user_data,
    setLaunchData,
    index,
}: {
    launch: LaunchData;
    user_data: UserData | null;
    setLaunchData: Dispatch<SetStateAction<LaunchData>>;
    index: number;
}) => {
    // console.log(launch);
    /// console.log(launch.seller.toString());
    //console.log(launch.sol_address.toString());
    //console.log(launch.team_wallet.toString());
    //console.log(launch.mint_address.toString());

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
            onClick={() => (window.location.href = `/launch/${launch.page_name}`)}
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
}: {
    launch_list: LaunchData[];
    user_data: UserData | null;
    setLaunchData: Dispatch<SetStateAction<LaunchData>>;
}) => {
    return (
        <>
            {launch_list.map((item: LaunchData, index) => (
                <ArenaGameCard key={index} launch={item} user_data={user_data} setLaunchData={setLaunchData} index={index} />
            ))}
        </>
    );
};

export default GameTable;
