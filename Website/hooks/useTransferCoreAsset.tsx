import { AssetV1, createV1, transferV1 } from "@metaplex-foundation/mpl-core";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ComputeBudgetProgram, Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { useCallback, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Config, TIMEOUT } from "../components/Solana/constants";
import { Instruction, publicKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { getRecentPrioritizationFees, get_current_blockhash, send_transaction } from "@/components/Solana/state";
import bs58 from "bs58";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";

const useTransferCoreAsset = () => {
    const wallet = useWallet();
    const { connection } = useConnection();
    const [isLoading, setIsLoading] = useState(false);
    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        signature_ws_id.current = null;
        setIsLoading(false);

        if (result.err !== null) {
            toast.error("Transfer failed, please try again", {
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }

        toast.success("Asset Transfer Successful!", {
            type: "success",
            isLoading: false,
            autoClose: 3000,
        });
    }, []);

    const transaction_failed = useCallback(async () => {
        if (signature_ws_id.current == null) return;

        signature_ws_id.current = null;
        setIsLoading(false);

        toast.error("Transaction not processed, please try again", {
            type: "error",
            isLoading: false,
            autoClose: 3000,
        });
    }, []);

    const transferAsset = async (asset: AssetV1, collection: PublicKey, destination: PublicKey) => {
        if (!wallet.signTransaction) {
            console.error("Wallet not connected");
            return;
        }

        setIsLoading(true);
        const umi = createUmi(Config.RPC_NODE, "confirmed");
        umi.use(walletAdapterIdentity(wallet));

        const destinationKey = publicKey(destination.toBuffer());
        const collectionKey = publicKey(collection.toBuffer());

        let transferIdx: Instruction = await transferV1(umi, {
            asset: asset.publicKey,
            newOwner: destinationKey,
            collection: collectionKey,
        }).getInstructions()[0];

        let keys = transferIdx.keys;
        let data = Buffer.from(transferIdx.data);
        let program = new PublicKey(transferIdx.programId.toString());

        let accounts = [];
        for (let key of keys) {
            accounts.push({
                pubkey: new PublicKey(key.pubkey),
                isSigner: key.isSigner,
                isWritable: key.isWritable,
            });
        }

        const list_instruction = new TransactionInstruction({
            keys: accounts,
            programId: program,
            data: data,
        });

        console.log("transferIdx: ", transferIdx);

        let list_txArgs = await get_current_blockhash("");

        let list_transaction = new Transaction(list_txArgs);
        list_transaction.feePayer = wallet.publicKey;
        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
        list_transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));
        list_transaction.add(list_instruction);

        //list_transaction.add(...transferIdx);

        try {
            let signed_transaction = await wallet.signTransaction(list_transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            let signature = transaction_response.result;
            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
            setTimeout(transaction_failed, TIMEOUT);

            console.log("wrap sig: ", signature);
        } catch (error) {
            console.log(error);
            return;
        }
    };

    return { transferAsset, isLoading };
};

export default useTransferCoreAsset;
