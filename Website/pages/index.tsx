import Head from "next/head";
import MarketMakingTable from "../components/tables/marketMakingTable";
import QuickLaunchBanner from "../components/quickLaunchBanner";

const Home = () => {
    return (
        <>
            <Head>
                <title>Let&apos;s Cook</title>
            </Head>

            <main className="mt-8 flex flex-col gap-8 md:gap-10 md:p-8">
                <QuickLaunchBanner />
                <MarketMakingTable />
            </main>
        </>
    );
};

export default Home;
