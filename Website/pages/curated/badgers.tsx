import React, { useCallback, useEffect, useMemo } from "react";
import Head from "next/head";
import { Card, CardBody, Flex, Stack, Text, Box, Button, Image, Progress, useDisclosure, HStack, Tooltip } from "@chakra-ui/react";
import { IoSettingsSharp, IoVolumeHigh, IoVolumeMute } from "react-icons/io5";
import Links from "../../components/Buttons/links";
import { CollectionKeys, Config, SYSTEM_KEY } from "../../components/Solana/constants";
import Loader from "../../components/loader";
import { stockSoldPercentage } from "../../utils/stockSoldPercentage";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import useMintNFT from "../../hooks/collections/useMintNFT";
import useClaimNFT from "../../hooks/collections/useClaimNFT";
import {} from "@solana/spl-token";
import { bignum_to_num } from "../../components/Solana/state";
import { MdOutlineContentCopy } from "react-icons/md";
import formatPrice from "../../utils/formatPrice";
import { ReceivedAssetModal, ReceivedAssetModalStyle } from "../../components/Solana/modals";
import UseWalletConnection from "../../hooks/useWallet";
import useTokenBalance from "../../hooks/data/useTokenBalance";
import useNFTBalance from "../../hooks/data/useNFTBalance";
import useAssignmentData from "../../hooks/data/useAssignmentData";
import useAudioPlayer from "../../hooks/curated/useAudioControll";
import useCollection from "@letscook/sdk/dist/hooks/data/useCollection";

const Badgers = () => {
    const { audioRef, isMusicPlaying, isMuted, showControls, togglePlayPause, toggleControls, toggleControlsOff, handleVolumeChange } =
        useAudioPlayer();
    const wallet = useWallet();
    const {connection} = useConnection();
    const collection_name = Config.NETWORK === "mainnet" ? "badger" : "testingtest";
    const { handleConnectWallet } = UseWalletConnection();
    const { isOpen: isAssetModalOpen, onOpen: openAssetModal, onClose: closeAssetModal } = useDisclosure();
    const { collection, tokenMint, error: collectionError } = useCollection({ connection, pageName: collection_name as string | null });
    const { MintNFT, isLoading: isMintLoading } = useMintNFT(collection);
    const { ClaimNFT, isLoading: isClaimLoading } = useClaimNFT(collection);
    const collectionAddress = useMemo(() => {
        return collection?.keys?.[CollectionKeys.CollectionMint] || null;
    }, [collection]);
    const { nftBalance, checkNFTBalance, fetchNFTBalance } = useNFTBalance(collectionAddress ? { collectionAddress } : null);

    const { assignmentData, validRandoms, asset, assetMeta, error: assignmentError } = useAssignmentData({ collection: collection });
    const mintAddress = useMemo(() => {
        return collection?.keys?.[CollectionKeys.MintAddress] || null;
    }, [collection]);

    const { tokenBalance } = useTokenBalance(mintAddress ? { mintAddress } : null);

    let isLoading = isClaimLoading || isMintLoading;

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

    if (collection === null || tokenMint === null) return <Loader />;

    const enoughTokenBalance = tokenBalance >= bignum_to_num(collection.swap_price) / Math.pow(10, collection.token_decimals);
    return (
        <>
            <Head>
                <title>Let&apos;s Cook | {collection.page_name}</title>
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
                                toggleControlsOff();
                            }}
                        >
                            <Box
                                onClick={toggleControlsOff}
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
                                        src={collection.collection_icon_url}
                                        alt="Green double couch with wooden legs"
                                        maxWidth={["2xs", "2xs", "3xs", "2xs", "xs"]}
                                        style={{ borderRadius: 10 }}
                                    />
                                    {assignmentData === null || assignmentData.status > 0 ? (
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
                                                    if (collection.collection_meta["__kind"] === "RandomFixedSupply") {
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
                                            Your NFTs: {nftBalance}
                                        </Text>
                                        <Text fontSize={["sm", "sm", "md", "lg", "xl"]} color="rgb(171,181,181)">
                                            Your ${collection.token_symbol}: {tokenBalance.toLocaleString()}
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
                                            {collection.collection_name}
                                        </Text>
                                        <Links socials={collection.socials} />
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
                                                            bignum_to_num(collection.swap_price) / Math.pow(10, collection.token_decimals),
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
                                                        ${collection.token_symbol.toLocaleString().trim()}
                                                    </Text>{" "}
                                                    <Tooltip label="Copy Contract Address" hasArrow fontSize="large" offset={[0, 10]}>
                                                        <div
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                navigator.clipboard.writeText(
                                                                    collection &&
                                                                        collection.keys &&
                                                                        collection.keys[CollectionKeys.MintAddress]
                                                                        ? collection.keys[CollectionKeys.MintAddress].toString()
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
                                                value={stockSoldPercentage(collection.num_available, collection.total_supply)}
                                            />

                                            <Flex justifyContent="space-between" width="100%">
                                                <Text fontFamily="ComicNeue" whiteSpace="nowrap" fontSize={["sm", "sm", "md", "lg", "xl"]}>
                                                    {stockSoldPercentage(collection.num_available, collection.total_supply).toFixed(2)}%
                                                    Sold
                                                </Text>
                                                <Text
                                                    fontFamily="ComicNeue"
                                                    whiteSpace="nowrap"
                                                    fontSize={["sm", "sm", "md", "lg", "xl"]}
                                                    color="rgb(171,181,181)"
                                                >
                                                    {collection.total_supply - collection.num_available} / {collection.total_supply}
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
            </Box>
        </>
    );
};

export default Badgers;
