import { VStack, Text, Grid, GridItem, Button, Box, Spinner } from "@chakra-ui/react";
import { Modal, ModalOverlay, ModalContent, ModalBody } from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";
import { CSSProperties, useState } from "react";
import { AssetV1, Attribute } from "@metaplex-foundation/mpl-core";
import useWrapNFT from "../../hooks/collections/useWrapNFT";
import { PublicKey } from "@solana/web3.js";
import { AssetWithMetadata } from "../collection/[pageName]";
import { CollectionData } from "@letscook/sdk/dist/state/collections";

interface RecievedAssetModalProps {
    isOpened: boolean;
    onClose: () => void;
    assets: AssetWithMetadata[];
    collection: CollectionData;
}

export function CollectionReleaseModal({ isOpened, onClose, assets, collection }: RecievedAssetModalProps) {
    const { xs, sm } = useResponsive();
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const { WrapNFT } = useWrapNFT(collection);

    const userHasPepemon = assets.length > 0;

    const [loadingStates, setLoadingStates] = useState(Array(assets.length).fill(false));

    const GridEntry = ({ asset, index }: { asset: AssetWithMetadata; index: number }) => {
        // let attributes = asset.asset.attributes.attributeList;
        let asset_name = asset.metadata["name"] ? asset.metadata["name"] : asset.asset.name;
        return (
            <>
                <Image src={asset.metadata["image"]} width={110} height={110} style={{ borderRadius: "8px" }} alt="nftImage" />
                <VStack style={hoveredIndex === index ? overlayVisibleStyle : overlayStyle}>
                    <Text
                        m={0}
                        lineHeight={0.75}
                        align="center"
                        fontSize="large"
                        style={{
                            fontFamily: "pokemon",
                            color: "white",
                            fontWeight: "semibold",
                        }}
                    >
                        {asset_name}
                    </Text>
                    {/*
                    <Text
                        m={0}
                        lineHeight={0.75}
                        align="center"
                        fontSize="x-large"
                        style={{
                            fontFamily: "pokemon",
                            color: "white",
                            fontWeight: "semibold",
                        }}
                    >
                        EV: {attributes[2].value}
                    </Text>
                    <Text
                        m={0}
                        lineHeight={0.75}
                        align="center"
                        fontSize="x-large"
                        style={{
                            fontFamily: "pokemon",
                            color: "white",
                            fontWeight: "semibold",
                        }}
                    >
                        IV: {attributes[3].value}
                    </Text>
                    */}
                </VStack>
            </>
        );
    };

    return (
        <>
            <Modal size="lg" isCentered isOpen={isOpened} onClose={onClose} motionPreset="slideInBottom">
                <ModalOverlay />

                <ModalContent h={xs ? 520 : 615} w={xs ? 380 : 800} style={{ background: "transparent" }}>
                    <ModalBody
                        className="bg-[#161616] bg-opacity-75 bg-clip-padding shadow-2xl backdrop-blur-sm backdrop-filter md:rounded-xl md:border-t-[3px] md:border-orange-700"
                        overflowY="auto"
                        style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
                        py={9}
                        pb={16}
                    >
                        <VStack
                            h="100%"
                            position="relative"
                            overflowY="auto"
                            // style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
                        >
                            <div className="mb-4 flex flex-col gap-2">
                                <Text className="text-center text-3xl font-semibold text-white lg:text-4xl">Your NFTs</Text>
                            </div>
                            {userHasPepemon ? (
                                <Grid templateColumns="repeat(3, 1fr)" gap={4} pb={1}>
                                    {assets.map((asset, index) => (
                                        <GridItem key={index}>
                                            <VStack>
                                                <Box
                                                    key={index}
                                                    style={gridItemStyle}
                                                    onMouseEnter={() => setHoveredIndex(index)}
                                                    onMouseLeave={() => setHoveredIndex(null)}
                                                >
                                                    <GridEntry asset={asset} index={index} />
                                                </Box>
                                            </VStack>
                                        </GridItem>
                                    ))}
                                </Grid>
                            ) : (
                                <></>
                            )}
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}

const gridItemStyle: CSSProperties = {
    position: "relative",
    backgroundColor: "lightgray",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "bold",
    borderRadius: "8px",
    cursor: "pointer",
};

const overlayStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    opacity: 0,
    transition: "opacity 0.3s ease",
};

const overlayVisibleStyle = {
    ...overlayStyle,
    opacity: 1,
};

export default CollectionReleaseModal;
