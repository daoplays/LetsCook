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
import { PublicKey, Transaction, TransactionInstruction, Connection } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, Config, SYSTEM_KEY, SOL_ACCOUNT_SEED, TIMEOUT } from "../../components/Solana/constants";
import { useCallback, useRef, useState } from "react";
import bs58 from "bs58";
import BN from "bn.js";
import { toast } from "react-toastify";

import { Token } from "@raydium-io/raydium-sdk";

import { ComputeBudgetProgram } from "@solana/web3.js";

import {
    unpackMint,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    TOKEN_2022_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { LaunchKeys, LaunchFlags } from "../../components/Solana/constants";
import { make_tweet } from "../../components/launch/twitter";
import { BeetStruct, bignum, u64, u8, uniformFixedSizeArray } from "@metaplex-foundation/beet";
import { getRaydiumPrograms } from "./utils";
import {
    RAYDIUM_PROGRAM,
    getAMMBaseAccount,
    getAMMQuoteAccount,
    getAuthorityAccount,
    getLPMintAccount,
    getPoolStateAccount,
} from "./useCreateCP";
import { MEMO_PROGRAM_ID } from "@raydium-io/raydium-sdk-v2";
import { AMMData } from "../../components/Solana/jupiter_state";
import useAppRoot from "../../context/useAppRoot";

const ZERO = new BN(0);
type BN = typeof ZERO;

function serialise_raydium_remove_liquidity_instruction(amount: number): Buffer {
    let discriminator: number[] = [183, 18, 70, 156, 148, 109, 161, 34];

    const data = new RaydiumRemoveLiquidity_Instruction(discriminator, amount, 0, 0);

    const [buf] = RaydiumRemoveLiquidity_Instruction.struct.serialize(data);

    return buf;
}

class RaydiumRemoveLiquidity_Instruction {
    constructor(
        readonly discriminator: number[],
        readonly lp_amount: bignum,
        readonly min_token_0: bignum,
        readonly min_token_1: bignum,
    ) {}

    static readonly struct = new BeetStruct<RaydiumRemoveLiquidity_Instruction>(
        [
            ["discriminator", uniformFixedSizeArray(u8, 8)],
            ["lp_amount", u64],
            ["min_token_0", u64],
            ["min_token_1", u64],
        ],
        (args) => new RaydiumRemoveLiquidity_Instruction(args.discriminator!, args.lp_amount!, args.min_token_0!, args.min_token_1!),
        "RaydiumRemoveLiquidity_Instruction",
    );
}

const useRemoveLiquidityRaydium = (amm: AMMData) => {
    const wallet = useWallet();
    const { mintData } = useAppRoot();

    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        signature_ws_id.current = null;
        setIsLoading(false);
        // if we have a subscription field check against ws_id
        if (result.err !== null) {
            toast.error("Transaction failed, please try again", {
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }

        toast.success("Transaction Successfull!", {
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

    const RemoveLiquidityRaydium = async (lp_amount: number) => {
        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        let base_mint = amm.base_mint;
        let quote_mint = new PublicKey("So11111111111111111111111111111111111111112");

        let base_mint_data = mintData.get(base_mint.toString());
        let quote_mint_data = mintData.get(quote_mint.toString());

        const [token0, token1] = new BN(base_mint.toBuffer()).gt(new BN(quote_mint.toBuffer()))
            ? [quote_mint, base_mint]
            : [base_mint, quote_mint];

        let authority = getAuthorityAccount();
        let pool_state = getPoolStateAccount(base_mint, quote_mint);

        let lp_mint = getLPMintAccount(base_mint, quote_mint);
        let amm_0 = token0.equals(base_mint) ? getAMMBaseAccount(base_mint, quote_mint) : getAMMQuoteAccount(base_mint, quote_mint);
        let amm_1 = token0.equals(base_mint) ? getAMMQuoteAccount(base_mint, quote_mint) : getAMMBaseAccount(base_mint, quote_mint);

        let user_base_account = await getAssociatedTokenAddress(
            amm.base_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            base_mint_data.token_program,
        );

        let user_quote_account = await getAssociatedTokenAddress(
            quote_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            quote_mint_data.token_program,
        );

        let user_0 = token0.equals(base_mint) ? user_base_account : user_quote_account;
        let user_1 = token0.equals(base_mint) ? user_quote_account : user_base_account;

        let user_lp_account = await getAssociatedTokenAddress(
            lp_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            TOKEN_PROGRAM_ID,
        );

        const keys = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
            { pubkey: authority, isSigner: false, isWritable: false },
            { pubkey: pool_state, isSigner: false, isWritable: true },
            { pubkey: user_lp_account, isSigner: false, isWritable: true },
            { pubkey: user_0, isSigner: false, isWritable: true },
            { pubkey: user_1, isSigner: false, isWritable: true },
            { pubkey: amm_0, isSigner: false, isWritable: true },
            { pubkey: amm_1, isSigner: false, isWritable: true },

            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: token0, isSigner: false, isWritable: false },
            { pubkey: token1, isSigner: false, isWritable: false },
            { pubkey: lp_mint, isSigner: false, isWritable: true },
            { pubkey: MEMO_PROGRAM_ID, isSigner: false, isWritable: false },
        ];

        let raydium_remove_liquidity_data = serialise_raydium_remove_liquidity_instruction(lp_amount);

        const list_instruction = new TransactionInstruction({
            keys: keys,
            programId: RAYDIUM_PROGRAM,
            data: raydium_remove_liquidity_data,
        });

        let list_txArgs = await get_current_blockhash("");

        let list_transaction = new Transaction(list_txArgs);
        list_transaction.feePayer = wallet.publicKey;
        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
        list_transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));

        list_transaction.add(list_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(list_transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            let signature = transaction_response.result;

            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
            setTimeout(transaction_failed, TIMEOUT);

            console.log("swap sig: ", signature);
        } catch (error) {
            console.log(error);
            return;
        }
    };

    return { RemoveLiquidityRaydium, isLoading };
};

export default useRemoveLiquidityRaydium;
