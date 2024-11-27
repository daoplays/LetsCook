import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Modal, ModalBody, ModalContent, ModalOverlay, VStack, Text, Spinner } from "@chakra-ui/react";
import useResponsive from "@/hooks/useResponsive";
import useListNFT from "@/hooks/collections/useListNFT";

import { PublicKey } from "@solana/web3.js";
import useUnlistNFT from "@/hooks/collections/useUnlistNFT";
import useBuyNFT from "@/hooks/collections/useBuyNFT";
import { AssetWithMetadata } from "@/pages/collection/[pageName]";
import { CollectionData } from "@/components/collection/collectionState";
import { Config } from "@/components/Solana/constants";
import { Button } from "@/components/ui/button";

interface ViewNFTDetailsModalProps {
    isOpened: boolean;
    onClose: () => void;
    nft?: AssetWithMetadata;
    collection?: CollectionData;
    isNFTListed: boolean;
    isUserOwned?: boolean;
    tab?: string;
    nftPrice?: number;
    nftIndex?: number;
}

function ViewNFTDetails({
    isOpened,
    onClose,
    collection,
    nft,
    isNFTListed,
    tab,
    isUserOwned,
    nftPrice,
    nftIndex,
}: ViewNFTDetailsModalProps) {
    const { xs, sm } = useResponsive();
    const { ListNFT } = useListNFT(collection);
    const { UnlistNFT } = useUnlistNFT(collection);
    const { BuyNFT } = useBuyNFT(collection);

    const [solAmount, setSolAmount] = useState<number>(0);

    let asset_name, asset_Attribute;
    let asset_key: PublicKey | null = null;
    if (nft !== undefined) {
        asset_name = nft.metadata["name"] ? nft.metadata["name"] : nft.asset.name;
        asset_Attribute = nft.metadata["attributes"] ? nft.metadata["attributes"] : null;
        asset_key = nft ? new PublicKey(nft.asset.publicKey.toString()) : null;
    }

    return (
        <Modal isOpen={isOpened} onClose={onClose} isCentered motionPreset="slideInBottom" size="2xl">
            <ModalOverlay className="backdrop-blur-sm" />
            <ModalContent className="bg-transparent">
                <ModalBody className="overflow-hidden p-0">
                    <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-slate-900/80 p-8 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <p className="text-2xl font-semibold text-white">{asset_name}</p>
                            <div className="relative">
                                <button
                                    onClick={onClose}
                                    className="rounded-full bg-white/10 p-2 text-white/70 transition-all hover:bg-white/20 hover:text-white"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 lg:flex-row">
                            <div className="aspect-square rounded-xl">
                                <Image
                                    src={nft?.metadata?.image}
                                    width={300}
                                    height={300}
                                    alt={nft?.metadata?.name || "NFT Image"}
                                    className="rounded-lg"
                                />
                            </div>

                            <div className="flex-grow">
                                <div className="grid grid-cols-2 gap-2">
                                    {nft?.metadata?.attributes?.map((attr, index) => (
                                        <div key={index} className="rounded-xl bg-slate-700/50 px-3 py-[1.3rem] backdrop-blur-sm">
                                            <div className="text-sm text-white/70">{attr.trait_type}</div>
                                            <div className="mt-1 text-lg font-semibold text-white">{attr.value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {!isNFTListed && (
                            <div className="flex flex-col items-center gap-3">
                                {tab !== "Marketplace" && (
                                    <div className="max-w-md">
                                        <div className="flex items-center gap-2 rounded-xl bg-slate-800/75 p-3">
                                            <div className="flex w-fit items-center gap-2 rounded-lg bg-slate-700/50 px-3 py-2">
                                                <Image
                                                    src={Config.token_image}
                                                    width={24}
                                                    height={24}
                                                    alt="Token Icon"
                                                    className="rounded-full"
                                                />
                                                <span className="mr-5 font-semibold text-white">{Config.token}</span>
                                            </div>
                                            <input
                                                className="w-full bg-transparent text-right text-xl text-white placeholder-white/50 focus:outline-none"
                                                placeholder="0"
                                                step="0.0000000001" // Adjust this as needed for precision
                                                onChange={(e) => {
                                                    setSolAmount(
                                                        !isNaN(parseFloat(e.target.value)) || e.target.value === ""
                                                            ? parseFloat(e.target.value)
                                                            : solAmount,
                                                    );
                                                }}
                                                type="number"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={async () => {
                                        if (isUserOwned) await UnlistNFT(asset_key, nftIndex);
                                        else if (tab === "Marketplace") await BuyNFT(asset_key, nftIndex);
                                        else asset_key ? await ListNFT(asset_key, solAmount) : {};

                                        onClose();
                                    }}
                                    className="rounded-xl bg-[#FFE376] px-8 py-3 text-lg font-bold text-[#BA6502] transition-all hover:bg-[#FFE376]/90 active:scale-95 active:transform"
                                >
                                    {isUserOwned ? "Unlist" : tab === "Marketplace" ? "Buy" : "List"}
                                </button>
                            </div>
                        )}
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}

export default ViewNFTDetails;
