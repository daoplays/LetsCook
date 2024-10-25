import { VStack, Text, Box } from "@chakra-ui/react";
import useResponsive from "../hooks/useResponsive";
import WoodenButton from "../components/Buttons/woodenButton";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";
import UseWalletConnection from "../hooks/useWallet";

const QuickLaunchBanner = () => {
    const wallet = useWallet();
    const router = useRouter();
    const { handleConnectWallet } = UseWalletConnection();
    const { sm, md, lg, xl, xxl } = useResponsive();

    return (
        <Box
            w="100%"
            h={lg ? 350 : 400}
            bg={"url(/images/Banner.png)"}
            bgSize="cover"
            boxShadow="0px 8px 12px 5px rgba(0, 0, 0, 0.30)inset"
        >
            <Box bg="linear-gradient(180deg, rgba(255,255,255,0) -60%, rgba(0,0,0,1) 150%)" w="100%" h="100%">
                <VStack px={4} justify="center" w="100%" h={"100%"} spacing={6}>
                    <Text m={0} fontSize={sm ? 24 : md ? 45 : 60} color="white" className="font-face-kg" align={"center"}>
                        Create a token in seconds
                    </Text>
                    <Text
                        m="0"
                        mb="2"
                        className="font-face-kg"
                        fontSize={sm ? "small" : lg ? "large" : "x-large"}
                        color="white"
                        align={"center"}
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
                        <WoodenButton label="Instant Launch" size={28} />
                    </div>
                </VStack>
            </Box>
        </Box>
    );
};

export default QuickLaunchBanner;
