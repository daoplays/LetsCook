import { Button, Flex, Link, Text } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import useResponsive from "../hooks/useResponsive";
import CreatorDashboardTable from "../components/creatorDashboardTable";
import "react-datepicker/dist/react-datepicker.css";
import useAppRoot from "../context/useAppRoot";
import { LaunchData } from "../components/Solana/state";
import EmptyLaunch from "../components/emptyLaunch";
import Loader from "../components/loader";
import { LaunchKeys } from "../components/Solana/constants";

const DashboardPage = () => {
    const router = useRouter();
    const wallet = useWallet();
    const { sm } = useResponsive();
    const { launchList } = useAppRoot();
    const [creatorLaunches, setCreatorLaunches] = useState<LaunchData[] | null>(null);

    useEffect(() => {
        if (!launchList || !wallet.connected) {
            return;
        }

        const filteredLaunches = launchList.filter((launch) => launch.keys[LaunchKeys.Seller].toString() === wallet.publicKey.toString());
        setCreatorLaunches(filteredLaunches);
    }, [wallet, launchList]);

    if (!creatorLaunches) return <Loader />;

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
                    Creator Dashboard
                </Text>
                {/* <Link href="/launch" w={sm ? "100%" : "fit-content"}> */}
                <Button w={sm ? "100%" : "fit-content"} onClick={() => router.push("/launch")}>
                    New Launch
                </Button>
                {/* </Link> */}
            </Flex>
            <CreatorDashboardTable creatorLaunches={creatorLaunches} />
        </main>
    );
};

export default DashboardPage;
