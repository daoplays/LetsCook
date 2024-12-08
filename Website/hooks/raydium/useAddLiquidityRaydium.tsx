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
import { BeetStruct, bignum, fixedSizeArray, u64, u8, uniformFixedSizeArray } from "@metaplex-foundation/beet";
import { RaydiumCPMM, getRaydiumPrograms } from "./utils";
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

        let list_txArgs = await get_current_blockhash("");

        let list_transaction = new Transaction(list_txArgs);
        list_transaction.feePayer = wallet.publicKey;

        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
        list_transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));

        if (ata_balance === 0) {
            list_transaction.add(create_lp_ata);
        }
        list_transaction.add(list_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(list_transaction);
            var signature = await connection.sendRawTransaction(signed_transaction.serialize(), { skipPreflight: true });

            if (signature === undefined) {
                console.log(signature);
                toast.error("Transaction failed, please try again");
                return;
            }

            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
            setTimeout(transaction_failed, TIMEOUT);

            console.log("swap sig: ", signature);
        } catch (error) {
            console.log(error);
            return;
        }
    };

    return { AddLiquidityRaydium, isLoading };
};

export default useAddLiquidityRaydium;
