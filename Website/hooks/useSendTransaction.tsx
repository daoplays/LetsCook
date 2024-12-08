import { Config } from "@/components/Solana/constants";
import { getRecentPrioritizationFees, get_current_blockhash } from "@/components/Solana/state";
import showTransactionToast from "@/components/transactionToast";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { 
    Connection, 
    Transaction, 
    TransactionInstruction,
    Keypair,
    PublicKey,
    ComputeBudgetProgram
} from "@solana/web3.js";
import { useCallback, useRef, useState } from "react";

interface SendTransactionOptions {
    instructions: TransactionInstruction[];
    additionalSigner?: Keypair;
    onSuccess?: () => void;
    onError?: (error: any) => void;
    skipPreflight?: boolean; // defaults to true
    commitment?: 'processed' | 'confirmed' | 'finalized'; // defaults to 'confirmed'
    timeout?: number; // defaults to 30000
}

const DEFAULT_OPTIONS: Partial<SendTransactionOptions> = {
    skipPreflight: true,
    commitment: 'confirmed',
    timeout: 30000
}

const useSendTransaction = () => {
    const wallet = useWallet();
    const { connection } = useConnection();

    const [isLoading, setIsLoading] = useState(false);
    const signatureWsId = useRef<number | null>(null);
    const timeoutId = useRef<NodeJS.Timeout | null>(null);

    const clearSubscriptions = useCallback(() => {
        if (signatureWsId.current !== null) {
            const connection = new Connection(Config.RPC_NODE);
            connection.removeSignatureListener(signatureWsId.current);
            signatureWsId.current = null;
        }
        if (timeoutId.current !== null) {
            clearTimeout(timeoutId.current);
            timeoutId.current = null;
        }
    }, []);

    const handleTransactionComplete = useCallback(async (result: any, toastControls: any, options?: SendTransactionOptions) => {
        clearSubscriptions();
        setIsLoading(false);

        if (result.err !== null) {
            toastControls.setError("execution_failed");
            options?.onError?.(result.err);
            return;
        }

        toastControls.setStatus("Confirmed");
        options?.onSuccess?.();
    }, [clearSubscriptions]);

    const handleTransactionTimeout = useCallback((toastControls: any, options?: SendTransactionOptions) => {
        clearSubscriptions();
        setIsLoading(false);

        toastControls.setError("Transaction timeout");
        options?.onError?.(new Error("Transaction timeout"));
    }, [clearSubscriptions]);

    const sendTransaction = async (options: SendTransactionOptions) => {
        // Merge provided options with defaults
        const finalOptions = { ...DEFAULT_OPTIONS, ...options };
        
        if (!wallet.signTransaction) {
            console.error("Wallet does not support signing");
            return;
        }

        if (signatureWsId.current !== null) {
            console.log("Transaction already pending");
            alert("Transaction pending, please wait");
            return;
        }

        if (finalOptions.instructions.length === 0) {
            console.error("No instructions provided");
            return;
        }

        const toastControls = showTransactionToast();
        setIsLoading(true);

        try {
            toastControls.setStatus("Signing");
            
            const txArgs = await get_current_blockhash("");
            const transaction = new Transaction(txArgs);
            transaction.feePayer = wallet.publicKey;

            let all_instructions = []

            let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
            all_instructions.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));
            all_instructions.push(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));

            all_instructions.push(...finalOptions.instructions);

            // Add all instructions to the transaction
            transaction.add(...all_instructions);

            // If there's an additional signer, add it to the transaction
            if (finalOptions.additionalSigner) {
                transaction.partialSign(finalOptions.additionalSigner);
            }

            // Sign with the wallet
            const signedTransaction = await wallet.signTransaction(transaction);

            toastControls.setStatus("Sending");

            // Send the transaction
            const signature = await connection.sendRawTransaction(
                signedTransaction.serialize(), 
                { skipPreflight: finalOptions.skipPreflight }
            );

            console.log("Transaction signature: ", signature);

            // Set up signature listener
            signatureWsId.current = connection.onSignature(
                signature,
                (result) => handleTransactionComplete(result, toastControls, finalOptions),
                finalOptions.commitment
            );

            // Set up timeout
            timeoutId.current = setTimeout(
                () => handleTransactionTimeout(toastControls, finalOptions),
                finalOptions.timeout
            );

        } catch (error) {
            console.error(error);
            setIsLoading(false);
            toastControls.setError("Failed to send transaction");
            finalOptions.onError?.(error);
            return;
        }
    };

    // Clean up subscriptions when component unmounts
    useCallback(() => {
        return () => {
            clearSubscriptions();
        };
    }, [clearSubscriptions]);

    return { sendTransaction, isLoading };
};

export default useSendTransaction;