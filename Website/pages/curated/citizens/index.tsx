import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Montserrat } from "next/font/google";
import Image from "next/image";
import { Loader } from "lucide-react";
import { CollectionKeys, Config, SYSTEM_KEY } from "@/components/Solana/constants";
import PageNotFound from "@/components/pageNotFound";
import { AssetWithMetadata } from "@/pages/collection/[pageName]";
import useTokenBalance from "@/hooks/data/useTokenBalance";
import useCitizenData from "./hooks/useCitizenData";
import useCollection from "@/hooks/data/useCollection";
import { Box, Flex, GridItem, VStack, useDisclosure } from "@chakra-ui/react";
import UseWalletConnection from "@/hooks/useWallet";
import useResponsive from "@/hooks/useResponsive";
import useNFTBalance from "@/hooks/data/useNFTBalance";
import Recruit from "./recruit";
import MissionModal from "./mission";
import useStartMission from "./hooks/useStartMission";
import useCheckMission from "./hooks/useCheckMission";
import useBetray from "./hooks/useBetray";
import { PublicKey } from "@solana/web3.js";

const montserrat = Montserrat({
    weight: ["500", "600", "700", "800", "900"],
    subsets: ["latin"],
    display: "swap",
    fallback: ["Arial", "sans-serif"],
    variable: "--font-montserrat",
});

const gridItemStyle: CSSProperties = {
    position: "relative",
    backgroundColor: "#1C1410",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "bold",
    borderRadius: "16px",
    cursor: "pointer",
    border: "2px solid #3A2618",
};

const LandingPage = () => {
    const [showInteractive, setShowInteractive] = useState(false);
    const wallet = useWallet();
    const { sm } = useResponsive();
    const { handleConnectWallet } = UseWalletConnection();

    const [isHomePage, setIsHomePage] = useState(true);
    const [isTokenToNFT, setIsTokenToNFT] = useState(true);
    const collection_name = Config.NETWORK === "eclipse" ? "joypeeps" : "citizens3";

    const [nftAmount, setNFTAmount] = useState<number>(0);
    const [token_amount, setTokenAmount] = useState<number>(0);

    const [wrapSOL, setWrapSOL] = useState<number>(0);

    const [activeTab, setActiveTab] = useState("Mint");

    const [listedNFTs, setListedNFTs] = useState<AssetWithMetadata[]>([]);
    const [userListedNFTs, setUserListedNFTs] = useState<string[]>([]);

    const prevUserListedNFTsRef = useRef<string>("");

    const { isOpen: isAssetModalOpen, onOpen: openAssetModal, onClose: closeAssetModal } = useDisclosure();

    const {
        collection,
        collectionPlugins,
        tokenMint,
        whitelistMint,
        outAmount,
        listedAssets,
        error: collectionError,
    } = useCollection({ pageName: collection_name as string | null });

    const { tokenBalance } = useTokenBalance({ mintData: tokenMint });

    const { tokenBalance: whiteListTokenBalance } = useTokenBalance({ mintData: whitelistMint });

    const collectionAddress = useMemo(() => {
        return collection?.keys?.[CollectionKeys.CollectionMint] || null;
    }, [collection]);

    const tokenAddress = collection?.keys?.[CollectionKeys.MintAddress].toString().toString();

    const { nftBalance, ownedAssets, collectionAssets, checkNFTBalance, fetchNFTBalance } = useNFTBalance(
        collectionAddress ? { collectionAddress } : null,
    );

    let isLoading = collection !== null;

    const [hoveredIndex, setHoveredIndex] = useState(null);

    const handleMouseEnter = (index) => setHoveredIndex(index);
    const handleMouseLeave = () => setHoveredIndex(null);

    const { StartMission, isLoading: StartMissionLoading } = useStartMission(collection);

    const { userData } = useCitizenData();

    useEffect(() => {
        if (!collectionAssets || !collectionPlugins) return;

        let new_listings: AssetWithMetadata[] = [];
        let user_listings: string[] = [];
        for (let i = 0; i < collectionPlugins.listings.length; i++) {
            const asset_key = collectionPlugins.listings[i].asset;
            const asset = collectionAssets.get(asset_key.toString());
            if (asset) new_listings.push(asset);
            if (wallet && wallet.publicKey && collectionPlugins.listings[i].seller.equals(wallet.publicKey))
                user_listings.push(asset.asset.publicKey.toString());
        }

        setListedNFTs(new_listings);
        // Stringify new values
        const newUserListingsStr = JSON.stringify(user_listings);

        // Compare with previous values stored in refs
        if (newUserListingsStr !== prevUserListedNFTsRef.current) {
            setUserListedNFTs(user_listings);
            prevUserListedNFTsRef.current = newUserListingsStr;
        }
    }, [collectionPlugins, collectionAssets, wallet]);

    // 1. Effect for initial balance
    useEffect(() => {
        if (collection && wallet && wallet.connected) {
            checkNFTBalance.current = true;
            fetchNFTBalance();
        }
    }, [collection, wallet, checkNFTBalance, userData, fetchNFTBalance]); // Only run on initial mount and when collection/wallet changes

    // if (!pageName) return;

    const NFTGrid = () => {
        const [selectedMercenary, setSelectedMercenary] = useState(null);
        const { isOpen: isMissionModalOpen, onOpen: openMissionModal, onClose: closeMissionModal } = useDisclosure();
        const { Betray } = useBetray(collection);
        const { CheckMission } = useCheckMission(collection);

        let allUserAssets = [...ownedAssets];

        const handleMissionSelect = (difficulty: string) => {
            console.log(`Selected ${difficulty} mission for mercenary:`, selectedMercenary);
            // Add your mission logic here
            StartMission(new PublicKey(selectedMercenary.asset.publicKey.toString()), 0);
            closeMissionModal();
        };

        if (collectionAssets && userData && !userData.asset.equals(SYSTEM_KEY)) {
            let mission_asset = collectionAssets.get(userData.asset.toString());
            console.log("User has asset on a mission", userData, mission_asset);
            // Check if mission_asset already exists in allUserAssets
            const assetExists = allUserAssets.some(
                (asset) => asset && mission_asset && asset.asset.publicKey.toString() === mission_asset.asset.publicKey.toString(),
            );

            if (!assetExists && mission_asset) {
                allUserAssets.push(mission_asset);
            }
        }

        return (
            <>
                <VStack h="100%" position="relative" overflowY="auto">
                    <Flex w="100%" wrap="wrap" gap={4} justify="center" align="start">
                        {allUserAssets.map((nft, index) => {
                            let level = "";
                            let wealth = "";
                            let attributes = nft.asset.attributes.attributeList
                            for (let i = 0; i < attributes.length; i++) {
                                if (attributes[i].key === "Level") {
                                    level = attributes[i].value;
                                }
                                if (attributes[i].key === "Wealth") {
                                    wealth = attributes[i].value;
                                }
                            }

                            return (
                                <GridItem key={`nft-${index}`}>
                                    <div className="flex flex-col gap-4">
                                        <Box
                                            style={gridItemStyle}
                                            onMouseEnter={() => handleMouseEnter(index)}
                                            onMouseLeave={handleMouseLeave}
                                            className="relative overflow-hidden p-2"
                                        >
                                            {/* Mercenary Level Banner */}
                                            <div className="absolute -right-8 top-4 z-10 rotate-45 bg-[#8B7355] px-8 py-1 text-sm text-[#1C1410]">
                                                Level {level}
                                            </div>

                                            <Image
                                                src={nft.metadata["image"]}
                                                width={sm ? 120 : 250}
                                                height={sm ? 120 : 250}
                                                alt={nft.metadata["name"] || nft.asset.name}
                                                className="rounded-xl"
                                            />
                                        </Box>

                                        {/* Attributes Display */}
                                        <div className="rounded-xl border-2 border-[#3A2618] bg-[#1C1410]/95 p-4 backdrop-blur-sm">
                                            <h3 className="mb-2 border-b border-[#3A2618] pb-2 text-lg font-bold text-[#C4A484]">
                                                {nft.metadata["name"] || nft.asset.name}
                                            </h3>
                                            <div className="grid grid-cols-2 gap-2">
                                            <div  className="rounded-lg bg-black/20 p-2">
                                                <p className="text-sm text-[#8B7355]">Wealth</p>
                                                <p className="text-[#C4A484]">{wealth}</p>
                                            </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="mt-4 flex gap-2">
                                                <VStack>
                                                    {nft.asset.publicKey.toString() === userData?.asset.toString() && (
                                                        <button
                                                            className="flex-1 transform rounded-lg border-2 border-[#3A2618] bg-gradient-to-b from-[#8B7355] to-[#3A2618] px-4 py-2 font-bold text-[#1C1410] transition-all hover:from-[#C4A484] hover:to-[#8B7355] active:scale-95"
                                                            onClick={() => {
                                                                CheckMission(nft.asset.publicKey.toString(), userData?.randoms_address);
                                                            }}
                                                        >
                                                            Check Mission Status
                                                        </button>
                                                    )}
                                                    {(userData === null ||
                                                        (userData &&
                                                            nft.asset.publicKey.toString() !== userData?.asset.toString() &&
                                                            userData?.mission_status !== 1)) && (
                                                        <button
                                                            className="flex-1 transform rounded-lg border-2 border-[#3A2618] bg-gradient-to-b from-[#8B7355] to-[#3A2618] px-4 py-2 font-bold text-[#1C1410] transition-all hover:from-[#C4A484] hover:to-[#8B7355] active:scale-95"
                                                            onClick={() => {
                                                                setSelectedMercenary(nft);
                                                                openMissionModal();
                                                            }}
                                                        >
                                                            Send on Mission
                                                        </button>
                                                    )}

                                                    <button
                                                        className="flex-1 transform rounded-lg border-2 border-[#8B1818] bg-gradient-to-b from-[#A13333] to-[#8B1818] px-4 py-2 font-bold text-[#FFD7D7] transition-all hover:from-[#CC4444] hover:to-[#A13333] active:scale-95"
                                                        onClick={() => {
                                                            Betray(nft.asset.publicKey.toString());
                                                        }}
                                                    >
                                                        Betray
                                                    </button>
                                                </VStack>
                                            </div>
                                        </div>
                                    </div>
                                </GridItem>
                            );
                        })}
                    </Flex>
                </VStack>

                <MissionModal
                    isOpen={isMissionModalOpen}
                    onClose={closeMissionModal}
                    mercenary={selectedMercenary}
                    onSelectMission={handleMissionSelect}
                />
            </>
        );
    };

    if (collection === null || tokenMint === null) return <Loader />;

    if (!collection) return <PageNotFound />;

    return (
        <main className={`relative min-h-screen w-full ${montserrat.className}`}>
            {/* Background Image */}
            <div className="absolute inset-0 h-full w-full">
                <Image
                    src="/curatedLaunches/citizens/tavern.png"
                    alt="Background"
                    layout="fill"
                    objectFit="cover"
                    priority
                    className="z-0"
                />
                <div className="absolute inset-0 z-10 bg-black/50" /> {/* Darkened overlay */}
            </div>

            {!showInteractive ? (
                // Main Landing Content
                <div className="relative z-20 flex min-h-screen w-full flex-col items-center justify-center">
                    <div className="w-full max-w-7xl px-4">
                        {nftBalance === 0 && (!userData || userData.asset.equals(SYSTEM_KEY)) ? (
                            <div className="flex flex-col items-center gap-6">
                                <div className="rounded-xl border-2 border-[#3A2618] bg-[#1C1410]/90 p-6 text-center backdrop-blur-sm">
                                    <h2 className="font-serif text-2xl text-[#C4A484]">Welcome to the Old Town Tavern</h2>
                                    <p className="mt-2 text-[#8B7355]">Seeking desperate souls for perilous ventures...</p>
                                </div>
                                <button
                                    onClick={() => setShowInteractive(true)}
                                    className="transform rounded-xl border-2 border-[#3A2618] bg-gradient-to-b from-[#8B7355] to-[#3A2618] px-12 py-6 text-3xl font-bold text-[#1C1410] transition-all hover:scale-105 hover:from-[#C4A484] hover:to-[#8B7355] active:scale-95"
                                >
                                    RECRUIT
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-8">
                                <div className="rounded-xl border-2 border-[#3A2618] bg-[#1C1410]/95 p-8 backdrop-blur-sm">
                                    <h2 className="mb-6 text-center font-serif text-2xl text-[#C4A484]">Your Mercenary Company</h2>
                                    <NFTGrid />
                                </div>
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => setShowInteractive(true)}
                                        className="transform rounded-xl border-2 border-[#3A2618] bg-gradient-to-b from-[#8B7355] to-[#3A2618] px-12 py-6 text-3xl font-bold text-[#1C1410] transition-all hover:scale-105 hover:from-[#C4A484] hover:to-[#8B7355] active:scale-95"
                                    >
                                        RECRUIT MORE
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // Recruit Interface
                <div className="relative z-20 flex min-h-screen w-full flex-col items-center justify-center py-16">
                    <div className="absolute top-0 z-50 flex min-h-20 w-full items-center xl:h-24">
                        <button
                            onClick={() => setShowInteractive(false)}
                            className="absolute left-4 transform rounded-lg border-2 border-[#3A2618] bg-gradient-to-b from-[#8B7355] to-[#3A2618] px-4 py-2 text-sm font-bold text-[#1C1410] transition-all hover:from-[#C4A484] hover:to-[#8B7355] active:scale-95"
                        >
                            Return to Tavern
                        </button>
                    </div>

                    <Recruit
                        collection={collection}
                        tokenMint={tokenMint}
                        tokenAddress={tokenAddress}
                        tokenBalance={tokenBalance}
                        nftBalance={nftBalance}
                        fetchNFTBalance={fetchNFTBalance}
                        checkNFTBalance={checkNFTBalance}
                        listedNFTs={listedNFTs}
                        allListings={listedAssets || []}
                        ownedNFTs={ownedAssets}
                    />
                </div>
            )}
        </main>
    );
};

export default LandingPage;
