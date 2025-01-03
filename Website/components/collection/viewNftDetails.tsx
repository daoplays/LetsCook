import { AssetWithMetadata } from "../../pages/collection/[pageName]";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Modal, ModalBody, ModalContent, ModalOverlay, VStack, Text, Spinner } from "@chakra-ui/react";
import useResponsive from "@/hooks/useResponsive";
import { Button } from "../ui/button";
import useListNFT from "@/hooks/collections/useListNFT";

import { Config } from "../Solana/constants";
import { PublicKey } from "@solana/web3.js";
import useUnlistNFT from "@/hooks/collections/useUnlistNFT";
import useBuyNFT from "@/hooks/collections/useBuyNFT";
import { Attribute } from "@metaplex-foundation/mpl-core";
import { CollectionData } from "@letscook/sdk/dist/state/collections";

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

    let asset_name;
    let offchain_attributes = [];
    let onchain_attributes: Attribute[] = [];

    let asset_key: PublicKey | null = null;
    if (nft !== undefined) {
        asset_name = nft.metadata["name"] ? nft.metadata["name"] : nft.asset.name;
        asset_key = nft ? new PublicKey(nft.asset.publicKey.toString()) : null;

        offchain_attributes = nft.metadata["attributes"] ? nft.metadata["attributes"] : [];
        onchain_attributes = nft.asset.attributes ? nft.asset.attributes.attributeList : [];
        const index = onchain_attributes.findIndex((attr) => attr.key === "CookWrapIndex");
        if (index > -1) {
            onchain_attributes.splice(index, 1);
        }
    }

    return (
        <Modal size="2xl" isCentered isOpen={isOpened} onClose={onClose} motionPreset="slideInBottom">
            <ModalOverlay />

            <ModalContent w={xs ? 380 : 800} style={{ background: "transparent" }}>
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
                            <Text className="text-center text-3xl font-semibold text-white lg:text-4xl">{nft.metadata["name"]}</Text>
                        </div>
                        {nft !== undefined && (
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
                                        {offchain_attributes.map((attr, index) => (
                                            <div key={index} className="rounded-xl bg-slate-700/50 px-3 py-[1.3rem] backdrop-blur-sm">
                                                <div className="text-sm text-white/70">{attr.trait_type}</div>
                                                <div className="mt-1 text-lg font-semibold text-white">{attr.value}</div>
                                            </div>
                                        ))}
                                        {onchain_attributes.map((attr, index) => (
                                            <div key={index} className="rounded-xl bg-slate-700/50 px-3 py-[1.3rem] backdrop-blur-sm">
                                                <div className="text-sm text-white/70">{attr.key}</div>
                                                <div className="mt-1 text-lg font-semibold text-white">{attr.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className={`${isNFTListed ? "hidden" : "flex flex-col items-center"} `}>
                            <div
                                className={`mt-2 items-center gap-2 rounded-xl bg-gray-800 p-3 text-white ${tab === "Marketplace" ? "hidden" : "flex"}`}
                            >
                                <div className="flex flex-col gap-2">
                                    <button className="flex items-center gap-2 rounded-lg bg-gray-700 px-2.5 py-1.5">
                                        <div className="w-6">
                                            <Image
                                                src={Config.token_image}
                                                width={25}
                                                height={25}
                                                alt="Eth Icon"
                                                className="rounded-full"
                                            />
                                        </div>
                                        <span>{Config.token}</span>
                                    </button>
                                </div>
                                <input
                                    className="w-full bg-transparent text-right text-xl focus:outline-none"
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
                            <Button
                                className="mt-2 w-fit rounded-md transition-all hover:opacity-90"
                                size="lg"
                                onClick={async (e) => {
                                    if (isUserOwned) {
                                        await UnlistNFT(asset_key, nftIndex);
                                    } else if (tab === "Marketplace") {
                                        console.log("buying nft", asset_key, nftIndex);
                                        await BuyNFT(asset_key, nftIndex);
                                    } else {
                                        try {
                                            asset_key ? await ListNFT(asset_key, solAmount) : {};
                                        } catch (e) {
                                            console.error(e);
                                        } finally {
                                            onClose();
                                        }
                                    }
                                }}
                            >
                                {isUserOwned ? "Unlist" : tab === "Marketplace" ? "Buy" : "List"}
                            </Button>
                        </div>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}

export default ViewNFTDetails;
