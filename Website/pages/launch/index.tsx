import { LaunchData, LaunchDataUserInput, defaultUserInput } from "../../components/Solana/state";
import { useEffect, useRef, useState } from "react";
import { HStack, Tooltip, VStack, useDisclosure } from "@chakra-ui/react";
import { FaEye } from "react-icons/fa";
import TokenPage from "../../components/launch/token";
import DetailsPage from "../../components/launch/details";
import BookPage from "../../components/launch/book";
import LaunchPreviewModal from "../../components/launchPreview/modal";
import useAppRoot from "../../context/useAppRoot";
import { useRouter } from "next/router";

const Launch = () => {
    const router = useRouter();
    const [screen, setScreen] = useState("token");
    const { newLaunchData } = useAppRoot();

    return (
        <main style={{ background: "linear-gradient(180deg, #292929 20%, #0B0B0B 100%)", paddingTop: "50px" }}>
            {screen === "token" && <TokenPage newLaunchData={newLaunchData} setScreen={setScreen} />}

            {screen === "details" && <DetailsPage newLaunchData={newLaunchData} setScreen={setScreen} />}

            {screen === "book" && <BookPage newLaunchData={newLaunchData} setScreen={setScreen} />}
        </main>
    );
};

export default Launch;
