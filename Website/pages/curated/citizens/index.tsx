import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWallet } from "@solana/wallet-adapter-react";
import { Montserrat } from "next/font/google";
import Image from "next/image";
import { Loader } from "lucide-react";
import { CollectionKeys, SYSTEM_KEY } from '@/components/Solana/constants';
import PageNotFound from '@/components/pageNotFound';
import { AssetWithMetadata } from '@/pages/collection/[pageName]';
import useTokenBalance from '@/hooks/data/useTokenBalance';
import useClaimNFT from '@/hooks/collections/useClaimNFT';
import useMintRandom from '@/hooks/collections/useMintRandom';
import useAppRoot from '@/context/useAppRoot';
import useWrapNFT from '@/hooks/collections/useWrapNFT';
import useMintNFT from '@/hooks/collections/useMintNFT';
import useAssignmentData from '@/hooks/data/useAssignmentData';
import useCollection from '@/hooks/data/useCollection';
import { useDisclosure } from '@chakra-ui/react';
import UseWalletConnection from '@/hooks/useWallet';
import useResponsive from '@/hooks/useResponsive';

const montserrat = Montserrat({
    weight: ["500", "600", "700", "800", "900"],
    subsets: ["latin"],
    display: "swap",
    fallback: ["Arial", "sans-serif"],
    variable: "--font-montserrat",
});

const LandingPage = () => {
    const [showInteractive, setShowInteractive] = useState(false);
    const wallet = useWallet();
    const { sm } = useResponsive();
    const { handleConnectWallet } = UseWalletConnection();

    const [isHomePage, setIsHomePage] = useState(true);
    const [isTokenToNFT, setIsTokenToNFT] = useState(true);
    const collection_name = "joypeeptest1";

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
        error: collectionError,
    } = useCollection({ pageName: collection_name as string | null });

    const { assignmentData, validRandoms, asset, assetMeta, error: assignmentError } = useAssignmentData({ collection: collection });

    const { MintNFT, isLoading: isMintLoading } = useMintNFT(collection);
    const { WrapNFT, isLoading: isWrapLoading } = useWrapNFT(collection);
    const { userSOLBalance } = useAppRoot();

    const { MintRandom, isLoading: isMintRandomLoading } = useMintRandom(collection);
    const { ClaimNFT, isLoading: isClaimLoading } = useClaimNFT(collection, wrapSOL === 1);

    const { tokenBalance } = useTokenBalance({ mintData: tokenMint });

    const { tokenBalance: whiteListTokenBalance } = useTokenBalance({ mintData: whitelistMint });

    const collectionAddress = useMemo(() => {
        return collection?.keys?.[CollectionKeys.CollectionMint] || null;
    }, [collection]);

    const tokenAddress = collection?.keys?.[CollectionKeys.MintAddress].toString().toString();

    const { nftBalance, ownedAssets, collectionAssets, checkNFTBalance, fetchNFTBalance } = useNFTBalance(
        collectionAddress ? { collectionAddress } : null,
    );

    let isLoading = isClaimLoading || isMintRandomLoading || isWrapLoading || isMintLoading;

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

    // 1. Effect for initial balance
    useEffect(() => {
        if (collection && wallet && wallet.connected) {
            checkNFTBalance.current = true;
            fetchNFTBalance();
        }
    }, [collection, wallet, checkNFTBalance, fetchNFTBalance]); // Only run on initial mount and when collection/wallet changes

    // if (!pageName) return;

    if (collection === null || tokenMint === null) return <Loader />;

    if (!collection) return <PageNotFound />;

    return (
        <main className={`relative min-h-screen w-full ${montserrat.className}`}>
            {/* Background Image Container */}
            <div className="absolute inset-0 h-full w-full">
                <Image 
                    src="/your-background-image.jpg" // Replace with your image path
                    alt="Background"
                    layout="fill"
                    objectFit="cover"
                    priority
                    className="z-0"
                />
                
                {/* Overlay for better text visibility */}
                <div className="absolute inset-0 bg-black/30 z-10" />
            </div>

            {!showInteractive ? (
                // Landing View with Recruit Button
                <div className="relative z-20 flex h-screen w-full flex-col items-center justify-center">
                    <button
                        onClick={() => setShowInteractive(true)}
                        className="transform rounded-xl bg-[#FFE376] px-12 py-6 text-3xl font-bold text-[#BA6502] transition-all hover:scale-105 hover:bg-[#FFE376]/90 active:scale-95"
                    >
                        RECRUIT
                    </button>
                </div>
            ) : (
                // Interactive Element Container
                <div className="relative z-20 flex min-h-screen w-full flex-col items-center justify-center py-16">
                    {/* Header */}
                    <div className="absolute top-0 z-50 flex min-h-20 w-full items-center bg-[#00357A] xl:h-24">
                        <button
                            onClick={() => setShowInteractive(false)}
                            className="absolute left-4 rounded-lg bg-[#FFE376] px-4 py-2 text-sm font-bold text-[#BA6502] transition-all hover:bg-[#FFE376]/90"
                        >
                            Back
                        </button>
                        <p className="font-face-wc mx-auto mt-2 text-wrap text-center text-[1.75rem] text-white sm:text-3xl xl:text-6xl">
                            THE <span className="text-[#FFDD56]">RECRUITMENT</span> CENTER
                        </p>
                    </div>

                    {/* Main Interactive Content */}
                    <div className="mt-24 w-full max-w-7xl px-4">
                        {/* Insert your existing interactive elements here */}
                        <div className="rounded-2xl bg-[#00357A]/75 p-8 backdrop-blur-sm">
                            {/* Your existing content from index.tsx */}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default LandingPage;