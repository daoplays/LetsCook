import { Button, Flex, Text } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import useResponsive from "../hooks/useResponsive";
import "react-datepicker/dist/react-datepicker.css";
import useAppRoot from "../context/useAppRoot";
import { JoinData, LaunchData, JoinedLaunch, bignum_to_num } from "../components/Solana/state";
import Loader from "../components/loader";
import { LaunchKeys } from "../components/Solana/constants";
import MyBagsTable from "../components/myBagsTable";

const BagsPage = () => {
    const { sm } = useResponsive();
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
                console.log(joinedLaunch[0].game_id.toString(), joinData[i].game_id.toString());
                let joined_launch: JoinedLaunch = { join_data: joinData[i], launch_data: joinedLaunch[0] };
                joinedLaunches.push(joined_launch);
            }

            setJoinedLaunches(joinedLaunches);
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
