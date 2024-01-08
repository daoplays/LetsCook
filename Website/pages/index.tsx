import GameTable from "../components/gameTable";
import FeaturedBanner from "../components/featuredBanner";
import "react-datepicker/dist/react-datepicker.css";
import useAppRoot from "../context/useAppRoot";
import { defaultLaunchTableFilters } from "../components/gameTable";
import EmptyLaunch from "../components/emptyLaunch";
const Home = () => {
    const { homePageList } = useAppRoot();

    if (homePageList.length <= 0) return <EmptyLaunch />;

    return (
        <main>
            <FeaturedBanner featuredLaunch={homePageList[0]} />
            <GameTable launchList={homePageList} filters={defaultLaunchTableFilters} />
        </main>
    );
};

export default Home;
