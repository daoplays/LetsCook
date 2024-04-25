import { Dispatch, SetStateAction, useState, useCallback, useRef } from "react";

import { uInt32ToLEBytes, get_current_blockhash, send_transaction, serialise_EditLaunch_instruction } from "../../components/Solana/state";
import { SOL_ACCOUNT_SEED, DEBUG, SYSTEM_KEY, PROGRAM, Config, DATA_ACCOUNT_SEED } from "../../components/Solana/constants";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, TransactionInstruction, Connection } from "@solana/web3.js";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import "react-datepicker/dist/react-datepicker.css";
import bs58 from "bs58";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import useAppRoot from "../../context/useAppRoot";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { serialise_EditCollection_instruction } from "../../components/collection/collectionState";

const useEditCollection = () => {
    const wallet = useWallet();
    const router = useRouter();
    const { newCollectionData, checkProgramData } = useAppRoot();
    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        setIsLoading(false);
        signature_ws_id.current = null;

        // if we have a subscription field check against ws_id
        if (result.err !== null) {
            toast.error("Transaction failed, please try again");
            return;
        }

        toast.success("Successfuly Launched Collection!", {
            type: "success",
            isLoading: false,
            autoClose: 3000,
        });

        // reset the urls so we know these have been submitted
        newCollectionData.current.icon_url = "";
        newCollectionData.current.banner_url = "";
        newCollectionData.current.uri = "";
        newCollectionData.current.edit_mode = false;
        newCollectionData.current.token_keypair = null;

        await checkProgramData();

        router.push("/dashboard");
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

    const EditCollection = async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        if (signature_ws_id.current !== null) {
            toast.success("Transaction pending, please wait");
            return;
        }

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        let launch_data_account = PublicKey.findProgramAddressSync(
            [Buffer.from(newCollectionData.current.pagename), Buffer.from("Collection")],
            PROGRAM,
        )[0];

        let program_data_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(DATA_ACCOUNT_SEED)], PROGRAM)[0];

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        let team_wallet = new PublicKey(newCollectionData.current.team_wallet);
        let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

        let token_mint = newCollectionData.current.token_mint;

        let team_token_account_key = await getAssociatedTokenAddress(
            token_mint, // mint
            team_wallet, // owner
            true, // allow owner off curve
            TOKEN_2022_PROGRAM_ID,
        );

        let pda_token_account_key = await getAssociatedTokenAddress(
            token_mint, // mint
            program_sol_account, // owner
            true, // allow owner off curve
            TOKEN_2022_PROGRAM_ID,
        );

        const instruction_data = serialise_EditCollection_instruction(newCollectionData.current);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_data_account, isSigner: false, isWritable: true },

            { pubkey: launch_data_account, isSigner: false, isWritable: true },
            { pubkey: program_sol_account, isSigner: false, isWritable: true },
            { pubkey: program_data_account, isSigner: false, isWritable: true },

            { pubkey: team_wallet, isSigner: false, isWritable: false },

            { pubkey: token_mint, isSigner: false, isWritable: true },
            { pubkey: team_token_account_key, isSigner: false, isWritable: true },
            { pubkey: pda_token_account_key, isSigner: false, isWritable: true },

            { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: true },
            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: true },
            { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
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
        const createLaunch = toast.info("Launching your collection (2/2)...");

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
            setTimeout(transaction_failed, 20000);
        } catch (error) {
            console.log(error);
            setIsLoading(false);
            toast.update(createLaunch, {
                render: "Something went wrong launching your collection , please try again later.",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }
    };
    return { EditCollection };
};

export default useEditCollection;
