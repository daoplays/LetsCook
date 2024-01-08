import { LaunchData, LaunchDataUserInput, defaultUserInput } from "../../components/Solana/state";
import { useEffect, useRef, useState } from "react";
import { HStack, Tooltip, VStack, useDisclosure } from "@chakra-ui/react";
import { FaEye } from "react-icons/fa";
import TokenPage from "../../components/launch/token";
import DetailsPage from "../../components/launch/details";
import BookPage from "../../components/launch/book";
import LaunchPreviewModal from "../../components/launchPreview/modal";
import useAppRoot from "../../context/useAppRoot";

const Launch = () => {
    const [screen, setScreen] = useState("token");
    const newLaunchData = useRef<LaunchDataUserInput>(defaultUserInput);

    return (
        <main style={{ background: "linear-gradient(180deg, #292929 20%, #0B0B0B 100%)", paddingTop: "50px" }}>
            {/* <HStack px={4} py={15} justifyContent="end" style={{ position: "sticky", top: 0 }}>
                {screen === "book" && (
                    <Tooltip label="Preview Launch" hasArrow fontSize="large" offset={[0, 10]}>
                        <VStack
                            backgroundImage="url(./images/Wood\ Panel.png)"
                            backgroundSize="cover"
                            align="center"
                            justify="center"
                            width={46}
                            height={46}
                            borderRadius={"100%"}
                            color="#683309"
                            style={{ position: "sticky", top: 0, zIndex: 99999, cursor: "pointer" }}
                            
                        >
                            <FaEye size={28} />
                        </VStack>
                    </Tooltip>
                )}
            </HStack> */}

            {screen === "token" && <TokenPage newLaunchData={newLaunchData} setScreen={setScreen} />}

            {screen === "details" && <DetailsPage newLaunchData={newLaunchData} setScreen={setScreen} />}

            {screen === "book" && <BookPage newLaunchData={newLaunchData} setScreen={setScreen} />}
        </main>
    );
};

export default Launch;
