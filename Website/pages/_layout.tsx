import { Rocket, Gift, Shield } from "lucide-react";
import { Button, Switch, useDisclosure } from "@chakra-ui/react";
import Image from "next/image";
import React, { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import useCollection from "@/hooks/data/useCollection";
import useAssignmentData from "@/hooks/data/useAssignmentData";
import useAppRoot from "@/context/useAppRoot";
import useMintRandom from "@/hooks/collections/useMintRandom";
import useClaimNFT from "@/hooks/collections/useClaimNFT";
import useTokenBalance from "@/hooks/data/useTokenBalance";
import { CollectionKeys, Config, SYSTEM_KEY } from "@/components/Solana/constants";
import useNFTBalance from "@/hooks/data/useNFTBalance";
import Loader from "@/components/loader";
import PageNotFound from "@/components/pageNotFound";
import { bignum_to_num } from "@/components/Solana/state";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import { CollectionV1, fetchCollectionV1 } from "@metaplex-foundation/mpl-core";
import Navigation from "@/components/solardexNavigation";
import { ReceivedAssetModal, ReceivedAssetModalStyle } from "@/components/Solana/modals";

const modalStyle: ReceivedAssetModalStyle = {
    check_image: "/curatedLaunches/badgers/badger.gif",
    failed_image: "/curatedLaunches/badgers/badger.gif",
    fontFamily: "singlanguagefont",
    fontColor: "white",
    succsss_h: 620,
    failed_h: 620,
    checking_h: 620,
    success_w: 620,
    failed_w: 620,
    checking_w: 620,
    sm_succsss_h: 570,
    sm_success_w: 420,
    sm_failed_h: 350,
    sm_failed_w: 350,
    sm_checking_h: 570,
    sm_checking_w: 420,
};

const AppRootPage = ({ children }: PropsWithChildren) => {
    const wallet = useWallet();
    const pageName = "tissue";

    const { isOpen: isAssetModalOpen, onOpen: openAssetModal, onClose: closeAssetModal } = useDisclosure();

    const { collection, tokenMint } = useCollection({ pageName: pageName });

    const { assignmentData, validRandoms, asset, assetMeta } = useAssignmentData({ collection: collection });

    const { MintRandom, isLoading: isMintRandomLoading } = useMintRandom(collection);
    const { ClaimNFT, isLoading: isClaimLoading } = useClaimNFT(collection, true, tokenMint);

    const { userSOLBalance } = useAppRoot();

    const { tokenBalance } = useTokenBalance({ mintData: tokenMint });

    const collectionAddress = useMemo(() => {
        return collection?.keys?.[CollectionKeys.CollectionMint] || null;
    }, [collection]);

    const { nftBalance, checkNFTBalance, fetchNFTBalance } = useNFTBalance(collectionAddress ? { collectionAddress } : null);

    let isLoading = isClaimLoading || isMintRandomLoading;

    const updateAssignment = useCallback(async () => {
        // if we are started to wait for randoms then open up the modal
        if (!assignmentData.random_address.equals(SYSTEM_KEY)) {
            openAssetModal();
        }

        if (assignmentData.status < 2) {
            return;
        } else {
            checkNFTBalance.current = true;
            fetchNFTBalance();
        }
    }, [assignmentData, openAssetModal, fetchNFTBalance, checkNFTBalance]);

    useEffect(() => {
        if (!assignmentData) return;

        updateAssignment();
    }, [collection, assignmentData, updateAssignment]);

    useEffect(() => {
        if (collection && wallet && wallet.connected) {
            checkNFTBalance.current = true;
            fetchNFTBalance();
        }
    }, [collection, wallet, checkNFTBalance, fetchNFTBalance]);

    if (collection === null || tokenMint === null) return <Loader />;

    if (!collection) return <PageNotFound />;

    const enoughTokenBalance = userSOLBalance >= bignum_to_num(collection.swap_price) / Math.pow(10, collection.token_decimals);

    return (
        <>
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
                <Navigation />

                <main className="mx-auto mt-8 grid max-w-6xl md:grid-cols-2">
                    <div className="relative mx-auto flex max-w-md flex-col items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-4">
                        <div className="aspect-square w-full">
                            <Image
                                src={"/images/solardex-badge.jpeg"}
                                alt="Solar Dex Badge"
                                width={400}
                                height={400}
                                className="rounded-xl"
                            />
                        </div>
                        {wallet.connected && <div className="mx-auto w-fit">Your Badges: {nftBalance.toString()}</div>}
                    </div>

                    <div className="flex w-[87.5%] flex-col justify-center space-y-6">
                        <div>
                            <div className="mb-3 flex items-center gap-3">
                                <h1 className="text-4xl font-bold">Solar Dex Badge NFT</h1>
                            </div>
                            <p className="text-gray-300">
                                Secure your position in the Solar Dex ecosystem by minting the exclusive Genesis Badge NFT.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3">
                                <Shield className="mt-1 text-yellow-500" size={20} />
                                <div>
                                    <h3 className="font-semibold">Early Adopter Status</h3>
                                    <p className="text-gray-400">
                                        Your badge serves as proof of being among the first supporters of Solar Dex.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <Gift className="mt-1 text-yellow-500" size={20} />
                                <div>
                                    <h3 className="font-semibold">Guaranteed Token Airdrop</h3>
                                    <p className="text-gray-400">
                                        Badge holders will receive an exclusive airdrop of Solar Dex tokens at TGE.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <Rocket className="mt-1 text-yellow-500" size={20} />
                                <div>
                                    <h3 className="font-semibold">Future Utility</h3>
                                    <p className="text-gray-400">
                                        Hold your badge for potential future benefits and governance participation
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="w-full">
                            {assignmentData === null || assignmentData.status > 0 ? (
                                <Button
                                    h={12}
                                    className="w-full"
                                    onClick={() => {
                                        if (enoughTokenBalance) {
                                            ClaimNFT();
                                        }
                                    }}
                                    isDisabled={!enoughTokenBalance || isLoading || !wallet.connected}
                                    isLoading={isLoading}
                                >
                                    {!wallet.connected ? "Connect Your Wallet" : "Mint Badge ($1)"}
                                </Button>
                            ) : (
                                <Button
                                    h={12}
                                    className="w-full"
                                    onClick={() => {
                                        if (collection.collection_meta["__kind"] === "RandomUnlimited") {
                                            MintRandom();
                                        }
                                    }}
                                    isLoading={isLoading}
                                    isDisabled={isLoading}
                                >
                                    Claim Your Badge
                                </Button>
                            )}
                            <div className="mx-auto mt-2 w-fit text-sm text-gray-400">Unlimited supply • No maximum mint per wallet</div>
                        </div>
                    </div>
                </main>

                <footer className="absolute bottom-6 right-6 mx-auto w-fit">
                    <p className="mx-auto -mb-[6px] w-fit text-sm text-gray-400">Powered By</p>
                    <Link href={"https://eclipse.letscook.wtf"} target="_blank">
                        <Image
                            src={"https://delta-edge.ardata.tech/gw/bafybeick5fyyhnnudr3h3fdud7icaq6pap4uxyfsfii2mw2mknn6cgabde"}
                            alt="Let's Cook"
                            width={120}
                            height={100}
                        />
                    </Link>
                </footer>
            </div>

            <ReceivedAssetModal
                curated={false}
                have_randoms={validRandoms}
                isWarningOpened={isAssetModalOpen}
                closeWarning={closeAssetModal}
                assignment_data={assignmentData}
                collection={collection}
                asset={asset}
                asset_image={assetMeta}
                style={modalStyle}
                isLoading={isLoading}
            />
        </>
    );
};

export default AppRootPage;
