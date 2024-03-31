import { VStack, Text, HStack, Progress, Button, Tooltip, Link } from "@chakra-ui/react";
import { LaunchData } from "../../components/Solana/state";
import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import Image from "next/image";
import useResponsive from "../../hooks/useResponsive";
import UseWalletConnection from "../../hooks/useWallet";
import FeaturedBanner from "../../components/featuredBanner";
import Head from "next/head";
import { MdOutlineContentCopy } from "react-icons/md";
import trimAddress from "../../utils/trimAddress";

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
                <VStack
                    p={md ? 22 : 50}
                    bg="rgba(225, 225, 225, 0.20)"
                    borderRadius={12}
                    border="1px solid white"
                    h="500px"
                    w={"100%"}
                    style={{ width: "100%" }}
                    justifyContent="space-between"
                >
                    <Text m={0} align="start" className="font-face-kg" color={"white"} fontSize="xx-large">
                        Hybrid Wrap
                    </Text>
                    <HStack spacing={24} alignItems="start">
                        <VStack>
                            <Image
                                src={"/images/smile.png"}
                                width={180}
                                height={180}
                                alt="Image Frame"
                                style={{ backgroundSize: "cover", borderRadius: 12 }}
                            />
                            <Text mt={1} mb={0} color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                $JOY
                            </Text>
                            <HStack spacing={2} align="start" justify="start">
                                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"large"}>
                                    CA: {trimAddress("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263")}
                                </Text>

                                <Tooltip label="Copy Contract Address" hasArrow fontSize="large" offset={[0, 10]}>
                                    <div
                                        style={{ cursor: "pointer" }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            navigator.clipboard.writeText("");
                                        }}
                                    >
                                        <MdOutlineContentCopy color="white" size={lg ? 22 : 22} />
                                    </div>
                                </Tooltip>

                                <Tooltip label="View in explorer" hasArrow fontSize="large" offset={[0, 10]}>
                                    <Link target="_blank" onClick={(e) => e.stopPropagation()}>
                                        <Image src="/images/solscan.png" width={lg ? 22 : 22} height={lg ? 22 : 22} alt="Solscan icon" />
                                    </Link>
                                </Tooltip>
                            </HStack>
                        </VStack>

                        <VStack spacing={3} margin="auto 0">
                            <Button>X Tokens = 1 NFT</Button>
                            <Button>1 NFT = X - 1% Tokens</Button>
                            <HStack alignItems="start">
                                <Text m={0} color="white" fontSize="medium" fontFamily="ReemKufiRegular">
                                    Platform Fee: 0.005
                                </Text>
                                <Image src="/images/sol.png" width={22} height={22} alt="SOL Icon" style={{ marginLeft: -3 }} />
                            </HStack>
                        </VStack>

                        <VStack>
                            <Image
                                src={"/images/cookman.png"}
                                width={180}
                                height={180}
                                alt="Image Frame"
                                style={{ backgroundSize: "cover", borderRadius: 12 }}
                            />
                            <Text mt={1} mb={0} color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                Cooldown: X Days
                            </Text>
                        </VStack>
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
                                        220 / 500
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
