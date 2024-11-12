import { useCallback, useEffect, useState, useMemo } from "react";
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
import { ReceivedAssetModal, ReceivedAssetModalStyle } from "@/components/Solana/modals";
import PageNotFound from "@/components/pageNotFound";
import { bignum_to_num } from "@/components/Solana/state";
import useAppRoot from "@/context/useAppRoot";
import CollectionReleaseModal from "../../collection/collectionReleaseModal";
import formatPrice from "@/utils/formatPrice";
import useResponsive from "@/hooks/useResponsive";
import { AssetWithMetadata } from "@/pages/collection/[pageName]";
import MyNFTsPanel from "./myAssets";
import Marketplace from "./marketplace";

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
    const collection_name = "joypeeptest1";

    const [nftAmount, setNFTAmount] = useState<number>(0);
    const [token_amount, setTokenAmount] = useState<number>(0);

    const [wrapSOL, setWrapSOL] = useState<number>(0);

    const [activeTab, setActiveTab] = useState("Mint");

    const [listedNFTs, setListedNFTs] = useState<AssetWithMetadata[]>([]);

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

    const { tokenBalance } = useTokenBalance({mintData: tokenMint});

    const { tokenBalance: whiteListTokenBalance } = useTokenBalance({mintData: whitelistMint});

    const collectionAddress = useMemo(() => {
        return collection?.keys?.[CollectionKeys.CollectionMint] || null;
    }, [collection]);

    const tokenAddress = collection?.keys?.[CollectionKeys.MintAddress].toString().toString();

    const { nftBalance, ownedAssets, collectionAssets, checkNFTBalance, fetchNFTBalance } = useNFTBalance(
        collectionAddress ? { collectionAddress } : null,
    );

    let isLoading = isClaimLoading || isMintRandomLoading || isWrapLoading || isMintLoading;

    const { isOpen: isReleaseModalOpen, onOpen: openReleaseModal, onClose: closeReleaseModal } = useDisclosure();
    const modalStyle: ReceivedAssetModalStyle = {
        check_image: "/images/cooks.jpeg",
        failed_image: "/images/cooks.jpeg",
        fontFamily: "KGSummerSunshineBlackout",
        fontColor: "white",
        succsss_h: 620,
        failed_h: 620,
        checking_h: 620,
        success_w: 620,
        failed_w: 620,
        checking_w: 620,
        sm_succsss_h: 570,
        sm_success_w: 420,
        sm_failed_h: 350,
        sm_failed_w: 350,
        sm_checking_h: 570,
        sm_checking_w: 420,
    };

    useEffect(() => {
        if (!collectionAssets || !collectionPlugins) return;

        let new_listings = [];
        for (let i = 0; i < collectionPlugins.listings.length; i++) {
            const asset_key = collectionPlugins.listings[i].asset;
            const asset = collectionAssets.get(asset_key.toString());
            if (asset) new_listings.push(asset);
        }
        setListedNFTs(new_listings);
    }, [collectionPlugins, collectionAssets]);

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

    useEffect(() => {
        fetchNFTBalance();
    }, [collection, wallet, fetchNFTBalance]);

    // if (!pageName) return;

    if (collection === null || tokenMint === null) return <Loader />;

    if (!collection) return <PageNotFound />;

    const enoughTokenBalance =
        (wrapSOL ? userSOLBalance : tokenBalance) >= bignum_to_num(collection.swap_price) / Math.pow(10, collection.token_decimals);

    const whiteListDecimals = whitelistMint?.mint?.decimals || 1;
    const hasEnoughWhitelistToken = whitelistMint
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
            className={`relative flex min-h-full w-full items-center justify-center py-16 text-white overflow-hidden ${montserrat.className}`}
            style={{ background: "linear-gradient(180deg, #5DBBFF 0%, #0076CC 100%)" }}
        >
            {/* Header */}
            <div className="mt-15 absolute top-0 flex min-h-20 w-full items-center bg-[#00357A] xl:h-24">
                <p className="font-face-wc left-0 right-0 mx-auto mt-2 text-wrap text-center text-[1.75rem] text-white sm:text-3xl xl:text-6xl">
                    THE <span className="text-[#FFDD56]">JOY</span> TRANSMOGRIFIER
                </p>
            </div>

            <Image src={"/curatedLaunches/joy/bg asset.png"} width={1150} height={1150} alt="JOY BOT" className="absolute bottom-0" />
            {isHomePage ? (
                <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                    <Image src={"/curatedLaunches/joy/bg asset.png"} width={1150} height={1150} alt="JOY BOT"/>

                    <p
                        className="font-face-wc absolute cursor-pointer text-3xl text-white transition-all hover:text-[4rem] md:text-6xl z-50"
                        style={{
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, 94%)",
                        }}
                        onClick={() => setIsHomePage(false)}
                    >
                        Start
                    </p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2 px-4 mt-16 md:gap-3">
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
                                <p className="text-6xl font-face-wc">${collection.token_symbol}</p>

                                <Image src={tokenMint.icon} width={250} height={250} alt="BOY Icon" className="rounded-full shadow-xl" />

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
                                                    href={"https://eclipse.letscook.wtf"}
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
                                                  )} $${collection.token_symbol}`
                                                : `${parseFloat(
                                                      formatPrice(
                                                          bignum_to_num(collection.swap_price) / Math.pow(10, collection.token_decimals),
                                                          2,
                                                      ),
                                                  ).toLocaleString("en-US", {})} $${collection.token_symbol} = 1 NFT`}
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
                                                    {(wrapSOL ? userSOLBalance : tokenBalance).toLocaleString()} {collection.token_symbol}
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
                                                    {nftBalance}
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
                                                disabled={!enoughTokenBalance}
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
                                                                new Date().getTime() < collectionPlugins.whitelistPhaseEnd.getTime() && (
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
                                allListings={collectionPlugins ? collectionPlugins.listings : []}
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
                                allListings={collectionPlugins ? collectionPlugins.listings : []}
                                collection={collection}
                                tab={activeTab}
                            />
                        </div>
                    )}
                </div>
            )}
            <ReceivedAssetModal
                curated={false}
                have_randoms={validRandoms}
                isWarningOpened={isAssetModalOpen}
                closeWarning={closeAssetModal}
                assignment_data={assignmentData}
                collection={collection}
                asset={asset}
                asset_image={assetMeta}
                style={modalStyle}
                isLoading={isLoading}
            />

            <CollectionReleaseModal
                isOpened={isReleaseModalOpen}
                onClose={closeReleaseModal}
                assets={ownedAssets}
                collection={collection}
            />
        </main>
    );
};

export default Joy;
