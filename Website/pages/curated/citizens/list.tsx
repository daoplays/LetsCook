import React from "react";
import { Modal, ModalOverlay, ModalContent, ModalBody } from "@chakra-ui/react";
import Image from "next/image";
import { FaCoins } from "react-icons/fa";
import { Loader2Icon } from "lucide-react";
import { AssetWithMetadata } from "@/pages/collection/[pageName]";
import { Config } from "@/components/Solana/constants";

interface ContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (price: number) => void;
    mercenary: AssetWithMetadata;
    isLoading?: boolean;
}

const ContractModal = ({ isOpen, onClose, onConfirm, mercenary, isLoading = false }: ContractModalProps) => {
    const [price, setPrice] = React.useState<string>("");

    if (!mercenary) return null;

    const name = mercenary.metadata["name"];

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow numbers and decimals
        const value = e.target.value.replace(/[^0-9.]/g, "");
        setPrice(value);
    };

    const handleSubmit = () => {
        const numPrice = parseFloat(price);
        if (numPrice > 0) {
            onConfirm(numPrice);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="none" size="2xl">
            <ModalOverlay className="backdrop-blur-sm" />
            <ModalContent className="bg-transparent">
                <ModalBody className="overflow-visible p-0">
                    <div className="relative flex flex-col gap-4 rounded-2xl border-2 border-[#3A2618] bg-[#1C1410]/95 p-8 shadow-2xl backdrop-blur-md">
                        {/* Header with Broker */}
                        <div className="mb-4 flex items-center gap-6 border-b border-[#3A2618] pb-6">
                            <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-[#3A2618] shadow-lg">
                                <Image
                                    src="/curatedLaunches/citizens/armsDealer.png"
                                    width={96}
                                    height={96}
                                    alt="The Broker"
                                    className="scale-110 transform"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <h2 className="font-serif text-xl text-[#C4A484]">Garrett Voss, The Broker</h2>
                                <p className="font-serif italic text-[#8B7355]">
                                    &quot;I&apos;ll find a buyer for your blade. Just name your price, and I&apos;ll handle the
                                    rest...&quot;
                                </p>
                            </div>
                        </div>

                        {/* Mercenary Preview */}
                        <div className="flex items-center gap-4">
                            <div className="relative h-24 w-24 overflow-hidden rounded-xl border-2 border-[#3A2618]">
                                <Image
                                    src={mercenary.metadata["image"]}
                                    fill
                                    style={{ objectFit: "cover" }}
                                    alt={name}
                                    className="opacity-80"
                                />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[#C4A484]">{name}</h3>
                                <p className="text-sm text-[#8B7355]">Setting contract price</p>
                            </div>
                        </div>

                        {/* Price Input */}
                        <div className="mt-4 rounded-lg border border-[#3A2618] bg-black/20 p-4">
                            <label className="block text-sm text-[#8B7355]">Contract Price</label>
                            <div className="mt-2 flex items-center gap-2">
                                <FaCoins className="text-[#C4A484]" />
                                <input
                                    type="text"
                                    value={price}
                                    onChange={handlePriceChange}
                                    placeholder="Enter amount"
                                    className="flex-1 bg-transparent text-lg font-bold text-[#C4A484] placeholder-[#8B7355]/50 outline-none"
                                />
                                <span className="text-sm text-[#8B7355]">{Config.token}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={onClose}
                                className="flex-1 transform rounded-lg border-2 border-[#3A2618] bg-gradient-to-b from-[#8B7355] to-[#3A2618] px-8 py-3 font-bold text-[#1C1410] transition-all hover:from-[#C4A484] hover:to-[#8B7355] active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!price || isLoading}
                                className="flex-1 transform rounded-lg border-2 border-[#3A2618] bg-gradient-to-b from-[#8B7355] to-[#3A2618] px-8 py-3 font-bold text-[#1C1410] transition-all hover:from-[#C4A484] hover:to-[#8B7355] active:scale-95 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2Icon className="mx-auto animate-spin" /> : "Set Contract"}
                            </button>
                        </div>
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default ContractModal;
