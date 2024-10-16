import Head from "next/head";
import MarketMakingTable from "../components/tables/marketMakingTable";
import QuickLaunchBanner from "../components/quickLaunchBanner";

const Home = () => {
    return (
        <>
            <Head>
                <title>Let&apos;s Cook</title>
            </Head>

            <main style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)" }}>
                <QuickLaunchBanner />
                <MarketMakingTable />
            </main>
        </>
    );
};

export default Home;
