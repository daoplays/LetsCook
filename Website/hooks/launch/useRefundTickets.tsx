import {
    LaunchData,
    LaunchInstruction,
    ListingData,
    getRecentPrioritizationFees,
    get_current_blockhash,
    myU64,
    send_transaction,
    serialise_basic_instruction,
    uInt32ToLEBytes,
} from "../../components/Solana/state";
import { PublicKey, Transaction, TransactionInstruction, Connection, ComputeBudgetProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, Config, SYSTEM_KEY, SOL_ACCOUNT_SEED } from "../../components/Solana/constants";
import { useCallback, useRef, useState } from "react";
import bs58 from "bs58";
import { LaunchKeys, LaunchFlags } from "../../components/Solana/constants";
import useAppRoot from "../../context/useAppRoot";
import { toast } from "react-toastify";

const useRefundTickets = (listing: ListingData, launchData: LaunchData, updateData: boolean = false) => {
    const wallet = useWallet();
    const { checkProgramData } = useAppRoot();

    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        // if we have a subscription field check against ws_id

        signature_ws_id.current = null;
        setIsLoading(false);

        if (result.err !== null) {
            toast.error("Transaction failed, please try again", {
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }

        toast.success("Tickets Refunded!", {
            type: "success",
            isLoading: false,
            autoClose: 3000,
        });

        if (updateData) {
            await checkProgramData();
        }
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

    const RefundTickets = async () => {
        if (wallet.signTransaction === undefined) return;

        if (wallet.publicKey.toString() == launchData.keys[LaunchKeys.Seller].toString()) {
            alert("Launch creator cannot buy tickets");
            return;
        }

        if (signature_ws_id.current !== null) {
            alert("Transaction pending, please wait");
            return;
        }

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        if (launchData === null) {
            return;
        }

        setIsLoading(true);

        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launchData.page_name), Buffer.from("Launch")], PROGRAM)[0];

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        let temp_wsol_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("Temp")], PROGRAM)[0];

        let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

        let user_join_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), Buffer.from(launchData.page_name), Buffer.from("Joiner")],
            PROGRAM,
        )[0];

        let wrapped_sol_mint = new PublicKey("So11111111111111111111111111111111111111112");

        const instruction_data = serialise_basic_instruction(LaunchInstruction.claim_refund);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_join_account, isSigner: false, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },
            { pubkey: launchData.keys[LaunchKeys.WSOLAddress], isSigner: false, isWritable: true },
            { pubkey: temp_wsol_account, isSigner: false, isWritable: true },
            { pubkey: wrapped_sol_mint, isSigner: false, isWritable: false },
            { pubkey: program_sol_account, isSigner: false, isWritable: false },
        ];

        account_vector.push({ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: false });

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
        transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));

        transaction.add(list_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            var signature = await connection.sendRawTransaction(signed_transaction.serialize(), { skipPreflight: true });

            console.log("join sig: ", signature);

            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
            setTimeout(transaction_failed, 20000);
        } catch (error) {
            console.log(error);
            setIsLoading(false);
            return;
        }
    };

    return { RefundTickets, isLoading };
};

export default useRefundTickets;
