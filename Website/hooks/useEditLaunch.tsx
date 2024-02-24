import { Dispatch, SetStateAction, MutableRefObject, useCallback, useRef } from "react";

import { LaunchDataUserInput, get_current_blockhash, send_transaction, serialise_EditLaunch_instruction } from "../components/Solana/state";
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
    }, []);

    const EditLaunch = async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        if (signature_ws_id.current !== null) {
            toast.success("Transaction pending, please wait");
            return;
        }

        const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });

        let launch_data_account = PublicKey.findProgramAddressSync(
            [Buffer.from(newLaunchData.current.pagename), Buffer.from("Launch")],
            PROGRAM,
        )[0];

        console.log("launch account", newLaunchData.current.pagename, launch_data_account.toString());

        const instruction_data = serialise_EditLaunch_instruction(newLaunchData.current);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },
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
        const createLaunch = toast.loading("Launching your token...");

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
                render: "Congratulations! Your token has been successfully launched.",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });

            router.push("/dashboard");
        } catch (error) {
            console.log(error);
            toast.update(createLaunch, {
                render: "Something went wrong launching your token , please try again later.",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }
    };
    return { EditLaunch };
};

export default useEditLaunch;
