import { VStack, Text, Grid, GridItem, Box, Spinner, Flex, useDisclosure } from "@chakra-ui/react";
import { Modal, ModalOverlay, ModalContent, ModalBody } from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";
import { CSSProperties, useState } from "react";
import { AssetV1, Attribute } from "@metaplex-foundation/mpl-core";
import useWrapNFT from "../../hooks/collections/useWrapNFT";
import { CollectionData } from "../../components/collection/collectionState";
import { PublicKey } from "@solana/web3.js";
import { AssetWithMetadata } from "../../pages/collection/[pageName]";
import { Button } from "../ui/button";
import NftCollectionTab from "./nftCollectionTab";

interface RecievedAssetModalProps {
    assets: AssetWithMetadata[];
    collection: CollectionData;
    actionTypeData: string;
}

function ViewCollection({ assets, collection, actionTypeData }: RecievedAssetModalProps) {
    const { xs, sm } = useResponsive();
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [seeAttribute, setSeeAttribute] = useState(false);
    const [hasAction, setHasAction] = useState(false);
    const [actionType, setActionType] = useState(actionTypeData);
    const [activeAsset, setActiveAsset] = useState();
    const { WrapNFT } = useWrapNFT(collection);

    const userHasCollection = assets.length > 0;

    const listNft = (activeAsset) => {
        setActiveAsset(activeAsset);
        setHasAction(true);
        openReleaseModal();
    };
    const checkAttribute = (activeAsset) => {
        setActiveAsset(activeAsset);
        setHasAction(false);
        openReleaseModal();
    };
    const [loadingStates, setLoadingStates] = useState(Array(assets.length).fill(false));
    const { isOpen: isReleaseModalOpen, onOpen: openReleaseModal, onClose: closeReleaseModal } = useDisclosure();

    const GridEntry = ({ asset, index }: { asset: AssetWithMetadata; index: number }) => {
        // let attributes = asset.asset.attributes.attributeList;
        let asset_name = asset.metadata["name"] ? asset.metadata["name"] : asset.asset.name;
        console.log(asset);
        return (
            <>
                <Image src={asset.metadata["image"]} width={180} height={180} style={{ borderRadius: "8px" }} alt="nftImage" />
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
                </VStack>
            </>
        );
    };

    const Attributes = ({ asset }: { asset: AssetWithMetadata }) => {
        // let attributes = asset.asset.attributes.attributeList;
        let asset_name = asset.metadata["name"] ? asset.metadata["name"] : asset.asset.name;
        let asset_Attribute = asset.metadata["attributes"] ? asset.metadata["attributes"] : null;
        return (
            <>
                <div className="flex items-start justify-center w-full gap-4 text-white">
                    <Image src={asset.metadata["image"]} width={280} height={280} style={{ borderRadius: "8px" }} alt="nftImage" />
                    <div className="flex flex-col gap-3">
                        <span>Asset name: {asset_name}</span>
                        {asset_Attribute !== null &&
                            asset_Attribute.map((value, index) => (
                                <span key={index}>
                                    {value.trait_type}: {value["value"]}
                                </span>
                            ))}
                    </div>
                </div>
            </>
        );
    };

    return (
        <main>
            <VStack
                h="100%"
                position="relative"
                overflowY="auto"
                // style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
            >
                {userHasCollection ? (
                    <Flex w={"100%"} wrap={"wrap"} gap={10} justify={"center"} align={"center"}>
                        {assets.map((asset, index) => (
                            <GridItem key={index}>
                                <VStack>
                                    <Box
                                        key={index}
                                        style={gridItemStyle}
                                        onMouseEnter={() => setHoveredIndex(index)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                        onClick={() => checkAttribute(asset)}
                                    >
                                        <GridEntry asset={asset} index={index} />
                                    </Box>
                                    <Button className="mt-2 transition-all hover:opacity-90" size="lg" onClick={() => listNft(asset)}>
                                        {loadingStates[index] ? <Spinner /> : actionTypeData}
                                    </Button>
                                </VStack>
                            </GridItem>
                        ))}
                    </Flex>
                ) : (
                    <div className="flex flex-col gap-2 my-4">
                        <Text className="text-xl font-semibold text-center text-white opacity-50 lg:text-2xl">
                            You don&apos;t have any {collection.nft_name}
                        </Text>
                    </div>
                )}
            </VStack>
            {activeAsset !== null && (
                <NftCollectionTab isOpened={isReleaseModalOpen} onClose={closeReleaseModal} asset={activeAsset} action={hasAction} actionType={actionType} />
            )}
        </main>
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
export default ViewCollection;
