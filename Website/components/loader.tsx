import { HStack, Text, VStack } from "@chakra-ui/react";
import ClockLoader from "react-spinners/ClockLoader";

const Loader = () => {
    return (
        <HStack justify="center" align="center" h="90vh" style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)" }}>
            <VStack>
                <ClockLoader color="#ffffff" loading size={50} />
                <Text color="white" fontSize="xx-large" textAlign="center" lineHeight={1.2}>
                    Preparing on-chain ingredients...
                </Text>
            </VStack>
        </HStack>
    );
};

export default Loader;
