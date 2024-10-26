import { VStack, Text, Box } from "@chakra-ui/react";
import useResponsive from "../hooks/useResponsive";
import WoodenButton from "../components/Buttons/woodenButton";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";
import UseWalletConnection from "../hooks/useWallet";
import Image from "next/image";

const QuickLaunchBanner = () => {
    const wallet = useWallet();
    const router = useRouter();
    const { handleConnectWallet } = UseWalletConnection();
    const { sm, md, lg, xl, xxl } = useResponsive();

    return (
        <Box w="100%" h={lg ? 350 : "auto"} className={"mb-5"} bgSize="cover" mt={"50px"}>
            <Box w="100%" h="100%">
                <VStack px={4} justify="center" w="100%" h={"100%"} spacing={5}>
                    
                    <Text m={0} fontSize={sm ? 24 : md ? 45 : 60} color="white" className="font-face-kg2" align={"center"} fontWeight="extrabold" lineHeight="30px">
                        CREATE A TOKEN IN SECONDS
                    </Text>
                    <Text
                        m="0"
                        className="font-face-kg2"
                        fontSize={sm ? "small" : lg ? "large" : "xx-large"}
                        color="white"
                        align={"center"}
                        fontWeight="bold"
                    >
                        Skip the Bonding Curve. Trade Instantly.
                    </Text>
                    <div
                        onClick={() => {
                            if (!wallet.connected) {
                                handleConnectWallet();
                            } else {
                                router.push("/launch");
                            }
                        }}
                    >
                        <WoodenButton label="QUICK LAUNCH" size={28} />
                    </div>
                </VStack>
            </Box>
        </Box>
    );
};

export default QuickLaunchBanner;
