import { AssignmentData, CollectionData } from "@/components/collection/collectionState";
import { SYSTEM_KEY } from "@/components/Solana/constants";
import useMintNFT from "@/hooks/collections/useMintNFT";
import useMintRandom from "@/hooks/collections/useMintRandom";
import useResponsive from "@/hooks/useResponsive";
import { AssetV1, Attribute } from "@metaplex-foundation/mpl-core";
import { Modal, ModalBody, ModalContent, ModalOverlay } from "@chakra-ui/react";
import { Loader2Icon } from "lucide-react";
import Image from "next/image";

interface RecievedAssetModalProps {
    isWarningOpened?: boolean;
    closeWarning?: () => void;
    collection: CollectionData;
    asset: AssetV1;
    asset_image: string;
    assignment_data: AssignmentData;
    isLoading: boolean;
    have_randoms: boolean;
}

export default function ReceivedAssetModal({
    isWarningOpened,
    closeWarning,
    collection,
    assignment_data,
    asset,
    asset_image,
    isLoading,
    have_randoms,
}: RecievedAssetModalProps) {
    const { sm } = useResponsive();
    const { MintNFT, isLoading: isMintLoading } = useMintNFT(collection);
    const { MintRandom, isLoading: isMintRandomLoading } = useMintRandom(collection);

    function filterAttributes(attributes) {
        return attributes.filter(function (item: Attribute) {
            return item.key !== "CookWrapIndex";
        });
    }

    if (assignment_data === null) return <></>;

    let waiting = !assignment_data.random_address.equals(SYSTEM_KEY) && !have_randoms;
    let success = assignment_data.status === 2;
    let checking = assignment_data.status === 0;

    let asset_name = collection.nft_name + " #" + (assignment_data.nft_index + 1).toString();
    let image_url = "";
    let description = "";

    if (asset !== null) {
        asset_name = asset.name;
    }
    if (asset_image !== null) {
        if (asset_image["name"] !== undefined) {
            asset_name = asset_image["name"];
        }
        if (asset_image["description"] !== undefined) {
            description = asset_image["description"];
        }
        image_url = asset_image["image"];
    }

    let attributes = asset === null ? [] : asset.attributes === undefined ? [] : filterAttributes(asset.attributes.attributeList);
    let globalLoading = isLoading || isMintLoading || isMintRandomLoading;

    // Waiting for random data modal
    if (waiting) {
        return (
            <Modal isOpen={isWarningOpened} onClose={closeWarning} isCentered motionPreset="none" size="2xl">
                <ModalOverlay className="backdrop-blur-sm" />
                <ModalContent className="bg-transparent">
                    <ModalBody className="overflow-visible p-0">
                        <div className="relative flex flex-col gap-4 rounded-2xl border-2 border-[#3A2618] bg-[#1C1410]/95 p-8 shadow-2xl backdrop-blur-md">
                            <h2 className="text-center font-serif text-2xl text-[#C4A484]">Recruiting in Progress</h2>
                            <div className="relative h-64 w-full overflow-hidden rounded-xl border-2 border-[#3A2618]">
                                <Image
                                    src="/curatedLaunches/citizens/tavern.png"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    alt="Recruitment"
                                    className="opacity-80"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1410] to-transparent" />
                            </div>
                            <p className="text-center text-[#8B7355]">The tavern keeper is finding a suitable recruit...</p>
                            <div className="flex justify-center">
                                <Loader2Icon className="h-8 w-8 animate-spin text-[#C4A484]" />
                            </div>
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isWarningOpened} onClose={closeWarning} isCentered motionPreset="none" size="2xl">
            <ModalOverlay className="backdrop-blur-sm" />
            <ModalContent className="bg-transparent">
                <ModalBody className="overflow-visible p-0">
                    <div className="relative flex flex-col gap-4 rounded-2xl border-2 border-[#3A2618] bg-[#1C1410]/95 p-8 shadow-2xl backdrop-blur-md">
                        <h2 className="text-center font-serif text-2xl text-[#C4A484]">
                            {checking ? "A New Soul Seeks Their Fortune" : "Welcome to the Company"}
                        </h2>

                        {success && <h3 className="text-center text-xl text-[#C4A484]">{asset_name}</h3>}

                        {(success && image_url) ? (
                            <div className="flex justify-center">
                                <div className="relative h-64 w-64 overflow-hidden rounded-xl border-2 border-[#3A2618]">
                                    <Image
                                        src={image_url}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        alt={asset_name}
                                        className="opacity-80"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="relative h-64 w-full overflow-hidden rounded-xl border-2 border-[#3A2618]">
                                <Image
                                    src="/curatedLaunches/citizens/select.png"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    alt="Potential Recruit"
                                    className="opacity-80"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1410] to-transparent" />
                            </div>
                        )}

                        {description && <p className="text-center text-[#8B7355]">{description}</p>}

                        {attributes.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                                {attributes.map((attribute, index) => (
                                    <div key={index} className="flex flex-col items-center rounded-lg border border-[#3A2618] bg-black/20 p-3 text-center">
                                        <p className="text-sm text-[#8B7355]">{attribute.key}</p>
                                        <p className="text-lg font-bold text-[#C4A484]">{attribute.value}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {checking && (
                            <button
                                onClick={() => {
                                    if (collection.collection_meta["__kind"] === "RandomFixedSupply") {
                                        MintNFT();
                                    }
                                    if (collection.collection_meta["__kind"] === "RandomUnlimited") {
                                        MintRandom();
                                    }
                                }}
                                disabled={globalLoading}
                                className="mx-auto mt-4 w-full transform rounded-lg border-2 border-[#3A2618] bg-gradient-to-b from-[#8B7355] to-[#3A2618] px-8 py-3 font-bold text-[#1C1410] transition-all hover:from-[#C4A484] hover:to-[#8B7355] active:scale-95"
                            >
                                {globalLoading ? (
                                    <Loader2Icon className="mx-auto animate-spin" />
                                ) : (
                                    "Meet Your Recruit"
                                )}
                            </button>
                        )}

                        {success && (
                            <button
                                onClick={closeWarning}
                                className="mx-auto mt-4 transform rounded-lg border-2 border-[#3A2618] bg-gradient-to-b from-[#8B7355] to-[#3A2618] px-8 py-2 font-bold text-[#1C1410] transition-all hover:from-[#C4A484] hover:to-[#8B7355] active:scale-95"
                            >
                                Close
                            </button>
                        )}
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}