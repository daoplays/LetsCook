import Head from "next/head";
import MarketMakingTable from "../components/tables/marketMakingTable";
import QuickLaunchBanner from "../components/quickLaunchBanner";
import { useEffect } from "react";
import useAppRoot from "@/context/useAppRoot";
import { redirect } from "next/navigation";
import router from "next/router";

const Home = () => {
    const { launchList, selectedNetwork } = useAppRoot();
    const hasVisited = sessionStorage.getItem("hasVisitedHome");

    if (selectedNetwork === "mainnet") {
        if (!hasVisited && router.pathname === "/") {
            if (launchList?.size >= 0) {
                sessionStorage.setItem("hasVisitedHome", "true");
                router.push("/calendar");
            }
        }
    }
    return (
        <>
            <Head>
                <title>Let&apos;s Cook</title>
            </Head>

            <main className="flex flex-col gap-8 mt-8 md:gap-10 md:p-8">
                <QuickLaunchBanner />
                <MarketMakingTable />
            </main>
        </>
    );
};

export default Home;
