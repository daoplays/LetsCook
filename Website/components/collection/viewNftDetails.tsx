import { AssetWithMetadata } from "../../pages/collection/[pageName]";
import React, { useEffect } from "react";
import Image from "next/image";
import { CollectionData } from "./collectionState";
import { Modal, ModalBody, ModalContent, ModalOverlay, VStack, Text, Spinner } from "@chakra-ui/react";
import useResponsive from "@/hooks/useResponsive";
import { Button } from "../ui/button";
import useListNFT from "@/hooks/collections/useListNFT";

import { Config } from "../Solana/constants";
import { PublicKey } from "@solana/web3.js";

interface ViewNFTDetailsModalProps {
    isOpened: boolean;
    onClose: () => void;
    nft?: AssetWithMetadata;
    collection?: CollectionData;
    isNFTListed: boolean;
}

function ViewNFTDetails({ isOpened, onClose, collection, nft, isNFTListed }: ViewNFTDetailsModalProps) {
    const { xs, sm } = useResponsive();
    const { ListNFT } = useListNFT(collection);

    let asset_name, asset_Attribute;
    let asset_key: PublicKey | null = null;
    if (nft !== undefined) {
        asset_name = nft.metadata["name"] ? nft.metadata["name"] : nft.asset.name;
        asset_Attribute = nft.metadata["attributes"] ? nft.metadata["attributes"] : null;
        asset_key = nft ? new PublicKey(nft.asset.publicKey.toString()) : null;
    }

    console.log(isNFTListed);
    return (
        <Modal size="lg" isCentered isOpen={isOpened} onClose={onClose} motionPreset="slideInBottom">
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
                            <div className="flex w-full items-start justify-center gap-4 text-white">
                                <Image
                                    src={nft.metadata["image"]}
                                    width={200}
                                    height={200}
                                    style={{ borderRadius: "8px" }}
                                    alt="nftImage"
                                />
                                <div className="flex flex-col gap-3">
                                    {asset_Attribute !== null &&
                                        asset_Attribute.map((value, index) => (
                                            <span key={index}>
                                                {value.trait_type}: {value["value"]}
                                            </span>
                                        ))}
                                </div>
                            </div>
                        )}
                        <div className={`${isNFTListed ? "hidden" : "flex flex-col items-center"} `}>
                            <div className="mt-2 flex items-center gap-2 rounded-xl bg-gray-800 p-3 text-white">
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
                                    type="number"
                                    className="w-full bg-transparent text-right text-xl focus:outline-none"
                                    placeholder="0"
                                    step="0.0000000001" // Adjust this as needed for precision
                                    min="0" // Optional: restrict to non-negative values
                                />
                            </div>
                            <Button
                                className="mt-2 w-fit transition-all hover:opacity-90"
                                size="lg"
                                onClick={async (e) => {
                                    try {
                                        asset_key ? await ListNFT(asset_key, 1) : {};
                                    } catch (e) {
                                        console.error(e);
                                    } finally {
                                        onClose();
                                    }
                                }}
                            >
                                List
                            </Button>
                        </div>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}

export default ViewNFTDetails;
