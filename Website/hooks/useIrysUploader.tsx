import React, { useCallback, useEffect, useState } from "react";
import { WebUploader } from "@irys/web-upload";
import { WebEclipseEth, WebSolana } from "@irys/web-upload-solana";
import { Config } from "../components/Solana/constants";
import BaseWebIrys from "@irys/web-upload/dist/types/base";
import { get_current_blockhash, getRecentPrioritizationFees } from "../components/Solana/state";
import { ComputeBudgetProgram, Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { toast } from "react-toastify";

type Tag = {
    name: string;
    value: string;
};
const useIrysUploader = (wallet) => {
    const [uploader, setUploader] = useState<BaseWebIrys | null>(null);

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

    const uploadFiles = useCallback(
        async (connection: Connection, files: File[], toast_text: string) => {
            let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);

            let size = files.reduce((sum, file) => sum + file.size, 0);
            let atomic_price = await uploader.getPrice(Math.ceil(1.1 * size));
            toast.info("Transferring funds for " + toast_text + " upload");
            try {
                let txArgs = await get_current_blockhash("");
                let irys_address = await uploader.utils.getBundlerAddress();
                var tx = new Transaction(txArgs).add(
                    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }),
                    SystemProgram.transfer({
                        fromPubkey: wallet.publicKey,
                        toPubkey: new PublicKey(irys_address),
                        lamports: Number(atomic_price),
                    }),
                );
                tx.feePayer = wallet.publicKey;
                let signed_transaction = await wallet.signTransaction(tx);
                var signature = await connection.sendRawTransaction(signed_transaction.serialize(), { skipPreflight: true });

                if (signature === undefined) {
                    console.log(signature);
                    toast.error("Transaction failed, please try again");
                    return null;
                }

                let fund_check = await uploader.funder.submitFundTransaction(signature);

                console.log(fund_check, fund_check.data["confirmed"]);

                toast.success("Your account has been successfully funded.");
            } catch (error) {
                console.log(error);
                toast.error("Oops! Something went wrong during funding. Please try again later. ");
                return null;
            }

            const tags: Tag[] = [];

            for (let i = 0; i < files.length; i++) {
                tags.push({ name: "Content-Type", value: files[i].type });
            }

            const uploadToArweave = toast.info("Sign to upload " + toast_text + " on Arweave.");

            let receipt;

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

            return receipt;
        },
        [uploader, wallet],
    );

    return { getIrysUploader, uploadFiles };
};

export default useIrysUploader;
