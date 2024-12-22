import {
    LaunchInstruction,
    getRecentPrioritizationFees,
    get_current_blockhash,
    serialise_basic_instruction,
    uInt32ToLEBytes,
} from "../../components/Solana/state";
import { PublicKey, Transaction, TransactionInstruction, ComputeBudgetProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, Config, SYSTEM_KEY, SOL_ACCOUNT_SEED } from "../../components/Solana/constants";
import { useRef } from "react";
import { LaunchKeys, LaunchFlags } from "../../components/Solana/constants";
import useSendTransaction from "../useSendTransaction";
import { ListingData } from "@letscook/sdk/dist/state/listing";
import { LaunchData } from "@letscook/sdk/dist/state/launch";

export const GetRefurndTicketsInstruction = async (user: PublicKey, listing: ListingData, launchData: LaunchData) => {
    if (user.toString() == launchData.keys[LaunchKeys.Seller].toString()) {
        alert("Launch creator cannot buy tickets");
        return;
    }

    if (launchData === null) {
        return;
    }

    let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launchData.page_name), Buffer.from("Launch")], PROGRAM)[0];

    let user_data_account = PublicKey.findProgramAddressSync([user.toBytes(), Buffer.from("User")], PROGRAM)[0];

    let temp_wsol_account = PublicKey.findProgramAddressSync([user.toBytes(), Buffer.from("Temp")], PROGRAM)[0];

    let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

    let user_join_account = PublicKey.findProgramAddressSync(
        [user.toBytes(), Buffer.from(launchData.page_name), Buffer.from("Joiner")],
        PROGRAM,
    )[0];

    let wrapped_sol_mint = new PublicKey("So11111111111111111111111111111111111111112");

    const instruction_data = serialise_basic_instruction(LaunchInstruction.claim_refund);

    var account_vector = [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: user_join_account, isSigner: false, isWritable: true },
        { pubkey: launch_data_account, isSigner: false, isWritable: true },
        { pubkey: launchData.keys[LaunchKeys.WSOLAddress], isSigner: false, isWritable: true },
        { pubkey: temp_wsol_account, isSigner: false, isWritable: true },
        { pubkey: wrapped_sol_mint, isSigner: false, isWritable: false },
        { pubkey: program_sol_account, isSigner: false, isWritable: false },
    ];

    account_vector.push({ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
    account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: false });

    let instructions: TransactionInstruction[] = [];
    const list_instruction = new TransactionInstruction({
        keys: account_vector,
        programId: PROGRAM,
        data: instruction_data,
    });

    return list_instruction;
};

const useRefundTickets = (listing: ListingData, launchData: LaunchData) => {
    const wallet = useWallet();

    const { sendTransaction, isLoading } = useSendTransaction();

    const RefundTickets = async () => {
        let instruction = await GetRefurndTicketsInstruction(wallet.publicKey, listing, launchData);
        await sendTransaction({
            instructions: [instruction],
            onSuccess: () => {
                // Handle success
            },
            onError: (error) => {
                // Handle error
            },
        });
    };

    return { RefundTickets, isLoading };
};

export default useRefundTickets;
