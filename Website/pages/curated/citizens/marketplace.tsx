import React, { CSSProperties, useState } from "react";
import { VStack, Flex, GridItem, Box, useDisclosure } from "@chakra-ui/react";
import Image from "next/image";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { FaCoins, FaEye } from "react-icons/fa";
import { lamportsToSol } from "@/utils/lamportToSol";
import useResponsive from "@/hooks/useResponsive";
import ViewNFTDetails from "../joy/viewNftDetails";
import useUnlistNFT from "@/hooks/collections/useUnlistNFT";
import useBuyNFT from "@/hooks/collections/useBuyNFT";
import { MarketplaceProps } from "../joy/marketplace";
import { AssetWithMetadata } from "@/pages/collection/[pageName]";
import { Config } from "@/components/Solana/constants";

const gridItemStyle: CSSProperties = {
    position: "relative",
    backgroundColor: "#1C1410",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "bold",
    borderRadius: "16px",
    cursor: "pointer",
    border: "2px solid #3A2618",
};

function Marketplace({ ownedNFTs, listedNFTs, allListings, collection, tab }: MarketplaceProps) {
    const { sm } = useResponsive();
    const wallet = useWallet();
    const [selectedNFT, setSelectedNFT] = useState(null);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [isUserOwned, setIsUserowned] = useState(false);
    const [nftIndex, setNftIndex] = useState(0);

    const { UnlistNFT } = useUnlistNFT(collection);
    const { BuyNFT } = useBuyNFT(collection);
    const { isOpen: isViewDetailsOpened, onOpen: openViewDetailsModal, onClose: closeViewDetailsModal } = useDisclosure();

    const handleMouseEnter = (index) => setHoveredIndex(index);
    const handleMouseLeave = () => setHoveredIndex(null);

    const handleNFTClick = (nft: AssetWithMetadata, isUserOwned: boolean, index: number) => {
        setNftIndex(index);
        setIsUserowned(isUserOwned);
        setSelectedNFT(nft);
        openViewDetailsModal();
    };

    // Filter logic for owned listings
    const ownerListedNFTPubkeys = wallet.connected
        ? allListings?.filter((listing) => listing?.seller.equals(wallet.publicKey)).map((listing) => listing.asset) || []
        : [];

    const ownerListedNFTs = wallet.connected
        ? listedNFTs.filter((nft) => ownerListedNFTPubkeys.some((pubkey) => pubkey.equals(new PublicKey(nft.asset.publicKey))))
        : [];

    return (
        <>
            <div className="flex w-full max-w-7xl flex-col items-center gap-6 p-6">
                {/* Merchant Section */}
                <div className="relative w-full rounded-xl border-2 border-[#3A2618] bg-[#1C1410]/95 p-8 shadow-2xl backdrop-blur-md">
                    <div className="mb-8 flex items-center gap-6 border-b border-[#3A2618] pb-6">
                        <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-[#3A2618] shadow-lg">
                            <Image
                                src="/curatedLaunches/citizens/armsDealer.png"
                                width={96}
                                height={96}
                                alt="Mercenary Merchant"
                                className="scale-110 transform"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <h2 className="font-serif text-xl text-[#C4A484]">Garrett Voss, The Broker</h2>
                            <p className="font-serif italic text-[#8B7355]">
                                &ldquo;Looking for experienced steel? I deal in trained blades... for the right price. Each one tested, each
                                one proven.&rdquo;
                            </p>
                        </div>
                    </div>

                    {/* Marketplace Grid */}
                    {listedNFTs.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {listedNFTs
                                .map((nft, index) => {
                                    const listingData = allListings?.find((listing) => {
                                        const assetKey = new PublicKey(nft.asset.publicKey);
                                        const listingKey = listing.asset;
                                        return assetKey.equals(listingKey);
                                    });
                                    const price = listingData ? parseFloat(listingData.price.toString()) : Infinity;
                                    return { nft, price, nftIndex: index };
                                })
                                .sort((a, b) => a.price - b.price)
                                .map(({ nft, nftIndex, price }) => {
                                    const isUserOwned = ownerListedNFTs.some(
                                        (ownedNFT) => ownedNFT.asset.publicKey === nft.asset.publicKey,
                                    );
                                    let level = "";
                                    let wealth = "";
                                    let attributes = nft.asset.attributes.attributeList
                                    for (let i = 0; i < attributes.length; i++) {
                                        if (attributes[i].key === "Level") {
                                            level = attributes[i].value;
                                        }
                                        if (attributes[i].key === "Wealth") {
                                            wealth = attributes[i].value;
                                        }
                                    }
                                    return (
                                        <div key={`nft-${nftIndex}`} className="flex flex-col gap-4">
                                            <Box
                                                style={gridItemStyle}
                                                onMouseEnter={() => handleMouseEnter(nftIndex)}
                                                onMouseLeave={handleMouseLeave}
                                                className="relative overflow-hidden p-2"
                                            >
                                                {/* Level Banner */}
                                                <div className="absolute -right-8 top-4 z-10 rotate-45 bg-[#8B7355] px-8 py-1 text-sm text-[#1C1410]">
                                                    Level {level}
                                                </div>

                                                {/* Price Tag */}
                                                <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-lg bg-black/60 px-3 py-2 backdrop-blur-sm">
                                                    <span className="font-bold text-[#C4A484]">{lamportsToSol(price.toString())}</span>
                                                    <Image
                                                        src={Config.token_image}
                                                        width={23}
                                                        height={23}
                                                        alt={Config.token}
                                                        className="rounded-full"
                                                    />
                                                </div>

                                                <Image
                                                    src={nft.metadata["image"]}
                                                    width={sm ? 120 : 200}
                                                    height={sm ? 120 : 200}
                                                    alt={nft.metadata["name"] || nft.asset.name}
                                                    className="rounded-xl"
                                                />
                                            </Box>

                                            <div className="rounded-xl border-2 border-[#3A2618] bg-[#1C1410]/95 p-4 backdrop-blur-sm">
                                                <h3 className="mb-2 border-b border-[#3A2618] pb-2 text-lg font-bold text-[#C4A484] text-center">
                                                    {nft.metadata["name"] || nft.asset.name}
                                                </h3>
                                                <div className="text-center flex items-center justify-center gap-2">
                                                    <span className="text-sm text-[#8B7355]">Wealth:</span>
                                                    <span className="text-[#C4A484]">{wealth}</span>
                                                    <FaCoins className="text-[#C4A484] text-sm" />
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    if (isUserOwned) {
                                                        UnlistNFT(new PublicKey(nft.asset.publicKey), nftIndex);
                                                    } else {
                                                        BuyNFT(new PublicKey(nft.asset.publicKey), nftIndex);
                                                    }
                                                }}
                                                className={`w-full transform rounded-lg border-2 border-[#3A2618] bg-gradient-to-b p-3 text-lg font-bold transition-all ${
                                                    isUserOwned
                                                        ? "from-[#A13333] to-[#8B1818] text-[#FFD7D7] hover:from-[#CC4444] hover:to-[#A13333]"
                                                        : "from-[#8B7355] to-[#3A2618] text-[#1C1410] hover:from-[#C4A484] hover:to-[#8B7355]"
                                                } active:scale-95`}
                                            >
                                                {isUserOwned ? "Withdraw Contract" : "Purchase Contract"}
                                            </button>
                                        </div>
                                    );
                                })}
                        </div>
                    ) : (
                        <div className="flex h-40 items-center justify-center rounded-lg border-2 border-[#3A2618] bg-black/20">
                            <p className="font-serif text-lg italic text-[#8B7355]">No mercenaries available for trade at the moment...</p>
                        </div>
                    )}
                </div>
            </div>

            {selectedNFT && (
                <ViewNFTDetails
                    isOpened={isViewDetailsOpened}
                    onClose={() => {
                        closeViewDetailsModal();
                        setSelectedNFT(null);
                        setIsUserowned(false);
                    }}
                    collection={collection}
                    nft={selectedNFT}
                    isNFTListed={isUserOwned}
                    isUserOwned={isUserOwned}
                    tab={tab}
                    nftIndex={nftIndex}
                />
            )}
        </>
    );
}

export default Marketplace;
