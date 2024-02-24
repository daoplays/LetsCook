import {
    LaunchData,
    LaunchInstruction,
    get_current_blockhash,
    myU64,
    send_transaction,
    serialise_basic_instruction,
    request_current_balance,
    uInt32ToLEBytes,
} from "../../components/Solana/state";
import { serialise_ClaimReward_instruction } from "../../components/Solana/jupiter_state";

import { PublicKey, Transaction, TransactionInstruction, Connection, Keypair } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { LaunchKeys, PROGRAM, RPC_NODE, SYSTEM_KEY, WSS_NODE, SOL_ACCOUNT_SEED } from "../../components/Solana/constants";
import { useCallback, useRef, useState } from "react";
import bs58 from "bs58";
import BN from "bn.js";
import { toast } from "react-toastify";

import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

const useGetMMRewards = () => {
    const wallet = useWallet();

    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        // if we have a subscription field check against ws_id
        if (result.err !== null) {
            alert("Transaction failed, please try again");
            return;
        }

        signature_ws_id.current = null;
    }, []);

    const GetMMRewards = async (date : number, launch : LaunchData) => {
        const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });

        const placeLimitToast = toast.loading("Claiming Reward..");

        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        const token_mint = launch.keys[LaunchKeys.MintAddress];

        let user_pda_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User_PDA")], PROGRAM)[0];

        let user_token_account_key = await getAssociatedTokenAddress(
            token_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );

        let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

        let pda_token_account_key = await getAssociatedTokenAddress(
            token_mint, // mint
            program_sol_account, // owner
            true, // allow owner off curve
        );

        let date_bytes = uInt32ToLEBytes(date);

        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launch.page_name), Buffer.from("Launch")], PROGRAM)[0];

        let launch_date_account = PublicKey.findProgramAddressSync(
            [token_mint.toBytes(), date_bytes, Buffer.from("LaunchDate")],
            PROGRAM,
        )[0];



        let user_date_account = PublicKey.findProgramAddressSync([token_mint.toBytes(), wallet.publicKey.toBytes(), date_bytes], PROGRAM)[0];

        const instruction_data = serialise_ClaimReward_instruction(date);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_pda_account, isSigner: false, isWritable: true },
            { pubkey: user_token_account_key, isSigner: false, isWritable: true },

            { pubkey: pda_token_account_key, isSigner: false, isWritable: true },
            { pubkey: program_sol_account, isSigner: false, isWritable: true },

            { pubkey: launch_data_account, isSigner: false, isWritable: true },
            { pubkey: launch_date_account, isSigner: false, isWritable: true },
            { pubkey: user_date_account, isSigner: false, isWritable: true },
            { pubkey: token_mint, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: true },
            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: true },
        ];

        const instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            console.log("claim reward", transaction_response);

            let signature = transaction_response.result;

            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");

            toast.update(placeLimitToast, {
                render: "Rewards Claimed",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });
        } catch (error) {
            toast.update(placeLimitToast, {
                render: "Reward Claim Failed.  Please try again later.",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
        }
    };

    return { GetMMRewards, isLoading };
};

export default useGetMMRewards;
