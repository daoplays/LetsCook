import { VStack, Text, Grid, GridItem, Box, Spinner, Flex, useDisclosure } from "@chakra-ui/react";
import { Modal, ModalOverlay, ModalContent, ModalBody } from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";
import { CSSProperties, useState } from "react";
import { AssetV1, Attribute } from "@metaplex-foundation/mpl-core";
import useWrapNFT from "../../hooks/collections/useWrapNFT";
import { CollectionData, NFTListingData } from "./collectionState";
import { PublicKey } from "@solana/web3.js";
import { AssetWithMetadata } from "../../pages/collection/[pageName]";
import { Button } from "../ui/button";
import { FaEye } from "react-icons/fa";
import useListNFT from "@/hooks/collections/useListNFT";
import ViewNFTDetails from "./viewNftDetails";
import { useWallet } from "@solana/wallet-adapter-react";
import useUnlistNFT from "@/hooks/collections/useUnlistNFT";

interface MyNFTsPanelProps {
    ownedNFTs?: AssetWithMetadata[];
    listedNFTs: AssetWithMetadata[];
    allListings?: NFTListingData[];
    collection: CollectionData;
}

function MyNFTsPanel({ ownedNFTs, listedNFTs, allListings, collection }: MyNFTsPanelProps) {
    const wallet = useWallet();
    const [selectedNFT, setSelectedNFT] = useState<AssetWithMetadata | null>(null);
    const [isNFTListed, setIsNFTListed] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const handleMouseEnter = (index) => setHoveredIndex(index);
    const handleMouseLeave = () => setHoveredIndex(null);

    const { UnlistNFT } = useUnlistNFT(collection);
    const { isOpen: isViewDetailsOpened, onOpen: openViewDetailsModal, onClose: closeViewDetailsModal } = useDisclosure();

    const handleNFTClick = (nft: AssetWithMetadata, isListed: boolean) => {
        setIsNFTListed(isListed);
        setSelectedNFT(nft);
        openViewDetailsModal();
    };

    // Extract public keys of NFTs listed by the owner
    const ownerListedNFTPubkeys =
        allListings?.filter((listing) => listing.seller.equals(wallet.publicKey)).map((listing) => listing.asset) || [];

    // Filter `listedNFTs` to include only those listed by the owner
    const ownerListedNFTs = listedNFTs.filter((nft) =>
        ownerListedNFTPubkeys.some((pubkey) => pubkey.equals(new PublicKey(nft.asset.publicKey))),
    );

    return (
        <>
            <main>
                <VStack h="100%" position="relative" overflowY="auto">
                    {ownedNFTs.length > 0 || ownerListedNFTs.length > 0 ? (
                        <Flex w={"100%"} wrap={"wrap"} gap={10} justify={"center"} align={"center"}>
                            {[
                                ...ownedNFTs,
                                ...ownerListedNFTs.filter(
                                    (listedNFT) => !ownedNFTs.some((ownedNFT) => ownedNFT.asset.publicKey === listedNFT.asset.publicKey),
                                ),
                            ].map((nft, index) => {
                                // Check if the current NFT is listed
                                const isListed = ownerListedNFTs.some((listedNFT) => listedNFT.asset.publicKey === nft.asset.publicKey);

                                // Find the price of the listed NFT if it is listed
                                const listingData = allListings?.find(
                                    (listing) =>
                                        listing.asset === new PublicKey(nft.asset.publicKey) && listing.seller === wallet.publicKey,
                                );
                                const price = listingData?.price;

                                return (
                                    <GridItem key={`nft-${index}`}>
                                        <VStack>
                                            <Box
                                                style={gridItemStyle}
                                                onMouseEnter={() => handleMouseEnter(index)}
                                                onMouseLeave={handleMouseLeave}
                                            >
                                                <Image
                                                    src={nft.metadata["image"]}
                                                    width={180}
                                                    height={180}
                                                    style={{ borderRadius: "8px" }}
                                                    alt="nftImage"
                                                />
                                                <VStack
                                                    style={{
                                                        ...overlayVisibleStyle,
                                                        display: hoveredIndex === index ? "flex" : "none",
                                                    }}
                                                    onClick={() => {
                                                        handleNFTClick(nft, isListed);
                                                    }}
                                                >
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
                                                        {nft.asset.name}
                                                    </Text>
                                                    <FaEye />
                                                </VStack>
                                            </Box>
                                            {isListed ? (
                                                // Unlist button if the NFT is listed
                                                <Button
                                                    className="mt-2 transition-all hover:opacity-90"
                                                    size="lg"
                                                    onClick={() => {
                                                        UnlistNFT(new PublicKey(nft.asset.publicKey), price);
                                                    }}
                                                >
                                                    Unlist
                                                </Button>
                                            ) : (
                                                // List button if the NFT is not listed
                                                <Button
                                                    className="mt-2 transition-all hover:opacity-90"
                                                    size="lg"
                                                    onClick={() => {
                                                        handleNFTClick(nft, isListed);
                                                    }}
                                                >
                                                    List
                                                </Button>
                                            )}
                                        </VStack>
                                    </GridItem>
                                );
                            })}
                        </Flex>
                    ) : (
                        <div className="my-4 flex flex-col gap-2">
                            <Text className="text-center text-xl font-semibold text-white opacity-50 lg:text-2xl">
                                You don&apos;t have any {collection.nft_name}
                            </Text>
                        </div>
                    )}
                </VStack>
            </main>

            {selectedNFT && (
                <ViewNFTDetails
                    isOpened={isViewDetailsOpened}
                    onClose={() => {
                        closeViewDetailsModal();
                        setSelectedNFT(null);
                        setIsNFTListed(null);
                    }}
                    collection={collection}
                    nft={selectedNFT}
                    isNFTListed={isNFTListed}
                />
            )}
        </>
    );
}

const Attributes = ({ asset }: { asset: AssetWithMetadata }) => {
    // let attributes = asset.asset.attributes.attributeList;
    let asset_name = asset.metadata["name"] ? asset.metadata["name"] : asset.asset.name;
    let asset_Attribute = asset.metadata["attributes"] ? asset.metadata["attributes"] : null;
    return (
        <>
            <div className="flex w-full items-start justify-center gap-4 text-white">
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
export default MyNFTsPanel;
