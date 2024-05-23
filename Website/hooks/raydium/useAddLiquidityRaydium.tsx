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
} from "../../components/Solana/state";
import { PublicKey, Transaction, TransactionInstruction, Connection } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, Config, SYSTEM_KEY, SOL_ACCOUNT_SEED } from "../../components/Solana/constants";
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
    LiquidityPoolKeys,
    TokenAmount,
    Percent,
    jsonInfo2PoolKeys,
    LiquidityPoolJsonInfo,
} from "@raydium-io/raydium-sdk";

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
import { BeetStruct, bignum, u64, u8 } from "@metaplex-foundation/beet";
import { getRaydiumPrograms } from "./utils";

const ZERO = new BN(0);
type BN = typeof ZERO;

const DEFAULT_TOKEN = {
    WSOL: new Token(TOKEN_PROGRAM_ID, new PublicKey("So11111111111111111111111111111111111111112"), 9, "WSOL", "WSOL"),
};

function serialise_raydium_add_liquidity_instruction(base_amount: number, quote_amount: number): Buffer {
    const data = new RaydiumAddLiquidity_Instruction(3, base_amount, quote_amount, 0);

    const [buf] = RaydiumAddLiquidity_Instruction.struct.serialize(data);

    return buf;
}

class RaydiumAddLiquidity_Instruction {
    constructor(
        readonly instruction: number,
        readonly baseAmountIn: bignum,
        readonly quoteAmountIn: bignum,
        readonly fixedSide: bignum,
    ) {}

    static readonly struct = new BeetStruct<RaydiumAddLiquidity_Instruction>(
        [
            ["instruction", u8],
            ["baseAmountIn", u64],
            ["quoteAmountIn", u64],
            ["fixedSide", u64],
        ],
        (args) => new RaydiumAddLiquidity_Instruction(args.instruction!, args.baseAmountIn!, args.quoteAmountIn!, args.fixedSide!),
        "RaydiumAddLiquidity_Instruction",
    );
}

async function generatePubKey({
    fromPublicKey,
    seed,
    programId = TOKEN_PROGRAM_ID,
}: {
    fromPublicKey: PublicKey;
    seed: string;
    programId: PublicKey;
}) {
    const publicKey = await PublicKey.createWithSeed(fromPublicKey, seed, programId);
    return { publicKey, seed };
}

const useAddLiquidityRaydium = (launchData: LaunchData) => {
    const wallet = useWallet();

    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        signature_ws_id.current = null;
        setIsLoading(false);
        // if we have a subscription field check against ws_id
        if (result.err !== null) {
            alert("Transaction failed, please try again");
            return;
        }

        if (Config.PROD) {
            let response = await make_tweet(launchData.page_name);
            console.log(response);
        }
    }, []);

    const AddLiquidityRaydium = async (token_amount: number, sol_amount: number) => {
        // if we have already done this then just skip this step
        console.log(launchData);

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        const quoteToken = DEFAULT_TOKEN.WSOL; // RAY

        const seed_base = launchData.keys[LaunchKeys.MintAddress].toBase58().slice(0, 31);
        const targetMargetId = await generatePubKey({
            fromPublicKey: launchData.keys[LaunchKeys.Seller],
            seed: seed_base + "1",
            programId: getRaydiumPrograms(Config).OPENBOOK_MARKET,
        });

        const poolInfo = Liquidity.getAssociatedPoolKeys({
            version: 4,
            marketVersion: 3,
            marketId: targetMargetId.publicKey,
            baseMint: launchData.keys[LaunchKeys.MintAddress],
            quoteMint: quoteToken.mint,
            baseDecimals: launchData.decimals,
            quoteDecimals: quoteToken.decimals,
            programId: getRaydiumPrograms(Config).AmmV4,
            marketProgramId: getRaydiumPrograms(Config).OPENBOOK_MARKET,
        });

        let user_base_account = await getAssociatedTokenAddress(
            launchData.keys[LaunchKeys.MintAddress], // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );

        let user_quote_account = await getAssociatedTokenAddress(
            quoteToken.mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );

        let user_lp_account = await getAssociatedTokenAddress(
            poolInfo.lpMint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );

        const eventQueue = await generatePubKey({
            fromPublicKey: launchData.keys[LaunchKeys.Seller],
            seed: seed_base + "3",
            programId: getRaydiumPrograms(Config).OPENBOOK_MARKET,
        });

        const keys = [
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: poolInfo.id, isSigner: false, isWritable: true },
            { pubkey: poolInfo.authority, isSigner: false, isWritable: false },
            { pubkey: poolInfo.openOrders, isSigner: false, isWritable: false },
            { pubkey: poolInfo.targetOrders, isSigner: false, isWritable: true },
            { pubkey: poolInfo.lpMint, isSigner: false, isWritable: true },
            { pubkey: poolInfo.baseVault, isSigner: false, isWritable: true },
            { pubkey: poolInfo.quoteVault, isSigner: false, isWritable: true },

            { pubkey: poolInfo.marketId, isSigner: false, isWritable: false },
            { pubkey: user_base_account, isSigner: false, isWritable: true },
            { pubkey: user_quote_account, isSigner: false, isWritable: true },
            { pubkey: user_lp_account, isSigner: false, isWritable: true },

            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: eventQueue.publicKey, isSigner: false, isWritable: false },
        ];

        let raydium_add_liquidity_data = serialise_raydium_add_liquidity_instruction(token_amount, sol_amount);

        const list_instruction = new TransactionInstruction({
            keys: keys,
            programId: getRaydiumPrograms(Config).AmmV4,
            data: raydium_add_liquidity_data,
        });

        let create_lp_ata = createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            user_lp_account,
            wallet.publicKey,
            poolInfo.lpMint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID,
        );

        let ata_balance = await connection.getBalance(user_lp_account);
        console.log("ata balance", ata_balance);

        let list_txArgs = await get_current_blockhash("");

        let list_transaction = new Transaction(list_txArgs);
        list_transaction.feePayer = wallet.publicKey;

        if (ata_balance === 0) {
            list_transaction.add(create_lp_ata);
        }
        list_transaction.add(list_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(list_transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            let signature = transaction_response.result;

            console.log("swap sig: ", signature);
        } catch (error) {
            console.log(error);
            return;
        }
    };

    return { AddLiquidityRaydium, isLoading };
};

export default useAddLiquidityRaydium;
