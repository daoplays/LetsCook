import { defaultLaunchTableFilters } from "../components/tables/gameTable";
import GameTable from "../components/tables/gameTable";
import FeaturedBanner from "../components/featuredBanner";
import useAppRoot from "../context/useAppRoot";
import EmptyLaunch from "../components/emptyLaunch";
import "react-datepicker/dist/react-datepicker.css";
import Loader from "../components/loader";
import Head from "next/head";
import { isHomePageOnly } from "../constant/root";
import { LaunchData } from "../components/Solana/state";

const Home = () => {
    const { homePageList, listingData } = useAppRoot();

    if (!homePageList || !listingData) return <Loader />;

    if (homePageList.size <= 0) return <EmptyLaunch />;

    let homePageVec: LaunchData[] = [];
    homePageList.forEach((launch) => {
        homePageVec.push(launch);
    });

    let featuredLaunch = homePageVec[0];
    let featuredListing = listingData.get(featuredLaunch.listing.toString());

    return (
        <>
            <Head>
                <title>Let&apos;s Cook</title>
            </Head>
            {isHomePageOnly ? (
                <EmptyLaunch />
            ) : (
                <main style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)" }}>
                    <FeaturedBanner featuredLaunch={homePageVec[0]} featuredListing={featuredListing} isHomePage={true} />
                    <GameTable launch_list={homePageList} filters={defaultLaunchTableFilters} />
                </main>
            )}
        </>
    );
};

export default Home;
