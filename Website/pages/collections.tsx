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
import CollectionDashboardTable from "../components/tables/collectionDashboardTable";
import { CollectionData } from "../components/collection/collectionState";

const BagsPage = () => {
    const { xs, sm, lg } = useResponsive();
    const { collectionList } = useAppRoot();

    if (!collectionList) return <Loader />;

    function filterTable() {
        let filtered: CollectionData[] = [];
        collectionList.forEach((item) => {
            if (item.description !== "") {
                filtered.push(item);
            }
        });
        return filtered;
    }

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Collections</title>
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
                    <Text
                        fontSize={sm ? 25 : 35}
                        color="white"
                        className="font-face-kg"
                        style={{ position: sm ? "static" : "absolute", left: 0, right: 0, margin: "auto" }}
                        align={"center"}
                    >
                        Collections
                    </Text>
                </Flex>

                <CollectionDashboardTable collectionList={filterTable()} />

                {collectionList.size <= 0 && (
                    <HStack w="100%" align="center" justify="center" mt={25}>
                        <Text fontSize={lg ? "large" : "x-large"} m={0} color={"white"} style={{ cursor: "pointer" }}>
                            There are no collections launched yet
                        </Text>
                    </HStack>
                )}
            </main>
        </>
    );
};

export default BagsPage;
