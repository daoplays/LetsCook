import { VStack, Text, Grid, GridItem, Box, Spinner, Flex, useDisclosure } from "@chakra-ui/react";
import { Modal, ModalOverlay, ModalContent, ModalBody } from "@chakra-ui/react";
import Image from "next/image";
import { CSSProperties, useState } from "react";
import { AssetV1, Attribute } from "@metaplex-foundation/mpl-core";
import { PublicKey } from "@solana/web3.js";
import { FaEye } from "react-icons/fa";
import useListNFT from "@/hooks/collections/useListNFT";
import { useWallet } from "@solana/wallet-adapter-react";
import useUnlistNFT from "@/hooks/collections/useUnlistNFT";
import { lamportsToSol } from "@/utils/lamportToSol";
import { AssetWithMetadata } from "@/pages/collection/[pageName]";
import {  NFTListingData } from "@/components/collection/collectionState";
import { Button } from "@/components/ui/button";
import { Config } from "@/components/Solana/constants";
import ViewNFTDetails from "./viewNftDetails";
import { Loader2 } from "lucide-react";
import useResponsive from "@/hooks/useResponsive";
import { CollectionData } from "@letscook/sdk/dist/state/collections";

interface MyNFTsPanelProps {
    ownedNFTs?: AssetWithMetadata[];
    listedNFTs: AssetWithMetadata[];
    allListings?: NFTListingData[];
    collection: CollectionData;
}

function MyNFTsPanel({ ownedNFTs, listedNFTs, allListings, collection }: MyNFTsPanelProps) {
    const { sm } = useResponsive();
    const wallet = useWallet();
    const [selectedNFT, setSelectedNFT] = useState<AssetWithMetadata | null>(null);
    const [isNFTListed, setIsNFTListed] = useState(false);
    const [nftPrice, setNftPrice] = useState(0);
    const [nftIndex, setNftIndex] = useState(0);

    const [hoveredIndex, setHoveredIndex] = useState(null);

    const handleMouseEnter = (index) => setHoveredIndex(index);
    const handleMouseLeave = () => setHoveredIndex(null);

    const { UnlistNFT, isLoading: isUnlistLoading } = useUnlistNFT(collection);
    const { isOpen: isViewDetailsOpened, onOpen: openViewDetailsModal, onClose: closeViewDetailsModal } = useDisclosure();

    const handleNFTClick = (nft: AssetWithMetadata, isListed: boolean, price?: number, index?: number) => {
        setNftIndex(index);
        setNftPrice(price);
        setIsNFTListed(isListed);
        setSelectedNFT(nft);
        openViewDetailsModal();
    };

    // Extract public keys of NFTs listed by the owner
    const ownerListedNFTPubkeys = wallet.connected
        ? allListings?.filter((listing) => listing?.seller.equals(wallet.publicKey)).map((listing) => listing.asset) || []
        : [];

    // Filter `listedNFTs` to include only those listed by the owner
    const ownerListedNFTs = wallet.connected
        ? listedNFTs.filter((nft) => ownerListedNFTPubkeys.some((pubkey) => pubkey.equals(new PublicKey(nft.asset.publicKey))))
        : [];

    return (
        <>
            <main className="w-full">
                <VStack h="100%" position="relative" overflowY="auto">
                    {ownedNFTs.length > 0 || ownerListedNFTs.length > 0 ? (
                        <Flex w={"100%"} wrap={"wrap"} gap={4} justify={"center"} align={"start"}>
                            {[
                                ...ownerListedNFTs
                                    .filter(
                                        (listedNFT) =>
                                            !ownedNFTs.some((ownedNFT) => ownedNFT.asset.publicKey === listedNFT.asset.publicKey),
                                    )
                                    .sort((a, b) => {
                                        const listingDataA = allListings?.find((listing) =>
                                            new PublicKey(a.asset.publicKey).equals(listing.asset),
                                        );
                                        const listingDataB = allListings?.find((listing) =>
                                            new PublicKey(b.asset.publicKey).equals(listing.asset),
                                        );

                                        const priceA = listingDataA ? parseFloat(listingDataA.price.toString()) : Infinity;
                                        const priceB = listingDataB ? parseFloat(listingDataB.price.toString()) : Infinity;

                                        return priceA - priceB;
                                    }),
                                ...ownedNFTs,
                            ].map((nft, index) => {
                                // Check if the current NFT is listed
                                const isListed = ownerListedNFTs.some((listedNFT) => listedNFT.asset.publicKey === nft.asset.publicKey);

                                const listingData = allListings?.find((listing) => {
                                    const assetKey = new PublicKey(nft.asset.publicKey);
                                    const listingKey = listing.asset;

                                    return assetKey.equals(listingKey);
                                });

                                const price = listingData ? listingData.price.toString() : "Unavailable";

                                const nftIndex = listedNFTs.indexOf(nft);

                                return (
                                    <GridItem key={`nft-${index}`}>
                                        <div className="flex flex-col gap-2">
                                            <Box
                                                style={gridItemStyle}
                                                className="relative"
                                                onMouseEnter={() => handleMouseEnter(index)}
                                                onMouseLeave={handleMouseLeave}
                                            >
                                                {isListed && (
                                                    <span className="absolute bottom-2 right-2 mt-2 flex items-center justify-center gap-1 rounded-lg bg-black/50 px-2 py-1 shadow-lg ring-1 ring-white/10 backdrop-blur-sm md:px-3 md:py-2">
                                                        <p className="text-sm font-semibold text-white md:text-[1rem]">
                                                            {lamportsToSol(price)}
                                                        </p>
                                                        <div className="flex items-center text-white">
                                                            <div className="w-4 drop-shadow-md md:w-6">
                                                                <Image
                                                                    src={Config.token_image}
                                                                    width={sm ? 18 : 23}
                                                                    height={sm ? 18 : 23}
                                                                    alt={Config.token}
                                                                    className="rounded-full"
                                                                />
                                                            </div>
                                                        </div>
                                                    </span>
                                                )}

                                                <Image
                                                    src={nft.metadata["image"]}
                                                    width={sm ? 120 : 200}
                                                    height={sm ? 120 : 200}
                                                    style={{ borderRadius: "16px" }}
                                                    alt="nftImage"
                                                />
                                                <VStack
                                                    style={{
                                                        ...overlayVisibleStyle,
                                                        display: hoveredIndex === index ? "flex" : "none",
                                                    }}
                                                    onClick={() => {
                                                        handleNFTClick(nft, isListed, parseFloat(price), nftIndex);
                                                    }}
                                                >
                                                    <Text m={0} lineHeight={0.75} align="center" fontSize="large">
                                                        {nft.asset.name}
                                                    </Text>
                                                    <FaEye />
                                                </VStack>
                                            </Box>

                                            {isListed ? (
                                                // Unlist button if the NFT is listed
                                                <Button
                                                    className={`w-full rounded-xl bg-[#FFE376] py-4 text-lg font-semibold text-[#BA6502] hover:bg-[#FFE376]/85`}
                                                    size="lg"
                                                    onClick={async () => {
                                                        await UnlistNFT(new PublicKey(nft.asset.publicKey), nftIndex);
                                                    }}
                                                    disabled={isUnlistLoading}
                                                >
                                                    {isUnlistLoading ? <Loader2 className="mx-auto animate-spin" /> : "Unlist"}
                                                </Button>
                                            ) : (
                                                // List button if the NFT is not listed
                                                <Button
                                                    className={`w-full rounded-xl bg-[#FFE376] py-4 text-lg font-semibold text-[#BA6502] hover:bg-[#FFE376]/85`}
                                                    size="lg"
                                                    onClick={() => {
                                                        handleNFTClick(nft, isListed);
                                                    }}
                                                >
                                                    List
                                                </Button>
                                            )}
                                        </div>
                                    </GridItem>
                                );
                            })}
                        </Flex>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center">
                            <span className="mx-auto text-xl font-semibold text-white opacity-50">
                                You Don&apos;t Have Any {collection.nft_name}
                            </span>
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
                        setNftPrice(nftPrice);
                    }}
                    collection={collection}
                    nft={selectedNFT}
                    isNFTListed={isNFTListed}
                    nftPrice={nftPrice}
                    nftIndex={nftIndex}
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
                <Image src={asset.metadata["image"]} width={280} height={280} style={{ borderRadius: "16px" }} alt="nftImage" />
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
    borderRadius: "16px",
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
    borderRadius: "16px",
    opacity: 0,
    transition: "opacity 0.3s ease",
};

const overlayVisibleStyle = {
    ...overlayStyle,
    opacity: 1,
};
export default MyNFTsPanel;
