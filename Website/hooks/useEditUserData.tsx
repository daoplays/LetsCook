import { Dispatch, SetStateAction, MutableRefObject, useCallback, useRef } from "react";

import { LaunchDataUserInput, get_current_blockhash, send_transaction, serialise_EditUser_instruction } from "../components/Solana/state";
import { DEBUG, SYSTEM_KEY, PROGRAM, RPC_NODE, WSS_NODE } from "../components/Solana/constants";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, TransactionInstruction, Connection } from "@solana/web3.js";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import "react-datepicker/dist/react-datepicker.css";
import bs58 from "bs58";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import useAppRoot from "../context/useAppRoot";

const useEditUser = () => {
    const wallet = useWallet();

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        signature_ws_id.current = null;

        // if we have a subscription field check against ws_id
        if (result.err !== null) {
            toast.error("Transaction failed, please try again");
            return;
        }
        
    }, []);

    const EditUser = async (name : string) => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        if (signature_ws_id.current !== null) {
            toast.success("Transaction pending, please wait");
            return;
        }

        const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];


        
        const instruction_data = serialise_EditUser_instruction(name);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_data_account, isSigner: false, isWritable: true },
            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: true },
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
        const createLaunch = toast.loading("Updating User Data...");

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

            toast.update(createLaunch, {
                render: "User Data updated",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });

        } catch (error) {
            console.log(error);
            toast.update(createLaunch, {
                render: "Something went wrong editing your user data , please try again later.",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }
    };
    return { EditUser };
};

export default useEditUser;
