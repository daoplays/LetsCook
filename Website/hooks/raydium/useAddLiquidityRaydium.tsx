import { PublicKey, Transaction, TransactionInstruction, Connection } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, Config, SYSTEM_KEY, SOL_ACCOUNT_SEED, TIMEOUT } from "../../components/Solana/constants";
import BN from "bn.js";

import {
    unpackMint,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    TOKEN_2022_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { BeetStruct, bignum, fixedSizeArray, u64, u8, uniformFixedSizeArray } from "@metaplex-foundation/beet";
import {
    RAYDIUM_PROGRAM,
    getAMMBaseAccount,
    getAMMQuoteAccount,
    getAuthorityAccount,
    getLPMintAccount,
    getPoolStateAccount,
} from "./useCreateCP";
import { AMMData } from "../../components/Solana/jupiter_state";
import { getMintData } from "@/components/amm/launch";
import useSendTransaction from "../useSendTransaction";

function serialise_raydium_add_liquidity_instruction(lp_amount: number, base_amount: number, quote_amount: number): Buffer {
    let discriminator: number[] = [242, 35, 198, 137, 82, 225, 242, 182];

    console.log("max:", base_amount, quote_amount);
    const data = new RaydiumAddLiquidity_Instruction(discriminator, lp_amount, base_amount, quote_amount);

    const [buf] = RaydiumAddLiquidity_Instruction.struct.serialize(data);

    return buf;
}

class RaydiumAddLiquidity_Instruction {
    constructor(
        readonly discriminator: number[],
        readonly lp_amount: bignum,
        readonly max_token_0: bignum,
        readonly max_token_1: bignum,
    ) {}

    static readonly struct = new BeetStruct<RaydiumAddLiquidity_Instruction>(
        [
            ["discriminator", uniformFixedSizeArray(u8, 8)],
            ["lp_amount", u64],
            ["max_token_0", u64],
            ["max_token_1", u64],
        ],
        (args) => new RaydiumAddLiquidity_Instruction(args.discriminator!, args.lp_amount!, args.max_token_0!, args.max_token_1!),
        "RaydiumAddLiquidity_Instruction",
    );
}

const useAddLiquidityRaydium = (amm: AMMData) => {
    const wallet = useWallet();

    const { sendTransaction, isLoading } = useSendTransaction();
    
    const AddLiquidityRaydium = async (lp_amount: number, token_amount: number, sol_amount: number) => {
        // if we have already done this then just skip this step

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

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
        ];

        let in_amount_0 = token0.equals(base_mint) ? token_amount : sol_amount;
        let in_amount_1 = token0.equals(base_mint) ? sol_amount : token_amount;

        let raydium_add_liquidity_data = serialise_raydium_add_liquidity_instruction(lp_amount, in_amount_0 * 2, in_amount_1 * 2);

        const list_instruction = new TransactionInstruction({
            keys: keys,
            programId: RAYDIUM_PROGRAM,
            data: raydium_add_liquidity_data,
        });

        let create_lp_ata = createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            user_lp_account,
            wallet.publicKey,
            lp_mint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        let ata_balance = await connection.getBalance(user_lp_account);
        console.log("ata balance", ata_balance);

        let instructions: TransactionInstruction[] = [];
        if (ata_balance === 0) {
            instructions.push(create_lp_ata);
        }
        instructions.push(list_instruction);

        await sendTransaction({
                    instructions,
                    onSuccess: () => {
                        // Handle success
                    },
                    onError: (error) => {
                        // Handle error
                    },
                });
    };

    return { AddLiquidityRaydium, isLoading };
};

export default useAddLiquidityRaydium;
