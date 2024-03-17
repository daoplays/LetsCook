import { Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import useResponsive from "../hooks/useResponsive";
import "react-datepicker/dist/react-datepicker.css";
import useAppRoot from "../context/useAppRoot";
import { JoinData, LaunchData, JoinedLaunch, bignum_to_num } from "../components/Solana/state";
import Loader from "../components/loader";
import { LaunchKeys } from "../components/Solana/constants";
import Head from "next/head";
import MyTicketsTable from "../components/tables/myTicketsTable";
import MyRewards from "../components/tables/myRewards";
import MyRewardsTable from "../components/tables/myRewards";

const BagsPage = () => {
    const { xs, sm, lg } = useResponsive();

    const [selected, setSelected] = useState("My Tickets");

    const handleClick = (tab: string) => {
        setSelected(tab);
    };

    const { joinData, launchList } = useAppRoot();
    const [joinedLaunches, setJoinedLaunches] = useState<JoinedLaunch[] | null>(null);

    useEffect(() => {
        if (joinData && launchList) {
            const userJoinedLaunches = launchList.filter((launch) => {
                const joinedGameIds = joinData.map((join) => bignum_to_num(join.game_id).toString());
                return joinedGameIds.includes(launch.game_id.toString());
            });

            let joinedLaunches: JoinedLaunch[] = [];
            for (let i = 0; i < joinData.length; i++) {
                const joinedLaunch = launchList.filter((launch) => {
                    return joinData[i].game_id.eq(launch.game_id);
                });
                if (joinedLaunch.length === 0 || joinedLaunch[0] === undefined)
                    continue;
                
                //console.log(joinedLaunch[0].game_id.toString(), joinData[i].game_id.toString());
                let joined_launch: JoinedLaunch = { join_data: joinData[i], launch_data: joinedLaunch[0] };
                joinedLaunches.push(joined_launch);
            }

            setJoinedLaunches(joinedLaunches);
        }
    }, [joinData, launchList]);

    if (!joinedLaunches) return <Loader />;

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | My Bags</title>
            </Head>
            <main>
                <Flex
                    px={4}
                    // py={18}
                    py={sm ? 22 : 37}
                    gap={2}
                    alignItems="center"
                    justifyContent={"start"}
                    style={{ position: "relative", flexDirection: sm ? "column-reverse" : "row" }}
                >
                    {/* <HStack align="center" spacing={0} zIndex={99} w="100%" mt={xs ? 1 : 0}>
                        {["My Tickets", "My Rewards"].map((name, i) => {
                            const isActive = selected === name;

                            const baseStyle = {
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer",
                            };

                            const activeStyle = {
                                background: isActive ? "#edf2f7" : "transparent",
                                color: isActive ? "black" : "white",
                                borderRadius: isActive ? "6px" : "",
                                border: isActive ? "none" : "",
                            };

                            return (
                                <Box
                                    key={i}
                                    style={{
                                        ...baseStyle,
                                        ...activeStyle,
                                    }}
                                    onClick={() => handleClick(name)}
                                    px={4}
                                    py={2}
                                    w={xs ? "50%" : "fit-content"}
                                >
                                    <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
                                        {name}
                                    </Text>
                                </Box>
                            );
                        })}
                    </HStack> */}

                    <Text
                        fontSize={sm ? 25 : 35}
                        color="white"
                        className="font-face-kg"
                        style={{ position: sm ? "static" : "absolute", left: 0, right: 0, margin: "auto" }}
                        align={"center"}
                    >
                        Bags
                    </Text>
                    {selected === "My Rewards" && !sm && <Button>Claim All</Button>}
                </Flex>

                {selected === "My Tickets" && <MyTicketsTable bags={joinedLaunches} />}

                {/* {selected === "My Rewards" && <MyRewardsTable bags={joinedLaunches} />} */}

                {joinedLaunches.length <= 0 && (
                    <HStack w="100%" align="center" justify="center" mt={25}>
                        <Text fontSize={lg ? "large" : "x-large"} m={0} color={"white"} style={{ cursor: "pointer" }}>
                            Your bag is empty
                        </Text>
                    </HStack>
                )}
            </main>
        </>
    );
};

export default BagsPage;
