import { defaultLaunchTableFilters } from "../components/gameTable";
import GameTable from "../components/gameTable";
import FeaturedBanner from "../components/featuredBanner";
import useAppRoot from "../context/useAppRoot";
import EmptyLaunch from "../components/emptyLaunch";
import "react-datepicker/dist/react-datepicker.css";
import Loader from "../components/loader";

const Home = () => {
    const { homePageList } = useAppRoot();

    if (!homePageList) return <Loader />;

    if (homePageList.length <= 0) return <EmptyLaunch />;

    return (
        <main style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)" }}>
            <FeaturedBanner featuredLaunch={homePageList[0]} isHomePage={true} />
            <GameTable launchList={homePageList} filters={defaultLaunchTableFilters} />
        </main>
    );
};

export default Home;
