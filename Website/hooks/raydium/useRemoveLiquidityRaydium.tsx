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
import { getMintData } from "@/components/amm/launch";
import useSendTransaction from "../useSendTransaction";

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

export const GetRemoveLiquidityRaydiumInstruction = async (user:PublicKey, amm: AMMData, lp_amount: number): Promise<TransactionInstruction> => {
        let base_mint = amm.base_mint;
        let quote_mint = new PublicKey("So11111111111111111111111111111111111111112");

        let base_mint_data = await getMintData(base_mint.toString());
        let quote_mint_data = await getMintData(quote_mint.toString());

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
            user, // owner
            true, // allow owner off curve
            base_mint_data.token_program,
        );

        let user_quote_account = await getAssociatedTokenAddress(
            quote_mint, // mint
            user, // owner
            true, // allow owner off curve
            quote_mint_data.token_program,
        );

        let user_0 = token0.equals(base_mint) ? user_base_account : user_quote_account;
        let user_1 = token0.equals(base_mint) ? user_quote_account : user_base_account;

        let user_lp_account = await getAssociatedTokenAddress(
            lp_mint, // mint
            user, // owner
            true, // allow owner off curve
            TOKEN_PROGRAM_ID,
        );

        const keys = [
            { pubkey: user, isSigner: true, isWritable: false },
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

        return list_instruction;
};

const useRemoveLiquidityRaydium = (amm: AMMData) => {
    const wallet = useWallet();

    const { sendTransaction, isLoading } = useSendTransaction();

    const RemoveLiquidityRaydium = async (lp_amount: number) => {
        let instruction = await GetRemoveLiquidityRaydiumInstruction(wallet.publicKey, amm, lp_amount);
        await sendTransaction({
            instructions: [instruction],
            onSuccess: () => {
                // Handle success
            },
            onError: (error) => {
                // Handle error
            },
        });
    };

    return { RemoveLiquidityRaydium, isLoading };
};

export default useRemoveLiquidityRaydium;
