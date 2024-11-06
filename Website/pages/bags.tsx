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

    const { joinData, launchList, listingData } = useAppRoot();
    const [joinedLaunches, setJoinedLaunches] = useState<JoinedLaunch[] | null>(null);

    useEffect(() => {
        if (joinData && launchList) {
            let joinedLaunches: JoinedLaunch[] = [];
            joinData.forEach((join) => {
                const joinedLaunch = launchList.get(join.page_name);
                if (joinedLaunch === null || joinedLaunch === undefined) return;

                let joined_launch: JoinedLaunch = { join_data: join, launch_data: joinedLaunch };
                joinedLaunches.push(joined_launch);
            });

            setJoinedLaunches(joinedLaunches);
        }
    }, [joinData, launchList, listingData]);

    if (!joinedLaunches) return <Loader />;

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | My Tickets</title>
            </Head>
            <main className="md:p-8">
                <Flex
                    px={4}
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
                        style={{ marginTop: sm ? 16 : 0 }}
                        className="mx-auto mb-3 block text-center text-3xl font-semibold text-white lg:text-4xl"
                        align={"center"}
                    >
                        Tickets
                    </Text>
                    {selected === "My Rewards" && !sm && <Button>Claim All</Button>}
                </Flex>

                {selected === "My Tickets" && <MyTicketsTable bags={joinedLaunches} />}

                {/* {selected === "My Rewards" && <MyRewardsTable bags={joinedLaunches} />} */}

                {joinedLaunches.length <= 0 && (
                    <HStack w="100%" align="center" justify="center" mt={25}>
                        <Text fontSize={lg ? "large" : "x-large"} m={0} color={"white"} style={{ cursor: "pointer" }}>
                            You have no unchecked tickets
                        </Text>
                    </HStack>
                )}
            </main>
        </>
    );
};

export default BagsPage;
