import { AssetWithMetadata } from "../../pages/collection/[pageName]";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { CollectionData } from "./collectionState";
import { Modal, ModalBody, ModalContent, ModalOverlay, VStack, Text, Spinner, useToast } from "@chakra-ui/react";
import useResponsive from "@/hooks/useResponsive";
import { Button } from "../ui/button";
import { CiWallet } from "react-icons/ci";
import { Config } from "../Solana/constants";
import { publicKey } from "@metaplex-foundation/umi";
import { transferV1 } from "@metaplex-foundation/mpl-core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
interface ViewNFTDetailsModalProps {
    isOpened: boolean;
    onClose: () => void;
    nft?: AssetWithMetadata;
    collection?: CollectionData;
}

function TransferNft({ isOpened, onClose, collection, nft }: ViewNFTDetailsModalProps) {
    const toast = useToast();
    const { xs, sm } = useResponsive();
    const [recipientAddress, setRecipientAddress] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);


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
                    <div className="flex flex-col gap-2 mb-4">
                        <Text className="text-3xl font-semibold text-center text-white lg:text-4xl">Transfer Item</Text>
                    </div>
                    <div className="flex flex-col items-center justify-center w-full">
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
                            </div>
                        )}
                        <span className="flex items-center w-full p-3 mt-3 text-white bg-gray-800 rounded-md focus:outline-none">
                            <input
                                placeholder={"Recipient " + Config.token + " Address"}
                                className="w-full text-xl text-white bg-transparent focus:outline-none"
                                type="text"
                                onChange={(e) => setRecipientAddress(e.target.value)}
                            />
                            <CiWallet className="text-4xl" />
                        </span>
                        <Button
                            className="mt-3 transition-all rounded-md w-fit hover:opacity-90"
                            size="lg"
                            isLoading={isLoading}
                        >
                            Transfer
                        </Button>
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}

export default TransferNft;
