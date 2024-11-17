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
import { Config } from "../Solana/constants";
import { lamportsToSol } from "@/utils/lamportToSol";
import { SlOptionsVertical } from "react-icons/sl";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarTrigger } from "../ui/menubar";
import TransferNft from "./transferNFT";

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

    const { UnlistNFT } = useUnlistNFT(collection);
    const { isOpen: isViewDetailsOpened, onOpen: openViewDetailsModal, onClose: closeViewDetailsModal } = useDisclosure();
    const { isOpen: isTransferNftOpened, onOpen: openTransferNftModal, onClose: closeTransferNftModal } = useDisclosure();

    const { WrapNFT, isLoading: isWrapLoading } = useWrapNFT(collection);
    const handleNFTClick = (nft: AssetWithMetadata, isListed: boolean, price?: number, index?: number) => {
        setNftIndex(index);
        setNftPrice(price);
        setIsNFTListed(isListed);
        setSelectedNFT(nft);
        openViewDetailsModal();
    };

    const handleTransferNFTClick = (nft: AssetWithMetadata) => {
        setSelectedNFT(nft);
        openTransferNftModal();
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
            <main>
                <VStack h="100%" position="relative" overflowY="auto">
                    {ownedNFTs.length > 0 || ownerListedNFTs.length > 0 ? (
                        <Flex w={"100%"} wrap={"wrap"} gap={10} justify={"center"} align={"start"}>
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

                                        return priceB - priceA;
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

                                const nftAssetKey = new PublicKey(nft.asset.publicKey);
                                return (
                                    <GridItem key={`nft-${index}`}>
                                        <VStack>
                                            <Box
                                                style={gridItemStyle}
                                                onMouseEnter={() => handleMouseEnter(index)}
                                                onMouseLeave={handleMouseLeave}
                                            >
                                                <div className="relative">
                                                    {!isListed && (
                                                        <Menubar className="absolute right-0 top-0 z-10 m-1 cursor-pointer rounded-md bg-[rgba(0,0,0,0.5)] text-white">
                                                            <MenubarMenu>
                                                                <MenubarTrigger>
                                                                    <SlOptionsVertical className="text-sm"/>
                                                                </MenubarTrigger>
                                                                <MenubarContent>
                                                                    <MenubarItem onClick={()=>WrapNFT(nftAssetKey)}>Unwrap</MenubarItem>
                                                                    <MenubarItem onClick={() => handleTransferNFTClick(nft)}>
                                                                        Transfer
                                                                    </MenubarItem>
                                                                </MenubarContent>
                                                            </MenubarMenu>
                                                        </Menubar>
                                                    )}
                                                    <Image
                                                        src={nft.metadata["image"]}
                                                        width={180}
                                                        height={180}
                                                        style={{ borderRadius: "8px" }}
                                                        alt="nftImage"
                                                    />
                                                    {isListed && (
                                                        <div className="absolute bottom-0 right-0">
                                                            <span className="absolute flex items-center justify-center gap-1 px-2 py-1 mt-2 rounded-lg shadow-lg bottom-2 right-2 bg-black/50 ring-1 ring-white/10 backdrop-blur-sm md:px-3 md:py-2">
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
                                                        </div>
                                                    )}
                                                </div>
                                                <VStack
                                                    style={{
                                                        ...overlayVisibleStyle,
                                                        display: hoveredIndex === index ? "flex" : "none",
                                                    }}
                                                    onClick={() => {
                                                        handleNFTClick(nft, isListed, price, nftIndex);
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
                                                    className="w-full mt-2 transition-all rounded-md hover:opacity-90"
                                                    size="lg"
                                                    onClick={async () => {
                                                        await UnlistNFT(new PublicKey(nft.asset.publicKey), nftIndex);
                                                    }}
                                                >
                                                    Unlist
                                                </Button>
                                            ) : (
                                                // List button if the NFT is not listed
                                                <Button
                                                    className="w-full mt-2 transition-all rounded-md hover:opacity-90"
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
                        <div className="flex flex-col gap-2 my-4">
                            <Text className="text-xl font-semibold text-center text-white opacity-25">
                                You Don&apos;t Have Any {collection.nft_name}
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
                        setNftPrice(nftPrice);
                    }}
                    collection={collection}
                    nft={selectedNFT}
                    isNFTListed={isNFTListed}
                    nftPrice={nftPrice}
                    nftIndex={nftIndex}
                />
            )}
            <TransferNft
                isOpened={isTransferNftOpened}
                onClose={() => {
                    closeTransferNftModal();
                }}
                collection={collection}
                nft={selectedNFT}
            />
        </>
    );
}

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
