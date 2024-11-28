import {
    NATIVE_MINT,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    createSyncNativeInstruction,
    getAccount,
    TOKEN_PROGRAM_ID,
    createInitializeAccountInstruction,
    createTransferInstruction,
    createCloseAccountInstruction,
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
    Account,
    PublicKey,
    TransactionInstruction,
} from "@solana/web3.js";
import { useCallback, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Config, TIMEOUT } from "../components/Solana/constants";
import { getRecentPrioritizationFees, get_current_blockhash, send_transaction } from "../components/Solana/state";
import bs58 from "bs58";

const useUnWrapSOL = () => {
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

    const getUnWrapInstruction = async (sol_amount: number, temp_account : PublicKey): Promise<TransactionInstruction[]> => {
        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        if (!wallet || !wallet.publicKey)
            return [];

        // 1) Create new token account
        // 2) Initialize the token account
        // 3) Transfer Wrapped token to the new token account
        // 4) Close the new token account

        const associatedTokenAccount = await getAssociatedTokenAddress(NATIVE_MINT, wallet.publicKey);

        let lamports = await connection.getMinimumBalanceForRentExemption(165);
        let create_temp_account = SystemProgram.createAccount({
            fromPubkey: wallet.publicKey,
            newAccountPubkey: temp_account,
            lamports,
            space: 165,
            programId: TOKEN_PROGRAM_ID,
        })

        let initialise_temp_account =  createInitializeAccountInstruction(
            temp_account,
            NATIVE_MINT,
            wallet.publicKey,
            TOKEN_PROGRAM_ID
        )

        let transfer_idx = createTransferInstruction(
            associatedTokenAccount, // source
            temp_account, // destination
            wallet.publicKey, // owner
            BigInt(sol_amount), // amount
            [], // multisigners
            TOKEN_PROGRAM_ID
        )

        let close_idx = createCloseAccountInstruction(
            temp_account,
            wallet.publicKey,
            wallet.publicKey,
            [],
            TOKEN_PROGRAM_ID
          )

          return [
            create_temp_account,
            initialise_temp_account,
            transfer_idx,
            close_idx
        ];
    };

    const UnWrapSOL = async (sol_amount: number) => {
        // if we have already done this then just skip this step

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        if (!wallet || !wallet.publicKey || !wallet.signTransaction)
            return;

        const temp_token_account = new Keypair();

        let instructions = await getUnWrapInstruction(sol_amount, temp_token_account.publicKey);

        let list_txArgs = await get_current_blockhash("");

        let list_transaction = new Transaction(list_txArgs);
        list_transaction.feePayer = wallet.publicKey;
        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
        list_transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));

        list_transaction.add(...instructions);

        list_transaction.partialSign(temp_token_account);

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
    return { UnWrapSOL, getUnWrapInstruction, isLoading };
};

export default useUnWrapSOL;
