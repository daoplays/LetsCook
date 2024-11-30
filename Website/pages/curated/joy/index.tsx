import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { Info, Loader, Loader2Icon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { IoSwapVertical } from "react-icons/io5";
import { FaWallet } from "react-icons/fa";
import { useWallet } from "@solana/wallet-adapter-react";
import { Montserrat } from "next/font/google";
import { MdOutlineContentCopy } from "react-icons/md";
import trimAddress from "@/utils/trimAddress";
import UseWalletConnection from "@/hooks/useWallet";
import Image from "next/image";
import Link from "next/link";
import useCollection from "@/hooks/data/useCollection";
import useMintNFT from "@/hooks/collections/useMintNFT";
import useWrapNFT from "@/hooks/collections/useWrapNFT";
import useMintRandom from "@/hooks/collections/useMintRandom";
import useAssignmentData from "@/hooks/data/useAssignmentData";
import useClaimNFT from "@/hooks/collections/useClaimNFT";
import { CollectionKeys, Config, SYSTEM_KEY } from "@/components/Solana/constants";
import useTokenBalance from "@/hooks/data/useTokenBalance";
import useNFTBalance from "@/hooks/data/useNFTBalance";
import { useDisclosure, VStack, HStack, Text, Box } from "@chakra-ui/react";
import { ReceivedAssetModalStyle } from "@/components/Solana/modals";
import PageNotFound from "@/components/pageNotFound";
import { bignum_to_num } from "@/components/Solana/state";
import CollectionReleaseModal from "../../collection/collectionReleaseModal";
import formatPrice from "@/utils/formatPrice";
import useResponsive from "@/hooks/useResponsive";
import { AssetWithMetadata } from "@/pages/collection/[pageName]";
import MyNFTsPanel from "./myAssets";
import Marketplace from "./marketplace";
import ReceivedAssetModal from "./receiveAssetModal";
import useGetUserBalance from "@/hooks/data/useGetUserBalance";

const montserrat = Montserrat({
    weight: ["500", "600", "700", "800", "900"],
    subsets: ["latin"],
    display: "swap",
    fallback: ["Arial", "sans-serif"],
    variable: "--font-montserrat",
});

const Joy = () => {
    const wallet = useWallet();
    const { sm } = useResponsive();
    const { handleConnectWallet } = UseWalletConnection();

    const [isHomePage, setIsHomePage] = useState(true);
    const [isTokenToNFT, setIsTokenToNFT] = useState(true);
    const collection_name = Config.NETWORK === "eclipse" ? "joypeeps" : "joypeeptest1";

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
        marketplaceSummary,
        listedAssets,
        error: collectionError,
    } = useCollection({ pageName: collection_name as string | null });

    const { assignmentData, validRandoms, asset, assetMeta, error: assignmentError } = useAssignmentData({ collection: collection });

    const { MintNFT, isLoading: isMintLoading } = useMintNFT(collection);
    const { WrapNFT, isLoading: isWrapLoading } = useWrapNFT(collection);
    const { userBalance: userSOLBalance } = useGetUserBalance();

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

    const enoughTokenBalance =
        (wrapSOL ? userSOLBalance : tokenBalance) >= bignum_to_num(collection.swap_price) / Math.pow(10, collection.token_decimals);

    const whitelistActive =
        whitelistMint &&
        collectionPlugins.whitelistPhaseEnd &&
        (collectionPlugins.whitelistPhaseEnd.getTime() === 0 || new Date().getTime() < collectionPlugins.whitelistPhaseEnd.getTime());

    const whiteListDecimals = whitelistMint?.mint?.decimals || 1;
    const hasEnoughWhitelistToken =
        whitelistMint && whitelistActive
            ? whiteListTokenBalance >= bignum_to_num(collectionPlugins.whitelistAmount) / Math.pow(10, whiteListDecimals)
            : true;

    let progress_string = "";
    if (collection.collection_meta["__kind"] === "RandomFixedSupply") {
        progress_string = collection.num_available.toString() + " / " + collection.total_supply.toString();
    }
    if (collection.collection_meta["__kind"] === "RandomUnlimited") {
        progress_string = "Unlimited";
    }

    return (
        <main
            className={`relative flex min-h-full w-full items-center justify-center py-16 text-white ${montserrat.className}`}
            style={{ background: "linear-gradient(180deg, #5DBBFF 0%, #0076CC 100%)" }}
        >
            {/* Header */}
            <div className="mt-15 absolute top-0 z-50 flex min-h-20 w-full items-center bg-[#00357A] xl:h-24">
                <p className="font-face-wc left-0 right-0 mx-auto mt-2 text-wrap text-center text-[1.75rem] text-white sm:text-3xl xl:text-6xl">
                    THE <span className="text-[#FFDD56]">JOY</span> TRANSMOGRIFIER
                </p>
            </div>

            {isHomePage && (
                <div className="absolute bottom-[0] left-1/2 h-[1050px] w-[1850px] -translate-x-1/2">
                    <Image
                        src={"/curatedLaunches/joy/image4.png"}
                        width={300}
                        height={300}
                        alt="ROCKET"
                        className="infinite absolute bottom-[0px] left-[200px] animate-pulse duration-1000 ease-linear"
                    />
                    <Image
                        src={"/curatedLaunches/joy/image8.png"}
                        width={230}
                        height={230}
                        alt="100 emoji"
                        className="infinite absolute left-[50px] top-[190px] animate-pulse duration-1000 ease-linear"
                    />
                    <Image
                        src={"/curatedLaunches/joy/image23.png"}
                        width={200}
                        height={200}
                        alt="Thread"
                        className="infinite absolute right-[150px] top-[150px] animate-pulse duration-1000 ease-linear"
                    />
                    <Image
                        src={"/curatedLaunches/joy/joy2.png"}
                        width={180}
                        height={180}
                        alt="JOY face up"
                        className="absolute left-[400px] top-[400px]"
                    />
                    <Image
                        src={"/curatedLaunches/joy/joy3.png"}
                        width={140}
                        height={140}
                        alt="JOY face down"
                        className="absolute right-[400px] top-[400px]"
                    />
                    <Image
                        src={"/curatedLaunches/joy/image108.png"}
                        width={341}
                        height={341}
                        alt="Eggplant"
                        className="infinite absolute right-[600px] top-[100px] animate-pulse duration-1000 ease-linear"
                    />
                    <Image
                        src={"/curatedLaunches/joy/image 24.png"}
                        width={270}
                        height={270}
                        alt="money with wings"
                        className="infinite absolute bottom-[300px] right-[50px] animate-pulse duration-1000 ease-linear"
                    />
                    <Image
                        src={"/curatedLaunches/joy/joy4.png"}
                        width={250}
                        height={250}
                        alt="JOY BOT9"
                        className="absolute bottom-[0px] right-[300px]"
                    />
                </div>
            )}

            {isHomePage ? (
                <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                    <Image src={"/curatedLaunches/joy/bot.png"} width={750} height={750} alt="JOY BOT" />

                    <p
                        className="font-face-wc absolute cursor-pointer text-3xl text-white transition-all hover:text-[4rem] md:text-6xl"
                        style={{
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, 25%)",
                        }}
                        onClick={() => setIsHomePage(false)}
                    >
                        Start
                    </p>
                </div>
            ) : (
                <>
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                        <Image src={"/curatedLaunches/joy/bot.png"} width={750} height={750} alt="JOY BOT" />
                    </div>
                    <div
                        className={`mt-16 flex transform flex-col items-center gap-2 px-4 transition-all duration-500 md:gap-3 ${isHomePage ? "scale-80 opacity-0" : "scale-100 opacity-100"}`}
                    >
                        <div className="-ml-1 flex w-fit gap-1 rounded-2xl p-2 xl:bg-[#00357A]/75 xl:shadow-2xl xl:backdrop-blur-sm xl:backdrop-filter">
                            <button
                                onClick={() => setActiveTab("Mint")}
                                className={`rounded-xl px-3 py-2 font-bold transition-all duration-200 md:px-8 md:py-3 md:text-lg ${
                                    activeTab === "Mint"
                                        ? "bg-white text-blue-700 shadow-lg"
                                        : "text-white/70 hover:bg-white/5 hover:text-white"
                                } `}
                            >
                                Mint
                            </button>
                            <button
                                onClick={() => setActiveTab("My NFTs")}
                                className={`rounded-xl px-3 py-2 font-bold transition-all duration-200 md:px-8 md:py-3 md:text-lg ${
                                    activeTab === "My NFTs"
                                        ? "bg-white text-blue-700 shadow-lg"
                                        : "text-white/70 hover:bg-white/5 hover:text-white"
                                } `}
                            >
                                My NFTs
                            </button>
                            <button
                                onClick={() => setActiveTab("Marketplace")}
                                className={`rounded-xl px-3 py-2 font-bold transition-all duration-200 md:px-8 md:py-3 md:text-lg ${
                                    activeTab === "Marketplace"
                                        ? "bg-white text-blue-700 shadow-lg"
                                        : "text-white/70 hover:bg-white/5 hover:text-white"
                                } `}
                            >
                                Marketplace
                            </button>
                        </div>
                        {activeTab === "Mint" && (
                            <div
                                className={`flex transform items-center justify-center gap-16 rounded-2xl bg-clip-padding transition-all duration-500 md:p-8 xl:bg-[#00357A]/75 xl:px-16 xl:shadow-2xl xl:backdrop-blur-sm xl:backdrop-filter ${isHomePage ? "scale-80 opacity-0" : "scale-100 opacity-100"} `}
                            >
                                <div className="hidden w-[320px] flex-col items-center justify-center gap-2 xl:flex">
                                    <p className="text-6xl font-face-wc">{collection.token_symbol}</p>

                                    <Image
                                        src={tokenMint.icon}
                                        width={250}
                                        height={250}
                                        alt="BOY Icon"
                                        className="rounded-full shadow-xl"
                                    />

                                    <p className="text-lg">Token Address: {trimAddress(tokenAddress)}</p>
                                    <div className="flex gap-2">
                                        <TooltipProvider>
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger>
                                                    <div
                                                        style={{ cursor: "pointer" }}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            navigator.clipboard.writeText(tokenAddress);
                                                        }}
                                                    >
                                                        <MdOutlineContentCopy color="white" size={22} />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom">
                                                    <p>Copy Token Address</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger>
                                                    <Link
                                                        href={"https://eclipsescan.xyz/token/" + tokenAddress.toString()}
                                                        target="_blank"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Image
                                                            src={"/curatedLaunches/joy/eclipsescan.jpg"}
                                                            width={25}
                                                            height={25}
                                                            alt="Solscan icon"
                                                            className="rounded-full"
                                                        />
                                                    </Link>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom">
                                                    <p>Eclipse Scan</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger>
                                                    <Link
                                                        href={"https://www.validators.wtf/rugcheck?mint=" + tokenAddress.toString()}
                                                        target="_blank"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Image
                                                            src={"/curatedLaunches/joy/validators.jpg"}
                                                            width={25}
                                                            height={25}
                                                            alt="Validators icon"
                                                            className="rounded-full"
                                                        />
                                                    </Link>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom">
                                                    <p>Validators Rug Check</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger>
                                                    <Link
                                                        href={
                                                            "https://eclipse.letscook.wtf/trade/8dotswVmYUDF24Z4Fvq4f7zZ6M2YfVuKddSUspyzwF2H"
                                                        }
                                                        target="_blank"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Image
                                                            src={"/favicon.ico"}
                                                            width={25}
                                                            height={25}
                                                            alt="Let's Cook Icon"
                                                            className="rounded-full"
                                                        />
                                                    </Link>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom">
                                                    <p>Buy on Let&apos;s Cook</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>

                                <div className="w-full rounded-2xl border border-t-[3px] border-t-[#FFDD56] bg-[#00357A]/75 p-4 text-white shadow-2xl md:w-[400px] xl:bg-transparent">
                                    <div className="flex flex-col items-center gap-2 mx-auto mb-4 w-fit">
                                        <p className="mx-auto text-3xl font-face-wc w-fit">Transmogrify</p>
                                        <div className="flex items-center gap-1 text-md">
                                            <p>
                                                {!isTokenToNFT
                                                    ? `1 NFT = ${parseFloat(formatPrice(outAmount, 2)).toLocaleString(
                                                          "en-US",
                                                          {},
                                                      )} ${collection.token_symbol}`
                                                    : `${parseFloat(
                                                          formatPrice(
                                                              bignum_to_num(collection.swap_price) /
                                                                  Math.pow(10, collection.token_decimals),
                                                              2,
                                                          ),
                                                      ).toLocaleString("en-US", {})} ${collection.token_symbol} = 1 NFT`}
                                            </p>

                                            {!isTokenToNFT && (
                                                <TooltipProvider>
                                                    <Tooltip delayDuration={0}>
                                                        <TooltipTrigger>
                                                            <Info size={18} />
                                                        </TooltipTrigger>
                                                        <TooltipContent side="bottom">
                                                            <p>2% Swap-Back Fee Paid to Community Wallet</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </div>

                                    <div className={`flex ${isTokenToNFT ? "flex-col" : "flex-col-reverse"}`}>
                                        {/* From Token Input */}
                                        <div className={`${isTokenToNFT ? "" : "-mt-6 mb-3"}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-sm">{isTokenToNFT ? `You're Swapping` : "To Receive"}</div>

                                                <div className="flex items-center gap-1 opacity-75">
                                                    <FaWallet size={12} />
                                                    <p className="text-sm">
                                                        {(wrapSOL ? userSOLBalance : tokenBalance).toLocaleString()}{" "}
                                                        {collection.token_symbol}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-xl">
                                                <div className="flex flex-col gap-2">
                                                    <button className="flex items-center gap-2 rounded-lg bg-gray-700 px-2.5 py-1.5">
                                                        <div className="w-6">
                                                            <Image
                                                                src={tokenMint.icon}
                                                                width={25}
                                                                height={25}
                                                                alt="$JOY Icon"
                                                                className="rounded-full"
                                                            />
                                                        </div>
                                                        <span>{collection.token_symbol}</span>
                                                    </button>
                                                </div>
                                                <input
                                                    type="text"
                                                    className="w-full text-xl text-right text-gray-500 bg-transparent cursor-not-allowed focus:outline-none"
                                                    placeholder="0"
                                                    value={
                                                        isTokenToNFT
                                                            ? formatPrice(
                                                                  bignum_to_num(collection.swap_price) /
                                                                      Math.pow(10, collection.token_decimals),
                                                                  3,
                                                              )
                                                            : formatPrice(outAmount, 3)
                                                    }
                                                    onChange={(e) => {
                                                        setTokenAmount(
                                                            !isNaN(parseFloat(e.target.value)) || e.target.value === ""
                                                                ? parseFloat(e.target.value)
                                                                : token_amount,
                                                        );
                                                    }}
                                                    disabled={true}
                                                />
                                            </div>
                                        </div>

                                        {/* Swap Icon */}
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => setIsTokenToNFT(!isTokenToNFT)}
                                                className="z-50 p-2 mx-auto my-2 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700"
                                            >
                                                <IoSwapVertical size={18} className="opacity-75" />
                                            </button>
                                        </div>

                                        {/* To Token Input */}
                                        <div className={`${!isTokenToNFT ? "" : "-mt-6 mb-3"}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-sm">{!isTokenToNFT ? `You're Swapping` : "To Receive"}</div>

                                                <div className="flex items-center gap-1 opacity-75">
                                                    <FaWallet size={12} />
                                                    <p className="text-sm">
                                                        {nftBalance + userListedNFTs.length}
                                                        {collection.collection_symbol}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-xl">
                                                <button className="flex items-center gap-2 rounded-lg bg-gray-700 px-2.5 py-1.5">
                                                    <div className="w-6">
                                                        <Image
                                                            src={collection.collection_icon_url}
                                                            width={25}
                                                            height={25}
                                                            alt="BOY Icon"
                                                            className="rounded-full"
                                                        />
                                                    </div>
                                                    <span className="text-nowrap">{collection.collection_name}</span>
                                                </button>
                                                <input
                                                    type="text"
                                                    className="w-full text-xl text-right text-gray-500 bg-transparent cursor-not-allowed focus:outline-none"
                                                    placeholder="0"
                                                    value={1}
                                                    onChange={(e) => {
                                                        setNFTAmount(
                                                            !isNaN(parseFloat(e.target.value)) || e.target.value === ""
                                                                ? parseFloat(e.target.value)
                                                                : nftAmount,
                                                        );
                                                    }}
                                                    disabled={true}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {wallet.connected ? (
                                        isTokenToNFT ? (
                                            assignmentData === null || assignmentData.status > 0 ? (
                                                <button
                                                    className={`w-full rounded-xl bg-[#FFE376] py-3 text-lg font-semibold text-[#BA6502] hover:bg-opacity-90`}
                                                    onClick={() => {
                                                        if (!wallet.connected) {
                                                            handleConnectWallet();
                                                        }

                                                        if (wallet.connected && enoughTokenBalance) {
                                                            ClaimNFT();
                                                        }
                                                    }}
                                                    disabled={!enoughTokenBalance || isLoading}
                                                >
                                                    {isLoading ? (
                                                        <Loader2Icon className="mx-auto animate-spin" />
                                                    ) : !enoughTokenBalance ? (
                                                        "Insufficient token balance"
                                                    ) : !hasEnoughWhitelistToken ? (
                                                        "Whitelist Token Required"
                                                    ) : (
                                                        "Mint NFT"
                                                    )}
                                                </button>
                                            ) : (
                                                <button
                                                    className="w-full rounded-xl bg-[#FFE376] py-3 text-lg font-semibold text-[#BA6502] hover:bg-opacity-90"
                                                    onClick={() => {
                                                        openAssetModal();
                                                        MintNFT();
                                                    }}
                                                    disabled={isLoading}
                                                >
                                                    {isLoading ? <Loader2Icon className="mx-auto animate-spin" /> : "Check your NFT"}
                                                </button>
                                            )
                                        ) : (
                                            <button
                                                className="w-full rounded-xl bg-[#FFE376] py-3 text-lg font-semibold text-[#BA6502] hover:bg-opacity-90"
                                                onClick={() => {
                                                    if (wallet.connected) {
                                                        WrapNFT(null);
                                                        checkNFTBalance.current = true;
                                                    } else {
                                                        handleConnectWallet();
                                                    }
                                                }}
                                                disabled={nftBalance <= 0 || isLoading}
                                            >
                                                {isLoading ? (
                                                    <Loader2Icon className="mx-auto animate-spin" />
                                                ) : nftBalance <= 0 ? (
                                                    `Insufficient NFT balance `
                                                ) : (
                                                    "Swap"
                                                )}
                                            </button>
                                        )
                                    ) : (
                                        <button
                                            className="w-full rounded-xl bg-[#FFE376] py-3 text-lg font-semibold text-[#BA6502] hover:bg-opacity-90"
                                            onClick={() => handleConnectWallet()}
                                        >
                                            Connect Wallet
                                        </button>
                                    )}

                                    <div className="flex flex-col gap-2 mt-4 text-sm">
                                        <div className="flex justify-between opacity-75">
                                            <span>NFTs Available</span>
                                            <span>{collection.num_available}</span>
                                        </div>

                                        <div className="flex justify-between opacity-75">
                                            <span>NFTs in Circulation</span>
                                            <span>{collection.total_supply - collection.num_available}</span>
                                        </div>
                                        <div className="flex justify-between opacity-75">
                                            <span>Total NFT Supply</span>
                                            <span>{collection.total_supply}</span>
                                        </div>

                                        {whitelistMint &&
                                            collectionPlugins.whitelistPhaseEnd &&
                                            (collectionPlugins.whitelistPhaseEnd.getTime() === 0 ||
                                                new Date().getTime() < collectionPlugins.whitelistPhaseEnd.getTime()) && (
                                                <>
                                                    <div className="flex justify-between opacity-75">
                                                        <span>Whitelist Token</span>
                                                        <HStack justifyContent="center">
                                                            <span>{trimAddress(whitelistMint.mint.address.toString())}</span>
                                                        </HStack>
                                                    </div>
                                                    <div className="flex justify-between opacity-75">
                                                        <span>WL End Date</span>
                                                        <HStack justifyContent="center">
                                                            <span>
                                                                {collectionPlugins.whitelistPhaseEnd &&
                                                                    Math.floor(collectionPlugins.whitelistPhaseEnd.getTime() / 1000) > 0 &&
                                                                    new Date().getTime() <
                                                                        collectionPlugins.whitelistPhaseEnd.getTime() && (
                                                                        <span>{collectionPlugins.whitelistPhaseEnd.toLocaleString()}</span>
                                                                    )}
                                                            </span>
                                                        </HStack>
                                                    </div>
                                                </>
                                            )}
                                    </div>
                                </div>

                                <div className="hidden w-[320px] flex-col items-center justify-center gap-2 xl:flex">
                                    <p className="text-6xl font-face-wc">{collection.collection_name}</p>

                                    <Image
                                        src={collection.collection_icon_url}
                                        width={225}
                                        height={225}
                                        alt="$JOY Icon"
                                        className="shadow-xl rounded-xl"
                                    />
                                    <p className="text-lg">Collection Address: {trimAddress(collectionAddress.toString())}</p>
                                    <div className="flex gap-2">
                                        <TooltipProvider>
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger>
                                                    <div
                                                        style={{ cursor: "pointer" }}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            navigator.clipboard.writeText(collectionAddress.toString());
                                                        }}
                                                    >
                                                        <MdOutlineContentCopy color="white" size={22} />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom">
                                                    <p>Copy Collection Address</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                            <Tooltip delayDuration={0}>
                                                <TooltipTrigger>
                                                    <Link
                                                        href={"https://eclipsescan.xyz/token/" + collectionAddress.toString()}
                                                        target="_blank"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Image
                                                            src={"/curatedLaunches/joy/eclipsescan.jpg"}
                                                            width={25}
                                                            height={25}
                                                            alt="Solscan icon"
                                                            className="rounded-full"
                                                        />
                                                    </Link>
                                                </TooltipTrigger>
                                                <TooltipContent side="bottom">
                                                    <p>Eclipse Scan</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "My NFTs" && (
                            <div
                                className={`flex h-[600px] w-full transform rounded-2xl bg-[#00357A]/75 bg-clip-padding p-8 shadow-2xl backdrop-blur-sm backdrop-filter md:w-[1000px]`}
                            >
                                <MyNFTsPanel
                                    ownedNFTs={ownedAssets}
                                    listedNFTs={listedNFTs}
                                    allListings={[...(collectionPlugins?.listings || []), ...(listedAssets || [])]}
                                    collection={collection}
                                />
                            </div>
                        )}

                        {activeTab == "Marketplace" && (
                            <div
                                className={`flex h-[600px] w-full transform rounded-2xl bg-[#00357A]/75 bg-clip-padding p-8 shadow-2xl backdrop-blur-sm backdrop-filter md:w-[1000px]`}
                            >
                                <Marketplace
                                    ownedNFTs={ownedAssets}
                                    listedNFTs={listedNFTs}
                                    allListings={[...(collectionPlugins?.listings || []), ...(listedAssets || [])]}
                                    collection={collection}
                                    tab={activeTab}
                                />
                            </div>
                        )}
                    </div>
                </>
            )}
            <ReceivedAssetModal
                have_randoms={validRandoms}
                isWarningOpened={isAssetModalOpen}
                closeWarning={closeAssetModal}
                assignment_data={assignmentData}
                collection={collection}
                asset={asset}
                asset_image={assetMeta}
                isLoading={isLoading}
            />
        </main>
    );
};

export default Joy;
