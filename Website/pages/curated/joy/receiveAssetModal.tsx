import { AssignmentData, CollectionData } from "@/components/collection/collectionState";
import { SYSTEM_KEY } from "@/components/Solana/constants";
import useMintNFT from "@/hooks/collections/useMintNFT";
import useMintRandom from "@/hooks/collections/useMintRandom";
import useResponsive from "@/hooks/useResponsive";
import { AssetV1, Attribute } from "@metaplex-foundation/mpl-core";
import { Modal, ModalBody, ModalContent, ModalOverlay, VStack, Text, Spinner } from "@chakra-ui/react";
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
    let failed = assignment_data.status === 1;
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
            <Modal isOpen={isWarningOpened} onClose={closeWarning} isCentered motionPreset="slideInBottom" size="md">
                <ModalOverlay className="backdrop-blur-sm" />
                <ModalContent className="bg-transparent">
                    <ModalBody className="overflow-hidden p-0">
                        <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-slate-900/80 p-8 backdrop-blur-md">
                            <div className="flex items-center justify-center">
                                <h2 className="text-2xl font-semibold text-white">Generating Random Data</h2>
                            </div>
                            <div className="flex justify-center">
                                <Image
                                    loading="lazy"
                                    src="/images/cooking.gif"
                                    width={200}
                                    height={200}
                                    alt="the cooks"
                                    className="rounded-xl"
                                />
                            </div>

                            <button
                                disabled={waiting}
                                onClick={() => {
                                    if (collection.collection_meta["__kind"] === "RandomFixedSupply") {
                                        MintNFT();
                                    }
                                    if (collection.collection_meta["__kind"] === "RandomUnlimited") {
                                        MintRandom();
                                    }
                                }}
                                className="mx-auto w-fit rounded-xl bg-[#FFE376] px-8 py-3 text-lg font-bold text-[#BA6502] transition-all hover:bg-[#FFE376]/90 active:scale-95 active:transform"
                            >
                                {<Spinner />}
                            </button>
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>
        );
    }

    // Main result modal
    return (
        <Modal isOpen={isWarningOpened} onClose={closeWarning} isCentered motionPreset="slideInBottom" size="md">
            <ModalOverlay className="backdrop-blur-sm" />
            <ModalContent className="bg-transparent">
                <ModalBody className="overflow-hidden p-0">
                    <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-slate-900/80 p-8 backdrop-blur-md">
                        <div className="flex items-center justify-center">
                            <h2 className="text-2xl font-semibold text-white">
                                {checking && "Claim your NFT"}
                                {success && "NFT claimed successfully!"}
                                {failed && "NFT claim failed"}
                            </h2>
                        </div>

                        {success && <h3 className="mt-[-0.5rem] text-center text-xl font-semibold text-white">{asset_name}</h3>}

                        <div className="flex justify-center">
                            {checking && (
                                <Image
                                    loading="lazy"
                                    src={"/images/cooks.jpeg"}
                                    width={200}
                                    height={200}
                                    alt="checking"
                                    className="rounded-xl"
                                />
                            )}
                            {failed && (
                                <Image
                                    loading="lazy"
                                    src={"/images/cooks.jpeg"}
                                    width={200}
                                    height={200}
                                    alt="failed"
                                    className="rounded-xl"
                                />
                            )}
                            {success && image_url && (
                                <Image loading="lazy" src={image_url} width={200} height={200} alt="success" className="rounded-xl" />
                            )}
                        </div>

                        {description && <p className="text-center text-xl text-white/90">{description}</p>}

                        {attributes.length > 0 && (
                            <div className="grid w-full grid-cols-2 gap-2">
                                {attributes.map((attribute, index) => (
                                    <div key={index} className="rounded-xl bg-slate-700/50 px-3 py-[1.3rem] backdrop-blur-sm">
                                        <div className="text-sm text-white/70">{attribute.key}</div>
                                        <div className="mt-1 text-lg font-semibold text-white">{attribute.value}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {checking && (
                            <div className="flex justify-center">
                                <button
                                    onClick={() => {
                                        if (collection.collection_meta["__kind"] === "RandomFixedSupply") {
                                            MintNFT();
                                        }
                                        if (collection.collection_meta["__kind"] === "RandomUnlimited") {
                                            MintRandom();
                                        }
                                    }}
                                    className="rounded-xl bg-[#FFE376] px-8 py-3 text-lg font-bold text-[#BA6502] transition-all hover:bg-[#FFE376]/90 active:scale-95 active:transform"
                                >
                                    {globalLoading ? <Spinner /> : "Claim"}
                                </button>
                            </div>
                        )}

                        {(success || failed) && (
                            <button
                                onClick={closeWarning}
                                className="mx-auto w-fit rounded-xl bg-[#FFE376] px-8 py-3 text-lg font-bold text-[#BA6502] transition-all hover:bg-[#FFE376]/90 active:scale-95 active:transform"
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
