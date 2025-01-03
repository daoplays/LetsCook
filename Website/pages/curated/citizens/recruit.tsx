import Image from "next/image";
import { AssignmentData, NFTListingData } from "@/components/collection/collectionState";
import { MintData, bignum_to_num } from "@/components/Solana/state";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MdOutlineContentCopy } from "react-icons/md";
import Link from "next/link";
import formatPrice from "@/utils/formatPrice";
import { FaCoins, FaSkull, FaWallet } from "react-icons/fa";
import trimAddress from "@/utils/trimAddress";
import useMintNFT from "@/hooks/collections/useMintNFT";
import useClaimNFT from "@/hooks/collections/useClaimNFT";
import { useWallet } from "@solana/wallet-adapter-react";
import UseWalletConnection from "@/hooks/useWallet";
import { Loader2Icon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CollectionKeys, SYSTEM_KEY } from "@/components/Solana/constants";
import { useDisclosure } from "@chakra-ui/react";
import ReceivedAssetModal from "./assetModal";
import useAssignmentData from "@/hooks/data/useAssignmentData";
import { AssetWithMetadata } from "@/pages/collection/[pageName]";
import Marketplace from "./marketplace";
import { CollectionData } from "@letscook/sdk/dist/state/collections";

interface RecruitProps {
    collection: CollectionData;
    tokenMint: MintData;
    tokenAddress: string;
    tokenBalance: number;
    nftBalance: number;
    fetchNFTBalance: () => void;
    checkNFTBalance: React.MutableRefObject<boolean>;
    // Added marketplace props
    listedNFTs: AssetWithMetadata[];
    allListings?: NFTListingData[];
    ownedNFTs?: AssetWithMetadata[];
}

function Recruit({
    collection,
    tokenMint,
    tokenAddress,
    tokenBalance,
    nftBalance,
    fetchNFTBalance,
    checkNFTBalance,
    listedNFTs,
    allListings,
    ownedNFTs,
}: RecruitProps) {
    const [activeTab, setActiveTab] = useState("recruit"); // "recruit" or "market"

    const wallet = useWallet();
    const { handleConnectWallet } = UseWalletConnection();
    const [nftAmount, setNFTAmount] = useState<number>(0);
    const [token_amount, setTokenAmount] = useState<number>(0);

    const { MintNFT, isLoading: isMintLoading } = useMintNFT(collection);
    const { ClaimNFT, isLoading: isClaimLoading } = useClaimNFT(collection, false);
    const { isOpen: isAssetModalOpen, onOpen: openAssetModal, onClose: closeAssetModal } = useDisclosure();

    const { assignmentData, validRandoms, asset, assetMeta, error: assignmentError } = useAssignmentData({ collection: collection });

    let isLoading = isClaimLoading || isMintLoading;
    const isHomePage = false;
    const isTokenToNFT = true;
    const requiredAmount = 1000;

    const enoughTokenBalance = tokenBalance >= bignum_to_num(collection.swap_price) / Math.pow(10, collection.token_decimals);

    const collectionAddress = useMemo(() => {
        return collection?.keys?.[CollectionKeys.CollectionMint] || null;
    }, [collection]);

    const updateAssignment = useCallback(async () => {
        // if we are started to wait for randoms then open up the modal
        if (!assignmentData.random_address.equals(SYSTEM_KEY)) {
            openAssetModal();
        }

        if (assignmentData.status < 2) {
            return;
        } else {
            checkNFTBalance.current = true;
            fetchNFTBalance();
        }
    }, [assignmentData, openAssetModal, fetchNFTBalance, checkNFTBalance]);

    useEffect(() => {
        if (!assignmentData) return;

        updateAssignment();
    }, [collection, assignmentData, updateAssignment]);

    if (!collection) return <></>;

    return (
        <div className="flex w-full max-w-4xl flex-col items-center gap-6 p-6">
            {/* Tabs */}
            <div className="flex w-full gap-2 rounded-xl border-2 border-[#3A2618] bg-[#1C1410]/50 p-2 backdrop-blur-sm">
                <button
                    onClick={() => setActiveTab("recruit")}
                    className={`flex-1 rounded-lg px-6 py-3 text-lg font-bold transition-all ${
                        activeTab === "recruit"
                            ? "bg-gradient-to-b from-[#8B7355] to-[#3A2618] text-[#1C1410]"
                            : "text-[#8B7355] hover:bg-[#3A2618]/30"
                    }`}
                >
                    Fresh Recruits
                </button>
                <button
                    onClick={() => setActiveTab("market")}
                    className={`flex-1 rounded-lg px-6 py-3 text-lg font-bold transition-all ${
                        activeTab === "market"
                            ? "bg-gradient-to-b from-[#8B7355] to-[#3A2618] text-[#1C1410]"
                            : "text-[#8B7355] hover:bg-[#3A2618]/30"
                    }`}
                >
                    Mercenary Market
                </button>
            </div>
            {activeTab === "recruit" ? (
                <>
                    {/* Main Recruitment Interface */}
                    <div className="relative w-full rounded-xl border-2 border-[#3A2618] bg-[#1C1410]/95 p-8 shadow-2xl backdrop-blur-md">
                        {/* Decorative Header 
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                        <Image
                            src="/curatedLaunches/citizens/scroll-header.png"
                            width={200}
                            height={40}
                            alt="Scroll Header"
                            className="opacity-80"
                        />
                    </div>
                    */}
                        {/* Tavern Keeper Section */}
                        <div className="mb-8 flex items-center gap-6 border-b border-[#3A2618] pb-6">
                            <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-[#3A2618] shadow-lg">
                                <Image
                                    src="/curatedLaunches/citizens/bartender.png"
                                    width={96}
                                    height={96}
                                    alt="Tavern Keeper"
                                    className="scale-110 transform"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <h2 className="font-serif text-xl text-[#C4A484]">Thomas Blackwood, The Keeper</h2>
                                <p className="font-serif italic text-[#8B7355]">
                                    &ldquo;Fresh meat for the grinder, eh? These lost souls might serve your purpose... if you&apos;ve got
                                    the coin.&rdquo;
                                </p>
                            </div>
                        </div>

                        {/* Recruitment Terms */}
                        <div className="mb-6 rounded-lg border border-[#3A2618] bg-black/20 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FaCoins className="h-6 w-6 text-[#C4A484]" />
                                    <div>
                                        <p className="text-sm text-[#8B7355]">Recruitment Cost</p>
                                        <p className="text-xl font-bold text-[#C4A484]">
                                            {requiredAmount} {collection.token_symbol}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-[#8B7355]">Your Purse</p>
                                    <p className="text-right text-lg text-[#C4A484]">
                                        {tokenBalance.toLocaleString()} {collection.token_symbol}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Statistics */}
                        <div className="mb-6 grid grid-cols-3 gap-4 text-center">
                            <div className="rounded-lg border border-[#3A2618] bg-black/20 p-3">
                                <p className="text-sm text-[#8B7355]">Available Recruits</p>
                                <p className="text-lg font-bold text-[#C4A484]">{collection.num_available}</p>
                            </div>
                            <div className="rounded-lg border border-[#3A2618] bg-black/20 p-3">
                                <p className="text-sm text-[#8B7355]">Active Service</p>
                                <p className="text-lg font-bold text-[#C4A484]">{collection.total_supply - collection.num_available}</p>
                            </div>
                            <div className="rounded-lg border border-[#3A2618] bg-black/20 p-3">
                                <p className="text-sm text-[#8B7355]">Total Roster</p>
                                <p className="text-lg font-bold text-[#C4A484]">{collection.total_supply}</p>
                            </div>
                        </div>

                        {/* Warning */}
                        <div className="mb-6 flex items-center gap-2 text-[#FF6B6B]">
                            <FaSkull className="h-5 w-5" />
                            <p className="text-sm italic">The path ahead is dark. Not all who venture return.</p>
                        </div>

                        {/* Action Button */}
                        {wallet.connected ? (
                            assignmentData === null || assignmentData.status > 0 ? (
                                <button
                                    onClick={() => {
                                        if (!wallet.connected) {
                                            handleConnectWallet();
                                        }
                                        if (wallet.connected && enoughTokenBalance) {
                                            ClaimNFT();
                                        }
                                    }}
                                    disabled={!enoughTokenBalance || isLoading}
                                    className={`w-full transform rounded-lg border-2 border-[#3A2618] bg-gradient-to-b p-4 text-xl font-bold uppercase tracking-wider transition-all ${
                                        enoughTokenBalance
                                            ? "from-[#8B7355] to-[#3A2618] text-[#1C1410] hover:from-[#C4A484] hover:to-[#8B7355] active:scale-95"
                                            : "from-[#4A3828] to-[#2A1810] text-[#8B7355] opacity-50"
                                    }`}
                                >
                                    {isLoading ? (
                                        <Loader2Icon className="mx-auto animate-spin" />
                                    ) : !enoughTokenBalance ? (
                                        "Insufficient Marks"
                                    ) : (
                                        "Recruit Mercenary"
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        openAssetModal();
                                        MintNFT();
                                    }}
                                    disabled={isLoading}
                                    className="w-full transform rounded-lg border-2 border-[#3A2618] bg-gradient-to-b from-[#8B7355] to-[#3A2618] p-4 text-xl font-bold uppercase tracking-wider text-[#1C1410] transition-all hover:from-[#C4A484] hover:to-[#8B7355] active:scale-95"
                                >
                                    {isLoading ? <Loader2Icon className="mx-auto animate-spin" /> : "View Recruit"}
                                </button>
                            )
                        ) : (
                            <button
                                onClick={handleConnectWallet}
                                className="w-full transform rounded-lg border-2 border-[#3A2618] bg-gradient-to-b from-[#8B7355] to-[#3A2618] p-4 text-xl font-bold uppercase tracking-wider text-[#1C1410] transition-all hover:from-[#C4A484] hover:to-[#8B7355] active:scale-95"
                            >
                                Connect Purse
                            </button>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <Marketplace
                        listedNFTs={listedNFTs}
                        allListings={allListings}
                        collection={collection}
                        ownedNFTs={ownedNFTs}
                        tab="market"
                    />
                </>
            )}
            ;
            <ReceivedAssetModal
                have_randoms={validRandoms}
                isWarningOpened={isAssetModalOpen}
                closeWarning={closeAssetModal}
                assignment_data={assignmentData}
                collection={collection}
                asset={asset}
                asset_meta={assetMeta}
                isLoading={isLoading}
            />
        </div>
    );
}

export default Recruit;
