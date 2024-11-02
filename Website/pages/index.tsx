import Head from "next/head";
import MarketMakingTable from "../components/tables/marketMakingTable";
import QuickLaunchBanner from "../components/quickLaunchBanner";

const Home = () => {
    return (
        <>
            <Head>
                <title>Let&apos;s Cook</title>
            </Head>

            <main className="mb-8 mt-16 flex flex-col gap-8">
                <QuickLaunchBanner />
                <MarketMakingTable />
            </main>
        </>
    );
};

export default Home;
