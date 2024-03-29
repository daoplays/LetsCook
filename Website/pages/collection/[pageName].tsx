import { VStack, Text, HStack, Progress, Button } from "@chakra-ui/react";
import { LaunchData } from "../../components/Solana/state";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import Image from "next/image";
import useResponsive from "../../hooks/useResponsive";
import UseWalletConnection from "../../hooks/useWallet";
import FeaturedBanner from "../../components/featuredBanner";
import Head from "next/head";
import FeaturedBannerCollection from "../../components/featuredBannerCollection";

const TokenMintPage = () => {
    const wallet = useWallet();
    const router = useRouter();
    const { pageName } = router.query;
    const { xs, sm, md, lg } = useResponsive();
    const { handleConnectWallet } = UseWalletConnection();

    const [launchData, setLaunchData] = useState<LaunchData | null>(null);

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Page</title>
            </Head>
            <main style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)", padding: "16px" }}>
                <FeaturedBannerCollection featuredLaunch={launchData} isHomePage={false} />
                <VStack
                    gap={50}
                    p={md ? 25 : 50}
                    bg="rgba(255, 255, 255, 0.20)"
                    borderRadius={12}
                    border="1px solid white"
                    h="500px"
                    w={"100%"}
                    style={{ width: "100%" }}
                    justifyContent="space-between"
                >
                    <HStack spacing={24} mt={14}>
                        <Image
                            src={"/images/smile.png"}
                            width={180}
                            height={180}
                            alt="Image Frame"
                            style={{ backgroundSize: "cover", borderRadius: 12 }}
                        />
                        <VStack>
                            <Text mb={3} align="start" className="font-face-kg" color={"white"} fontSize="xx-large">
                                Hybrid Swap
                            </Text>
                            <Button>X Tokens = 1 NFT</Button>
                            <Button>1 NFT = X - 1% Tokens</Button>
                        </VStack>
                        <Image
                            src={"/images/cookman.png"}
                            width={180}
                            height={180}
                            alt="Image Frame"
                            style={{ backgroundSize: "cover", borderRadius: 12 }}
                        />
                    </HStack>
                    <VStack spacing={0} w="100%" style={{ position: "relative" }}>
                        <Text color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                            Available Supply
                        </Text>
                        <HStack w="100%" style={{ position: "relative", alignItems: "center", justifyContent: "center" }}>
                            <Progress
                                w="100%"
                                h={29}
                                borderRadius={20}
                                sx={{
                                    "& > div": {
                                        background: "linear-gradient(180deg, #8DFE7A 0%, #3E9714 100%)",
                                    },
                                }}
                                size="sm"
                                min={0}
                                value={50}
                                boxShadow="0px 5px 15px 0px rgba(0,0,0,0.6) inset"
                            />
                            <HStack style={{ position: "absolute", zIndex: 1 }}>
                                <HStack justify="center">
                                    <Text m="0" color="black" fontSize={sm ? "medium" : "large"} fontFamily="ReemKufiRegular">
                                        250 / 500
                                    </Text>
                                </HStack>
                            </HStack>
                        </HStack>
                    </VStack>
                </VStack>
            </main>
        </>
    );
};

export default TokenMintPage;
