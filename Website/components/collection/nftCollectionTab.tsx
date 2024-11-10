import { AssetWithMetadata } from "../../pages/collection/[pageName]";
import React from "react";
import Image from "next/image";
import { CollectionData } from "./collectionState";
import { Modal, ModalBody, ModalContent, ModalOverlay, VStack, Text, Spinner } from "@chakra-ui/react";
import useResponsive from "@/hooks/useResponsive";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import ethImage from "@/public/images/eth.png";
interface RecievedAssetModalProps {
    actionType: string;
    action: boolean;
    isOpened: boolean;
    onClose: () => void;
    asset: AssetWithMetadata;
}
function NftCollectionTab({ isOpened, onClose, asset, action, actionType }: RecievedAssetModalProps) {
    console.log("TNAOIGNAOINSOIAADJOAS", asset);
    const { xs, sm } = useResponsive();
    let asset_name, asset_Attribute;
    if (asset !== undefined) {
        asset_name = asset.metadata["name"] ? asset.metadata["name"] : asset.asset.name;
        asset_Attribute = asset.metadata["attributes"] ? asset.metadata["attributes"] : null;
    }
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
                        <div className="flex flex-col gap-2 mb-4">
                            <Text className="text-3xl font-semibold text-center text-white lg:text-4xl">{asset_name}</Text>
                        </div>
                        {asset !== undefined && (
                            <div className="flex items-start justify-center w-full gap-4 text-white">
                                <Image
                                    src={asset.metadata["image"]}
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
                        {action && (
                            <>
                                {actionType == "List" && (
                                    <>
                                        <div className="flex items-center gap-2 p-3 mt-2 text-white bg-gray-800 rounded-xl">
                                            <div className="flex flex-col gap-2">
                                                <button className="flex items-center gap-2 rounded-lg bg-gray-700 px-2.5 py-1.5">
                                                    <div className="w-6">
                                                        <Image
                                                            src={ethImage}
                                                            width={25}
                                                            height={25}
                                                            alt="Eth Icon"
                                                            className="rounded-full"
                                                        />
                                                    </div>
                                                    <span>ETH</span>
                                                </button>
                                            </div>
                                            <input
                                                type="number"
                                                className="w-full text-xl text-right bg-transparent focus:outline-none"
                                                placeholder="0"
                                                step="0.000000000000000001" // Adjust this as needed for precision
                                                min="0" // Optional: restrict to non-negative values
                                            />
                                        </div>
                                        <Button className="mt-2 transition-all hover:opacity-90" size="lg">
                                            List
                                        </Button>
                                    </>
                                )}
                                {actionType == "Buy" && (
                                    <>
                                        <div className="flex items-center gap-2 p-3 mt-2 text-white bg-gray-800 rounded-xl">
                                            <div className="flex flex-col gap-2">
                                                <button className="flex items-center gap-2 rounded-lg bg-gray-700 px-2.5 py-1.5">
                                                    <div className="w-6">
                                                        <Image
                                                            src={ethImage}
                                                            width={25}
                                                            height={25}
                                                            alt="Eth Icon"
                                                            className="rounded-full"
                                                        />
                                                    </div>
                                                    <span>ETH</span>
                                                </button>
                                            </div>
                                            <input
                                                type="number"
                                                className="w-full text-xl text-right bg-transparent focus:outline-none"
                                                placeholder="0"
                                                step="0.000000000000000001"
                                                min="0"
                                                disabled
                                            />
                                        </div>
                                        <Button className="mt-2 transition-all hover:opacity-90" size="lg">
                                            Buy
                                        </Button>
                                    </>
                                )}
                            </>
                        )}
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}

export default NftCollectionTab;
