import { AssetWithMetadata } from "../../pages/collection/[pageName]";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Modal, ModalBody, ModalContent, ModalOverlay, VStack, Text, Spinner, useToast } from "@chakra-ui/react";
import useResponsive from "@/hooks/useResponsive";
import { Button } from "../ui/button";
import { CiWallet } from "react-icons/ci";
import { CollectionKeys, Config } from "../Solana/constants";
import { publicKey } from "@metaplex-foundation/umi";
import { transferV1 } from "@metaplex-foundation/mpl-core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import useTransferCoreAsset from "@/hooks/useTransferCoreAsset";
import { PublicKey } from "@solana/web3.js";
import { CollectionData } from "@letscook/sdk/dist/state/collections";

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
    const { transferAsset } = useTransferCoreAsset();

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
                    <div className="mb-4 flex flex-col gap-2">
                        <Text className="text-center text-3xl font-semibold text-white lg:text-4xl">Transfer Item</Text>
                    </div>
                    <div className="flex w-full flex-col items-center justify-center">
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
                        <span className="mt-3 flex w-full items-center rounded-md bg-gray-800 p-3 text-white focus:outline-none">
                            <input
                                placeholder={"Recipient " + Config.token + " Address"}
                                className="w-full bg-transparent text-xl text-white focus:outline-none"
                                type="text"
                                onChange={(e) => setRecipientAddress(e.target.value)}
                            />
                            <CiWallet className="text-4xl" />
                        </span>
                        <Button
                            className="mt-3 w-fit rounded-md transition-all hover:opacity-90"
                            size="lg"
                            isLoading={isLoading}
                            onClick={() => {
                                transferAsset(nft?.asset, collection?.keys[CollectionKeys.CollectionMint], new PublicKey(recipientAddress));
                            }}
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
