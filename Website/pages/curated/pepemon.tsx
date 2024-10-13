import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useResponsive from "../../hooks/useResponsive";
import Head from "next/head";
import Image from "next/image";
import { Flex, VStack, Text, useDisclosure, Button, HStack } from "@chakra-ui/react";
import useMintRandom from "../../hooks/collections/useMintRandom";
import { findCollection } from "../../components/collection/utils";
import useAppRoot from "../../context/useAppRoot";
import { AssignmentData, CollectionData, request_assignment_data } from "../../components/collection/collectionState";
import { useConnection, useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { CollectionKeys, Config, PROGRAM, SYSTEM_KEY } from "../../components/Solana/constants";
import { Key, getAssetV1GpaBuilder, updateAuthority, AssetV1, fetchAssetV1, deserializeAssetV1 } from "@metaplex-foundation/mpl-core";
import type { RpcAccount, PublicKey as umiKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import { ReceivedAssetModal, ReceivedAssetModalStyle } from "../../components/Solana/modals";
import { PublicKey } from "@solana/web3.js";
import { unpackMint, Mint, unpackAccount, getTransferFeeConfig, getAssociatedTokenAddressSync, calculateFee } from "@solana/spl-token";
import { TokenAccount, bignum_to_num, request_raw_account_data, request_token_amount } from "../../components/Solana/state";
import UseWalletConnection from "../../hooks/useWallet";
import { DisconnectWalletButton } from "../../components/Solana/wallet";
import useClaimNFT from "../../hooks/collections/useClaimNFT";
import Loader from "../../components/loader";
import ReleaseModal from "./releaseModal";
import { AssetWithMetadata, check_nft_balance } from "../collection/[pageName]";
import useMintNFT from "../../hooks/collections/useMintNFT";
import useTokenBalance from "../../hooks/data/useTokenBalance";
const soundCollection = {
    success: "/Success.mp3",
    fail: "/Fail.mp3",
    catched: "/Catched.mp3",
    throw: "/Throw.mp3",
    throwing: "/Throwing.mp3",
};

const Pepemon = () => {
    const { xs, sm, md, lg } = useResponsive();
    const wallet = useWallet();
    const { connection } = useConnection();
    const { handleConnectWallet, handleDisconnectWallet } = UseWalletConnection();

    const { collectionList, mintData } = useAppRoot();
    const [launch, setCollectionData] = useState<CollectionData | null>(null);
    const [assigned_nft, setAssignedNFT] = useState<AssignmentData | null>(null);
    const [nft_balance, setNFTBalance] = useState<number>(0);
    const [owned_assets, setOwnedAssets] = useState<AssetWithMetadata[]>([]);

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

    const { isOpen: isAssetModalOpen, onOpen: openAssetModal, onClose: closeAssetModal } = useDisclosure();
    const { isOpen: isReleaseModalOpen, onOpen: openReleaseModal, onClose: closeReleaseModal } = useDisclosure();

    const { MintNFT, isLoading: isMintLoading } = useMintNFT(launch);
    const { MintRandom, isLoading: isMintRandomLoading } = useMintRandom(launch);

    const { ClaimNFT, isLoading: isClaimLoading, OraoRandoms, setOraoRandoms } = useClaimNFT(launch);

    const mintAddress = useMemo(() => {
        return launch?.keys?.[CollectionKeys.MintAddress] || null;
    }, [launch]);

    const { tokenBalance } = useTokenBalance(mintAddress ? { mintAddress } : null);

    let isLoading = isClaimLoading || isMintRandomLoading || isMintLoading;

    const modalStyle: ReceivedAssetModalStyle = {
        check_image: "/curatedLaunches/pepemon/Pepeball.png",
        failed_image: "/curatedLaunches/pepemon/failedPepe.png",
        fontFamily: "pokemon",
        fontColor: "black",
        succsss_h: 620,
        failed_h: 620,
        checking_h: 620,
        success_w: 620,
        failed_w: 450,
        checking_w: 620,
        sm_succsss_h: 570,
        sm_failed_h: 350,
        sm_checking_h: 570,
        sm_success_w: 420,
        sm_failed_w: 350,
        sm_checking_w: 420,
    };

    const sound = (src) => {
        let audio = new Audio(src);
        try {
            audio.volume = 0.5;
            audio.play();
        } catch (error) {
            console.error(`An error occurred: ${error}`);
        }
    };

    useEffect(() => {
        if (collectionList === null) return;

        let launch = collectionList.get("pepemon");

        if (launch === null) return;

        if (check_initial_collection.current) {
            console.log("check intitial cllection");
            setCollectionData(launch);
            collection_key.current = launch.keys[CollectionKeys.CollectionMint];
            check_initial_collection.current = false;
        }
    }, [collectionList]);

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

        mint_nft.current = false;
    }, [OraoRandoms]);

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
            console.log("assignment", result);
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

            // if we are started to wait for randoms then open up the modal
            if (!updated_data.random_address.equals(SYSTEM_KEY)) {
                openAssetModal();
            }

            if (updated_data.status < 2) {
                asset_received.current = null;
                asset_image.current = null;

                sound(soundCollection.fail);
            } else {
                let nft_index = updated_data.nft_index;
                let json_url = launch.nft_meta_url + nft_index + ".json";
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
                        sound(soundCollection.catched);
                    } else {
                        sound(soundCollection.success);
                        asset_received.current = null;
                    }

                    check_nft_balance(collection_key.current, wallet, setOwnedAssets, setNFTBalance, check_initial_nft_balance);
                } catch (error) {
                    asset_received.current = null;
                }
            }

            //console.log(updated_data);
            mint_nft.current = true;
            setAssignedNFT(updated_data);
        },
        [launch, assigned_nft, wallet, setOwnedAssets, setNFTBalance, openAssetModal],
    );

    const get_assignment_data = useCallback(async () => {
        if (launch === null || mintData === null) return;

        if (!check_initial_assignment.current) {
            return;
        }

        let nft_assignment_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), launch.keys[CollectionKeys.CollectionMint].toBytes(), Buffer.from("assignment")],
            PROGRAM,
        )[0];

        let assignment_data = await request_assignment_data(nft_assignment_account);
        //console.log("check assignment", nft_assignment_account.toString(), assignment_data);

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
    }, [launch, mintData, wallet, setOraoRandoms]);

    useEffect(() => {
        if (launch === null || mintData === null) return;

        if (launch_account_ws_id.current === null) {
            console.log("subscribe 1");
            let launch_data_account = PublicKey.findProgramAddressSync(
                [Buffer.from(launch.page_name), Buffer.from("Collection")],
                PROGRAM,
            )[0];

            launch_account_ws_id.current = connection.onAccountChange(launch_data_account, check_launch_update, "confirmed");
        }

        if (wallet === null || wallet.publicKey === null) {
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
    }, [wallet, connection, launch, mintData, check_launch_update, check_assignment_update]);

    useEffect(() => {
        if (launch === null) return;

        if (wallet === null || wallet.publicKey === null) {
            return;
        }

        if (check_initial_assignment.current) {
            get_assignment_data();
        }

        check_nft_balance(collection_key.current, wallet, setOwnedAssets, setNFTBalance, check_initial_nft_balance);
    }, [launch, wallet, get_assignment_data, setOwnedAssets, setNFTBalance]);

    const tiltShaking = `@keyframes tilt-shaking {
        0% { transform: translate(0, 0) rotate(0deg); }
        25% { transform: translate(5px, 5px) rotate(5deg); }
        50% { transform: translate(0, 0) rotate(0eg); }
        75% { transform: translate(-5px, 5px) rotate(-5deg); }
        100% { transform: translate(0, 0) rotate(0deg); }
    }`;

    useEffect(() => {
        const styleSheet = document.styleSheets[0];
        styleSheet.insertRule(tiltShaking, styleSheet.cssRules.length);
    }, [tiltShaking]);

    let prob_string = "";

    if (launch) {
        for (let i = 0; i < launch.plugins.length; i++) {
            if (launch.plugins[i]["__kind"] === "MintProbability") {
                prob_string = `${launch.plugins[i]["mint_prob"].toString()}%`;
                //console.log("Have mint prob", prob_string);
            }
        }
    }

    useEffect(() => {
        let soundInterval;
        if (isLoading) {
            soundInterval = setInterval(() => {
                sound(soundCollection.throwing);
            }, 1000);
        } else {
            clearInterval(soundInterval);
        }

        return () => {
            clearInterval(soundInterval);
        };
    }, [isLoading]);

    if (launch === null) return <Loader />;

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Pepemon</title>
            </Head>
            <main
                style={{
                    height: "100%",
                    background: 'url("/curatedLaunches/pepemon/BG.png")',
                    backgroundSize: "cover",
                    position: "relative",
                }}
            >
                <Flex h="100%" alignItems={"center"} justify={"center"} flexDirection="column">
                    {/* // Page Title  */}
                    <Image
                        src={"/curatedLaunches/pepemon/PageTitle.png"}
                        alt="Pepemon Title"
                        width={800}
                        height={400}
                        style={{ position: "fixed", top: 80, padding: "0px 16x" }}
                    />

                    {/* // Restart Button */}
                    {wallet.connected && (
                        <HStack w="90%" justify={"space-between"} position="fixed" top={md ? 36 : 20} px={xs ? 2 : 16}>
                            <Image
                                src={"/curatedLaunches/pepemon/pc.png"}
                                alt="Pepemon Release"
                                width={70}
                                height={100}
                                onClick={openReleaseModal}
                                style={{ cursor: "pointer" }}
                            />
                            <div
                                style={{
                                    cursor: "pointer",
                                    background: "url(/curatedLaunches/pepemon/horizontal3.png)",
                                    backgroundSize: "cover",
                                    width: md ? "140px" : "160px",
                                    height: md ? "68px" : "80px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                                onClick={async () => await wallet.disconnect()}
                            >
                                <Text m={0} fontWeight={500} fontSize={md ? 28 : 35} className="font-face-pk">
                                    Restart
                                </Text>
                            </div>
                        </HStack>
                    )}

                    <VStack
                        zIndex={2}
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            marginLeft: "auto",
                            marginRight: "auto",
                            marginTop: sm && wallet.connected ? -250 : sm ? -150 : wallet.connected ? -50 : 0,
                        }}
                    >
                        <Image
                            src={"/curatedLaunches/pepemon/Grass.png"}
                            alt="Pepemon Grass"
                            width={sm ? 250 : 400}
                            height={sm ? 250 : 400}
                        />
                        <Image
                            src={"/curatedLaunches/pepemon/pikachu.png"}
                            alt="Pikachu Silhouette"
                            width={sm ? 250 : 350}
                            height={sm ? 250 : 350}
                            style={{ position: "absolute", zIndex: -1 }}
                        />

                        {wallet.connected ? (
                            <VStack gap={0} position={"absolute"} style={{ bottom: -160 }}>
                                <Image
                                    src="/curatedLaunches/pepemon/Pepeball.png"
                                    alt="Pepemon Ball"
                                    width={130}
                                    height={sm ? 150 : 150}
                                    style={{
                                        cursor: "pointer",
                                        animation: isLoading && "tilt-shaking 0.25s infinite",
                                    }}
                                    onClick={
                                        isLoading
                                            ? () => {}
                                            : assigned_nft === null || assigned_nft.status > 0
                                              ? () => ClaimNFT()
                                              : () => {
                                                    openAssetModal();
                                                    MintNFT();
                                                }
                                    }
                                />
                                <Text mt={-5} fontWeight={500} fontSize={30} className="font-face-pk">
                                    Click to Throw
                                </Text>
                            </VStack>
                        ) : (
                            <div
                                style={{
                                    cursor: "pointer",
                                    background: "url(/curatedLaunches/pepemon/horizontal3.png)",
                                    backgroundSize: "cover",
                                    width: md ? "140px" : "160px",
                                    height: md ? "68px" : "80px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    marginTop: "-15px",
                                }}
                                onClick={() => handleConnectWallet()}
                            >
                                <Text m={0} fontWeight={500} fontSize={40} className="font-face-pk    ">
                                    Start
                                </Text>
                            </div>
                        )}
                    </VStack>
                </Flex>

                <HStack alignItems="end" gap={0} style={{ position: "absolute", bottom: 0, left: -20 }}>
                    <Image
                        src={"/curatedLaunches/pepemon/PepeTrainer.png"}
                        alt="Pepemon Trainer"
                        width={md ? 200 : 400}
                        height={md ? 400 : 600}
                    />
                </HStack>

                {wallet.connected && (
                    <div
                        style={{
                            cursor: "pointer",
                            background: md ? "none" : "url(/curatedLaunches/pepemon/horizontal1.png)",
                            backgroundSize: "cover",
                            width: md ? "fit-content" : "400px",
                            height: "250px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "start",
                            justifyContent: md ? "end" : "center",
                            position: "absolute",
                            bottom: 50,
                            right: 20,
                            padding: md ? 0 : 30,
                        }}
                    >
                        <Text m={0} fontWeight={500} fontSize={md ? 30 : 32} className="font-face-pk">
                            PEPEBALLS: {tokenBalance.toLocaleString()}
                        </Text>
                        <Text m={0} fontWeight={500} fontSize={md ? 30 : 32} className="font-face-pk">
                            PEPEMON OWNED: {nft_balance}
                        </Text>
                        <Text m={0} fontWeight={500} fontSize={md ? 30 : 32} className="font-face-pk">
                            WILD PEPEMON: {launch && launch.num_available}
                        </Text>
                        <Text m={0} fontWeight={500} fontSize={md ? 30 : 32} className="font-face-pk">
                            CATCH CHANCE: {prob_string}
                        </Text>
                    </div>
                )}

                <ReceivedAssetModal
                    curated={true}
                    have_randoms={OraoRandoms.length > 0}
                    isWarningOpened={isAssetModalOpen}
                    closeWarning={closeAssetModal}
                    assignment_data={assigned_nft}
                    collection={launch}
                    asset={asset_received.current}
                    asset_image={asset_image.current}
                    style={modalStyle}
                    isLoading={isLoading}
                />

                <ReleaseModal isOpened={isReleaseModalOpen} onClose={closeReleaseModal} assets={owned_assets} collection={launch} />
            </main>
        </>
    );
};

export default Pepemon;
