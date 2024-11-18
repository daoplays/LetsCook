import {
    VStack,
    Text,
    HStack,
    Progress,
    Button,
    Tooltip,
    Link,
    Flex,
    Card,
    CardBody,
    InputRightElement,
    InputGroup,
    Input,
    Center,
    Divider,
    Spacer,
    useDisclosure,
    Switch,
    Box,
    list,
} from "@chakra-ui/react";
import { AssetV1 } from "@metaplex-foundation/mpl-core";
import { bignum_to_num } from "../../components/Solana/state";
import { useEffect, useCallback, useState, useMemo, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import Image from "next/image";
import useResponsive from "../../hooks/useResponsive";
import UseWalletConnection from "../../hooks/useWallet";
import Head from "next/head";
import { MdOutlineContentCopy } from "react-icons/md";
import trimAddress from "../../utils/trimAddress";
import PageNotFound from "../../components/pageNotFound";
import Loader from "../../components/loader";
import CollectionFeaturedBanner from "../../components/collectionFeaturedBanner";
import useClaimNFT from "../../hooks/collections/useClaimNFT";
import { CollectionKeys, Config, LaunchFlags, SYSTEM_KEY, WRAPPED_SOL } from "../../components/Solana/constants";
import useWrapNFT from "../../hooks/collections/useWrapNFT";
import useMintNFT from "../../hooks/collections/useMintNFT";
import useMintRandom from "../../hooks/collections/useMintRandom";
import ShowExtensions from "../../components/Solana/extensions";
import { getSolscanLink } from "../../utils/getSolscanLink";
import { LuArrowUpDown } from "react-icons/lu";
import { FaWallet } from "react-icons/fa";
import { ReceivedAssetModal, ReceivedAssetModalStyle } from "../../components/Solana/modals";
import formatPrice from "../../utils/formatPrice";
import useTokenBalance from "../../hooks/data/useTokenBalance";
import useCollection from "../../hooks/data/useCollection";
import useAssignmentData from "../../hooks/data/useAssignmentData";
import useNFTBalance from "../../hooks/data/useNFTBalance";
import styles from "../../styles/Launch.module.css";
import useAppRoot from "@/context/useAppRoot";
import CollectionReleaseModal from "./collectionReleaseModal";
import MyNFTsPanel from "@/components/collection/myAssets";
import Marketplace from "@/components/collection/marketplace";
import { PublicKey } from "@solana/web3.js";
import { set } from "date-fns";
import { NFTListingData } from "@/components/collection/collectionState";

export interface AssetWithMetadata {
    asset: AssetV1;
    metadata: any;
}

const CollectionSwapPage = () => {
    const wallet = useWallet();
    const router = useRouter();
    const { pageName } = router.query;
    const { xs, sm, md, lg, xl } = useResponsive();
    const { handleConnectWallet } = UseWalletConnection();

    const [nftAmount, setNFTAmount] = useState<number>(0);
    const [token_amount, setTokenAmount] = useState<number>(0);

    const [isTokenToNFT, setIsTokenToNFT] = useState(true);
    const [wrapSOL, setWrapSOL] = useState<number>(0);
    const [selected, setSelected] = useState("Mint");

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
    } = useCollection({ pageName: pageName as string | null });

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

    const { nftBalance, ownedAssets, collectionAssets, checkNFTBalance, fetchNFTBalance } = useNFTBalance(
        collectionAddress ? { collectionAddress } : null,
    );

    const [listedNFTs, setListedNFTs] = useState<AssetWithMetadata[]>([]);
    const [userListedNFTs, setUserListedNFTs] = useState<string[]>([]);

    const prevUserListedNFTsRef = useRef<string>("");

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

    // 1. Effect for initial balance
    useEffect(() => {
        if (collection && wallet && wallet.connected) {
            checkNFTBalance.current = true;
            fetchNFTBalance();
        }
    }, [collection, wallet, checkNFTBalance, fetchNFTBalance]); // Only run on initial mount and when collection/wallet changes

    useEffect(() => {
        if (!collectionAssets) return;

        let new_listings: AssetWithMetadata[] = [];
        let user_listings: string[] = [];

        if (collectionPlugins) {
            for (let i = 0; i < collectionPlugins.listings.length; i++) {
                const asset_key = collectionPlugins.listings[i].asset;
                const asset = collectionAssets.get(asset_key.toString());
                if (asset) new_listings.push(asset);
                if (wallet && wallet.publicKey && collectionPlugins.listings[i].seller.equals(wallet.publicKey))
                    user_listings.push(asset.asset.publicKey.toString());
            }
        }
        for (let i = 0; i < listedAssets.length; i++) {
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

    if (!pageName) return;

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

    const handleClick = (tab: string) => {
        setSelected(tab);
    };
    const whitelistActive =
        whitelistMint &&
        collectionPlugins.whitelistPhaseEnd &&
        (collectionPlugins.whitelistPhaseEnd.getTime() === 0 || new Date().getTime() < collectionPlugins.whitelistPhaseEnd.getTime());

    const whiteListDecimals = whitelistMint?.mint?.decimals || 1;
    const hasEnoughWhitelistToken =
        whitelistMint && whitelistActive
            ? whiteListTokenBalance >= bignum_to_num(collectionPlugins.whitelistAmount) / Math.pow(10, whiteListDecimals)
            : true;

    //console.log(collection.keys[CollectionKeys.TeamWallet].toString())
    //console.log(whiteListTokenBalance, "whiteListTokenBalance >= collectionPlugins.whitelistAmount", enoughTokenBalance);
    return (
        <>
            <Head>
                <title>Let&apos;s Cook | {pageName}</title>
            </Head>
            <main style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)", height: "auto" }}>
                <CollectionFeaturedBanner featuredLaunch={collection} isHomePage={false} />
                <HStack align="center" spacing={0} zIndex={99} w="100%" mt={xs ? 1 : -2} className="ml-4 mt-2">
                    {/* add rewards  */}
                    {["Mint", "My NFTs", "Marketplace"].map((name, i) => {
                        const isActive = selected === name;

                        const baseStyle = {
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                        };

                        const activeStyle = {
                            color: "white",
                            borderBottom: isActive ? "2px solid white" : "",
                            opacity: isActive ? 1 : 0.5,
                        };

                        const mobileBaseStyle = {
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                        };

                        const mobileActiveStyle = {
                            background: isActive ? "#edf2f7" : "transparent",
                            color: isActive ? "black" : "white",
                            borderRadius: isActive ? "6px" : "",
                            border: isActive ? "none" : "",
                        };

                        const base = sm ? mobileBaseStyle : baseStyle;
                        const active = sm ? mobileActiveStyle : activeStyle;

                        return (
                            <Box
                                key={i}
                                style={{
                                    ...base,
                                    ...active,
                                }}
                                onClick={() => {
                                    handleClick(name);
                                }}
                                px={4}
                                py={2}
                                w={sm ? "50%" : "fit-content"}
                            >
                                <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
                                    {name}
                                </Text>
                            </Box>
                        );
                    })}
                </HStack>

                {selected == "Mint" && (
                    <div style={{ padding: "16px" }}>
                        <VStack
                            p={md ? 22 : 50}
                            bg="rgba(225, 225, 225, 0.20)"
                            borderRadius={12}
                            border="1px solid white"
                            h="fit-content"
                            justifyContent="space-between"
                        >
                            <Flex gap={lg ? 12 : 24} direction={lg ? "column" : "row"} className="items-center">
                                <VStack minW={220}>
                                    <Image
                                        src={tokenMint.icon}
                                        width={180}
                                        height={180}
                                        alt="Image Frame"
                                        style={{ backgroundSize: "cover", borderRadius: 12 }}
                                    />
                                    <Text mt={1} mb={0} color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                        {collection.token_symbol}
                                    </Text>
                                    <HStack spacing={2} align="start" justify="start">
                                        <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"large"}>
                                            CA: {trimAddress(collection.keys[CollectionKeys.MintAddress].toString())}
                                        </Text>

                                        <Tooltip label="Copy Contract Address" hasArrow fontSize="large" offset={[0, 10]}>
                                            <div
                                                style={{ cursor: "pointer" }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    navigator.clipboard.writeText(collection.keys[CollectionKeys.MintAddress].toString());
                                                }}
                                            >
                                                <MdOutlineContentCopy color="white" size={lg ? 22 : 22} />
                                            </div>
                                        </Tooltip>

                                        <Tooltip label="View in explorer" hasArrow fontSize="large" offset={[0, 10]}>
                                            <Link
                                                href={getSolscanLink(collection.keys[CollectionKeys.MintAddress], "Token")}
                                                target="_blank"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Image
                                                    src="/images/solscan.png"
                                                    width={lg ? 22 : 22}
                                                    height={lg ? 22 : 22}
                                                    alt="Solscan icon"
                                                />
                                            </Link>
                                        </Tooltip>

                                        <Tooltip label="Rug Check" hasArrow fontSize="large" offset={[0, 10]}>
                                            <Link
                                                href={`https://rugcheck.xyz/tokens/${
                                                    collection && collection.keys && collection.keys[CollectionKeys.MintAddress]
                                                        ? collection.keys[CollectionKeys.MintAddress].toString()
                                                        : ""
                                                }`}
                                                target="_blank"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Image
                                                    src="/images/rugcheck.jpeg"
                                                    width={22}
                                                    height={22}
                                                    alt="Rugcheck icon"
                                                    style={{ borderRadius: "100%" }}
                                                />
                                            </Link>
                                        </Tooltip>
                                    </HStack>
                                    <ShowExtensions extension_flag={collection.token_extensions} />
                                    {collection.keys[CollectionKeys.MintAddress].equals(WRAPPED_SOL) && (
                                        <HStack spacing={4} mt={-3} w="100%" className={styles.eachField} justify={"center"}>
                                            <div
                                                className={`${styles.textLabel} font-face-kg mt-1`}
                                                style={{ minWidth: sm ? "80px" : "80px" }}
                                            >
                                                Wrap {Config.token}:
                                            </div>
                                            <HStack>
                                                <Switch
                                                    py={2}
                                                    size={lg ? "md" : "md"}
                                                    isChecked={wrapSOL === 1}
                                                    onChange={() => setWrapSOL(wrapSOL === 0 ? 1 : 0)}
                                                />
                                                <Tooltip
                                                    label={"Program will wrap the W" + Config.token + " token for you"}
                                                    hasArrow
                                                    w={270}
                                                    fontSize="large"
                                                    offset={[0, 10]}
                                                >
                                                    <Image width={25} height={25} src="/images/help.png" alt="Help" />
                                                </Tooltip>
                                            </HStack>
                                        </HStack>
                                    )}
                                </VStack>
                                <VStack pb={whitelistMint && 6}>
                                    {whitelistMint &&
                                        collectionPlugins.whitelistPhaseEnd &&
                                        (collectionPlugins.whitelistPhaseEnd.getTime() === 0 ||
                                            new Date().getTime() < collectionPlugins.whitelistPhaseEnd.getTime()) && (
                                            <VStack my={3}>
                                                <Text align="center" m={0} color={"white"} fontFamily="ReemKufiRegular">
                                                    Whitelist Token Required: <br />{" "}
                                                </Text>
                                                <HStack justifyContent="center">
                                                    <Text color={"white"} fontFamily="ReemKufiRegular" mb={0}>
                                                        CA: {trimAddress(whitelistMint.mint.address.toString())}
                                                    </Text>
                                                    <Tooltip label="View in explorer" hasArrow fontSize="large" offset={[0, 10]}>
                                                        <Link
                                                            href={getSolscanLink(whitelistMint.mint.address, "Token")}
                                                            target="_blank"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Image
                                                                src="/images/solscan.png"
                                                                width={lg ? 22 : 22}
                                                                height={lg ? 22 : 22}
                                                                alt="Solscan icon"
                                                            />
                                                        </Link>
                                                    </Tooltip>
                                                </HStack>
                                                {collectionPlugins.whitelistPhaseEnd &&
                                                    Math.floor(collectionPlugins.whitelistPhaseEnd.getTime() / 1000) > 0 &&
                                                    new Date().getTime() < collectionPlugins.whitelistPhaseEnd.getTime() && (
                                                        <Text align="center" mb={0} opacity="50%" color={"white"}>
                                                            Until: {collectionPlugins.whitelistPhaseEnd.toLocaleString()}
                                                        </Text>
                                                    )}
                                            </VStack>
                                        )}
                                    <VStack
                                        my="auto"
                                        h="100%"
                                        borderRadius={12}
                                        p={4}
                                        align="center"
                                        w={350}
                                        style={{ background: "rgba(0, 0, 0, 0.2)" }}
                                        boxShadow="0px 5px 15px 0px rgba(0,0,0,0.3)"
                                        gap={0}
                                    >
                                        <Text align={sm ? "center" : "start"} className="font-face-kg" color={"white"} fontSize="x-large">
                                            Collection Wrap
                                        </Text>

                                        <HStack align="center" mb={4}>
                                            <Text m={0} color="white" fontSize="medium" fontWeight="semibold">
                                                {!isTokenToNFT
                                                    ? `1 NFT = ${formatPrice(outAmount, 3)} ${collection.token_symbol}`
                                                    : `${formatPrice(
                                                          bignum_to_num(collection.swap_price) / Math.pow(10, collection.token_decimals),
                                                          3,
                                                      )} ${collection.token_symbol} = 1 NFT`}
                                            </Text>
                                            <Tooltip label="With 2% Transfer Tax" hasArrow fontSize="medium" offset={[0, 10]}>
                                                <Image width={20} height={20} src="/images/help.png" alt="Help" />
                                            </Tooltip>
                                        </HStack>

                                        <Flex w="100%" align="center" gap={3} flexDirection={isTokenToNFT ? "column" : "column-reverse"}>
                                            <VStack w="100%">
                                                <HStack w="100%" justifyContent="space-between">
                                                    <Text
                                                        m={0}
                                                        color={"white"}
                                                        fontFamily="ReemKufiRegular"
                                                        fontSize={"medium"}
                                                        opacity={0.5}
                                                    >
                                                        {isTokenToNFT ? "You're Paying" : "To Receive"}
                                                    </Text>

                                                    <HStack gap={1} opacity={0.5}>
                                                        <FaWallet size={12} color="white" />
                                                        <Text
                                                            pl={0.5}
                                                            m={0}
                                                            color={"white"}
                                                            fontFamily="ReemKufiRegular"
                                                            fontSize={"medium"}
                                                        >
                                                            {(wrapSOL ? userSOLBalance : tokenBalance).toLocaleString()}
                                                        </Text>
                                                        <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"}>
                                                            {collection.token_symbol}
                                                        </Text>
                                                    </HStack>
                                                </HStack>
                                                <InputGroup size="md">
                                                    <Input
                                                        color="white"
                                                        size="lg"
                                                        borderColor="rgba(134, 142, 150, 0.5)"
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
                                                        type="number"
                                                        min="0"
                                                    />
                                                    <InputRightElement h="100%" w={50}>
                                                        <Image
                                                            src={tokenMint.icon}
                                                            width={30}
                                                            height={30}
                                                            alt="SOL Icon"
                                                            style={{ borderRadius: "100%" }}
                                                        />
                                                    </InputRightElement>
                                                </InputGroup>
                                            </VStack>

                                            {!collectionPlugins.mintOnly && (
                                                <LuArrowUpDown
                                                    size={24}
                                                    color="white"
                                                    style={{ marginTop: "12px", cursor: "pointer" }}
                                                    onClick={() => setIsTokenToNFT(!isTokenToNFT)}
                                                />
                                            )}

                                            <VStack w="100%">
                                                <HStack w="100%" justifyContent="space-between">
                                                    <Text
                                                        m={0}
                                                        color={"white"}
                                                        fontFamily="ReemKufiRegular"
                                                        fontSize={"medium"}
                                                        opacity={0.5}
                                                    >
                                                        {isTokenToNFT ? "To Receive" : "You're Paying"}
                                                    </Text>

                                                    <HStack gap={1} opacity={0.5}>
                                                        <FaWallet size={12} color="white" />
                                                        <Text
                                                            pl={0.5}
                                                            m={0}
                                                            color={"white"}
                                                            fontFamily="ReemKufiRegular"
                                                            fontSize={"medium"}
                                                        >
                                                            {nftBalance + userListedNFTs.length}
                                                        </Text>
                                                        <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"}>
                                                            {collection.collection_symbol}
                                                        </Text>
                                                    </HStack>
                                                </HStack>
                                                <InputGroup size="md">
                                                    <Input
                                                        color="white"
                                                        size="lg"
                                                        borderColor="rgba(134, 142, 150, 0.5)"
                                                        value={1}
                                                        onChange={(e) => {
                                                            setNFTAmount(
                                                                !isNaN(parseFloat(e.target.value)) || e.target.value === ""
                                                                    ? parseFloat(e.target.value)
                                                                    : nftAmount,
                                                            );
                                                        }}
                                                        disabled={true}
                                                        type="number"
                                                        min="0"
                                                    />
                                                    <InputRightElement h="100%" w={50}>
                                                        <Image
                                                            src={collection.collection_icon_url}
                                                            width={30}
                                                            height={30}
                                                            alt="SOL Icon"
                                                            style={{ borderRadius: "100%" }}
                                                        />
                                                    </InputRightElement>
                                                </InputGroup>
                                            </VStack>
                                        </Flex>

                                        {wallet.connected ? (
                                            <VStack spacing={3} w="100%">
                                                {isTokenToNFT ? (
                                                    <HStack w="100%">
                                                        {assignmentData === null || assignmentData.status > 0 ? (
                                                            <Tooltip
                                                                label={
                                                                    enoughTokenBalance == false
                                                                        ? "You don't have enough token balance"
                                                                        : hasEnoughWhitelistToken == false &&
                                                                          "You don't have WhiteList token balance"
                                                                }
                                                                hasArrow
                                                                offset={[0, 10]}
                                                                isDisabled={enoughTokenBalance && hasEnoughWhitelistToken}
                                                            >
                                                                <Button
                                                                    w="100%"
                                                                    mt={3}
                                                                    onClick={() => {
                                                                        if (!wallet.connected) {
                                                                            handleConnectWallet();
                                                                        }

                                                                        if (wallet.connected && enoughTokenBalance) {
                                                                            ClaimNFT();
                                                                        }
                                                                    }}
                                                                    isLoading={isLoading}
                                                                    isDisabled={
                                                                        enoughTokenBalance == false ||
                                                                        hasEnoughWhitelistToken == false ||
                                                                        isLoading
                                                                    }
                                                                >
                                                                    Confirm {collectionPlugins.probability}
                                                                </Button>
                                                            </Tooltip>
                                                        ) : (
                                                            <Button
                                                                w="100%"
                                                                mt={3}
                                                                onClick={() => {
                                                                    if (collection.collection_meta["__kind"] === "RandomFixedSupply") {
                                                                        openAssetModal();
                                                                        MintNFT();
                                                                    }
                                                                    if (collection.collection_meta["__kind"] === "RandomUnlimited") {
                                                                        openAssetModal();
                                                                        MintRandom();
                                                                    }
                                                                }}
                                                                isLoading={isLoading}
                                                                disabled={isLoading}
                                                            >
                                                                Confirm {collectionPlugins.probability}
                                                            </Button>
                                                        )}
                                                    </HStack>
                                                ) : (
                                                    <Tooltip
                                                        label={`You don't have ${collection.collection_name} NFTs`}
                                                        hasArrow
                                                        offset={[0, 10]}
                                                        isDisabled={nftBalance > 0 || isLoading}
                                                    >
                                                        <Button
                                                            w="100%"
                                                            mt={3}
                                                            onClick={() => {
                                                                if (wallet.connected) {
                                                                    WrapNFT(null);
                                                                    checkNFTBalance.current = true;
                                                                } else {
                                                                    handleConnectWallet();
                                                                }
                                                            }}
                                                            isLoading={isWrapLoading}
                                                            isDisabled={nftBalance <= 0 || isLoading}
                                                        >
                                                            Confirm
                                                        </Button>
                                                    </Tooltip>
                                                )}
                                            </VStack>
                                        ) : (
                                            <Button w="100%" mt={3} onClick={() => handleConnectWallet()}>
                                                Connect your wallet
                                            </Button>
                                        )}
                                    </VStack>
                                </VStack>
                                <VStack minW={220}>
                                    <Image
                                        src={collection.collection_icon_url}
                                        width={180}
                                        height={180}
                                        alt="Image Frame"
                                        style={{ backgroundSize: "cover", borderRadius: 12 }}
                                    />
                                    <Text mt={1} mb={0} color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                        {collection.collection_name}
                                    </Text>
                                    <HStack spacing={2} align="start" justify="start">
                                        <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"large"}>
                                            CA: {trimAddress(collection.keys[CollectionKeys.CollectionMint].toString())}
                                        </Text>

                                        <Tooltip label="Copy Contract Address" hasArrow fontSize="large" offset={[0, 10]}>
                                            <div
                                                style={{ cursor: "pointer" }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    navigator.clipboard.writeText(
                                                        collection && collection.keys && collection.keys[CollectionKeys.CollectionMint]
                                                            ? collection.keys[CollectionKeys.CollectionMint].toString()
                                                            : "",
                                                    );
                                                }}
                                            >
                                                <MdOutlineContentCopy color="white" size={lg ? 22 : 22} />
                                            </div>
                                        </Tooltip>

                                        <Tooltip label="View in explorer" hasArrow fontSize="large" offset={[0, 10]}>
                                            <Link
                                                href={getSolscanLink(collection.keys[CollectionKeys.CollectionMint], "Collection")}
                                                target="_blank"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Image
                                                    src="/images/solscan.png"
                                                    width={lg ? 22 : 22}
                                                    height={lg ? 22 : 22}
                                                    alt="Solscan icon"
                                                />
                                            </Link>
                                        </Tooltip>
                                    </HStack>
                                    <ShowExtensions extension_flag={collection.flags[LaunchFlags.Extensions]} />
                                </VStack>
                            </Flex>

                            <VStack mt={5} spacing={0} w="100%" style={{ position: "relative" }}>
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
                                        max={collection.total_supply}
                                        value={collection.num_available}
                                        boxShadow="0px 5px 15px 0px rgba(0,0,0,0.6) inset"
                                    />
                                    <HStack style={{ position: "absolute", zIndex: 1 }}>
                                        <HStack justify="center">
                                            <Text m="0" color="black" fontSize={sm ? "medium" : "large"} fontFamily="ReemKufiRegular">
                                                {progress_string}
                                            </Text>
                                        </HStack>
                                    </HStack>
                                </HStack>
                            </VStack>
                        </VStack>
                    </div>
                )}

                {selected === "My NFTs" && (
                    <div style={{ padding: "16px" }}>
                        <VStack
                            p={md ? 22 : 50}
                            bg="rgba(225, 225, 225, 0.20)"
                            borderRadius={12}
                            border="1px solid white"
                            h="fit-content"
                            justifyContent="space-between"
                        >
                            <MyNFTsPanel
                                ownedNFTs={ownedAssets}
                                listedNFTs={listedNFTs}
                                allListings={[...(collectionPlugins?.listings || []), ...(listedAssets || [])]}
                                collection={collection}
                            />
                        </VStack>
                    </div>
                )}

                {selected == "Marketplace" && (
                    <div style={{ padding: "16px" }}>
                        <VStack
                            p={md ? 22 : 50}
                            bg="rgba(225, 225, 225, 0.20)"
                            borderRadius={12}
                            border="1px solid white"
                            h="fit-content"
                            justifyContent="space-between"
                        >
                            <Marketplace
                                ownedNFTs={ownedAssets}
                                listedNFTs={listedNFTs}
                                allListings={[...(collectionPlugins?.listings || []), ...(listedAssets || [])]}
                                collection={collection}
                                tab={selected}
                            />
                        </VStack>
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
            </main>
        </>
    );
};

export default CollectionSwapPage;
