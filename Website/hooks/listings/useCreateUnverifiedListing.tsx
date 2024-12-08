import { Dispatch, SetStateAction, MutableRefObject, useCallback, useRef, useState } from "react";

import {
    LaunchDataUserInput,
    LaunchInstruction,
    ListingData,
    getRecentPrioritizationFees,
    get_current_blockhash,
    request_launch_data,
    request_raw_account_data,
    send_transaction,
    serialise_EditLaunch_instruction,
    uInt32ToLEBytes,
} from "../../components/Solana/state";
import {
    DEBUG,
    SYSTEM_KEY,
    PROGRAM,
    Config,
    LaunchKeys,
    LaunchFlags,
    DATA_ACCOUNT_SEED,
    SOL_ACCOUNT_SEED,
    TIMEOUT,
} from "../../components/Solana/constants";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, TransactionInstruction, Connection, ComputeBudgetProgram } from "@solana/web3.js";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import "react-datepicker/dist/react-datepicker.css";
import bs58 from "bs58";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getAMMBaseAccount, getAMMQuoteAccount, getLPMintAccount } from "../raydium/useCreateCP";
import { FixableBeetStruct, array, u8, utf8String } from "@metaplex-foundation/beet";
import { NewListing } from "../../components/listing/launch";

class CreateListing_Instruction {
    constructor(
        readonly instruction: number,
        readonly name: string,
        readonly symbol: string,
        readonly icon: string,
        readonly uri: string,
        readonly banner: string,
        readonly description: string,
        readonly website: string,
        readonly twitter: string,
        readonly telegram: string,
        readonly discord: string,
    ) {}

    static readonly struct = new FixableBeetStruct<CreateListing_Instruction>(
        [
            ["instruction", u8],
            ["name", utf8String],
            ["symbol", utf8String],
            ["icon", utf8String],
            ["uri", utf8String],
            ["banner", utf8String],
            ["description", utf8String],
            ["website", utf8String],
            ["twitter", utf8String],
            ["telegram", utf8String],
            ["discord", utf8String],
        ],
        (args) =>
            new CreateListing_Instruction(
                args.instruction!,
                args.name!,
                args.symbol!,
                args.icon!,
                args.uri!,
                args.banner!,
                args.description!,
                args.website!,
                args.twitter!,
                args.telegram!,
                args.discord!,
            ),
        "CreateListing_Instruction",
    );
}

function serialise_CreateListing_instruction(new_listing: NewListing): Buffer {
    const data = new CreateListing_Instruction(
        LaunchInstruction.create_unverified_listing,
        new_listing.name,
        new_listing.symbol,
        new_listing.icon,
        new_listing.uri,
        new_listing.banner,
        new_listing.description,
        new_listing.website,
        new_listing.twitter,
        new_listing.telegram,
        new_listing.discord,
    );
    const [buf] = CreateListing_Instruction.struct.serialize(data);

    return buf;
}

const useCreateUnverifiedListing = () => {
    const wallet = useWallet();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        // if we have a subscription field check against ws_id

        signature_ws_id.current = null;
        setIsLoading(false);

        if (result.err !== null) {
            toast.error("Transaction failed, please try again", {
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }

        toast.success("Request Sent!", {
            type: "success",
            isLoading: false,
            autoClose: 3000,
        });
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

    const CreateUnverifiedListing = async (new_listing: NewListing) => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        if (signature_ws_id.current !== null) {
            //toast.success("Transaction pending, please wait");
            //return;
        }

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        let program_data_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(DATA_ACCOUNT_SEED)], PROGRAM)[0];
        let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];
        let token_mint = new PublicKey(new_listing.token);
        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        if (new_listing.token === "So11111111111111111111111111111111111111112") {
            toast.error("Dont add WSOL");
            return;
        }

        if (Config.PROD) {
            const options = { method: "GET", headers: { "X-API-KEY": "e819487c98444f82857d02612432a051" } };

            let market_url = "https://public-api.birdeye.so/defi/v2/markets?address=" + token_mint.toString();
            let market_result = await fetch(market_url, options).then((response) => response.json());

            let found = false;
            for (let i = 0; i < market_result["data"]["items"].length; i++) {
                let item = market_result["data"]["items"][i];
                if (
                    item.base.address !== "So11111111111111111111111111111111111111112" &&
                    item.quote.address !== "So11111111111111111111111111111111111111112"
                )
                    continue;

                if (item["source"] === "Raydium") {
                    found = true;
                    break;
                }
                if (item["source"] === "Raydium Cp") {
                    found = true;
                    break;
                }
            }

            if (!found) {
                toast.error("No Raydium Market Found");
                return;
            }
        }

        let listing = PublicKey.findProgramAddressSync(
            [token_mint.toBytes(), wallet.publicKey.toBytes(), Buffer.from("UnverifiedListing")],
            PROGRAM,
        )[0];

        const instruction_data = serialise_CreateListing_instruction(new_listing);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_data_account, isSigner: false, isWritable: true },
            { pubkey: listing, isSigner: false, isWritable: true },
            { pubkey: program_data_account, isSigner: false, isWritable: true },
            { pubkey: program_sol_account, isSigner: false, isWritable: true },
            { pubkey: token_mint, isSigner: false, isWritable: true },
            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
        ];

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
        transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));

        transaction.add(list_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            var signature = await connection.sendRawTransaction(signed_transaction.serialize(), { skipPreflight: true });

            if (signature === undefined) {
                console.log(signature);
                toast.error("Transaction failed, please try again");
                return;
            }

            if (DEBUG) {
                console.log("list signature: ", signature);
            }
            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
            setTimeout(transaction_failed, TIMEOUT);
        } catch (error) {
            console.log(error);
            toast.error("Something went wrong launching your token , please try again later.", {
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }
    };
    return { CreateUnverifiedListing };
};

export default useCreateUnverifiedListing;
