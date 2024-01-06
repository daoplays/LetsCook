import GameTable from "../components/gameTable";
import FeaturedBanner from "../components/featuredBanner";
import "react-datepicker/dist/react-datepicker.css";

const Home = () => {
    return (
        <main>
            <FeaturedBanner />
            <GameTable />
        </main>
    );
};

export default Home;
