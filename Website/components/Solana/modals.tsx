import { Dispatch, SetStateAction, MutableRefObject } from "react";
import { Box, Button, Center, HStack, Link, Spinner, Text, VStack } from "@chakra-ui/react";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton } from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";
import { LaunchData } from "./state";
import useBuyTickets from "../../hooks/useBuyTickets";
import { AssetV1, Attribute } from "@metaplex-foundation/mpl-core";
import { PublicKey } from "@solana/web3.js";
import { AssignmentData, CollectionData } from "../collection/collectionState";
import useMintNFT from "../../hooks/collections/useMintNFT";
import styles from "../../styles/LaunchDetails.module.css";
import { SYSTEM_KEY } from "./constants";
import Image from "next/image";

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
    asset: MutableRefObject<AssetV1>;
    asset_image: MutableRefObject<string>;
    assignment_data: AssignmentData;
    style: ReceivedAssetModalStyle;
    curated?: boolean;
}

export interface ReceivedAssetModalStyle {
    fontFamily: string,
    fontColor: string
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
}: RecievedAssetModalProps) {
    const { sm } = useResponsive();
    const { MintNFT, isLoading: isMintLoading } = useMintNFT(collection);

    function filterAttributes(attributes) {
        return attributes.filter(function (item: Attribute) {
            return item.key !== "Number";
        });
    }

    if (assignment_data === null) return <></>;

    let asset_name = collection.nft_name + " #" + (assignment_data.nft_index + 1).toString();
    let image_url = "";

    if (asset.current !== null) {
        asset_name = asset.current.name;
    }
    if (asset_image.current !== null) {
        if (asset_image.current["name"] !== undefined) {
            asset_name = asset_image.current["name"];
        }
        image_url = asset_image.current["image"];
    }

    let attributes =
        asset.current === null
            ? []
            : asset.current.attributes === undefined
              ? []
              : filterAttributes(asset.current.attributes.attributeList);
              
    //console.log("image_url: ", asset.current.attributes.attributeList, asset_image.current);

    let success = !assignment_data.nft_address.equals(SYSTEM_KEY);
    let failed = assignment_data.nft_address.equals(SYSTEM_KEY);

    return (
        <>
            <Modal size="md" isCentered isOpen={isWarningOpened} onClose={closeWarning} motionPreset="slideInBottom">
                <ModalOverlay />

                <ModalContent
                    h={sm && curated && success ? 570 : curated && success ? 620 : sm && curated && failed ? 350 : curated ? 450 : 585}
                    w={sm && curated && success ? 420 : curated && success ? 620 : sm && curated && failed ? 350 : curated ? 450 : 450}
                    style={{ background: "transparent" }}
                >
                    <ModalBody
                        bg={
                            curated && failed
                                ? "url(/curatedLaunches/pepemon/escaped.png)"
                                : curated
                                  ? "url(/curatedLaunches/pepemon/vertical.png)"
                                  : "url(/images/terms-container.png)"
                        }
                        bgSize={curated ? "cover" : "contain"}
                        bgRepeat={!curated && "no-repeat"}
                        p={sm ? 10 : 14}
                    >
                        <VStack h="100%" position="relative">
                            {failed && !curated && (
                                <Text
                                    align="center"
                                    fontSize={curated ? 40 : "large"}
                                    style={{
                                        fontFamily: style.fontFamily,
                                        color: style.fontColor,
                                        fontWeight: "semibold",
                                    }}
                                >
                                    No NFT Received!
                                </Text>
                            )}

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
                                        {curated ? "Successfully Caught" : "New NFT Received!"}
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
                                </VStack>
                            )}

                            <VStack align="center" fontFamily="ReemKufiRegular">
                                {failed && !curated && (
                                    <img
                                        src="/images/cooks.jpeg"
                                        width={200}
                                        height={200}
                                        alt="the cooks"
                                        style={{ borderRadius: "12px" }}
                                    />
                                )}

                                {success && (
                                    <img src={image_url} width={200} height={200} alt="the cooks" style={{ borderRadius: "12px" }} />
                                )}
                            </VStack>
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

                            {collection.collection_meta["__kind"] === "RandomFixedSupply" && assignment_data.status !== 0 && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        MintNFT();
                                    }}
                                    className={`${styles.nextBtn} font-face-kg `}
                                >
                                    {isMintLoading ? <Spinner /> : "Mint"}
                                </button>
                            )}

                            {!curated && (
                                <Text
                                    m={0}
                                    align="center"
                                    fontSize={sm ? "medium" : "medium"}
                                    style={{
                                        fontFamily: "KGSummerSunshineBlackout",
                                        color: "red",
                                        cursor: "pointer",
                                        position: "absolute",
                                        bottom: 0,
                                    }}
                                    onClick={closeWarning}
                                >
                                    Close
                                </Text>
                            )}
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}
