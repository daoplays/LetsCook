import { Dispatch, SetStateAction, MutableRefObject, useCallback, useRef } from "react";

import { LaunchDataUserInput, get_current_blockhash, send_transaction, serialise_EditLaunch_instruction } from "../components/Solana/state";
import { DEBUG, SYSTEM_KEY, PROGRAM, RPC_NODE, WSS_NODE } from "../components/Solana/constants";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, TransactionInstruction, Connection } from "@solana/web3.js";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import "react-datepicker/dist/react-datepicker.css";
import bs58 from "bs58";

interface EditLaunchProps {
    newLaunchData: MutableRefObject<LaunchDataUserInput>;
    setSubmitStatus: Dispatch<SetStateAction<string>>;
}

const useEditLaunch = ({ newLaunchData, setSubmitStatus }: EditLaunchProps) => {
    const wallet = useWallet();

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        // if we have a subscription field check against ws_id
        if (result.err !== null) {
            alert("Transaction failed, please try again");
        }
        signature_ws_id.current = null;
    }, []);

    const EditLaunch = async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        if (signature_ws_id.current !== null) {
            alert("Transaction pending, please wait");
            return;
        }

        const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });

        let launch_data_account = PublicKey.findProgramAddressSync(
            [Buffer.from(newLaunchData.current.pagename), Buffer.from("Launch")],
            PROGRAM,
        )[0];

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
        setSubmitStatus("Set Launch Metadata");

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            if (transaction_response.result === "INVALID") {
                console.log(transaction_response);
                alert("Transaction error, please try again");
                return;
            }

            let signature = transaction_response.result;

            if (DEBUG) {
                console.log("list signature: ", signature);
            }
            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
            setSubmitStatus(null);
        } catch (error) {
            console.log(error);
            setSubmitStatus(null);
            return;
        }
    };
    return { EditLaunch };
};

export default useEditLaunch;
