import GameTable from "../components/gameTable";
import FeaturedBanner from "../components/featuredBanner";
import "react-datepicker/dist/react-datepicker.css";
import useAppRoot from "../context/useAppRoot";
import { defaultLaunchTableFilters } from "../components/gameTable";
const Home = () => {
    const { homePageList } = useAppRoot();

    return (
        <main>
            <FeaturedBanner featuredLaunch={homePageList[0]} />
            <GameTable launchList={homePageList} filters={defaultLaunchTableFilters} />
        </main>
    );
};

export default Home;
