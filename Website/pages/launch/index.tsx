import { LaunchData, LaunchDataUserInput, defaultUserInput } from "../../components/Solana/state";
import { useEffect, useRef, useState } from "react";
import { FormControl, FormLabel, Text, Switch, Tooltip, VStack, useDisclosure } from "@chakra-ui/react";
import { FaEye } from "react-icons/fa";
import LaunchPreviewModal from "../../components/launchPreview/modal";
import useAppRoot from "../../context/useAppRoot";
import { useRouter } from "next/router";
import useResponsive from "../../hooks/useResponsive";
import Head from "next/head";
import LaunchPage from "../../components/launch/launch";
import AdvanceLaunch from "../../components/launch/advanceLaunch";

const TokenLaunch = () => {
    const router = useRouter();
    const { lg } = useResponsive();
    const [screen, setScreen] = useState("token");
    const [simpleLaunch, setSimpleLaunch] = useState(true);

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Token</title>
            </Head>
            <main
                style={{
                    background: "linear-gradient(180deg, #292929 20%, #0B0B0B 100%)",
                    height: simpleLaunch && "100%",
                    paddingTop: lg ? "25px" : "50px",
                    position: "relative",
                }}
            >
                <FormControl display="flex" w="fit-content" alignItems="center" position="absolute" top={4} right={4}>
                    <FormLabel htmlFor="mode" mb="0" color="white" cursor="pointer">
                        <Text m={0} ml={5} className="font-face-rk" fontSize={"lg"} color="white">
                            Advanced Mode
                        </Text>
                    </FormLabel>
                    <Switch
                        id="mode"
                        size="md"
                        isChecked={!simpleLaunch}
                        onChange={() => setSimpleLaunch(!simpleLaunch)}
                        isDisabled={screen !== "token"}
                    />
                </FormControl>

                {simpleLaunch ? <LaunchPage /> : <AdvanceLaunch activeScreen={screen} simpleLaunch={simpleLaunch}/>}

            </main>
        </>
    );
};

export default TokenLaunch;
