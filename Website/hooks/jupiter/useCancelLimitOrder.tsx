import {
    LaunchData,
    LaunchInstruction,
    get_current_blockhash,
    myU64,
    send_transaction,
    serialise_basic_instruction,
    request_current_balance,
    getRecentPrioritizationFees,
} from "../../components/Solana/state";
import { serialise_PlaceCancel_instruction } from "../../components/Solana/jupiter_state";

import { PublicKey, Transaction, TransactionInstruction, Connection, Keypair } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, Config, SYSTEM_KEY } from "../../components/Solana/constants";
import { useCallback, useRef, useState } from "react";
import bs58 from "bs58";
import BN from "bn.js";
import { toast } from "react-toastify";

import { ComputeBudgetProgram } from "@solana/web3.js";

import { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { LaunchKeys, LaunchFlags } from "../../components/Solana/constants";
import { make_tweet } from "../../components/launch/twitter";
import { LimitOrderProvider, Order } from "@jup-ag/limit-order-sdk";
import useAppRoot from "../../context/useAppRoot";

interface OpenOrder {
    publicKey: PublicKey;
    account: Order;
}

const useCancelLimitOrder = () => {
    const wallet = useWallet();
    const { checkUserOrders } = useAppRoot();

    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        // if we have a subscription field check against ws_id
        if (result.err !== null) {
            alert("Transaction failed, please try again");
            return;
        }

        checkUserOrders();

        signature_ws_id.current = null;
    }, []);

    const CancelLimitOrder = async (launch_data: LaunchData, order: OpenOrder) => {
        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        const placeLimitToast = toast.loading("Cancelling Limit Order..");

        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        const token_mint = launch_data.keys[LaunchKeys.MintAddress];
        const wsol_mint = new PublicKey("So11111111111111111111111111111111111111112");
        const jupiter_program_key = new PublicKey("jupoNjAxXgZ4rjzxzPMP4oxduvQsQtZzyknqvzYNrNu");
        let user_pda_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User_PDA")], PROGRAM)[0];

        const limitOrder = new LimitOrderProvider(connection, null);
        // Base key are used to generate a unique order id

        const tx = await limitOrder.cancelOrder({
            owner: user_pda_account,
            orderPubKey: order.publicKey,
        });

        let n_instructions = tx.instructions.length;

        let jup_account_keys = tx.instructions[n_instructions - 1].keys;
        let jup_data = Array.from(tx.instructions[n_instructions - 1].data);

        let user_token_account_key = await getAssociatedTokenAddress(
            token_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            TOKEN_2022_PROGRAM_ID,
        );

        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launch_data.page_name), Buffer.from("Launch")], PROGRAM)[0];

        let order_type = order.account.inputMint.toString() === wsol_mint.toString();
        let order_amount = order.account.makingAmount;
        const instruction_data = serialise_PlaceCancel_instruction(order_type ? 0 : 1, order_amount, jup_data);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_token_account_key, isSigner: false, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: false },
            { pubkey: jupiter_program_key, isSigner: false, isWritable: true },
        ];

        jup_account_keys[2].isSigner = false;
        for (let i = 0; i < jup_account_keys.length; i++) {
            //console.log(jup_account_keys[i].pubkey.toString(), jup_account_keys[i].isSigner, jup_account_keys[i].isWritable)
            account_vector.push(jup_account_keys[i]);
        }

        const instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
        transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));

        transaction.add(instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            console.log("cancel limit order", transaction_response);

            let signature = transaction_response.result;

            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "finalized");

            toast.update(placeLimitToast, {
                render: "Limit Order Cancelled",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });
        } catch (error) {
            toast.update(placeLimitToast, {
                render: "Cancel Failed.  Please try again later.",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
        }
    };

    return { CancelLimitOrder, isLoading };
};

export default useCancelLimitOrder;
