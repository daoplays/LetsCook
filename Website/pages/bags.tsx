import { Button, Flex, Text } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import useResponsive from "../hooks/useResponsive";
import "react-datepicker/dist/react-datepicker.css";
import useAppRoot from "../context/useAppRoot";
import { JoinData, LaunchData, RunJoinDataGPA } from "../components/Solana/state";
import Loader from "../components/loader";
import { LaunchKeys } from "../components/Solana/constants";
import MyBagsTable from "../components/myBagsTable";

const BagsPage = () => {
    const { sm } = useResponsive();
    const { joinData, launchList } = useAppRoot();
    const [joinedLaunches, setJoinedLaunches] = useState<LaunchData[] | null>(null);

    useEffect(() => {
        if (joinData && launchList) {
            const userJoinedLaunches = launchList.filter((launch) => {
                const joinedGameIds = joinData.map((join) => join.game_id.toString());
                return joinedGameIds.includes(launch.game_id.toString());
            });

            setJoinedLaunches(userJoinedLaunches);
        }
    }, [joinData, launchList]);

    if (!joinedLaunches) return <Loader />;

    return (
        <main>
            <Flex
                px={4}
                py={18}
                gap={2}
                alignItems="center"
                justifyContent="end"
                style={{ position: "relative", flexDirection: sm ? "column" : "row" }}
            >
                <Text
                    fontSize={sm ? 25 : 35}
                    color="white"
                    className="font-face-kg"
                    style={{ position: sm ? "static" : "absolute", left: 0, right: 0, margin: "auto" }}
                    align={"center"}
                >
                    My Bags
                </Text>
            </Flex>
            <MyBagsTable bags={joinedLaunches} />
        </main>
    );
};

export default BagsPage;
