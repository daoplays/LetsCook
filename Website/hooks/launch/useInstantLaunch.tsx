import { useCallback, useRef, useState } from "react";

import {
    LaunchDataUserInput,
    LaunchInstruction,
    getRecentPrioritizationFees,
    get_current_blockhash,
    request_current_balance,
    send_transaction,
    serialise_CreateLaunch_instruction,
    uInt32ToLEBytes,
} from "../../components/Solana/state";
import {
    DEBUG,
    SYSTEM_KEY,
    PROGRAM,
    Config,
    LaunchKeys,
    METAPLEX_META,
    SOL_ACCOUNT_SEED,
    DATA_ACCOUNT_SEED,
} from "../../components/Solana/constants";
import { useWallet } from "@solana/wallet-adapter-react";
import {
    PublicKey,
    Transaction,
    TransactionInstruction,
    Connection,
    ComputeBudgetProgram,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import "react-datepicker/dist/react-datepicker.css";
import bs58 from "bs58";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import useAppRoot from "../../context/useAppRoot";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import useEditLaunch from "./useEditLaunch";
import useIrysUploader from "../useIrysUploader";
import { bignum, FixableBeetStruct, u8, utf8String } from "@metaplex-foundation/beet";

class CreateInstantLaunch_Instruction {
    constructor(
        readonly instruction: number,
        readonly name: string,
        readonly symbol: string,
        readonly uri: string,
        readonly icon: string,
        readonly description: string,
        readonly website: string,
        readonly twitter: string,
        readonly telegram: string,
        readonly discord: string,
    ) {}

    static readonly struct = new FixableBeetStruct<CreateInstantLaunch_Instruction>(
        [
            ["instruction", u8],
            ["name", utf8String],
            ["symbol", utf8String],
            ["uri", utf8String],
            ["icon", utf8String],
            ["description", utf8String],
            ["website", utf8String],
            ["twitter", utf8String],
            ["telegram", utf8String],
            ["discord", utf8String],
        ],
        (args) =>
            new CreateInstantLaunch_Instruction(
                args.instruction!,
                args.name!,
                args.symbol!,
                args.uri!,
                args.icon!,
                args.description!,
                args.website!,
                args.twitter!,
                args.telegram!,
                args.discord!,
            ),
        "CreateInstantLaunch_Instruction",
    );
}

function serialise_CreateInstantLaunch_instruction(new_launch_data: LaunchDataUserInput): Buffer {
    const data = new CreateInstantLaunch_Instruction(
        LaunchInstruction.create_instant_launch,
        new_launch_data.name,
        new_launch_data.symbol,
        new_launch_data.uri,
        new_launch_data.icon_url,
        "",
        new_launch_data.web_url,
        new_launch_data.twt_url,
        new_launch_data.tele_url,
        new_launch_data.disc_url,
    );
    const [buf] = CreateInstantLaunch_Instruction.struct.serialize(data);

    return buf;
}

const useInstantLaunch = () => {
    const router = useRouter();
    const wallet = useWallet();
    const { newLaunchData } = useAppRoot();
    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);
    const amm_id = useRef<string>("");
    const image_url = useRef<string>("");
    const meta_url = useRef<string>("");

    const { uploadFiles } = useIrysUploader(wallet);

    const check_signature_update = useCallback(async (result: any) => {
        // if we have a subscription field check against ws_id
        signature_ws_id.current = null;
        setIsLoading(false);

        if (result.err !== null) {
            toast.error("Transaction failed, please try again");
            return;
        }

        toast.success("Launch Complete!", {
            type: "success",
            isLoading: false,
            autoClose: 3000,
        });

        image_url.current = "";
        meta_url.current = "";

        router.push(`/trade/${amm_id.current}`).then(() => {
            window.location.reload();
        });

        signature_ws_id.current = null;
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

    const CreateInstantLaunch = async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        setIsLoading(true);

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);

        if (image_url.current == "") {
            try {
                let receipt = await uploadFiles(connection, [newLaunchData.current.icon_file], "Images");

                console.log(receipt, "https://gateway.irys.xyz/" + receipt.manifest.paths[newLaunchData.current.icon_file.name].id);

                newLaunchData.current.icon_url =
                    "https://gateway.irys.xyz/" + receipt.manifest.paths[newLaunchData.current.icon_file.name].id;
                image_url.current = newLaunchData.current.icon_url;
            } catch (e) {
                console.log(e);
                setIsLoading(false);
                return;
            }
        } else {
            console.log("using existing image url ", image_url.current);
            newLaunchData.current.icon_url = image_url.current;
        }

        if (meta_url.current == "") {
            // console.log(icon_url, banner_url);
            var metadata = {
                name: newLaunchData.current.name,
                symbol: newLaunchData.current.symbol,
                description: newLaunchData.current.description,
                image: newLaunchData.current.icon_url,
            };

            const jsn = JSON.stringify(metadata);
            const blob = new Blob([jsn], { type: "application/json" });
            const json_file = new File([blob], "metadata.json");

            try {
                let receipt = await uploadFiles(connection, [json_file], "Metadata");

                console.log("json recipet", receipt, "https://gateway.irys.xyz/" + receipt.manifest.paths[json_file.name].id);

                newLaunchData.current.uri = "https://gateway.irys.xyz/" + receipt.manifest.paths[json_file.name].id;
                meta_url.current = newLaunchData.current.uri;
            } catch (e) {
                console.log(e);
                setIsLoading(false);
                return;
            }
        } else {
            console.log("using existing meta url ", meta_url.current);
            newLaunchData.current.uri = meta_url.current;
        }

        let program_data_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(DATA_ACCOUNT_SEED)], PROGRAM)[0];
        let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

        let wrapped_sol_mint = new PublicKey("So11111111111111111111111111111111111111112");
        var token_mint_pubkey = newLaunchData.current.token_keypair.publicKey;

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        let listing = PublicKey.findProgramAddressSync([token_mint_pubkey.toBuffer(), Buffer.from("Listing")], PROGRAM)[0];

        let amm_seed_keys = [];
        if (token_mint_pubkey.toString() < wrapped_sol_mint.toString()) {
            amm_seed_keys.push(token_mint_pubkey);
            amm_seed_keys.push(wrapped_sol_mint);
        } else {
            amm_seed_keys.push(wrapped_sol_mint);
            amm_seed_keys.push(token_mint_pubkey);
        }

        let amm_data_account = PublicKey.findProgramAddressSync(
            [amm_seed_keys[0].toBytes(), amm_seed_keys[1].toBytes(), Buffer.from("CookAMM")],
            PROGRAM,
        )[0];

        amm_id.current = amm_data_account.toString();

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

        let cook_lp_mint_account = PublicKey.findProgramAddressSync([amm_data_account.toBytes(), Buffer.from("LP")], PROGRAM)[0];

        let index_buffer = uInt32ToLEBytes(0);
        let price_data_account = PublicKey.findProgramAddressSync(
            [amm_data_account.toBytes(), index_buffer, Buffer.from("TimeSeries")],
            PROGRAM,
        )[0];

        const instruction_data = serialise_CreateInstantLaunch_instruction(newLaunchData.current);
        console.log("idx data", instruction_data.length);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_data_account, isSigner: false, isWritable: true },

            { pubkey: listing, isSigner: false, isWritable: true },

            { pubkey: program_data_account, isSigner: false, isWritable: true },
            { pubkey: program_sol_account, isSigner: false, isWritable: true },

            { pubkey: token_mint_pubkey, isSigner: true, isWritable: true },
            { pubkey: wrapped_sol_mint, isSigner: false, isWritable: true },

            { pubkey: amm_data_account, isSigner: false, isWritable: true },
            { pubkey: quote_amm_account, isSigner: false, isWritable: true },
            { pubkey: base_amm_account, isSigner: false, isWritable: true },
            { pubkey: cook_lp_mint_account, isSigner: false, isWritable: true },
            { pubkey: price_data_account, isSigner: false, isWritable: true },
        ];

        account_vector.push({ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: newLaunchData.current.token_program, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: false });

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));
        transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));
        transaction.add(list_instruction);

        transaction.partialSign(newLaunchData.current.token_keypair);

        const createLaunch = toast.info("(3/3) Setting up your launch");

        console.log("tx size", transaction.serializeMessage().length);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);

            var signature = await connection.sendRawTransaction(signed_transaction.serialize(), { skipPreflight: true });

            console.log(signature);
            //var transaction_response = await send_transaction("", encoded_transaction);

            if (signature === undefined) {
                console.log(signature);
                toast.error("Transaction failed, please try again");
                return;
            }

            //let signature = transaction_response.result;

            if (DEBUG) {
                console.log("list signature: ", signature);
            }
            signature_ws_id.current = 1;

            connection.onSignature(signature, check_signature_update, "confirmed");
            setTimeout(transaction_failed, 20000);
        } catch (error) {
            console.log(error);
            setIsLoading(false);
            toast.update(createLaunch, {
                render: "We couldn't create your launch accounts. Please try again.",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }
    };

    return { CreateInstantLaunch, image_url, meta_url, isLoading };
};

export default useInstantLaunch;
