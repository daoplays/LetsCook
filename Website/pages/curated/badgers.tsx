import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import { Card, CardBody, Flex, Stack, Text, Box, Button, Image, Progress, useDisclosure, HStack, Tooltip } from "@chakra-ui/react";
import { IoSettingsSharp, IoVolumeHigh, IoVolumeMute } from "react-icons/io5";
import Links from "../../components/Buttons/links";
import useAppRoot from "../../context/useAppRoot";
import { AssignmentData, CollectionData, request_assignment_data } from "../../components/collection/collectionState";
import { PublicKey } from "@solana/web3.js";
import { CollectionKeys, Config, PROGRAM, SYSTEM_KEY } from "../../components/Solana/constants";
import Loader from "../../components/loader";
import { stockSoldPercentage } from "../../utils/stockSoldPercentage";
import { AssetWithMetadata, fetchNFTBalance } from "../collection/[pageName]";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import useMintNFT from "../../hooks/collections/useMintNFT";
import { AssetV1, deserializeAssetV1 } from "@metaplex-foundation/mpl-core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import type { RpcAccount } from "@metaplex-foundation/umi";
import useClaimNFT from "../../hooks/collections/useClaimNFT";
import useMintRandom from "../../hooks/collections/useMintRandom";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { TokenAccount, bignum_to_num, request_raw_account_data, request_token_amount } from "../../components/Solana/state";
import { MdOutlineContentCopy } from "react-icons/md";
import formatPrice from "../../utils/formatPrice";
import { ReceivedAssetModal, ReceivedAssetModalStyle } from "../../components/Solana/modals";
import ReleaseModal from "./releaseModal";
import UseWalletConnection from "../../hooks/useWallet";
import useTokenBalance from "../../hooks/data/useTokenBalance";

const Badgers = () => {
    const collection_name = "badger";
    const wallet = useWallet();
    const [isMuted, setIsMuted] = useState(true); // State to manage mute/unmute
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [nft_balance, setNFTBalance] = useState<number>(0);
    const [assigned_nft, setAssignedNFT] = useState<AssignmentData | null>(null);
    const [owned_assets, setOwnedAssets] = useState<AssetWithMetadata[]>([]);
    const { isOpen: isAssetModalOpen, onOpen: openAssetModal, onClose: closeAssetModal } = useDisclosure();
    const { isOpen: isReleaseModalOpen, onOpen: openReleaseModal, onClose: closeReleaseModal } = useDisclosure();
    const { handleConnectWallet, handleDisconnectWallet } = UseWalletConnection();
    const [launch, setCollectionData] = useState<CollectionData | null>(null);
    const { MintNFT, isLoading: isMintLoading } = useMintNFT(launch);
    const audioRef = useRef<HTMLAudioElement>(null);
    const check_initial_collection = useRef<boolean>(true);
    const collection_key = useRef<PublicKey | null>(null);
    const check_initial_nft_balance = useRef<boolean>(true);
    const mint_nft = useRef<boolean>(false);
    const asset_received = useRef<AssetV1 | null>(null);
    const asset_image = useRef<string | null>(null);
    const launch_account_ws_id = useRef<number | null>(null);
    const nft_account_ws_id = useRef<number | null>(null);
    const user_token_ws_id = useRef<number | null>(null);
    const { ClaimNFT, isLoading: isClaimLoading, OraoRandoms, setOraoRandoms } = useClaimNFT(launch);
    const { connection } = useConnection();
    const { collectionList, mintData } = useAppRoot();
    const { MintRandom, isLoading: isMintRandomLoading } = useMintRandom(launch);
    const check_initial_assignment = useRef<boolean>(true);

    const mintAddress = useMemo(() => {
        return launch?.keys?.[CollectionKeys.MintAddress] || null;
    }, [launch]);

    const { tokenBalance } = useTokenBalance(mintAddress ? { mintAddress } : null);

    let isLoading = isClaimLoading || isMintRandomLoading || isMintLoading;

    const modalStyle: ReceivedAssetModalStyle = {
        check_image: "/curatedLaunches/badgers/badger.gif",
        failed_image: "/curatedLaunches/badgers/badger.gif",
        fontFamily: "singlanguagefont",
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

    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isMusicPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch((error) => {
                    console.error("Playback failed:", error); // Log any errors that occur during playback
                });
            }
            setIsMuted(!isMuted);
            setIsMusicPlaying(!isMusicPlaying);
        }
    };

    const toggleControls = () => {
        setShowControls(!showControls);
    };

    const handleVolumeChange = (event: any) => {
        if (audioRef.current) {
            const volume = parseFloat(event.target.value);
            audioRef.current.volume = event.target.value;
            setIsMuted(volume === 0);
            setIsMusicPlaying(volume !== 0);
        }
    };

    useEffect(() => {
        if (collectionList === null) return;

        let launch = collectionList.get(collection_name);

        if (launch === null) return;

        if (check_initial_collection.current) {
            console.log("check intitial collection");
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

                    fetchNFTBalance(collection_key.current, wallet, setOwnedAssets, setNFTBalance, check_initial_nft_balance);
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

        fetchNFTBalance(collection_key.current, wallet, setOwnedAssets, setNFTBalance, check_initial_nft_balance);
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

    if (launch === null) return <Loader />;
    const enoughTokenBalance = tokenBalance >= bignum_to_num(launch.swap_price) / Math.pow(10, launch.token_decimals);
    return (
        <>
            <Head>
                <title>Let&apos;s Cook | {launch.page_name}</title>
            </Head>
            <audio ref={audioRef} src="/curatedLaunches/badgers/badger_loop.mp3" autoPlay loop muted={isMuted} />
            <Flex
                position="fixed"
                bottom={{ base: 1, md: 5 }}
                right={{ base: 1, md: 5 }}
                zIndex={50}
                py={2}
                px={3}
                w="fit-content"
                bg="black"
                opacity={0.5}
                borderRadius="2xl"
                alignItems="center"
                justify="center"
            >
                <Flex alignItems="center" gap={3}>
                    <Box
                        onClick={toggleControls}
                        className="cursor-pointer"
                        fontSize={{ base: "20px", lg: "30px" }}
                        color="white"
                        _hover={{ color: "teal.500", transform: "scale(1.1)" }} // Hover effect
                        transition="all 0.2s"
                        cursor="pointer"
                    >
                        <IoSettingsSharp />
                    </Box>
                    {isMusicPlaying ? (
                        <Flex
                            gap={1}
                            onClick={() => {
                                togglePlayPause();
                                setShowControls(false);
                            }}
                        >
                            <Box
                                onClick={toggleControls}
                                className="cursor-pointer"
                                fontSize={{ base: "20px", lg: "30px" }}
                                color="white"
                                _hover={{ color: "teal.500", transform: "scale(1.1)" }} // Hover effect
                                transition="all 0.2s"
                                cursor="pointer"
                            >
                                <IoVolumeHigh />
                            </Box>
                            {/* <Lottie options={defaultOptions} height={35} width={35} /> */}
                        </Flex>
                    ) : (
                        <Box
                            onClick={togglePlayPause}
                            className="cursor-pointer"
                            fontSize={{ base: "20px", lg: "30px" }}
                            color="white"
                            _hover={{ color: "teal.500", transform: "scale(1.1)" }} // Hover effect
                            transition="all 0.2s"
                            cursor="pointer"
                        >
                            <IoVolumeMute />
                        </Box>
                    )}
                </Flex>

                {showControls && (
                    <Flex direction="column">
                        <input type="range" min="0" max="1" step="0.01" onChange={handleVolumeChange} className="volume-slider" />
                    </Flex>
                )}
            </Flex>
            <Box
                bgImage="url('/curatedLaunches/badgers/badgerBackground.png')"
                bgSize="cover"
                bgPosition="center"
                bgRepeat="no-repeat"
                minH="100vh"
                w="100%"
                display="flex"
                justifyContent="center"
                alignItems="center"
            >
                <Flex
                    gap={5}
                    style={{ width: "auto" }}
                    justifyContent={"center"}
                    alignItems={["center", "center", "center", "stretch", "stretch"]}
                    padding={5}
                    fontFamily={"singlanguagefont"}
                    letterSpacing="2px"
                    direction={["column", "column", "column", "row", "row"]}
                >
                    <Flex width={["100%", "100%", "100%", "auto", "auto"]}>
                        <Card
                            maxH="2xl"
                            sx={{
                                background: "linear-gradient(150deg, rgba(70,69,80,.90) 0%, rgba(6,29,34,.90) 86%)",
                                borderRadius: "10px", // Make sure to apply rounded corners as well
                                padding: "10px",
                            }}
                            textAlign="center"
                            height="100%"
                            width="100%"
                        >
                            <CardBody>
                                <Flex direction="column" alignItems="center" justifyContent="center" height="100%" textColor="white">
                                    <Image
                                        src={launch.collection_icon_url}
                                        alt="Green double couch with wooden legs"
                                        maxWidth={["2xs", "2xs", "3xs", "2xs", "xs"]}
                                        style={{ borderRadius: 10 }}
                                    />
                                    {assigned_nft === null || assigned_nft.status > 0 ? (
                                        <Stack mt="1.25rem" spacing="3" align="center">
                                            <Button
                                                variant="outline"
                                                colorScheme="teal"
                                                borderRadius="full"
                                                padding="0"
                                                onClick={() => {
                                                    if (!wallet.connected) {
                                                        handleConnectWallet();
                                                    }

                                                    if (wallet.connected && enoughTokenBalance) {
                                                        ClaimNFT();
                                                    }
                                                }}
                                                isDisabled={!enoughTokenBalance || isLoading}
                                                _hover={{ boxShadow: "lg", transform: "scale(1.05)", opacity: ".90" }}
                                                height="auto"
                                                position="relative"
                                                border={0}
                                                isLoading={isLoading}
                                            >
                                                <Image
                                                    src="/curatedLaunches/badgers/shroombutton.png"
                                                    alt="Mashroom Button"
                                                    width={["100px", "", "", "", "150px"]}
                                                />
                                                <Text
                                                    fontSize={["xl", "xl", "xl", "2xl", "4xl"]}
                                                    color="black"
                                                    position="absolute"
                                                    top="40%"
                                                    fontWeight="bold"
                                                    className="text-stroke"
                                                >
                                                    MINT
                                                </Text>
                                            </Button>
                                        </Stack>
                                    ) : (
                                        <Stack mt="1.25rem" spacing="3" align="center">
                                            <Button
                                                variant="outline"
                                                colorScheme="teal"
                                                borderRadius="full"
                                                padding="0"
                                                onClick={() => {
                                                    if (launch.collection_meta["__kind"] === "RandomFixedSupply") {
                                                        MintNFT();
                                                    }
                                                }}
                                                _hover={{ boxShadow: "lg", transform: "scale(1.05)", opacity: ".90" }}
                                                height="auto"
                                                position="relative"
                                                border={0}
                                                isLoading={isLoading}
                                            >
                                                <Image
                                                    src="/curatedLaunches/badgers/shroombutton.png"
                                                    alt="Mashroom Button"
                                                    width={["100px", "", "", "", "150px"]}
                                                />
                                                <Text
                                                    fontSize={["xl", "xl", "xl", "2xl", "4xl"]}
                                                    color="black"
                                                    position="absolute"
                                                    top="40%"
                                                    fontWeight="bold"
                                                    className="text-stroke"
                                                >
                                                    MINT
                                                </Text>
                                            </Button>
                                        </Stack>
                                    )}
                                    <HStack spacing={5} mt={10} fontFamily="ComicNeue">
                                        <Text fontSize={["sm", "sm", "md", "lg", "xl"]} color="rgb(171,181,181)">
                                            Your NFTs: {nft_balance}
                                        </Text>
                                        <Text fontSize={["sm", "sm", "md", "lg", "xl"]} color="rgb(171,181,181)">
                                            Your ${launch.token_symbol}: {tokenBalance.toLocaleString()}
                                        </Text>
                                    </HStack>
                                </Flex>
                            </CardBody>
                        </Card>
                    </Flex>

                    <Flex>
                        <Card
                            maxH="2xl"
                            color={"white"}
                            sx={{
                                background: "linear-gradient(150deg, rgba(70,69,80,.90) 0%, rgba(6,29,34,.90) 86%)",
                                borderRadius: "10px", // Make sure to apply rounded corners as well
                                padding: "20px",
                            }}
                            textAlign="center"
                            fontFamily={"singlanguagefont"}
                        >
                            <CardBody>
                                <Flex direction="column" alignItems="center" justifyContent="center" height="100%">
                                    <Stack spacing="4">
                                        <Text fontSize={["2xl", "2xl", "3xl", "4xl", "6xl"]} color="white" mb={0} lineHeight="3.125rem">
                                            {launch.collection_name}
                                        </Text>
                                        <Links socials={launch.socials} />
                                        <Stack spacing={2} textAlign={["center", "center", "center", "left", "left"]}>
                                            <Text fontSize={["xl", "xl", "2xl", "3xl", "4xl"]} mb={0} lineHeight="50px">
                                                Whitelist Phase
                                            </Text>
                                            <Stack
                                                spacing={[5, 5, "10px", "10px", "10px"]}
                                                ml={0}
                                                justifyContent={["center", "center", "center", "left", "left"]}
                                                direction="row"
                                            >
                                                <Text
                                                    fontFamily="ComicNeue"
                                                    mb={[0, 0, 0, "", ""]}
                                                    whiteSpace="nowrap"
                                                    fontSize={["sm", "sm", "md", "lg", "3xl"]}
                                                    border={"1px solid white"}
                                                    letterSpacing="1px"
                                                    sx={{
                                                        borderRadius: "10px",
                                                        padding: "0px 15px",
                                                        background: "linear-gradient(320deg, rgba(0,0,0,1) 0%, rgba(58,104,73,1) 100%)",
                                                    }}
                                                >
                                                    07 OCT 2024
                                                </Text>
                                                <Text
                                                    fontFamily="ComicNeue"
                                                    mb={[0, 0, 0, "", ""]}
                                                    whiteSpace="nowrap"
                                                    fontSize={["sm", "sm", "md", "lg", "3xl"]}
                                                    border={"1px solid white"}
                                                    letterSpacing="1px"
                                                    sx={{
                                                        borderRadius: "10px",
                                                        padding: "0px 15px",
                                                        background: "linear-gradient(320deg, rgba(0,0,0,1) 0%, rgba(58,104,73,1) 100%)",
                                                    }}
                                                >
                                                    18:00 UTC
                                                </Text>
                                            </Stack>
                                        </Stack>
                                        <Stack spacing={2} textAlign={["center", "center", "center", "left", "left"]}>
                                            <Text fontSize={["xl", "xl", "2xl", "3xl", "4xl"]} mb={0} lineHeight="50px">
                                                Public Phase
                                            </Text>
                                            <Stack
                                                justifyContent={["center", "center", "center", "left", "left"]}
                                                direction="row"
                                                spacing={[5, 5, "10px", "10px", "10px"]}
                                                ml={0}
                                            >
                                                <Text
                                                    fontFamily="ComicNeue"
                                                    mb={[0, 0, 0, "", ""]}
                                                    whiteSpace="nowrap"
                                                    fontSize={["sm", "sm", "md", "lg", "3xl"]}
                                                    border={"1px solid white"}
                                                    letterSpacing="1px"
                                                    sx={{
                                                        borderRadius: "10px",
                                                        padding: "0px 15px",
                                                        background: "linear-gradient(320deg, rgba(0,0,0,1) 0%, rgba(58,104,73,1) 100%)",
                                                    }}
                                                >
                                                    07 OCT 2024
                                                </Text>
                                                <Text
                                                    fontFamily="ComicNeue"
                                                    mb={[0, 0, 0, "", ""]}
                                                    whiteSpace="nowrap"
                                                    fontSize={["sm", "sm", "md", "lg", "3xl"]}
                                                    border={"1px solid white"}
                                                    letterSpacing="1px"
                                                    sx={{
                                                        borderRadius: "10px",
                                                        padding: "0px 15px",
                                                        background: "linear-gradient(320deg, rgba(0,0,0,1) 0%, rgba(58,104,73,1) 100%)",
                                                    }}
                                                >
                                                    22:00 UTC
                                                </Text>
                                            </Stack>
                                        </Stack>
                                        <Stack spacing={2} textAlign={["center", "center", "center", "left", "left"]}>
                                            <Text fontSize={["xl", "xl", "2xl", "3xl", "4xl"]} mb={0} lineHeight="50px">
                                                Price
                                            </Text>
                                            <Stack
                                                justifyContent={["center", "center", "center", "left", "left"]}
                                                direction="row"
                                                spacing={[5, 5, "10px", "10px", "10px"]}
                                                ml={0}
                                            >
                                                <span
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        gap: 4,
                                                        border: "1px solid white",
                                                        borderRadius: "10px",
                                                        padding: "0px 15px",
                                                        background: "linear-gradient(320deg, rgba(0,0,0,1) 0%, rgba(58,104,73,1) 100%)",
                                                    }}
                                                >
                                                    <Text
                                                        fontFamily="ComicNeue"
                                                        whiteSpace="nowrap"
                                                        fontSize={["sm", "sm", "md", "lg", "3xl"]}
                                                        letterSpacing="1px"
                                                        mb="0px"
                                                    >
                                                        {formatPrice(
                                                            bignum_to_num(launch.swap_price) / Math.pow(10, launch.token_decimals),
                                                            2,
                                                        )}
                                                    </Text>
                                                </span>
                                                <span
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        gap: 4,
                                                        border: "1px solid white",
                                                        borderRadius: "10px",
                                                        padding: "0px 15px",
                                                        background: "linear-gradient(320deg, rgba(0,0,0,1) 0%, rgba(58,104,73,1) 100%)",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <Text
                                                        fontFamily="ComicNeue"
                                                        whiteSpace="nowrap"
                                                        fontSize={["sm", "sm", "md", "lg", "3xl"]}
                                                        letterSpacing="1px"
                                                        mb="0px"
                                                    >
                                                        ${launch.token_symbol.toLocaleString().trim()}
                                                    </Text>{" "}
                                                    <Tooltip label="Copy Contract Address" hasArrow fontSize="large" offset={[0, 10]}>
                                                        <div
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                navigator.clipboard.writeText(
                                                                    launch && launch.keys && launch.keys[CollectionKeys.MintAddress]
                                                                        ? launch.keys[CollectionKeys.MintAddress].toString()
                                                                        : "",
                                                                );
                                                            }}
                                                        >
                                                            <Box fontSize={[10, 10, 22, 22, 22]}>
                                                                <MdOutlineContentCopy color="white" />
                                                            </Box>
                                                        </div>
                                                    </Tooltip>
                                                </span>
                                            </Stack>
                                        </Stack>

                                        <Stack spacing={2} mt={4} textAlign={["center", "center", "center", "left", "left"]}>
                                            <Text fontSize={["xl", "xl", "2xl", "3xl", "4xl"]} mb={0} lineHeight="50px">
                                                Supply Minted
                                            </Text>
                                            <Progress
                                                colorScheme="green"
                                                size="md"
                                                value={stockSoldPercentage(launch.num_available, launch.total_supply)}
                                            />

                                            <Flex justifyContent="space-between" width="100%">
                                                <Text fontFamily="ComicNeue" whiteSpace="nowrap" fontSize={["sm", "sm", "md", "lg", "xl"]}>
                                                    {stockSoldPercentage(launch.num_available, launch.total_supply).toFixed(2)}% Sold
                                                </Text>
                                                <Text
                                                    fontFamily="ComicNeue"
                                                    whiteSpace="nowrap"
                                                    fontSize={["sm", "sm", "md", "lg", "xl"]}
                                                    color="rgb(171,181,181)"
                                                >
                                                    {launch.total_supply - launch.num_available} / {launch.total_supply}
                                                </Text>
                                            </Flex>
                                        </Stack>
                                    </Stack>
                                </Flex>
                            </CardBody>
                        </Card>
                    </Flex>
                </Flex>
                <ReceivedAssetModal
                    curated={false}
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
            </Box>
        </>
    );
};

export default Badgers;
