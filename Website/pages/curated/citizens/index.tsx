import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Montserrat } from "next/font/google";
import Image from "next/image";
import { Loader } from "lucide-react";
import { CollectionKeys, Config, SYSTEM_KEY } from "@/components/Solana/constants";
import PageNotFound from "@/components/pageNotFound";
import { AssetWithMetadata } from "@/pages/collection/[pageName]";
import useTokenBalance from "@/hooks/data/useTokenBalance";
import useCitizenData from "./hooks/useCitizenData";
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
import BetrayalModal from "./betray";
import { set } from "date-fns";
import { CitizenUserData } from "@/components/curated/citizens/state";
import useListNFT from "@/hooks/collections/useListNFT";
import useUnlistNFT from "@/hooks/collections/useUnlistNFT";
import ContractModal from "./list";
import { FaCoins } from "react-icons/fa";
import { bignum_to_num } from "@/components/Solana/state";
import useCollection from "@letscook/sdk/dist/hooks/data/useCollection";

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

function getStatusString(status: number) {
    switch (status) {
        case 0:
            return "select";
        case 1:
            return "ongoing";
        case 2:
            return "success";
        case 3:
            return "failed";
        default:
            return null;
    }
}

const LandingPage = () => {
    const [showInteractive, setShowInteractive] = useState(false);
    const wallet = useWallet();
    const { connection } = useConnection();
    const { sm } = useResponsive();

    const collection_name = Config.NETWORK === "eclipse" ? "joypeeps" : "Citizens5";
    const [selectedMercenary, setSelectedMercenary] = useState(null);

    const [listedNFTs, setListedNFTs] = useState<AssetWithMetadata[]>([]);
    const [userListedNFTs, setUserListedNFTs] = useState<string[]>([]);

    const prevUserListedNFTsRef = useRef<string>("");
    const showed_initial_status = useRef<boolean>(false);

    const [currentStatus, setCurrentStatus] = useState<string | null>(null);
    const prevUserData = useRef<CitizenUserData | null>(null);

    const {
        collection,
        collectionPlugins,
        tokenMint,
        whitelistMint,
        outAmount,
        listedAssets,
        error: collectionError,
    } = useCollection({ connection, pageName: collection_name as string | null });

    const { isOpen: isMissionModalOpen, onOpen: openMissionModal, onClose: closeMissionModal } = useDisclosure();
    const { isOpen: isBetrayalModalOpen, onOpen: openBetrayalModal, onClose: closeBetrayalModal } = useDisclosure();
    const { isOpen: isContractModalOpen, onOpen: openContractModal, onClose: closeContractModal } = useDisclosure();

    const { Betray, isLoading: isBetrayLoading } = useBetray(collection);
    const { CheckMission, isLoading: isCheckingMission } = useCheckMission(collection);
    const { ListNFT, isLoading: isListingLoading } = useListNFT(collection);
    const { UnlistNFT, isLoading: isUnlistingLoading } = useUnlistNFT(collection);

    const { tokenBalance } = useTokenBalance({ mintData: tokenMint });

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
        for (let i = 0; i < listedAssets.length; i++) {
            console.log(
                "listed asset",
                listedAssets[i].asset.toString(),
                listedAssets[i].seller.toString(),
                bignum_to_num(listedAssets[i].price),
            );
            const asset = collectionAssets.get(listedAssets[i].asset.toString());
            if (asset) new_listings.push(asset);
            if (wallet && wallet.publicKey && listedAssets[i].seller.equals(wallet.publicKey))
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
    }, [collectionPlugins, collectionAssets, listedAssets, wallet]);

    // 1. Effect for initial balance
    useEffect(() => {
        if (collection && wallet && wallet.connected) {
            checkNFTBalance.current = true;
            fetchNFTBalance();
        }
    }, [collection, wallet, checkNFTBalance, userData, fetchNFTBalance]); // Only run on initial mount and when collection/wallet changes

    // if (!pageName) return;

    // Watch for mission status changes
    useEffect(() => {
        if (!userData) return;

        if (prevUserData.current && userData.slot <= prevUserData.current.slot) {
            return;
        }

        let mission_asset = undefined;
        if (collectionAssets) mission_asset = collectionAssets.get(userData.asset.toString());

        // if the status updates then open the modal
        if (prevUserData.current) {
            // also check that the mission status is different
            // otherwise this triggers on betray
            if (prevUserData.current.mission_status === userData.mission_status) {
                return;
            }

            let new_status = getStatusString(userData.mission_status);

            prevUserData.current = userData;
            setCurrentStatus(new_status);

            // if we have an asset then update
            if (mission_asset) {
                setSelectedMercenary(mission_asset);
            }
            openMissionModal();
            return;
        }

        prevUserData.current = userData;
        if (!showed_initial_status.current && userData?.mission_status === 1) {
            if (mission_asset) {
                setSelectedMercenary(mission_asset);
                showed_initial_status.current = true;
                setCurrentStatus("ongoing");
                openMissionModal(); // Reopen the modal when mission starts
            }
        }
    }, [collectionAssets, userData, openMissionModal]);

    const NFTGrid = () => {
        let allUserAssets = [...ownedAssets];

        const handleMissionSelect = (difficulty: number) => {
            StartMission(new PublicKey(selectedMercenary.asset.publicKey.toString()), difficulty);
        };

        const handleBetrayalConfirm = async () => {
            if (selectedMercenary) {
                await Betray(selectedMercenary.asset.publicKey.toString());
                closeBetrayalModal();
                setSelectedMercenary(null);
            }
        };

        const handleCheckMission = () => {
            if (selectedMercenary && userData) {
                CheckMission(selectedMercenary.asset.publicKey.toString(), userData?.randoms_address);
            }
        };

        const handleContractSubmit = async (price: number) => {
            if (selectedMercenary) {
                // Your contract listing logic here
                // Similar to your marketplace listing function
                await ListNFT(new PublicKey(selectedMercenary.asset.publicKey.toString()), price);
                closeContractModal();
                setSelectedMercenary(null);
            }
        };

        if (collectionAssets && userData && !userData.asset.equals(SYSTEM_KEY)) {
            let mission_asset = collectionAssets.get(userData.asset.toString());
            //console.log("User has asset on a mission", userData, mission_asset);
            // Check if mission_asset already exists in allUserAssets
            const assetExists = allUserAssets.some(
                (asset) => asset && mission_asset && asset.asset.publicKey.toString() === mission_asset.asset.publicKey.toString(),
            );

            if (!assetExists && mission_asset) {
                allUserAssets.push(mission_asset);
            }
        }

        if (userListedNFTs.length > 0) {
            for (let i = 0; i < listedNFTs.length; i++) {
                let asset = collectionAssets.get(userListedNFTs[i]);
                if (asset) {
                    allUserAssets.push(asset);
                }
            }
        }

        return (
            <>
                <VStack h="100%" position="relative" overflowY="auto">
                    <Flex w="100%" wrap="wrap" gap={4} justify="center" align="start">
                        {allUserAssets.map((nft, index) => {
                            let level = "";
                            let wealth = "";
                            let attributes = nft.asset.attributes.attributeList;
                            for (let i = 0; i < attributes.length; i++) {
                                if (attributes[i].key === "Level") {
                                    level = attributes[i].value;
                                }
                                if (attributes[i].key === "Wealth") {
                                    wealth = attributes[i].value;
                                }
                            }

                            let isListed = userListedNFTs.includes(nft.asset.publicKey.toString());
                            let onMission = nft.asset.publicKey.toString() === userData?.asset.toString();
                            let anyOnMission =
                                userData === null ||
                                (userData &&
                                    nft.asset.publicKey.toString() !== userData?.asset.toString() &&
                                    userData?.mission_status !== 1);

                            let maxLevel = 20;
                            let overMaxLevel = parseInt(level) >= maxLevel;

                            let maxLevelString = overMaxLevel ? "Max Level Reached" : "Send on Mission";

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
                                            <h3 className="mb-2 border-b border-[#3A2618] pb-2 text-center text-lg font-bold text-[#C4A484]">
                                                {nft.metadata["name"] || nft.asset.name}
                                            </h3>
                                            <div className="flex items-center justify-center gap-2 text-center">
                                                <span className="text-sm text-[#8B7355]">Wealth:</span>
                                                <span className="text-[#C4A484]">{wealth}</span>
                                                <FaCoins className="text-sm text-[#C4A484]" />
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="mt-4 flex flex-col gap-2">
                                                <VStack>
                                                    {onMission && (
                                                        <button
                                                            className="w-full transform rounded-lg border-2 border-[#3A2618] bg-gradient-to-b from-[#8B7355] to-[#3A2618] px-4 py-2 font-bold text-[#1C1410] transition-all hover:from-[#C4A484] hover:to-[#8B7355] active:scale-95"
                                                            onClick={() => {
                                                                CheckMission(nft.asset.publicKey.toString(), userData?.randoms_address);
                                                            }}
                                                        >
                                                            Check Mission Status
                                                        </button>
                                                    )}
                                                    {!isListed && anyOnMission && (
                                                        <button
                                                            disabled={overMaxLevel}
                                                            className="w-full transform rounded-lg border-2 border-[#3A2618] bg-gradient-to-b from-[#8B7355] to-[#3A2618] px-4 py-2 font-bold text-[#1C1410] transition-all hover:from-[#C4A484] hover:to-[#8B7355] active:scale-95"
                                                            onClick={() => {
                                                                setSelectedMercenary(nft);
                                                                setCurrentStatus("select");
                                                                openMissionModal();
                                                            }}
                                                        >
                                                            {maxLevelString}
                                                        </button>
                                                    )}

                                                    {!onMission && !isListed && (
                                                        <button
                                                            className="w-full transform rounded-lg border-2 border-[#3A2618] bg-gradient-to-b from-[#8B7355] to-[#3A2618] px-4 py-2 font-bold text-[#1C1410] transition-all hover:from-[#C4A484] hover:to-[#8B7355] active:scale-95"
                                                            onClick={() => {
                                                                setSelectedMercenary(nft);
                                                                openContractModal();
                                                            }}
                                                        >
                                                            Contract Out
                                                        </button>
                                                    )}

                                                    {!onMission && !isListed && (
                                                        <button
                                                            className="w-full transform rounded-lg border-2 border-[#8B1818] bg-gradient-to-b from-[#A13333] to-[#8B1818] px-4 py-2 font-bold text-[#FFD7D7] transition-all hover:from-[#CC4444] hover:to-[#A13333] active:scale-95"
                                                            onClick={() => {
                                                                setSelectedMercenary(nft);
                                                                openBetrayalModal();
                                                            }}
                                                        >
                                                            Betray
                                                        </button>
                                                    )}

                                                    {isListed && (
                                                        <button
                                                            className="w-full transform rounded-lg border-2 border-[#3A2618] bg-gradient-to-b from-[#8B7355] to-[#3A2618] px-4 py-2 font-bold text-[#1C1410] transition-all hover:from-[#C4A484] hover:to-[#8B7355] active:scale-95"
                                                            onClick={() => {
                                                                UnlistNFT(new PublicKey(nft.asset.publicKey), 0);
                                                            }}
                                                        >
                                                            Remove Contract
                                                        </button>
                                                    )}
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
                    onCheckMission={handleCheckMission} // Add this
                    userData={prevUserData.current} // Add this
                    isLoading={isCheckingMission} // Add this
                    missionState={currentStatus}
                />
                <BetrayalModal
                    isOpen={isBetrayalModalOpen}
                    onClose={closeBetrayalModal}
                    onConfirm={handleBetrayalConfirm}
                    mercenary={selectedMercenary}
                    isLoading={isBetrayLoading}
                />

                <ContractModal
                    isOpen={isContractModalOpen}
                    onClose={closeContractModal}
                    onConfirm={handleContractSubmit}
                    mercenary={selectedMercenary}
                    isLoading={isListingLoading} // If you have a loading state from your listing hook
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
                    fill
                    style={{ objectFit: "cover" }}
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
                                <NFTGrid />
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
                                    <h2 className="mb-6 text-center font-serif text-2xl text-[#C4A484]">Your Company</h2>
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
