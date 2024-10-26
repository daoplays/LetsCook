import Head from "next/head";
import MarketMakingTable from "../components/tables/marketMakingTable";
import QuickLaunchBanner from "../components/quickLaunchBanner";
import Image from "next/image";
const Home = () => {
    return (
        <>
            <Head>
                <title>Let&apos;s Cook</title>
            </Head>

            <main>
                <QuickLaunchBanner />
                <MarketMakingTable />
            </main>
        </>
    );
};

export default Home;
