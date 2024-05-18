import { Dispatch, SetStateAction, MutableRefObject, useCallback, useRef } from "react";

import {
    LaunchDataUserInput,
    get_current_blockhash,
    request_launch_data,
    send_transaction,
    serialise_EditLaunch_instruction,
} from "../components/Solana/state";
import { DEBUG, SYSTEM_KEY, PROGRAM, Config, LaunchKeys } from "../components/Solana/constants";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, TransactionInstruction, Connection, ComputeBudgetProgram } from "@solana/web3.js";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import "react-datepicker/dist/react-datepicker.css";
import bs58 from "bs58";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import useAppRoot from "../context/useAppRoot";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

const useEditLaunch = () => {
    const wallet = useWallet();
    const router = useRouter();
    const { newLaunchData, checkProgramData } = useAppRoot();

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        signature_ws_id.current = null;

        // if we have a subscription field check against ws_id
        if (result.err !== null) {
            toast.error("Transaction failed, please try again");
            return;
        }

        // reset the urls so we know these have been submitted
        newLaunchData.current.icon_url = "";
        newLaunchData.current.banner_url = "";
        newLaunchData.current.uri = "";
        newLaunchData.current.edit_mode = false;
        newLaunchData.current.token_keypair = null;

        console.log(newLaunchData.current);
        await checkProgramData();
        router.push("/dashboard");
    }, []);

    const EditLaunch = async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        if (signature_ws_id.current !== null) {
            //toast.success("Transaction pending, please wait");
            //return;
        }

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        let launch_data_account = PublicKey.findProgramAddressSync(
            [Buffer.from(newLaunchData.current.pagename), Buffer.from("Launch")],
            PROGRAM,
        )[0];

        const launch_data = await request_launch_data("", launch_data_account);

        let wrapped_sol_mint = new PublicKey("So11111111111111111111111111111111111111112");
        var token_mint_pubkey = launch_data.keys[LaunchKeys.MintAddress];

        let amm_seed_keys = [];
        if (token_mint_pubkey.toString() < wrapped_sol_mint.toString()) {
            amm_seed_keys.push(token_mint_pubkey);
            amm_seed_keys.push(wrapped_sol_mint);
        } else {
            amm_seed_keys.push(wrapped_sol_mint);
            amm_seed_keys.push(token_mint_pubkey);
        }

        let amm_data_account = PublicKey.findProgramAddressSync(
            [amm_seed_keys[0].toBytes(), amm_seed_keys[1].toBytes(), Buffer.from("AMM")],
            PROGRAM,
        )[0];

        let base_amm_account = await getAssociatedTokenAddress(
            token_mint_pubkey, // mint
            amm_data_account, // owner
            true, // allow owner off curve
            newLaunchData.current.token_program,
        );

        let quote_amm_account = await getAssociatedTokenAddress(
            wrapped_sol_mint, // mint
            amm_data_account, // owner
            true, // allow owner off curve
            TOKEN_PROGRAM_ID,
        );

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        console.log("launch account", newLaunchData.current.pagename, launch_data_account.toString());

        const instruction_data = serialise_EditLaunch_instruction(newLaunchData.current);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_data_account, isSigner: false, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },

            { pubkey: wrapped_sol_mint, isSigner: false, isWritable: true },
            { pubkey: token_mint_pubkey, isSigner: false, isWritable: true },

            { pubkey: amm_data_account, isSigner: false, isWritable: true },
            { pubkey: quote_amm_account, isSigner: false, isWritable: true },
            { pubkey: base_amm_account, isSigner: false, isWritable: true },

            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: newLaunchData.current.token_program, isSigner: false, isWritable: false },
            { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ];

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(list_instruction);
        transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000000 }));

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            if (transaction_response.result === "INVALID") {
                console.log(transaction_response);
                toast.error("Transaction failed, please try again");
                return;
            }

            let signature = transaction_response.result;

            if (DEBUG) {
                console.log("list signature: ", signature);
            }
            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
        } catch (error) {
            console.log(error);
            toast.error("Something went wrong launching your token , please try again later.", {
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }
    };
    return { EditLaunch };
};

export default useEditLaunch;
