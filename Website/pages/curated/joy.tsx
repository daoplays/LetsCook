import { useCallback, useEffect, useState, useMemo } from "react";
import { Info, Loader } from "lucide-react";
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
import { useRouter } from "next/router";
import useCollection from "@/hooks/data/useCollection";
import useMintNFT from "@/hooks/collections/useMintNFT";
import useWrapNFT from "@/hooks/collections/useWrapNFT";
import useMintRandom from "@/hooks/collections/useMintRandom";
import useAssignmentData from "@/hooks/data/useAssignmentData";
import useClaimNFT from "@/hooks/collections/useClaimNFT";
import { CollectionKeys, Config, SYSTEM_KEY } from "@/components/Solana/constants";
import useTokenBalance from "@/hooks/data/useTokenBalance";
import useNFTBalance from "@/hooks/data/useNFTBalance";
import { useDisclosure } from "@chakra-ui/react";
import { ReceivedAssetModal, ReceivedAssetModalStyle } from "@/components/Solana/modals";
import PageNotFound from "@/components/pageNotFound";
import { bignum_to_num } from "@/components/Solana/state";
import useAppRoot from "@/context/useAppRoot";
import CollectionReleaseModal from "../collection/collectionReleaseModal";
import formatPrice from "@/utils/formatPrice";

const montserrat = Montserrat({
    weight: ["500", "600", "700", "800", "900"],
    subsets: ["latin"],
    display: "swap",
    fallback: ["Arial", "sans-serif"],
    variable: "--font-montserrat",
});

const Joy = () => {
    const wallet = useWallet();
    const { handleConnectWallet } = UseWalletConnection();

    const [isHomePage, setIsHomePage] = useState(true);
    const [isTokenToNFT, setIsTokenToNFT] = useState(true);
    const router = useRouter();
    const collection_name = Config.NETWORK === "mainnet" ? "badger" : "testingtest";

    const [nftAmount, setNFTAmount] = useState<number>(0);
    const [token_amount, setTokenAmount] = useState<number>(0);

    const [wrapSOL, setWrapSOL] = useState<number>(0);

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

    const mintAddress = useMemo(() => {
        return collection?.keys?.[CollectionKeys.MintAddress] || null;
    }, [collection]);

    const { tokenBalance } = useTokenBalance(mintAddress ? { mintAddress } : null);

    const collectionAddress = useMemo(() => {
        return collection?.keys?.[CollectionKeys.CollectionMint] || null;
    }, [collection]);

    const { nftBalance, ownedAssets, checkNFTBalance, fetchNFTBalance } = useNFTBalance(collectionAddress ? { collectionAddress } : null);

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

    let progress_string = "";
    if (collection.collection_meta["__kind"] === "RandomFixedSupply") {
        progress_string = collection.num_available.toString() + " / " + collection.total_supply.toString();
    }
    if (collection.collection_meta["__kind"] === "RandomUnlimited") {
        progress_string = "Unlimited";
    }

    return (
        <main
            className={`relative flex h-full w-full items-center justify-center text-white ${montserrat.className}`}
            style={{ background: "linear-gradient(180deg, #5DBBFF 0%, #0076CC 100%)" }}
        >
            {/* Header */}
            <div className="mt-15 absolute top-0 flex min-h-20 w-full items-center bg-[#00357A] xl:h-24">
                <p className="font-face-wc left-0 right-0 mx-auto mt-2 text-wrap text-center text-[1.75rem] text-white sm:text-3xl xl:text-6xl">
                    THE <span className="text-[#FFDD56]">JOY</span> TRANSMOGIFIER
                </p>
            </div>

            <Image src={"/curatedLaunches/joy/bot.png"} width={750} height={750} alt="JOY BOT" className="absolute bottom-0" />
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
                <div
                    className={`mt-20 flex transform items-center justify-center gap-16 rounded-2xl bg-clip-padding transition-all duration-500 md:p-8 xl:bg-[#00357A]/75 xl:px-16 xl:shadow-2xl xl:backdrop-blur-sm xl:backdrop-filter ${isHomePage ? "scale-90 opacity-0" : "scale-100 opacity-100"}`}
                >
                    
                    <div className="flex-col items-center justify-center hidden gap-2 xl:flex">
                        <p className="text-6xl font-face-wc">${collection.collection_name}</p>
                        <Image
                            src={collection.collection_icon_url}
                            width={225}
                            height={225}
                            alt="$JOY Icon"
                            className="rounded-full shadow-xl"
                        />

                        <p className="text-lg">Token Address: {trimAddress(collection.keys[CollectionKeys.CollectionMint].toString())}</p>
                        <div className="flex gap-2">
                            <TooltipProvider>
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger>
                                        <div
                                            style={{ cursor: "pointer" }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navigator.clipboard.writeText(
                                                    trimAddress(collection.keys[CollectionKeys.CollectionMint].toString()),
                                                );
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
                                            href={
                                                "https://eclipsescan.xyz/token/" + collection.keys[CollectionKeys.CollectionMint].toString()
                                            }
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
                                            href={
                                                "https://www.validators.wtf/rugcheck?mint=" +
                                                collection.keys[CollectionKeys.CollectionMint].toString()
                                            }
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
                        </div>
                    </div>
                    <div className="w-full rounded-2xl border border-t-[3px] border-t-[#FFDD56] bg-[#00357A]/75 p-4 text-white shadow-2xl md:w-[400px] xl:bg-transparent">
                        <div className="flex flex-col items-center gap-1 mx-auto mb-3 w-fit">
                            <p className="mx-auto text-3xl font-face-wc w-fit">Transmogify</p>

                            <div className="flex items-center gap-1 text-md">
                                <p>
                                    {!isTokenToNFT
                                        ? `1 NFT = ${parseFloat(formatPrice(outAmount, 3)).toLocaleString("en-US", {
                                              minimumFractionDigits: 3,
                                          })} ${collection.token_symbol}`
                                        : `${parseFloat(
                                              formatPrice(
                                                  bignum_to_num(collection.swap_price) / Math.pow(10, collection.token_decimals),
                                                  3,
                                              ),
                                          ).toLocaleString("en-US", {
                                              minimumFractionDigits: 3,
                                          })} $${collection.token_symbol} = 1 NFT`}
                                </p>
                                {/* {isTokenToNFT ? <p>100,000 $JOY = 1 NFT </p> : <p>1 NFT = 98,000 $JOY </p>} */}
                                {isTokenToNFT && (
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
                                            <span>JOY</span>
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full text-xl text-right bg-transparent focus:outline-none"
                                        placeholder="0"
                                        value={
                                            isTokenToNFT
                                                ? formatPrice(
                                                      bignum_to_num(collection.swap_price) / Math.pow(10, collection.token_decimals),
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
                                        <span>BOYS</span>
                                    </button>
                                    <input
                                        type="text"
                                        className="w-full text-xl text-right bg-transparent focus:outline-none"
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
                                        className="w-full rounded-xl bg-[#FFE376] py-3 text-lg font-semibold text-[#BA6502] hover:bg-opacity-90"
                                        onClick={() => {
                                            if (!wallet.connected) {
                                                handleConnectWallet();
                                            }

                                            if (wallet.connected && enoughTokenBalance) {
                                                ClaimNFT();
                                            }
                                        }}
                                    >
                                        Swap
                                    </button>
                                ) : (
                                    <button
                                        className="w-full rounded-xl bg-[#FFE376] py-3 text-lg font-semibold text-[#BA6502] hover:bg-opacity-90"
                                        onClick={() => {
                                            openAssetModal();
                                            MintNFT();
                                        }}
                                    >
                                        Swap
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
                                    // isLoading={isWrapLoading}
                                >
                                    Swap
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
                        </div>
                    </div>
                    <div className="flex-col items-center justify-center hidden gap-2 xl:flex">
                        <p className="text-6xl font-face-wc">{collection.token_symbol}</p>
                        <Image src={tokenMint.icon} width={250} height={250} alt="BOY Icon" className="rounded-full shadow-xl" />
                        <p className="text-lg">Collection Address: {trimAddress(collection.keys[CollectionKeys.MintAddress].toString())}</p>
                        <div className="flex gap-2">
                            <TooltipProvider>
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger>
                                        <div
                                            style={{ cursor: "pointer" }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navigator.clipboard.writeText(
                                                    trimAddress(collection.keys[CollectionKeys.MintAddress].toString()),
                                                );
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
                                            href={
                                                "https://eclipsescan.xyz/token/" +
                                                trimAddress(collection.keys[CollectionKeys.MintAddress].toString())
                                            }
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
