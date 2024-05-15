import { useCallback, useEffect, useRef, useState } from "react";
import useResponsive from "../../hooks/useResponsive";
import Head from "next/head";
import Image from "next/image";
import { Flex, VStack, Text, useDisclosure, Button, HStack } from "@chakra-ui/react";
import useMintRandom from "../../hooks/collections/useMintRandom";
import { findCollection } from "../../components/collection/utils";
import useAppRoot from "../../context/useAppRoot";
import { AssignmentData, CollectionData, request_assignment_data } from "../../components/collection/collectionState";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { CollectionKeys, Config, PROGRAM, SYSTEM_KEY } from "../../components/Solana/constants";
import { Key, getAssetV1GpaBuilder, updateAuthority, AssetV1, fetchAssetV1, deserializeAssetV1 } from "@metaplex-foundation/mpl-core";
import type { RpcAccount, PublicKey as umiKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import { ReceivedAssetModal } from "../../components/Solana/modals";
import { PublicKey } from "@solana/web3.js";
import {
    unpackMint,
    Mint,
    TOKEN_2022_PROGRAM_ID,
    unpackAccount,
    getTransferFeeConfig,
    getAssociatedTokenAddressSync,
    calculateFee,
} from "@solana/spl-token";
import { TokenAccount, bignum_to_num, request_token_amount } from "../../components/Solana/state";
import UseWalletConnection from "../../hooks/useWallet";
import { DisconnectWalletButton } from "../../components/Solana/wallet";
import useClaimNFT from "../../hooks/collections/useClaimNFT";
const Pepemon = () => {
    const { sm, md, lg } = useResponsive();
    const wallet = useWallet();
    const { connection } = useConnection();
    const { handleConnectWallet, handleDisconnectWallet } = UseWalletConnection();

    const { collectionList, mintData } = useAppRoot();
    const [launch, setCollectionData] = useState<CollectionData | null>(null);
    const [assigned_nft, setAssignedNFT] = useState<AssignmentData | null>(null);
    const [out_amount, setOutAmount] = useState<number>(0);
    const [nft_balance, setNFTBalance] = useState<number>(0);
    const [token_balance, setTokenBalance] = useState<number>(0);

    const [token_amount, setTokenAmount] = useState<number>(0);
    const [nft_amount, setNFTAmount] = useState<number>(0);
    const [isTokenToNFT, setIsTokenToNFT] = useState(false);

    const launch_account_ws_id = useRef<number | null>(null);
    const nft_account_ws_id = useRef<number | null>(null);
    const user_token_ws_id = useRef<number | null>(null);

    const mint_nft = useRef<boolean>(false);
    const check_initial_assignment = useRef<boolean>(true);
    const check_initial_collection = useRef<boolean>(true);

    const asset_received = useRef<AssetV1 | null>(null);
    const asset_image = useRef<string | null>(null);

    const { isOpen: isAssetModalOpen, onOpen: openAssetModal, onClose: closeAssetModal } = useDisclosure();

    const { MintRandom, isLoading: isMintRandomLoading } = useMintRandom(launch);
    const { ClaimNFT, isLoading: isClaimLoading } = useClaimNFT(launch);

    let isLoading = isClaimLoading || isMintRandomLoading;

    const check_nft_balance = useCallback(async () => {
        if (launch === null || wallet === null || wallet.publicKey === null) return;

        console.log("CHECKING NFT BALANCE");

        const umi = createUmi(Config.RPC_NODE, "confirmed");

        let collection_umiKey = publicKey(launch.keys[CollectionKeys.CollectionMint].toString());

        const assets = await getAssetV1GpaBuilder(umi)
            .whereField("key", Key.AssetV1)
            .whereField("updateAuthority", updateAuthority("Collection", [collection_umiKey]))
            .getDeserialized();

        console.log(assets);
        let valid_lookups = 0;
        for (let i = 0; i < assets.length; i++) {
            if (assets[i].owner.toString() === wallet.publicKey.toString()) {
                valid_lookups += 1;
            }
        }
        console.log("have ", valid_lookups, "addresses with balance");

        setNFTBalance(valid_lookups);
    }, [launch, wallet]);

    useEffect(() => {
        if (collectionList === null) return;

        let launch = findCollection(collectionList, "DM21_FA");

        if (launch === null) return;

        if (check_initial_collection.current) {
            setCollectionData(launch);
            check_initial_collection.current = false;
        }

        check_nft_balance();
    }, [collectionList, check_nft_balance]);

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
        if (assigned_nft === null || !mint_nft.current) {
            return;
        }

        console.log(assigned_nft, assigned_nft.nft_address.toString())
        if (
            launch.collection_meta["__kind"] === "RandomFixedSupply" &&
            assigned_nft.status === 0 &&
            !assigned_nft.nft_address.equals(SYSTEM_KEY)
        ) {
            return;
        }

        console.log("open asset modal");
        openAssetModal();

        mint_nft.current = false;
    }, [launch, assigned_nft, openAssetModal]);

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

            if (updated_data.nft_address.equals(SYSTEM_KEY)) {
                console.log("no asset recieved");

                asset_received.current = null;
                asset_image.current = null;
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
                    } else {
                        asset_received.current = null;
                    }
                } catch (error) {
                    asset_received.current = null;
                }
            }

            //console.log(updated_data);
            mint_nft.current = true;
            setAssignedNFT(updated_data);
        },
        [launch, assigned_nft],
    );

    const check_user_token_update = useCallback(async (result: any) => {
        //console.log(result);
        // if we have a subscription field check against ws_id

        let event_data = result.data;
        const [token_account] = TokenAccount.struct.deserialize(event_data);
        let amount = bignum_to_num(token_account.amount);
        // console.log("update quote amount", amount);

        setTokenBalance(amount);
    }, []);

    const get_assignment_data = useCallback(async () => {
        if (launch === null) return;

        if (!check_initial_assignment.current) {
            return;
        }

        let user_token_account_key = getAssociatedTokenAddressSync(
            launch.keys[CollectionKeys.MintAddress], // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            TOKEN_2022_PROGRAM_ID,
        );

        let user_amount = await request_token_amount("", user_token_account_key);
        setTokenBalance(user_amount);

        let nft_assignment_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), launch.keys[CollectionKeys.CollectionMint].toBytes(), Buffer.from("assignment")],
            PROGRAM,
        )[0];

        let assignment_data = await request_assignment_data(nft_assignment_account);
        console.log("check assignment", nft_assignment_account.toString(), assignment_data);

        check_initial_assignment.current = false;
        if (assignment_data === null) {
            return;
        }

        console.log(assignment_data);
        setAssignedNFT(assignment_data);
    }, [launch, wallet]);

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

        if (wallet === null || wallet.publicKey === null) {
            return;
        }
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
                TOKEN_2022_PROGRAM_ID,
            );
            user_token_ws_id.current = connection.onAccountChange(user_token_account_key, check_user_token_update, "confirmed");
        }
    }, [wallet, connection, launch, check_launch_update, check_assignment_update, check_user_token_update]);

    useEffect(() => {
        if (launch === null) return;

        if (wallet === null || wallet.publicKey === null) {
            return;
        }
        console.log("get initial assignment data");
        get_assignment_data();
    }, [launch, wallet, get_assignment_data]);

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
    }, []);

    let prob_string = "";

    if (launch) {
        for (let i = 0; i < launch.plugins.length; i++) {
            if (launch.plugins[i]["__kind"] === "MintProbability") {
                prob_string = `${launch.plugins[i]["mint_prob"].toString()}%`;
                console.log("Have mint prob", prob_string);
            }
        }
    }

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Pepemon</title>
            </Head>
            <main
                style={{
                    height: "100vh",
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
                        style={{ position: "fixed", top: 30 }}
                    />

                    {/* // Restart Button */}
                    {wallet.connected && !md && (
                        <div
                            style={{
                                cursor: "pointer",
                                background: "url(/curatedLaunches/pepemon/horizontal3.png)",
                                backgroundSize: "cover",
                                width: "160px",
                                height: "80px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                position: "absolute",
                                top: 20,
                                right: 20,
                            }}
                            onClick={async () => await wallet.disconnect()}
                        >
                            <Text m={0} fontWeight={500} fontSize={35} className="font-face-pk">
                                Restart
                            </Text>
                        </div>
                    )}

                    <VStack
                        zIndex={2}
                        style={{
                            position: "absolute",
                            left: 0,
                            right: 0,
                            marginLeft: "auto",
                            marginRight: "auto",
                            marginTop: sm && wallet.connected ? -280 : sm ? -150 : wallet.connected ? -50 : 0,
                        }}
                    >
                        <Image
                            src={"/curatedLaunches/pepemon/Grass.png"}
                            alt="Pepemon Grass"
                            width={sm ? 300 : 400}
                            height={sm ? 300 : 400}
                        />
                        <Image
                            src={"/curatedLaunches/pepemon/pikachu.png"}
                            alt="Pikachu Silhouette"
                            width={sm ? 300 : 350}
                            height={sm ? 300 : 350}
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
                                    
                                    onClick={isLoading ? () => {} : () => {
                                        if (launch.collection_meta["__kind"] === "RandomFixedSupply") {
                                        ClaimNFT();
                                    }
                                    if (launch.collection_meta["__kind"] === "RandomUnlimited") {
                                        MintRandom();
                                    }}
                                }
                                />
                                <Text mt={-5} fontWeight={500} fontSize={30} className="font-face-pk    ">
                                    Click to Throw
                                </Text>
                            </VStack>
                        ) : (
                            <div
                                style={{
                                    cursor: "pointer",
                                    background: "url(/curatedLaunches/pepemon/horizontal3.png)",
                                    backgroundSize: "cover",
                                    width: "160px",
                                    height: "80px",
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
                            bottom: 20,
                            right: 20,
                            padding: md ? 0 : 30,
                        }}
                    >
                        <Text m={0} fontWeight={500} fontSize={md ? 30 : 32} className="font-face-pk">
                            PEPEBALLS: {token_balance.toLocaleString()}
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
                    isWarningOpened={isAssetModalOpen}
                    closeWarning={closeAssetModal}
                    assignment_data={assigned_nft}
                    collection={launch}
                    asset={asset_received}
                    asset_image={asset_image}
                />
            </main>
        </>
    );
};

export default Pepemon;
