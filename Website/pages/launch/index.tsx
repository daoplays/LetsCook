import { useEffect, useRef, useState } from "react";
import { FormControl, FormLabel, Text, Switch, Tooltip, VStack, useDisclosure } from "@chakra-ui/react";
import { useRouter } from "next/router";
import useResponsive from "../../hooks/useResponsive";
import Head from "next/head";
import LaunchPage from "../../components/launch/instant";
import AdvanceLaunch from "../../components/launch/advancedLaunch";

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
            <main className="md:p-8">
                <FormControl
                    display="flex"
                    w="fit-content"
                    alignItems="center"
                    position="absolute"
                    top={20}
                    right={8}
                    p={4}
                    py={2}
                    className="z-50 rounded-xl bg-gray-800 bg-opacity-75 bg-clip-padding shadow-2xl backdrop-blur-sm backdrop-filter"
                >
                    <FormLabel htmlFor="mode" mb="0" color="white" cursor="pointer">
                        <Text m={0} fontSize={"md"} color="white">
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
                {simpleLaunch ? <LaunchPage /> : <AdvanceLaunch activeScreen={screen} />}
            </main>
        </>
    );
};

export default TokenLaunch;
