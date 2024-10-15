import { useCallback, useEffect, useMemo, useRef } from "react";
import useResponsive from "../../hooks/useResponsive";
import Head from "next/head";
import Image from "next/image";
import { Flex, VStack, Text, useDisclosure, Button, HStack } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { CollectionKeys, Config, PROGRAM, SYSTEM_KEY } from "../../components/Solana/constants";
import { ReceivedAssetModal, ReceivedAssetModalStyle } from "../../components/Solana/modals";
import UseWalletConnection from "../../hooks/useWallet";
import useClaimNFT from "../../hooks/collections/useClaimNFT";
import Loader from "../../components/loader";
import ReleaseModal from "./releaseModal";
import useMintNFT from "../../hooks/collections/useMintNFT";
import useTokenBalance from "../../hooks/data/useTokenBalance";
import useCollection from "../../hooks/data/useCollection";
import useNFTBalance from "../../hooks/data/useNFTBalance";
import useAssignmentData from "../../hooks/data/useAssignmentData";

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
    const collection_name = Config.PROD ? "pepemon_gen1" : "pepemon";
    const { handleConnectWallet } = UseWalletConnection();

    const {
        collection,
        collectionPlugins,
        tokenMint,
        error: collectionError,
    } = useCollection({ pageName: collection_name as string | null });
    const collectionAddress = useMemo(() => {
        return collection?.keys?.[CollectionKeys.CollectionMint] || null;
    }, [collection]);
    const { nftBalance, ownedAssets, checkNFTBalance, fetchNFTBalance } = useNFTBalance(collectionAddress ? { collectionAddress } : null);

    const { assignmentData, validRandoms, asset, assetMeta, error: assignmentError } = useAssignmentData({ collection: collection });
    const mintAddress = useMemo(() => {
        return collection?.keys?.[CollectionKeys.MintAddress] || null;
    }, [collection]);

    const { tokenBalance } = useTokenBalance(mintAddress ? { mintAddress } : null);

    const { isOpen: isAssetModalOpen, onOpen: openAssetModal, onClose: closeAssetModal } = useDisclosure();
    const { isOpen: isReleaseModalOpen, onOpen: openReleaseModal, onClose: closeReleaseModal } = useDisclosure();

    const { MintNFT, isLoading: isMintLoading } = useMintNFT(collection);

    const { ClaimNFT, isLoading: isClaimLoading } = useClaimNFT(collection);

    let isLoading = isClaimLoading || isMintLoading;

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

    const sound = (src) => {
        let audio = new Audio(src);
        try {
            audio.volume = 0.5;
            audio.play();
        } catch (error) {
            console.error(`An error occurred: ${error}`);
        }
    };

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

    if (collectionPlugins) {
        prob_string = `${collectionPlugins.probability.split(" ")[0]}`;
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

    if (collection === null || tokenMint === null) return <Loader />;

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
                                            : assignmentData === null || assignmentData.status > 0
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
                            PEPEMON OWNED: {nftBalance}
                        </Text>
                        <Text m={0} fontWeight={500} fontSize={md ? 30 : 32} className="font-face-pk">
                            WILD PEPEMON: {collection && collection.num_available}
                        </Text>
                        <Text m={0} fontWeight={500} fontSize={md ? 30 : 32} className="font-face-pk">
                            CATCH CHANCE: {prob_string}
                        </Text>
                    </div>
                )}

                <ReceivedAssetModal
                    curated={true}
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

                <ReleaseModal isOpened={isReleaseModalOpen} onClose={closeReleaseModal} assets={ownedAssets} collection={collection} />
            </main>
        </>
    );
};

export default Pepemon;
