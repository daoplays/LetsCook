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
} from "@chakra-ui/react";
import { Key, getAssetV1GpaBuilder, updateAuthority, AssetV1, fetchAssetV1, deserializeAssetV1 } from "@metaplex-foundation/mpl-core";
import type { RpcAccount, PublicKey as umiKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import { bignum_to_num, TokenAccount, request_token_amount, request_raw_account_data, MintData } from "../../components/Solana/state";
import { useRef, useEffect, useCallback, useState } from "react";
import { useWallet, useConnection, WalletContextState } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import Image from "next/image";
import useResponsive from "../../hooks/useResponsive";
import UseWalletConnection from "../../hooks/useWallet";
import FeaturedBanner from "../../components/featuredBanner";
import Head from "next/head";
import { MdOutlineContentCopy } from "react-icons/md";
import trimAddress from "../../utils/trimAddress";
import useAppRoot from "../../context/useAppRoot";
import { AssignmentData, CollectionData, request_assignment_data } from "../../components/collection/collectionState";
import PageNotFound from "../../components/pageNotFound";
import Loader from "../../components/loader";
import CollectionFeaturedBanner from "../../components/collectionFeaturedBanner";
import useClaimNFT from "../../hooks/collections/useClaimNFT";
import { CollectionKeys, Config, PROGRAM, Extensions, LaunchFlags, LaunchKeys, SYSTEM_KEY } from "../../components/Solana/constants";
import { PublicKey, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";
import useWrapNFT from "../../hooks/collections/useWrapNFT";
import useMintNFT from "../../hooks/collections/useMintNFT";
import useMintRandom from "../../hooks/collections/useMintRandom";
import ShowExtensions from "../../components/Solana/extensions";
import { unpackMint, Mint, unpackAccount, getTransferFeeConfig, getAssociatedTokenAddressSync, calculateFee } from "@solana/spl-token";
import { getSolscanLink } from "../../utils/getSolscanLink";
import { LuArrowUpDown } from "react-icons/lu";
import { FaWallet } from "react-icons/fa";
import { ReceivedAssetModal, ReceivedAssetModalStyle } from "../../components/Solana/modals";
import { findCollection } from "../../components/collection/utils";
import BN from "bn.js";

export interface AssetWithMetadata {
    asset: AssetV1;
    metadata: any;
}

export const check_nft_balance = async (launch_key: PublicKey, wallet: WalletContextState, setOwnedAssets: any, setNFTBalance: any) => {
    if (launch_key === null || wallet === null || wallet.publicKey === null) return;

    console.log("CHECKING NFT BALANCE");

    const umi = createUmi(Config.RPC_NODE, "confirmed");

    let collection_umiKey = publicKey(launch_key.toString());

    const assets = await getAssetV1GpaBuilder(umi)
        .whereField("key", Key.AssetV1)
        .whereField("updateAuthority", updateAuthority("Collection", [collection_umiKey]))
        .getDeserialized();

    console.log(assets);
    let valid_lookups = 0;
    let owned_assets: AssetWithMetadata[] = [];
    for (let i = 0; i < assets.length; i++) {
        if (assets[i].owner.toString() === wallet.publicKey.toString()) {
            valid_lookups += 1;
            let uri_json = await fetch(assets[i].uri).then((res) => res.json());
            let entry: AssetWithMetadata = { asset: assets[i], metadata: uri_json };
            owned_assets.push(entry);
        }
    }
    console.log("have ", valid_lookups, "addresses with balance");

    setOwnedAssets(owned_assets);
    setNFTBalance(valid_lookups);
};

const CollectionSwapPage = () => {
    const wallet = useWallet();
    const { connection } = useConnection();
    const router = useRouter();
    const { pageName } = router.query;
    const { xs, sm, md, lg, xl } = useResponsive();
    const { handleConnectWallet } = UseWalletConnection();
    const { collectionList, mintData } = useAppRoot();
    const [launch, setCollectionData] = useState<CollectionData | null>(null);
    const [assigned_nft, setAssignedNFT] = useState<AssignmentData | null>(null);
    const [out_amount, setOutAmount] = useState<number>(0);
    const [nft_balance, setNFTBalance] = useState<number>(0);
    const [token_balance, setTokenBalance] = useState<number>(0);
    const [owned_assets, setOwnedAssets] = useState<AssetWithMetadata[]>([]);

    const [WLEndDate, setWLEndDate] = useState<Date>();

    const [token_amount, setTokenAmount] = useState<number>(0);
    const [nft_amount, setNFTAmount] = useState<number>(0);
    const [isTokenToNFT, setIsTokenToNFT] = useState(false);

    const collection_key = useRef<PublicKey | null>(null);

    const launch_account_ws_id = useRef<number | null>(null);
    const nft_account_ws_id = useRef<number | null>(null);
    const user_token_ws_id = useRef<number | null>(null);

    const mint_nft = useRef<boolean>(false);
    const check_initial_assignment = useRef<boolean>(true);
    const check_initial_collection = useRef<boolean>(true);
    const check_initial_nft_balance = useRef<boolean>(true);

    const asset_received = useRef<AssetV1 | null>(null);
    const asset_image = useRef<string | null>(null);

    const [white_list, setWhiteList] = useState<MintData | null>(null);

    const { isOpen: isAssetModalOpen, onOpen: openAssetModal, onClose: closeAssetModal } = useDisclosure();

    const { MintNFT, isLoading: isMintLoading } = useMintNFT(launch);
    const { WrapNFT, isLoading: isWrapLoading } = useWrapNFT(launch);

    const { MintRandom, isLoading: isMintRandomLoading } = useMintRandom(launch);
    const { ClaimNFT, isLoading: isClaimLoading, OraoRandoms, setOraoRandoms } = useClaimNFT(launch);

    let isLoading = isClaimLoading || isMintRandomLoading || isWrapLoading || isMintLoading;

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
        if (collectionList === null || mintData === null) return;

        let launch = collectionList.get(pageName.toString());

        if (launch === null) return;

        console.log("other set collection", launch);

        if (check_initial_collection.current) {
            setCollectionData(launch);
            collection_key.current = launch.keys[CollectionKeys.CollectionMint];
            check_initial_collection.current = false;
        }

        let mint = mintData.get(launch.keys[CollectionKeys.MintAddress].toString());
        let transfer_fee_config = getTransferFeeConfig(mint.mint);
        let input_fee =
            transfer_fee_config === null ? 0 : Number(calculateFee(transfer_fee_config.newerTransferFee, BigInt(launch.swap_price)));
        let swap_price = bignum_to_num(launch.swap_price);

        let input_amount = swap_price - input_fee;

        let swap_fee = Math.floor((input_amount * launch.swap_fee) / 100 / 100);

        let output = input_amount - swap_fee;

        let output_fee = transfer_fee_config === null ? 0 : Number(calculateFee(transfer_fee_config.newerTransferFee, BigInt(output)));

        let final_output = output - output_fee;

        //console.log("actual input amount was",  input_fee, input_amount,  "fee",  swap_fee,  "output", output, "output fee", output_fee, "final output", final_output);
        setOutAmount(final_output / Math.pow(10, launch.token_decimals));

        // check relevant plugins
        console.log("checking plugins");
        for (let i = 0; i < launch.plugins.length; i++) {
            if (launch.plugins[i]["__kind"] === "Whitelist") {
                let whitelist_key = launch.plugins[i]["key"];
                console.log("whitelist key", whitelist_key.toString(), mintData.get(whitelist_key.toString()));
                setWhiteList(mintData.get(whitelist_key.toString()));
                console.log("phase end", new Date(bignum_to_num(launch.plugins[i]["phase_end"])).toDateString());
                console.log();
            }
        }
    }, [collectionList, pageName, mintData, wallet]);

    // when page unloads unsub from any active websocket listeners

    useEffect(() => {
        return () => {
            console.log("in use effect return");
            const unsub = async () => {
                if (launch_account_ws_id.current !== null) {
                    await connection.removeAccountChangeListener(launch_account_ws_id.current);
                    launch_account_ws_id.current = null;
                }
                if (nft_account_ws_id.current !== null) {
                    await connection.removeAccountChangeListener(nft_account_ws_id.current);
                    nft_account_ws_id.current = null;
                }
            };
            unsub();
        };
    }, [connection]);

    useEffect(() => {
        if (!mint_nft.current) return;

        if (OraoRandoms.length === 0) return;

        openAssetModal();

        mint_nft.current = false;
    }, [OraoRandoms, openAssetModal]);

    const check_launch_update = useCallback(async (result: any) => {
        //console.log("collection", result);
        // if we have a subscription field check against ws_id

        let event_data = result.data;

        //console.log("have collection data", event_data, launch_account_ws_id.current);
        let account_data = Buffer.from(event_data, "base64");

        const [updated_data] = CollectionData.struct.deserialize(account_data);

        setCollectionData(updated_data);
    }, []);

    const check_assignment_update = useCallback(
        async (result: any) => {
            //console.log("assignment", result);
            // if we have a subscription field check against ws_id

            let event_data = result.data;

            //console.log("have assignment data", event_data);
            let account_data = Buffer.from(event_data, "base64");

            if (account_data.length === 0) {
                //console.log("account deleted");
                setAssignedNFT(null);
                mint_nft.current = false;
                return;
            }

            const [updated_data] = AssignmentData.struct.deserialize(account_data);

            console.log("in check assignment", updated_data, updated_data.nft_address.toString());
            if (assigned_nft !== null && updated_data.num_interations === assigned_nft.num_interations) {
                return;
            }

            if (updated_data.status < 2) {
                asset_received.current = null;
                asset_image.current = null;
            } else {
                let nft_index = updated_data.nft_index;
                let json_url = launch.nft_meta_url + nft_index + ".json";
                console.log(json_url);
                let uri_json = await fetch(json_url).then((res) => res.json());
                asset_image.current = uri_json;

                try {
                    const umi = createUmi(Config.RPC_NODE, "confirmed");

                    let asset_umiKey = publicKey(updated_data.nft_address.toString());
                    const myAccount = await umi.rpc.getAccount(asset_umiKey);

                    if (myAccount.exists) {
                        let asset = await deserializeAssetV1(myAccount as RpcAccount);
                        console.log("new asset", asset);
                        asset_received.current = asset;
                        let uri_json = await fetch(asset.uri).then((res) => res.json());
                        asset_image.current = uri_json;
                    } else {
                        asset_received.current = null;
                    }

                    check_nft_balance(collection_key.current, wallet, setOwnedAssets, setNFTBalance);
                } catch (error) {
                    asset_received.current = null;
                }
            }

            //console.log(updated_data);
            mint_nft.current = true;
            setAssignedNFT(updated_data);
        },
        [launch, assigned_nft, wallet, setOwnedAssets, setNFTBalance],
    );

    const check_user_token_update = useCallback(
        async (result: any) => {
            //console.log(result);
            // if we have a subscription field check against ws_id

            let event_data = result.data;
            const [token_account] = TokenAccount.struct.deserialize(event_data);
            let amount = bignum_to_num(token_account.amount);
            // console.log("update quote amount", amount);

            setTokenBalance(amount / Math.pow(10, launch.token_decimals));
        },
        [launch],
    );

    const get_assignment_data = useCallback(async () => {
        console.log("get assignment data", launch === null, mintData === null);
        if (launch === null || mintData === null) return;

        if (!check_initial_assignment.current) {
            return;
        }

        let mint = mintData.get(launch.keys[CollectionKeys.MintAddress].toString());

        let user_token_account_key = getAssociatedTokenAddressSync(
            launch.keys[CollectionKeys.MintAddress], // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            mint.token_program,
        );

        let user_amount = await request_token_amount("", user_token_account_key);
        console.log("set token balance in GAD", user_amount / Math.pow(10, launch.token_decimals));
        setTokenBalance(user_amount / Math.pow(10, launch.token_decimals));

        let nft_assignment_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), launch.keys[CollectionKeys.CollectionMint].toBytes(), Buffer.from("assignment")],
            PROGRAM,
        )[0];

        let assignment_data = await request_assignment_data(nft_assignment_account);

        ///generate_random_f64(bytes);
        check_initial_assignment.current = false;
        if (assignment_data === null) {
            return;
        }

        if (!assignment_data.random_address.equals(SYSTEM_KEY) && assignment_data.status == 0) {
            let orao_data = await request_raw_account_data("", assignment_data.random_address);
            let orao_randomness: number[] = Array.from(orao_data.slice(8 + 32, 8 + 32 + 64));

            let valid = false;
            for (let i = 0; i < orao_randomness.length; i++) {
                if (orao_randomness[i] != 0) {
                    valid = true;
                    break;
                }
            }
            if (valid) {
                mint_nft.current = true;
                setOraoRandoms(orao_randomness);
            }
        }

        console.log(assignment_data);
        setAssignedNFT(assignment_data);
    }, [launch, wallet, mintData, setOraoRandoms]);

    useEffect(() => {
        if (launch === null) return;

        if (launch_account_ws_id.current === null) {
            console.log("subscribe 1");
            let launch_data_account = PublicKey.findProgramAddressSync(
                [Buffer.from(launch.page_name), Buffer.from("Collection")],
                PROGRAM,
            )[0];

            launch_account_ws_id.current = connection.onAccountChange(launch_data_account, check_launch_update, "confirmed");
        }

        if (wallet === null || wallet.publicKey === null || mintData === null) {
            return;
        }

        let mint = mintData.get(launch.keys[CollectionKeys.MintAddress].toString());

        if (nft_account_ws_id.current === null) {
            console.log("subscribe 2");
            let nft_assignment_account = PublicKey.findProgramAddressSync(
                [wallet.publicKey.toBytes(), launch.keys[CollectionKeys.CollectionMint].toBytes(), Buffer.from("assignment")],
                PROGRAM,
            )[0];
            nft_account_ws_id.current = connection.onAccountChange(nft_assignment_account, check_assignment_update, "confirmed");
        }

        if (user_token_ws_id.current === null) {
            let user_token_account_key = getAssociatedTokenAddressSync(
                launch.keys[CollectionKeys.MintAddress], // mint
                wallet.publicKey, // owner
                true, // allow owner off curve
                mint.token_program,
            );
            user_token_ws_id.current = connection.onAccountChange(user_token_account_key, check_user_token_update, "confirmed");
        }
    }, [wallet, connection, launch, mintData, check_launch_update, check_assignment_update, check_user_token_update]);

    useEffect(() => {
        if (launch === null) return;

        if (wallet === null || wallet.publicKey === null) {
            return;
        }

        if (check_initial_assignment.current) {
            get_assignment_data();
        }

        if (check_initial_nft_balance.current) {
            check_nft_balance(collection_key.current, wallet, setOwnedAssets, setNFTBalance);
            check_initial_nft_balance.current = false;
        }
    }, [launch, wallet, get_assignment_data, setOwnedAssets, setNFTBalance]);

    if (!pageName) return;

    if (launch === null) return <Loader />;

    if (!launch) return <PageNotFound />;

    const enoughTokenBalance = token_balance >= bignum_to_num(launch.swap_price);

    let progress_string = "";
    if (launch.collection_meta["__kind"] === "RandomFixedSupply") {
        progress_string = launch.num_available.toString() + " / " + launch.total_supply.toString();
    }
    if (launch.collection_meta["__kind"] === "RandomUnlimited") {
        progress_string = "Unlimited";
    }

    const { prob_string, mint_only, wl_end_date } = launch.plugins.reduce(
        (acc, plugin) => {
            switch (plugin["__kind"]) {
                case "MintProbability":
                    acc.prob_string = `(${plugin["mint_prob"]}% mint chance)`;
                    break;
                case "MintOnly":
                    acc.mint_only = true;
                    // Need to set isTokenToNFT to true to make it token to NFT only
                    // setIsTokenToNFT(true); infinite loop re render (to fix)
                    break;
                case "Whitelist":
                    console.log("setting whitelist phase end to ", bignum_to_num(plugin["phase_end"]));
                    acc.wl_end_date = new Date(bignum_to_num(plugin["phase_end"]));
                    break;
                default:
                    break;
            }
            return acc;
        },
        { prob_string: "", mint_only: false, wl_end_date: null },
    );

    console.log(token_balance);
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
                        h="fit-content"
                        justifyContent="space-between"
                    >
                        <Flex gap={lg ? 12 : 24} direction={lg ? "column" : "row"} alignItems={"center"}>
                            <VStack minW={220}>
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
                                <HStack spacing={2} align="start" justify="start">
                                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"large"}>
                                        CA: {trimAddress(launch.keys[CollectionKeys.CollectionMint].toString())}
                                    </Text>

                                    <Tooltip label="Copy Contract Address" hasArrow fontSize="large" offset={[0, 10]}>
                                        <div
                                            style={{ cursor: "pointer" }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navigator.clipboard.writeText(
                                                    launch && launch.keys && launch.keys[CollectionKeys.CollectionMint]
                                                        ? launch.keys[CollectionKeys.CollectionMint].toString()
                                                        : "",
                                                );
                                            }}
                                        >
                                            <MdOutlineContentCopy color="white" size={lg ? 22 : 22} />
                                        </div>
                                    </Tooltip>

                                    <Tooltip label="View in explorer" hasArrow fontSize="large" offset={[0, 10]}>
                                        <Link
                                            href={getSolscanLink(launch.keys[CollectionKeys.CollectionMint], "Collection")}
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
                                <ShowExtensions extension_flag={launch.flags[LaunchFlags.Extensions]} />
                            </VStack>

                            <VStack pb={wl_end_date && 12}>
                                {white_list && wl_end_date && (
                                    <VStack mt={3}>
                                        <Text align="center" m={0} color={"white"} fontFamily="ReemKufiRegular">
                                            Whitelist Token Required: <br />{" "}
                                            <HStack>
                                                <Link href="#" target="_blank">
                                                    CA: {trimAddress(white_list.mint.address.toString()) }
                                                </Link>
                                                <Tooltip label="View in explorer" hasArrow fontSize="large" offset={[0, 10]}>
                                                    <Link
                                                        href={getSolscanLink(white_list.mint.address, "Token")}
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
                                        </Text>
                                        <Text align="center" mb={0} color={"white"} fontFamily="ReemKufiRegular" opacity="50%">
                                            Until: {wl_end_date.toLocaleString()}
                                        </Text>
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
                                        Hybrid Wrap
                                    </Text>

                                    <HStack align="center" mb={4}>
                                        <Text m={0} color="white" fontSize="medium" fontWeight="semibold">
                                            ~
                                            {!isTokenToNFT
                                                ? `1 NFT = ${out_amount.toLocaleString()} ${launch.token_symbol}`
                                                : `${(
                                                      bignum_to_num(launch.swap_price) / Math.pow(10, launch.token_decimals)
                                                  ).toLocaleString()} ${launch.token_symbol} = 1 NFT`}
                                        </Text>
                                        <Tooltip label="With 2% Transfer Tax" hasArrow fontSize="medium" offset={[0, 10]}>
                                            <Image width={20} height={20} src="/images/help.png" alt="Help" />
                                        </Tooltip>
                                    </HStack>

                                    <Flex w="100%" align="center" gap={3} flexDirection={isTokenToNFT ? "column" : "column-reverse"}>
                                        <VStack w="100%">
                                            <HStack w="100%" justifyContent="space-between">
                                                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                                                    {isTokenToNFT ? "You're Paying" : "To Receive"}
                                                </Text>

                                                <HStack gap={1} opacity={0.5}>
                                                    <FaWallet size={12} color="white" />
                                                    <Text pl={0.5} m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"}>
                                                        {token_balance.toLocaleString()}
                                                    </Text>
                                                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"}>
                                                        {launch.token_symbol}
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
                                                            ? (
                                                                  bignum_to_num(launch.swap_price) / Math.pow(10, launch.token_decimals)
                                                              ).toLocaleString()
                                                            : out_amount.toLocaleString()
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
                                                        src={launch.token_icon_url}
                                                        width={30}
                                                        height={30}
                                                        alt="SOL Icon"
                                                        style={{ borderRadius: "100%" }}
                                                    />
                                                </InputRightElement>
                                            </InputGroup>
                                        </VStack>

                                        {!mint_only && (
                                            <LuArrowUpDown
                                                size={24}
                                                color="white"
                                                style={{ marginTop: "12px", cursor: "pointer" }}
                                                onClick={() => setIsTokenToNFT(!isTokenToNFT)}
                                            />
                                        )}

                                        <VStack w="100%">
                                            <HStack w="100%" justifyContent="space-between">
                                                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                                                    {isTokenToNFT ? "To Receive" : "You're Paying"}
                                                </Text>

                                                <HStack gap={1} opacity={0.5}>
                                                    <FaWallet size={12} color="white" />
                                                    <Text pl={0.5} m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"}>
                                                        {nft_balance}
                                                    </Text>
                                                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"}>
                                                        {launch.collection_symbol}
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
                                                                : nft_amount,
                                                        );
                                                    }}
                                                    disabled={true}
                                                    type="number"
                                                    min="0"
                                                />
                                                <InputRightElement h="100%" w={50}>
                                                    <Image
                                                        src={launch.collection_icon_url}
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
                                                    {assigned_nft === null || assigned_nft.status > 0 ? (
                                                        <Tooltip
                                                            label="You don't have enough token balance"
                                                            hasArrow
                                                            offset={[0, 10]}
                                                            isDisabled={enoughTokenBalance}
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
                                                                isDisabled={!enoughTokenBalance || isLoading}
                                                            >
                                                                Confirm {prob_string}
                                                            </Button>
                                                        </Tooltip>
                                                    ) : (
                                                        <Button
                                                            w="100%"
                                                            mt={3}
                                                            onClick={() => {
                                                                if (launch.collection_meta["__kind"] === "RandomFixedSupply") {
                                                                    openAssetModal();
                                                                    MintNFT();
                                                                }
                                                                if (launch.collection_meta["__kind"] === "RandomUnlimited") {
                                                                    openAssetModal();
                                                                    MintRandom();
                                                                }
                                                            }}
                                                            isLoading={isLoading}
                                                        >
                                                            Check
                                                        </Button>
                                                    )}
                                                </HStack>
                                            ) : (
                                                <Tooltip
                                                    label={`You don't have ${launch.collection_name} NFTs`}
                                                    hasArrow
                                                    offset={[0, 10]}
                                                    isDisabled={nft_balance > 0 || isLoading}
                                                >
                                                    <Button
                                                        w="100%"
                                                        mt={3}
                                                        onClick={() => {
                                                            if (wallet.connected) {
                                                                WrapNFT(null);
                                                            } else {
                                                                handleConnectWallet();
                                                            }
                                                        }}
                                                        isLoading={isWrapLoading}
                                                        isDisabled={nft_balance <= 0 || isLoading}
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
                                    src={launch.token_icon_url}
                                    width={180}
                                    height={180}
                                    alt="Image Frame"
                                    style={{ backgroundSize: "cover", borderRadius: 12 }}
                                />
                                <Text mt={1} mb={0} color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                    {launch.token_symbol}
                                </Text>
                                <HStack mb={1} spacing={2} align="start" justify="start">
                                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"large"}>
                                        CA: {trimAddress(launch.keys[CollectionKeys.MintAddress].toString())}
                                    </Text>

                                    <Tooltip label="Copy Contract Address" hasArrow fontSize="large" offset={[0, 10]}>
                                        <div
                                            style={{ cursor: "pointer" }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navigator.clipboard.writeText(launch.keys[CollectionKeys.MintAddress].toString());
                                            }}
                                        >
                                            <MdOutlineContentCopy color="white" size={lg ? 22 : 22} />
                                        </div>
                                    </Tooltip>

                                    <Tooltip label="View in explorer" hasArrow fontSize="large" offset={[0, 10]}>
                                        <Link
                                            href={getSolscanLink(launch.keys[CollectionKeys.MintAddress], "Token")}
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
                                                launch && launch.keys && launch.keys[CollectionKeys.MintAddress]
                                                    ? launch.keys[CollectionKeys.MintAddress].toString()
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
                                <ShowExtensions extension_flag={launch.token_extensions} />
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
                                    max={launch.total_supply}
                                    value={launch.num_available}
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
                <ReceivedAssetModal
                    curated={false}
                    isWarningOpened={isAssetModalOpen}
                    closeWarning={closeAssetModal}
                    assignment_data={assigned_nft}
                    collection={launch}
                    asset={asset_received}
                    asset_image={asset_image}
                    style={modalStyle}
                    isLoading={isLoading}
                />
            </main>
        </>
    );
};

export default CollectionSwapPage;
