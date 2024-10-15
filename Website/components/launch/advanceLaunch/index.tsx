import React, { Dispatch, SetStateAction, useState } from "react";
import TokenPage from "./token";
import DetailsPage from "./details";
import BookPage from "./book";
interface TokenPageProps {
    setScreen: Dispatch<SetStateAction<string>>;
}
const AdvanceLaunch = ({ activeScreen }) => {
    const [screen, setScreen] = useState(activeScreen);
    return (
        <main>
            {screen === "token" && <TokenPage setScreen={setScreen} />}

            {screen === "details" && <DetailsPage setScreen={setScreen} />}

            {screen === "book" && <BookPage setScreen={setScreen} />}
        </main>
    );
};

export default AdvanceLaunch;
