import GameTable from "../components/gameTable";
import FeaturedBanner from "../components/featuredBanner";
import "react-datepicker/dist/react-datepicker.css";
import useAppRoot from "../context/useAppRoot";
import { defaultLaunchTableFilters } from "../components/gameTable";
const Home = () => {
    const { launchList } = useAppRoot();

    return (
        <main>
            <FeaturedBanner featuredLaunch={launchList[0]} />
            <GameTable filters={defaultLaunchTableFilters}/>
        </main>
    );
};

export default Home;
