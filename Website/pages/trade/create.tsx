import { LaunchData, LaunchDataUserInput, defaultUserInput } from "../../components/Solana/state";
import { useEffect, useRef, useState } from "react";
import { FormControl, FormLabel, Text, Switch, Tooltip, VStack, useDisclosure } from "@chakra-ui/react";
import { FaEye } from "react-icons/fa";
import TokenPage from "../../components/launch/advanceLaunch/token";
import DetailsPage from "../../components/launch/advanceLaunch/details";
import BookPage from "../../components/launch/advanceLaunch/book";
import LaunchPreviewModal from "../../components/launchPreview/modal";
import useAppRoot from "../../context/useAppRoot";
import { useRouter } from "next/router";
import useResponsive from "../../hooks/useResponsive";
import Head from "next/head";
import LaunchAMM from "../../components/amm/launch";

const CreateAMM = () => {
    const { lg } = useResponsive();

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Token</title>
            </Head>
            <main
                style={{
                    background: "linear-gradient(180deg, #292929 20%, #0B0B0B 100%)",
                    height: "100%",
                    paddingTop: lg ? "25px" : "50px",
                    position: "relative",
                }}
            >
                <LaunchAMM />
            </main>
        </>
    );
};

export default CreateAMM;
