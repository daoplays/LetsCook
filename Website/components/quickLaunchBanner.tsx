import { VStack, Text, Box } from "@chakra-ui/react";
import useResponsive from "../hooks/useResponsive";
import WoodenButton from "../components/Buttons/woodenButton";
import { useRouter } from "next/router";
import { useWallet } from "@solana/wallet-adapter-react";
import UseWalletConnection from "../hooks/useWallet";
import { Button } from "./ui/button";

const QuickLaunchBanner = () => {
    const wallet = useWallet();
    const router = useRouter();
    const { handleConnectWallet } = UseWalletConnection();
    const { sm, md, lg, xl, xxl } = useResponsive();

    return (
        <VStack justify="center " gap={4}>
            <Text
                fontSize={sm ? 24 : md ? 45 : 60}
                color="white"
                className="font-face-kg2"
                align={"center"}
                fontWeight="extrabold"
                lineHeight="30px"
            >
                CREATE A TOKEN IN SECONDS
            </Text>
            <Text className="font-face-kg2" mt={2} fontSize={sm ? "small" : lg ? "large" : "xx-large"} color="white" align={"center"}>
                Skip the Bonding Curve. Trade Instantly.
            </Text>
            <Button
                onClick={() => {
                    if (!wallet.connected) {
                        handleConnectWallet();
                    } else {
                        router.push("/launch");
                    }
                }}
                className="px-10 py-8 text-3xl transition-all hover:opacity-90"
            >
                Quick Launch
            </Button>
        </VStack>
    );
};

export default QuickLaunchBanner;
