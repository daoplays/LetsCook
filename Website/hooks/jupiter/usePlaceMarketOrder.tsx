import {
    LaunchData,
    LaunchInstruction,
    get_current_blockhash,
    myU64,
    send_transaction,
    serialise_basic_instruction,
    request_current_balance,
    uInt32ToLEBytes,
    bignum_to_num
} from "../../components/Solana/state";
import { serialise_PlaceLimit_instruction } from "../../components/Solana/jupiter_state";

import { PublicKey, Transaction, TransactionInstruction, Connection, Keypair } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, RPC_NODE, SYSTEM_KEY, WSS_NODE } from "../../components/Solana/constants";
import { useCallback, useRef, useState } from "react";
import bs58 from "bs58";
import BN from "bn.js";
import { toast } from "react-toastify";


import { ComputeBudgetProgram } from "@solana/web3.js";

import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { LaunchKeys, LaunchFlags, PROD } from "../../components/Solana/constants";
import { make_tweet } from "../../components/launch/twitter";
import useAppRoot from "../../context/useAppRoot";

const usePlaceMarketOrder = () => {
    const wallet = useWallet();
    const { checkProgramData } = useAppRoot();

    const [isLoading, setIsLoading] = useState(false);
    const [toastId, setToastId] = useState<number | string | null>(null);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        // if we have a subscription field check against ws_id
        if (result.err !== null) {

            toast.update(toastId, {
                render: "Market Order Failed.  Please try again later.",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });    
            setToastId(null);        
            return;
        }

        toast.update(toastId, {
            render: "Market Order Placed",
            type: "success",
            isLoading: false,
            autoClose: 3000,
        });
        await checkProgramData();

        signature_ws_id.current = null;
        setToastId(null);
    }, [toastId]);

    const PlaceMarketOrder = async (launch: LaunchData, token_amount: number, sol_amount: number, order_type: number) => {
        const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });

        const placeLimitToast = toast.loading("Placing Market Order..");
        setToastId(placeLimitToast);

        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        const token_mint = launch.keys[LaunchKeys.MintAddress];
        const wsol_mint = new PublicKey("So11111111111111111111111111111111111111112");

       

        token_amount = new BN(token_amount * Math.pow(10, launch.decimals));
        sol_amount = new BN(sol_amount * Math.pow(10, 9));
       
     
        let user_token_account_key = await getAssociatedTokenAddress(
            token_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            TOKEN_2022_PROGRAM_ID
        );

        let temp_wsol_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), launch.keys[LaunchKeys.MintAddress].toBytes(), Buffer.from("Temp")],
            PROGRAM,
        )[0];

        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launch.page_name), Buffer.from("Launch")], PROGRAM)[0];

        let current_date = Math.floor((new Date().getTime() / 1000 - bignum_to_num(launch.last_interaction)) / 24 / 60 / 60);
        let date_bytes = uInt32ToLEBytes(current_date);


        let launch_date_account = PublicKey.findProgramAddressSync(
            [token_mint.toBytes(), date_bytes, Buffer.from("LaunchDate")],
            PROGRAM,
        )[0];

        let user_date_account = PublicKey.findProgramAddressSync(
            [token_mint.toBytes(), wallet.publicKey.toBytes(), date_bytes],
            PROGRAM,
        )[0];

        let amm_seed_keys = []
        if (token_mint.toString() < wsol_mint.toString()) {
            amm_seed_keys.push(token_mint)
            amm_seed_keys.push(wsol_mint)
        }
        else{
            amm_seed_keys.push(wsol_mint)
            amm_seed_keys.push(token_mint)
        }


        let amm_data_account = PublicKey.findProgramAddressSync(
            [amm_seed_keys[0].toBytes(), amm_seed_keys[1].toBytes(), Buffer.from("AMM")],
            PROGRAM,
        )[0];

        let base_amm_account = await getAssociatedTokenAddress(
            token_mint, // mint
            amm_data_account, // owner
            true, // allow owner off curve
            TOKEN_2022_PROGRAM_ID
        );

        let quote_amm_account = await getAssociatedTokenAddress(
            wsol_mint, // mint
            amm_data_account, // owner
            true, // allow owner off curve
            TOKEN_PROGRAM_ID
        );

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        let index_buffer = uInt32ToLEBytes(0);
        let price_data_account = PublicKey.findProgramAddressSync([amm_data_account.toBytes(), index_buffer, Buffer.from("TimeSeries")], PROGRAM)[0];


        const instruction_data = serialise_PlaceLimit_instruction(order_type, order_type === 0 ? sol_amount : token_amount, []);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_data_account, isSigner: false, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },

            { pubkey: user_token_account_key, isSigner: false, isWritable: true },
            { pubkey: temp_wsol_account, isSigner: false, isWritable: true },

            { pubkey: token_mint, isSigner: false, isWritable: true },
            { pubkey: wsol_mint, isSigner: false, isWritable: true },

            { pubkey: amm_data_account, isSigner: false, isWritable: true },
            { pubkey: base_amm_account, isSigner: false, isWritable: true },
            { pubkey: quote_amm_account, isSigner: false, isWritable: true },

            { pubkey: launch_date_account, isSigner: false, isWritable: true },
            { pubkey: user_date_account, isSigner: false, isWritable: true },


            { pubkey: price_data_account, isSigner: false, isWritable: true },


            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },

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

        console.log("sending transaction");

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            console.log(signed_transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            console.log("market order", transaction_response);

            let signature = transaction_response.result;

            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");

            
        } catch (error) {
            toast.update(placeLimitToast, {
                render: "Market Order Failed.  Please try again later.",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
        }
    };

    return { PlaceMarketOrder, isLoading };
};

export default usePlaceMarketOrder;
