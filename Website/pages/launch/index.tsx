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
import useResponsive from "../../hooks/useResponsive";
import Head from "next/head";

const Launch = () => {
    const router = useRouter();
    const { lg } = useResponsive();
    const [screen, setScreen] = useState("token");

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Launch</title>
            </Head>
            <main style={{ background: "linear-gradient(180deg, #292929 20%, #0B0B0B 100%)", paddingTop: lg ? "25px" : "50px" }}>
                {screen === "token" && <TokenPage setScreen={setScreen} />}

                {screen === "details" && <DetailsPage setScreen={setScreen} />}

                {screen === "book" && <BookPage setScreen={setScreen} />}
            </main>
        </>
    );
};

export default Launch;
