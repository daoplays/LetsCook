import { Button, Flex, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import useResponsive from "../hooks/useResponsive";
import "react-datepicker/dist/react-datepicker.css";
import useAppRoot from "../context/useAppRoot";
import { LaunchData } from "../components/Solana/state";
import Loader from "../components/loader";
import { LaunchKeys } from "../components/Solana/constants";
import MyBagsTable from "../components/myBagsTable";

const BagsPage = () => {
    const wallet = useWallet();
    const { sm } = useResponsive();
    const { launchList, currentUserData } = useAppRoot();
    const [bags, setBags] = useState<LaunchData[] | null>(null);

    useEffect(() => {
        if (!launchList || !wallet.connected) {
            return;
        }

        // console.log("Launch List: ", launchList[0].last_interaction.toString());
        // console.log("Current User: ", currentUserData.user_key.toString());
        const filteredLaunches = launchList.filter((launch) => launch.keys[LaunchKeys.Seller].toString() === wallet.publicKey.toString());
        setBags(filteredLaunches);
    }, [wallet, launchList]);

    if (!bags) return <Loader />;

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
                <Button w={sm ? "100%" : "fit-content"}>Claim All</Button>
            </Flex>
            <MyBagsTable bags={bags} />
        </main>
    );
};

export default BagsPage;
