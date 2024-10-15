import React, { Dispatch, SetStateAction, useState } from "react";
import TokenPage from "./token";
import DetailsPage from "./details";
import BookPage from "./book";
interface TokenPageProps {
    setScreen: Dispatch<SetStateAction<string>>;
    simpleLaunch: boolean;
}
const AdvanceLaunch = ({activeScreen, simpleLaunch}) => {
    const [screen, setScreen] = useState(activeScreen);
    return (
        <main>
            {screen === "token" && <TokenPage setScreen={setScreen} simpleLaunch={simpleLaunch} />}

            {screen === "details" && <DetailsPage setScreen={setScreen} simpleLaunch={simpleLaunch} />}

            {screen === "book" && <BookPage setScreen={setScreen} />}
        </main>
    );
};

export default AdvanceLaunch;
