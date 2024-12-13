import React, { useCallback, useEffect, useState } from "react";
import { WebUploader } from "@irys/web-upload";
import { WebEclipseEth, WebSolana } from "@irys/web-upload-solana";
import { Config } from "../components/Solana/constants";
import BaseWebIrys from "@irys/web-upload/dist/types/base";
import { get_current_blockhash, getRecentPrioritizationFees } from "../components/Solana/state";
import { ComputeBudgetProgram, Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { toast } from "react-toastify";
import useSendTransaction from "./useSendTransaction";
import { Manifest, UploadResponse } from "@irys/sdk/build/cjs/common/types";
import {DataItem, JWKInterface} from "@irys/bundles";


/**
 * Type definition for the upload result returned from Irys
 * @interface UploadReceipt
 * @property {string} id - The manifest ID of the uploaded files
 * @property {Object} manifest - The manifest object containing file paths and details
 */
export type IrysWebUploaderResponse = UploadResponse & {
    throwawayKey: JWKInterface;
    txs: DataItem[];
    throwawayKeyAddress: string;
    manifest: Manifest;
    manifestId: string;
}

type Tag = {
    name: string;
    value: string;
};


type BlockUploadOptions = {
    blockSize?: number; // Size in bytes for each block, defaults to 1GB
    onBlockUpload?: (blockIndex: number, totalBlocks: number) => void;
    onManifestUpload?: (manifestId: string) => void;
};

const DEFAULT_BLOCK_SIZE = 1024 * 1024 * 1024; // 1GB


const useIrysUploader = (wallet) => {
    const [uploader, setUploader] = useState<BaseWebIrys | null>(null);
    const {sendTransaction} = useSendTransaction();

    const getEclipseIrysUploader = useCallback(async () => {
        if (Config.PROD) {
            return await WebUploader(WebEclipseEth).withProvider(wallet).withRpc(Config.RPC_NODE).mainnet();
        }
        return await WebUploader(WebEclipseEth).withProvider(wallet).withRpc(Config.RPC_NODE).devnet();
    }, [wallet]);

    const getSolanaIrysUploader = useCallback(async () => {
        if (Config.PROD) {
            return await WebUploader(WebSolana).withProvider(wallet).withRpc(Config.RPC_NODE).mainnet();
        }
        return await WebUploader(WebSolana).withProvider(wallet).withRpc(Config.RPC_NODE).devnet();
    }, [wallet]);

    const getIrysUploader = useCallback(async () => {
        let newUploader: BaseWebIrys;
        if (Config.NETWORK === "eclipse") {
            newUploader = await getEclipseIrysUploader();
        } else {
            newUploader = await getSolanaIrysUploader();
        }
        setUploader(newUploader);
        return newUploader;
    }, [getEclipseIrysUploader, getSolanaIrysUploader]);

    useEffect(() => {
        if (!wallet || !wallet.publicKey) return;

        getIrysUploader();
    }, [wallet, getIrysUploader]);


    const fundUploader = useCallback(async (
        size: number
    ) => {
        if (!uploader || !wallet.publicKey) return false;

        const atomic_price = await uploader.getPrice(Math.ceil(1.1 * size));
        
        try {
            const irys_address = await uploader.utils.getBundlerAddress();
            const signature = await sendTransaction({
                instructions: [
                    SystemProgram.transfer({
                        fromPubkey: wallet.publicKey,
                        toPubkey: new PublicKey(irys_address),
                        lamports: Number(atomic_price),
                    })
                ],
                onSuccess: () => {},
                onError: (error) => {
                    throw error;
                },
            });

            if (!signature) {
                throw new Error("Failed to get transaction signature");
            }

            const fund_check = await uploader.funder.submitFundTransaction(signature);
            console.log(fund_check, fund_check.data["confirmed"]);

            return true;
        } catch (error) {
            console.error("Funding error:", error);
            return false;
        }
    }, [uploader, wallet, sendTransaction]);

    const uploadFilesInBlocks = useCallback(async (
        connection: Connection,
        files: File[],
        tags: Tag[],
        options: BlockUploadOptions = {}
    ): Promise<IrysWebUploaderResponse | null> => {
        if (!uploader || !wallet.publicKey) return null;

        const blockSize = options.blockSize || DEFAULT_BLOCK_SIZE;
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);

        // Split files into blocks
        const blocks: File[][] = [];
        let currentBlock: File[] = [];
        let currentBlockSize = 0;

        for (const file of files) {
            if (currentBlockSize + file.size > blockSize) {
                blocks.push(currentBlock);
                currentBlock = [];
                currentBlockSize = 0;
            }
            currentBlock.push(file);
            currentBlockSize += file.size;
        }
        if (currentBlock.length > 0) {
            blocks.push(currentBlock);
        }

        // Fund the uploader for all blocks
        const fundingSuccess = await fundUploader(totalSize);
        if (!fundingSuccess) {
            toast.error("Failed to fund uploader");
            return null;
        }

        let combinedManifest: Manifest = { manifest: "arweave/paths", version: "0.1.0", paths: {} };

        // Upload each block
        for (let i = 0; i < blocks.length; i++) {
            try {
                const blockTags = blocks[i].map((file) => ({
                    name: "Content-Type",
                    value: file.type
                }));

                const { manifest } = await uploader.uploadFolder(blocks[i], {
                    manifestTags: blockTags,
                });

                combinedManifest.paths = { ...combinedManifest.paths, ...manifest.paths };
                options.onBlockUpload?.(i + 1, blocks.length);
            } catch (error) {
                console.error(`Error uploading block ${i + 1}:`, error);
                toast.error(`Failed to upload block ${i + 1}`);
                return null;
            }
        }

        // Upload the final manifest
        try {
            const manifestJSON = JSON.stringify(combinedManifest);
            const manifestBlob = new Blob([manifestJSON], { type: "application/json" });
            const manifestFile = new File([manifestBlob], "manifest.json");

            // Fund the manifest upload
            const manifestFundingSuccess = await fundUploader(
                manifestFile.size
            );

            if (!manifestFundingSuccess) {
                throw new Error("Failed to fund manifest upload");
            }

            const manifestResponse = await uploader.upload(manifestJSON, {
                tags: [
                    { name: "Type", value: "manifest" },
                    { name: "Content-Type", value: "application/x.irys-manifest+json" }
                ]
            });

            options.onManifestUpload?.(manifestResponse.id);

            return {
                ...manifestResponse,
                manifest: combinedManifest,
                manifestId: manifestResponse.id
            } as IrysWebUploaderResponse;
        } catch (error) {
            console.error("Error uploading manifest:", error);
            toast.error("Failed to upload manifest");
            return null;
        }
    }, [uploader, wallet.publicKey, fundUploader]);

    const uploadFiles = useCallback(
        async (connection: Connection, files: File[], toast_text: string): Promise<IrysWebUploaderResponse> => {

            const totalSize = files.reduce((sum, file) => sum + file.size, 0);
            if (totalSize <= DEFAULT_BLOCK_SIZE) {

                toast.info("Transferring funds for " + toast_text + " upload");
                // Fund the uploader for all blocks
                const fundingSuccess = await fundUploader(totalSize);
                if (!fundingSuccess) {
                    toast.error("Failed to fund uploader");
                    return null;
                }

                const tags: Tag[] = [];

                for (let i = 0; i < files.length; i++) {
                    tags.push({ name: "Content-Type", value: files[i].type });
                }

                const uploadToArweave = toast.info("Sign to upload " + toast_text + " on Arweave.");

                let receipt : IrysWebUploaderResponse;

                try {
                    receipt = await uploader.uploadFolder(files, {
                        //@ts-ignore
                        tags,
                    });
                    toast.update(uploadToArweave, {
                        render: toast_text + " have been uploaded successfully! View: https://gateway.irys.xyz/${receipt.id}",
                        type: "success",
                        isLoading: false,
                        autoClose: 2000,
                    });
                } catch (error) {
                    toast.update(uploadToArweave, {
                        render: "Failed to upload " + toast_text + ", please try again later.",
                        type: "error",
                        isLoading: false,
                        autoClose: 3000,
                    });

                    return null;
                }
                console.log("receipt", receipt)
                return receipt;
            }

            // For larger uploads, use block upload
            return uploadFilesInBlocks(connection, files, [], {
                onBlockUpload: (current, total) => {
                    toast.info(`Uploading block ${current}/${total}`);
                },
                onManifestUpload: (manifestId) => {
                    toast.success(`Upload complete! Manifest ID: ${manifestId}`);
                }
            });
        },
        [uploader, uploadFilesInBlocks, fundUploader],
    );

    return { getIrysUploader, uploadFiles };
};

export default useIrysUploader;
