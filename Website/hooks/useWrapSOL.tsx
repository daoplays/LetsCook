import {
    NATIVE_MINT,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    createSyncNativeInstruction,
    getAccount,
} from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import {
    clusterApiUrl,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
    ComputeBudgetProgram,
} from "@solana/web3.js";
import { useCallback, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Config, TIMEOUT } from "../components/Solana/constants";
import { getRecentPrioritizationFees, get_current_blockhash, send_transaction } from "../components/Solana/state";
import bs58 from "bs58";

const useWrapSOL = () => {
    const wallet = useWallet();

    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        signature_ws_id.current = null;
        setIsLoading(false);
        // if we have a subscription field check against ws_id
        if (result.err !== null) {
            toast.error("Transaction failed, please try again", {
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }

        toast.success("Transaction Successfull!", {
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

    const WrapSOL = async (sol_amount: number) => {
        // if we have already done this then just skip this step

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        const associatedTokenAccount = await getAssociatedTokenAddress(NATIVE_MINT, wallet.publicKey);

        let create_ata_idx = createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            associatedTokenAccount,
            wallet.publicKey,
            NATIVE_MINT,
        );

        let transfer_idx = SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: associatedTokenAccount,
            lamports: sol_amount,
        });

        let sync_idx = createSyncNativeInstruction(associatedTokenAccount);

        let list_txArgs = await get_current_blockhash("");

        let list_transaction = new Transaction(list_txArgs);
        list_transaction.feePayer = wallet.publicKey;
        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
        list_transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));

        let ata_balance = await connection.getBalance(associatedTokenAccount);

        if (ata_balance === 0) {
            list_transaction.add(create_ata_idx);
        }
        list_transaction.add(transfer_idx);
        list_transaction.add(sync_idx);

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
    return { WrapSOL, isLoading };
};

export default useWrapSOL;
