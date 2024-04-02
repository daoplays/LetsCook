import { VStack, Text, HStack, Progress, Button, Tooltip, Link } from "@chakra-ui/react";
import { bignum_to_num } from "../../components/Solana/state";
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
import useAppRoot from "../../context/useAppRoot";
import { CollectionData } from "../../components/collection/collectionState";
import PageNotFound from "../../components/pageNotFound";
import Loader from "../../components/loader";
import CollectionFeaturedBanner from "../../components/collectionFeaturedBanner";
import useClaimNFT from "../../hooks/collections/useClaimNFT";
import { CollectionKeys } from "../../components/Solana/constants";

function findLaunch(list: CollectionData[], page_name: string | string[]) {
    if (list === null || list === undefined || page_name === undefined || page_name === null) return null;

    let launchList = list.filter(function (item) {
        //console.log(new Date(bignum_to_num(item.launch_date)), new Date(bignum_to_num(item.end_date)))
        return item.page_name == page_name;
    });

    return launchList[0];
}

const CollectionSwapPage = () => {
    const wallet = useWallet();
    const router = useRouter();
    const { pageName } = router.query;
    const { xs, sm, md, lg } = useResponsive();
    const { handleConnectWallet } = UseWalletConnection();
    const { collectionList } = useAppRoot();

    let launch = findLaunch(collectionList, pageName);

    const {ClaimNFT} = useClaimNFT(launch);



    if (!pageName) return;

    if (launch === null) return <Loader />;

    if (!launch) return <PageNotFound />;

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | {pageName}</title>
            </Head>
            <main style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)" }}>
                <CollectionFeaturedBanner featuredLaunch={launch} isHomePage={false} />
                <div style={{ padding: "16px" }}>
                    <VStack
                        p={md ? 22 : 50}
                        bg="rgba(225, 225, 225, 0.20)"
                        borderRadius={12}
                        border="1px solid white"
                        h="500px"
                        justifyContent="space-between"
                    >
                        <Text m={0} align="start" className="font-face-kg" color={"white"} fontSize="xx-large">
                            Hybrid Wrap
                        </Text>
                        <HStack spacing={24} alignItems="start">
                            <VStack>
                                <Image
                                    src={launch.token_icon_url}
                                    width={180}
                                    height={180}
                                    alt="Image Frame"
                                    style={{ backgroundSize: "cover", borderRadius: 12 }}
                                />
                                <Text mt={1} mb={0} color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                    {launch.token_symbol}
                                </Text>
                                <HStack spacing={2} align="start" justify="start">
                                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"large"}>
                                        CA: {trimAddress(launch.keys[CollectionKeys.MintAddress].toString())}
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
                                            <Image
                                                src="/images/solscan.png"
                                                width={lg ? 22 : 22}
                                                height={lg ? 22 : 22}
                                                alt="Solscan icon"
                                            />
                                        </Link>
                                    </Tooltip>
                                </HStack>
                            </VStack>

                            <VStack spacing={3} margin="auto 0">
                                <Button onClick={() => ClaimNFT()}>{bignum_to_num(launch.swap_price)} Tokens = 1 NFT</Button>
                                <Button>1 NFT = {bignum_to_num(launch.swap_price)} - {bignum_to_num(launch.swap_fee)}% Tokens</Button>
                            </VStack>

                            <VStack>
                                <Image
                                    src={launch.collection_icon_url}
                                    width={180}
                                    height={180}
                                    alt="Image Frame"
                                    style={{ backgroundSize: "cover", borderRadius: 12 }}
                                />
                                <Text mt={1} mb={0} color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                    {launch.collection_name}
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
                                    value={launch.num_available}
                                    boxShadow="0px 5px 15px 0px rgba(0,0,0,0.6) inset"
                                />
                                <HStack style={{ position: "absolute", zIndex: 1 }}>
                                    <HStack justify="center">
                                        <Text m="0" color="black" fontSize={sm ? "medium" : "large"} fontFamily="ReemKufiRegular">
                                        {launch.num_available} / {launch.total_supply}
                                        </Text>
                                    </HStack>
                                </HStack>
                            </HStack>
                        </VStack>
                    </VStack>
                </div>
            </main>
        </>
    );
};

export default CollectionSwapPage;
