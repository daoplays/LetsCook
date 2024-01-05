import { RunLaunchDataGPA, LaunchData, bignum_to_num, UserData, RunUserDataGPA } from "../components/Solana/state";
import { Center, VStack, Text, Box, HStack, ModalOverlay, Flex, Skeleton, TableContainer, Tooltip, Show } from "@chakra-ui/react";
import { Dispatch, SetStateAction, useCallback, useEffect, useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Screen } from "../components/Solana/constants";
import Link from "next/link";
import useResponsive from "../hooks/useResponsive";
import Image from "next/image";
import WoodenButton from "../components/Buttons/woodenButton";
import twitter from "../public/socialIcons/twitter.svg";
import telegram from "../public/socialIcons/telegram.svg";
import discord from "../public/socialIcons/discord.svg";
import website from "../public/socialIcons/website.svg";
import "react-datepicker/dist/react-datepicker.css";
import GameTable from "../components/gameTable";

const Home = () => {
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

    const [screen, setScreen] = useState<Screen>(Screen.HOME_SCREEN);

    const CheckLaunchData = useCallback(async () => {
        setIsLoading(true);
        if (!check_launch_data.current) return;

        let list = await RunLaunchDataGPA("");
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

    const Featured = () => {
        const Links = () => (
            <HStack gap={3}>
                <Link href={featured_launch !== null ? "https://twitter.com/" + featured_launch.twitter : "#"} target="_blank">
                    <Image src={twitter.src} alt="Twitter Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
                </Link>
                <Link href={featured_launch !== null ? "https://twitter.com/" + featured_launch.telegram : "#"} target="_blank">
                    <Image src={telegram.src} alt="Telegram Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
                </Link>
                <Link href={featured_launch !== null ? "https://twitter.com/" + featured_launch.twitter : "#"} target="_blank">
                    <Image src={discord.src} alt="Discord Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
                </Link>
                <Link href={featured_launch !== null ? featured_launch.website : "#"} target="_blank">
                    <Image src={website.src} alt="Website Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
                </Link>
            </HStack>
        );

        return (
            <Box h={md ? 300 : 320} bg="url(/images/Banner.png)" bgSize="cover" boxShadow="0px 8px 12px 5px rgba(0, 0, 0, 0.30)inset ">
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
                            {featured_launch !== null && (
                                <Image
                                    src={featured_launch.icon}
                                    width={md ? 130 : 200}
                                    height={md ? 130 : 200}
                                    alt="$LOGO"
                                    hidden={md}
                                    style={{ borderRadius: sm ? "12px" : "8px" }}
                                />
                            )}
                            <VStack gap={md ? 1 : 3} alignItems={md ? "center" : "left"}>
                                <Flex gap={md ? 2 : 6}>
                                    {/* {featured_launch !== null && (
                                        <Image
                                            src={featured_launch.icon}
                                            width={50}
                                            height={50}
                                            alt="$LOGO"
                                            hidden={!md}
                                            style={{ borderRadius: sm ? "12px" : "8px" }}
                                        />
                                    )} */}
                                    <Text
                                        m={0}
                                        fontSize={md ? 30 : 60}
                                        color="white"
                                        className="font-face-kg"
                                        style={{ wordBreak: "break-all" }}
                                        align={"center"}
                                    >
                                        {featured_launch !== null ? "$" + featured_launch.name : ""}
                                    </Text>
                                    {!md && featured_launch !== null && <Links />}
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
                                    {featured_launch !== null ? featured_launch.description : ""}
                                </Text>
                            </VStack>
                        </HStack>

                        <Show breakpoint="(max-width: 1024px)">{featured_launch !== null && <Links />}</Show>

                        <Link href={`/launch/${featured_launch?.page_name}`} style={{ marginTop: sm ? 12 : 0 }}>
                            {featured_launch !== null && new Date().getTime() >= featured_launch.launch_date && (
                                <WoodenButton label="Mint Live" size={35} />
                            )}
                            {featured_launch !== null && new Date().getTime() < featured_launch.launch_date && (
                                <WoodenButton label="Mint Pending" size={35} />
                            )}
                            {featured_launch !== null && new Date().getTime() >= featured_launch.end_date && (
                                <WoodenButton label="Mint Closed" size={35} />
                            )}
                        </Link>
                    </Flex>
                </Box>
            </Box>
        );
    };

    return (
        <main>
            <Featured />
            <GameTable />
        </main>
    );
};

export default Home;
