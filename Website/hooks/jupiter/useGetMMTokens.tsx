import {
    LaunchData,
    LaunchInstruction,
    get_current_blockhash,
    myU64,
    send_transaction,
    serialise_basic_instruction,
    request_current_balance,
    uInt32ToLEBytes,
    bignum_to_num,
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

import {
    Token,
    DEVNET_PROGRAM_ID,
    MAINNET_PROGRAM_ID,
    Liquidity,
    SYSTEM_PROGRAM_ID,
    RENT_PROGRAM_ID,
    LOOKUP_TABLE_CACHE,
} from "@raydium-io/raydium-sdk";

import { ComputeBudgetProgram } from "@solana/web3.js";

import { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { LaunchKeys, LaunchFlags } from "../../components/Solana/constants";
import { make_tweet } from "../../components/launch/twitter";
import { LimitOrderProvider } from "@jup-ag/limit-order-sdk";
import useAppRoot from "../../context/useAppRoot";

const useGetMMTokens = () => {
    const wallet = useWallet();
    const { listingData } = useAppRoot();
    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        // if we have a subscription field check against ws_id
        if (result.err !== null) {
            alert("Transaction failed, please try again");
            return;
        }

        signature_ws_id.current = null;
    }, []);

    const GetMMTokens = async (launch: LaunchData) => {
        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        const placeLimitToast = toast.loading("Collecting Tokens..");

        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        let listing = listingData.get(launch.listing.toString());

        const token_mint = listing.mint;
        const wsol_mint = new PublicKey("So11111111111111111111111111111111111111112");

        let user_pda_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User_PDA")], PROGRAM)[0];

        let user_token_account_key = await getAssociatedTokenAddress(
            token_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            TOKEN_2022_PROGRAM_ID,
        );

        let pda_token_account_key = await getAssociatedTokenAddress(
            token_mint, // mint
            user_pda_account, // owner
            true, // allow owner off curve
            TOKEN_2022_PROGRAM_ID,
        );

        let amm_seed_keys = [];
        if (token_mint.toString() < wsol_mint.toString()) {
            amm_seed_keys.push(token_mint);
            amm_seed_keys.push(wsol_mint);
        } else {
            amm_seed_keys.push(wsol_mint);
            amm_seed_keys.push(token_mint);
        }

        let amm_data_account = PublicKey.findProgramAddressSync(
            [
                amm_seed_keys[0].toBytes(),
                amm_seed_keys[1].toBytes(),
                Buffer.from(launch.flags[LaunchFlags.AMMProvider] === 0 ? "CookAMM" : "RaydiumCPMM"),
            ],
            PROGRAM,
        )[0];

        let current_date = Math.floor((new Date().getTime() / 1000 - bignum_to_num(launch.last_interaction)) / 24 / 60 / 60);
        console.log(current_date);

        let date_bytes = uInt32ToLEBytes(current_date);

        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launch.page_name), Buffer.from("Launch")], PROGRAM)[0];

        let launch_date_account = PublicKey.findProgramAddressSync(
            [amm_data_account.toBytes(), date_bytes, Buffer.from("LaunchDate")],
            PROGRAM,
        )[0];

        let user_date_account = PublicKey.findProgramAddressSync(
            [amm_data_account.toBytes(), wallet.publicKey.toBytes(), date_bytes],
            PROGRAM,
        )[0];

        const instruction_data = serialise_basic_instruction(0);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_pda_account, isSigner: false, isWritable: true },
            { pubkey: user_token_account_key, isSigner: false, isWritable: true },
            { pubkey: pda_token_account_key, isSigner: false, isWritable: true },
            { pubkey: amm_data_account, isSigner: false, isWritable: true },
            { pubkey: launch_date_account, isSigner: false, isWritable: true },
            { pubkey: user_date_account, isSigner: false, isWritable: true },
            { pubkey: token_mint, isSigner: false, isWritable: true },
            { pubkey: wsol_mint, isSigner: false, isWritable: true },
            { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
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

        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
        transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));

        transaction.add(instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            var signature = await connection.sendRawTransaction(signed_transaction.serialize(), { skipPreflight: true });

            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");

            toast.update(placeLimitToast, {
                render: "Collected Tokens",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });
        } catch (error) {
            toast.update(placeLimitToast, {
                render: "Collection Failed.  Please try again later.",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
        }
    };

    return { GetMMTokens, isLoading };
};

export default useGetMMTokens;
