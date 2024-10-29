import { Dispatch, SetStateAction, MutableRefObject } from "react";
import { Box, Button, Center, HStack, Link, Spinner, Text, VStack } from "@chakra-ui/react";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton } from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";
import { LaunchData } from "./state";
import useBuyTickets from "../../hooks/launch/useBuyTickets";
import { AssetV1, Attribute } from "@metaplex-foundation/mpl-core";
import { PublicKey } from "@solana/web3.js";
import { AssignmentData, CollectionData } from "../collection/collectionState";
import useMintNFT from "../../hooks/collections/useMintNFT";
import styles from "../../styles/LaunchDetails.module.css";
import { SYSTEM_KEY } from "./constants";
import Image from "next/image";
import BN from "bn.js";
import useMintRandom from "../../hooks/collections/useMintRandom";

interface WarningModalProps {
    isWarningOpened?: boolean;
    closeWarning?: () => void;
    BuyTickets: () => void;
    launchData: LaunchData;
    value: number;
}

export function WarningModal({ isWarningOpened, closeWarning, BuyTickets }: WarningModalProps) {
    const { sm } = useResponsive();

    return (
        <>
            <Modal size="md" isCentered isOpen={isWarningOpened} onClose={closeWarning} motionPreset="slideInBottom">
                <ModalOverlay />

                <ModalContent mx={6} p={0} h={585} style={{ background: "transparent" }}>
                    <ModalBody bg="url(/images/terms-container.png)" bgSize="contain" bgRepeat="no-repeat" p={sm ? 10 : 14}>
                        <VStack spacing={sm ? 6 : 10}>
                            <Text
                                align="center"
                                fontSize={"large"}
                                style={{
                                    fontFamily: "KGSummerSunshineBlackout",
                                    color: "white",
                                    fontWeight: "semibold",
                                }}
                            >
                                If you can’t handle the heat, get out of the Kitchen!
                            </Text>

                            <VStack mt={-8} align="center" fontFamily="ReemKufiRegular">
                                <Text fontSize={sm ? "md" : "xl"} color="white" m={0} align="center">
                                    Memecoins are not investments.
                                </Text>
                                <Text fontSize={sm ? "md" : "xl"} color="white" m={0} align="center">
                                    You are not trading.
                                </Text>
                                <Text fontSize={sm ? "md" : "xl"} color="white" m={0} align="center">
                                    You are collecting memes and PvP gambling on social media.
                                </Text>
                            </VStack>

                            <Link href="/terms" target="_blank" style={{ textDecoration: "none" }}>
                                <Text
                                    px={2}
                                    borderRadius="12px"
                                    w="fit-content"
                                    backgroundColor="white"
                                    align="center"
                                    fontSize={"medium"}
                                    style={{
                                        fontFamily: "ReemKufiRegular",
                                        fontWeight: "semibold",
                                        margin: "0 auto",
                                        cursor: "pointer",
                                    }}
                                >
                                    See full Terms & Conditions
                                </Text>
                            </Link>

                            <VStack spacing={5}>
                                <HStack
                                    bg="#B80303"
                                    borderRadius="20px"
                                    p={3}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => {
                                        BuyTickets();
                                    }}
                                >
                                    <Text
                                        mb={0}
                                        align="end"
                                        fontSize={sm ? "medium" : "large"}
                                        style={{
                                            fontFamily: "KGSummerSunshineBlackout",
                                            fontWeight: "semibold",
                                            cursor: "pointer",
                                            color: "white",
                                        }}
                                    >
                                        I GET IT, LET ME COOK
                                    </Text>
                                </HStack>
                                <Text
                                    align="end"
                                    fontSize={sm ? "medium" : "medium"}
                                    style={{
                                        fontFamily: "KGSummerSunshineBlackout",
                                        color: "red",
                                        cursor: "pointer",
                                    }}
                                    onClick={closeWarning}
                                >
                                    Take me back
                                </Text>
                            </VStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}

interface RecievedAssetModalProps {
    isWarningOpened?: boolean;
    closeWarning?: () => void;
    collection: CollectionData;
    asset: AssetV1;
    asset_image: string;
    assignment_data: AssignmentData;
    style: ReceivedAssetModalStyle;
    curated?: boolean;
    isLoading: boolean;
    have_randoms: boolean;
}

export interface ReceivedAssetModalStyle {
    check_image: string;
    failed_image: string;
    fontFamily: string;
    fontColor: string;
    succsss_h: number;
    success_w: number;
    failed_h: number;
    failed_w: number;
    checking_h: number;
    checking_w: number;
    sm_succsss_h: number;
    sm_success_w: number;
    sm_failed_h: number;
    sm_failed_w: number;
    sm_checking_h: number;
    sm_checking_w: number;
}

export function ReceivedAssetModal({
    isWarningOpened,
    closeWarning,
    collection,
    assignment_data,
    asset,
    asset_image,
    style,
    curated,
    isLoading,
    have_randoms,
}: RecievedAssetModalProps) {
    const { sm } = useResponsive();
    const { MintNFT, isLoading: isMintLoading } = useMintNFT(collection);
    const { MintRandom, isLoading: isMintRandomLoading } = useMintRandom(collection);

    function filterAttributes(attributes) {
        return attributes.filter(function (item: Attribute) {
            return item.key !== "CookWrapIndex";
        });
    }

    if (assignment_data === null) return <></>;

    let waiting = !assignment_data.random_address.equals(SYSTEM_KEY) && !have_randoms;
    let success = assignment_data.status === 2;
    let failed = assignment_data.status === 1;
    let checking = assignment_data.status === 0;

    let height = success ? style.succsss_h : failed ? style.failed_h : style.checking_h;
    let width = success ? style.success_w : failed ? style.failed_w : style.checking_w;

    if (sm) {
        height = success ? style.sm_succsss_h : failed ? style.sm_failed_h : style.sm_checking_h;
        width = success ? style.sm_success_w : failed ? style.sm_failed_w : style.sm_checking_w;
    }

    // check if we are in a state where we are just waiting for random numbers
    if (waiting) {
        console.log("waiting for random data");
        return (
            <>
                <Modal size="md" isCentered isOpen={isWarningOpened} onClose={closeWarning} motionPreset="slideInBottom">
                    <ModalOverlay />

                    <ModalContent h={height} w={width} style={{ background: "transparent" }}>
                        <ModalBody
                            bg={curated ? "url(/curatedLaunches/pepemon/vertical.png)" : "url(/images/terms-container.png)"}
                            bgSize={curated ? "cover" : "contain"}
                            bgRepeat={!curated && "no-repeat"}
                            p={sm ? 10 : 14}
                        >
                            <VStack h="100%" position="relative">
                                <Text
                                    align="center"
                                    fontSize={curated ? 50 : "large"}
                                    style={{
                                        fontFamily: style.fontFamily,
                                        color: style.fontColor,
                                        fontWeight: "semibold",
                                    }}
                                >
                                    {"Generating Random Data"}
                                </Text>
                                <VStack align="center" fontFamily="ReemKufiRegular">
                                    <img
                                        loading="lazy"
                                        src={"/images/cooking.gif"}
                                        width={200}
                                        height={200}
                                        alt="the cooks"
                                        style={{ borderRadius: "12px" }}
                                    />
                                </VStack>
                            </VStack>
                        </ModalBody>
                    </ModalContent>
                </Modal>
            </>
        );
    }

    let asset_name = collection.nft_name + " #" + (assignment_data.nft_index + 1).toString();
    let image_url = "";
    let description = "";

    if (asset !== null) {
        asset_name = asset.name;
    }
    if (asset_image !== null) {
        if (asset_image["name"] !== undefined) {
            asset_name = asset_image["name"];
        }
        if (asset_image["description"] !== undefined) {
            description = asset_image["description"];
        }
        image_url = asset_image["image"];
    }

    let attributes = asset === null ? [] : asset.attributes === undefined ? [] : filterAttributes(asset.attributes.attributeList);

    //console.log("image_url: ", asset.current.attributes.attributeList, asset_image.current);

    let globalLoading = isLoading || isMintLoading || isMintRandomLoading;
    //console.log("globalLoading: ", globalLoading, isLoading, isMintLoading, isMintRandomLoading);

    return (
        <>
            <Modal size="md" isCentered isOpen={isWarningOpened} onClose={closeWarning} motionPreset="slideInBottom">
                <ModalOverlay />

                <ModalContent h={height} w={width} style={{ background: "transparent" }}>
                    <ModalBody
                        bg={curated ? "url(/curatedLaunches/pepemon/vertical.png)" : "url(/images/terms-container.png)"}
                        bgSize={curated ? "cover" : "contain"}
                        bgRepeat={!curated && "no-repeat"}
                        p={sm ? 10 : 14}
                    >
                        <VStack h="100%" position="relative">
                            {success && (
                                <VStack spacing={!curated && 5}>
                                    <Text
                                        m={0}
                                        align="center"
                                        fontSize={curated ? 40 : "large"}
                                        style={{
                                            fontFamily: style.fontFamily,
                                            color: style.fontColor,
                                            fontWeight: "semibold",
                                        }}
                                    >
                                        {curated ? "Successfully caught" : "New NFT Received!"}
                                    </Text>
                                    <Text
                                        m={curated && 0}
                                        align="center"
                                        fontSize={curated ? 40 : "large"}
                                        style={{
                                            fontFamily: style.fontFamily,
                                            color: style.fontColor,
                                            fontWeight: "semibold",
                                        }}
                                    >
                                        {asset_name}
                                    </Text>
                                    {/* )} */}
                                </VStack>
                            )}
                            {failed && (
                                <Text
                                    align="center"
                                    fontSize={curated ? 50 : "large"}
                                    style={{
                                        fontFamily: style.fontFamily,
                                        color: style.fontColor,
                                        fontWeight: "semibold",
                                    }}
                                >
                                    {curated ? "PEPEMON ESCAPED" : "No NFT Received!"}
                                </Text>
                            )}
                            {checking && (
                                <Text
                                    align="center"
                                    fontSize={curated ? 50 : "large"}
                                    style={{
                                        fontFamily: style.fontFamily,
                                        color: style.fontColor,
                                        fontWeight: "semibold",
                                    }}
                                >
                                    {curated ? "ATTEMPTING CATCH" : "Check your NFT!"}
                                </Text>
                            )}
                            <VStack align="center" fontFamily="ReemKufiRegular">
                                {checking && (
                                    <img
                                        loading="lazy"
                                        src={style.check_image}
                                        width={200}
                                        height={200}
                                        alt="the cooks"
                                        style={{ borderRadius: "12px" }}
                                    />
                                )}
                                {failed && (
                                    <Image
                                        loading="lazy"
                                        src={style.failed_image}
                                        width={width}
                                        height={height}
                                        alt="the cooks"
                                        style={{ borderRadius: "12px" }}
                                    />
                                )}

                                {success && image_url && (
                                    <img
                                        loading="lazy"
                                        src={image_url}
                                        width={200}
                                        height={200}
                                        alt="the cooks"
                                        style={{ borderRadius: "12px" }}
                                    />
                                )}
                            </VStack>
                            <Text
                                m={0}
                                fontSize={curated ? "25" : "10"}
                                align="center"
                                style={{
                                    fontFamily: style.fontFamily,
                                    color: style.fontColor,
                                    fontWeight: "semibold",
                                }}
                            >
                                {description}
                            </Text>
                            {attributes.length > 0 && (
                                <VStack spacing={curated ? 0 : 4} mt={4}>
                                    {attributes.map((attribute, index) => (
                                        <Text
                                            key={index}
                                            m={0}
                                            fontSize={curated ? 35 : "medium"}
                                            style={{
                                                fontFamily: style.fontFamily,
                                                color: style.fontColor,
                                                fontWeight: "semibold",
                                            }}
                                        >
                                            {attribute.key} : {attribute.value}
                                        </Text>
                                    ))}
                                </VStack>
                            )}
                            {curated && checking && (
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
                                    }}
                                    onClick={(e) => {
                                        if (collection.collection_meta["__kind"] === "RandomFixedSupply") {
                                            MintNFT();
                                        }
                                        if (collection.collection_meta["__kind"] === "RandomUnlimited") {
                                            MintRandom();
                                        }
                                    }}
                                >
                                    {globalLoading ? (
                                        <Spinner />
                                    ) : (
                                        <Text m={0} fontWeight={500} fontSize={35} className="font-face-pk">
                                            Check
                                        </Text>
                                    )}
                                </div>
                            )}
                            {!curated && checking && (
                                <VStack>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            if (collection.collection_meta["__kind"] === "RandomFixedSupply") {
                                                MintNFT();
                                            }
                                            if (collection.collection_meta["__kind"] === "RandomUnlimited") {
                                                MintRandom();
                                            }
                                        }}
                                        className={`${styles.nextBtn} font-face-kg`}
                                    >
                                        {globalLoading ? <Spinner /> : "Check"}
                                    </button>
                                </VStack>
                            )}
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}
