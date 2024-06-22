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
    serialise_basic_instruction,
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
import useAppRoot from "../../context/useAppRoot";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getAMMBaseAccount, getAMMQuoteAccount, getLPMintAccount, getPoolStateAccount } from "../raydium/useCreateCP";
import { FixableBeetStruct, array, u8, utf8String } from "@metaplex-foundation/beet";
import { NewListing } from "../../components/listing/launch";



const useCreateListing = () => {
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

        toast.success("Listing Created!", {
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

    const CreateListing = async (new_listing: NewListing, accept: boolean) => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        if (signature_ws_id.current !== null) {
            //toast.success("Transaction pending, please wait");
            //return;
        }

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        let program_data_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(DATA_ACCOUNT_SEED)], PROGRAM)[0];
        let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];
        let token_mint = new PublicKey(new_listing.token);
        let creator = new PublicKey(new_listing.user);
        let creator_data_account = PublicKey.findProgramAddressSync([creator.toBytes(), Buffer.from("User")], PROGRAM)[0];

        let unverified = PublicKey.findProgramAddressSync(
            [token_mint.toBytes(), creator.toBytes(), Buffer.from("UnverifiedListing")],
            PROGRAM,
        )[0];
        let verified = accept ? PublicKey.findProgramAddressSync([token_mint.toBytes(), Buffer.from("Listing")], PROGRAM)[0] : PROGRAM;

        // check for raydium cpmm
        let quote_mint = new PublicKey("So11111111111111111111111111111111111111112");
        let pool_state = getPoolStateAccount(token_mint, quote_mint);
        let pool_state_account = await connection.getAccountInfo(pool_state);

        let amm_seed_keys = [];
        if (token_mint.toString() < quote_mint.toString()) {
            amm_seed_keys.push(token_mint);
            amm_seed_keys.push(quote_mint);
        } else {
            amm_seed_keys.push(quote_mint);
            amm_seed_keys.push(token_mint);
        }

        let amm_data_account = PublicKey.findProgramAddressSync(
            [
                amm_seed_keys[0].toBytes(),
                amm_seed_keys[1].toBytes(),
                Buffer.from("RaydiumCPMM"),
            ],
            PROGRAM,
        )[0];

        let amm_account =  (pool_state_account) ? amm_data_account : PROGRAM;
        let raydium_base_account = getAMMBaseAccount(token_mint, quote_mint);
        let raydium_quote_account = getAMMQuoteAccount(token_mint, quote_mint);
        let raydium_lp_mint_account = getLPMintAccount(token_mint, quote_mint);


        const instruction_data = serialise_basic_instruction(LaunchInstruction.create_listing);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: creator, isSigner: false, isWritable: true },
            { pubkey: creator_data_account, isSigner: false, isWritable: true },
            { pubkey: unverified, isSigner: false, isWritable: true },
            { pubkey: verified, isSigner: false, isWritable: true },
            { pubkey: program_data_account, isSigner: false, isWritable: true },
            { pubkey: program_sol_account, isSigner: false, isWritable: true },
            { pubkey: token_mint, isSigner: false, isWritable: true },
            { pubkey: amm_account, isSigner: false, isWritable: true },
            { pubkey: quote_mint, isSigner: false, isWritable: true },
            { pubkey: raydium_quote_account, isSigner: false, isWritable: true },
            { pubkey: raydium_base_account, isSigner: false, isWritable: true },
            { pubkey: raydium_lp_mint_account, isSigner: false, isWritable: true },

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

        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
        transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));

        transaction.add(list_instruction);

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
    return { CreateListing };
};

export default useCreateListing;
