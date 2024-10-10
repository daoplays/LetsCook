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
    request_raw_account_data,
} from "../../components/Solana/state";
import { PublicKey, Transaction, TransactionInstruction, Connection } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, Config, SYSTEM_KEY, SOL_ACCOUNT_SEED, TIMEOUT } from "../../components/Solana/constants";
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
import { AMMData, MarketStateLayoutV2, RaydiumAMM } from "../../components/Solana/jupiter_state";

const ZERO = new BN(0);
type BN = typeof ZERO;

const PROGRAMIDS = Config.PROD ? MAINNET_PROGRAM_ID : DEVNET_PROGRAM_ID;

function serialise_raydium_remove_liquidity_instruction(amount: number): Buffer {
    const data = new RaydiumRemoveLiquidity_Instruction(4, amount);

    const [buf] = RaydiumRemoveLiquidity_Instruction.struct.serialize(data);

    return buf;
}

class RaydiumRemoveLiquidity_Instruction {
    constructor(
        readonly instruction: number,
        readonly amount: bignum,
    ) {}

    static readonly struct = new BeetStruct<RaydiumRemoveLiquidity_Instruction>(
        [
            ["instruction", u8],
            ["amount", u64],
        ],
        (args) => new RaydiumRemoveLiquidity_Instruction(args.instruction!, args.amount!),
        "RaydiumRemoveLiquidity_Instruction",
    );
}

const useRemoveLiquidityRaydiumClassic = (amm: AMMData) => {
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

    const RemoveLiquidityRaydiumClassic = async (lp_amount: number) => {
        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        let pool_data = await request_raw_account_data("", amm.pool);
        const [ray_pool] = RaydiumAMM.struct.deserialize(pool_data);

        const poolInfo = Liquidity.getAssociatedPoolKeys({
            version: 4,
            marketVersion: 3,
            marketId: ray_pool.marketId,
            baseMint: ray_pool.baseMint,
            quoteMint: ray_pool.quoteMint,
            baseDecimals: ray_pool.baseDecimal,
            quoteDecimals: ray_pool.quoteDecimal,
            programId: PROGRAMIDS.AmmV4,
            marketProgramId: PROGRAMIDS.OPENBOOK_MARKET,
        });

        let market_data = await request_raw_account_data("", ray_pool.marketId);
        const [market] = MarketStateLayoutV2.struct.deserialize(market_data);

        let user_base_account = await getAssociatedTokenAddress(
            ray_pool.baseMint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );

        let user_quote_account = await getAssociatedTokenAddress(
            ray_pool.quoteMint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );

        let user_lp_account = await getAssociatedTokenAddress(
            ray_pool.lpMint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );

        const keys = [
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: poolInfo.id, isSigner: false, isWritable: true },
            { pubkey: poolInfo.authority, isSigner: false, isWritable: false },
            { pubkey: poolInfo.openOrders, isSigner: false, isWritable: false },
            { pubkey: poolInfo.targetOrders, isSigner: false, isWritable: true },
            { pubkey: poolInfo.lpMint, isSigner: false, isWritable: true },
            { pubkey: poolInfo.baseVault, isSigner: false, isWritable: true },
            { pubkey: poolInfo.quoteVault, isSigner: false, isWritable: true },

            { pubkey: poolInfo.withdrawQueue, isSigner: false, isWritable: true },
            { pubkey: poolInfo.lpVault, isSigner: false, isWritable: true },

            { pubkey: ray_pool.marketProgramId, isSigner: false, isWritable: false },
            { pubkey: poolInfo.marketId, isSigner: false, isWritable: false },
            { pubkey: market.baseVault, isSigner: false, isWritable: false },
            { pubkey: market.quoteVault, isSigner: false, isWritable: false },
            { pubkey: poolInfo.marketAuthority, isSigner: false, isWritable: false },

            { pubkey: user_lp_account, isSigner: false, isWritable: true },
            { pubkey: user_base_account, isSigner: false, isWritable: true },
            { pubkey: user_quote_account, isSigner: false, isWritable: true },
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },

            { pubkey: market.eventQueue, isSigner: false, isWritable: false },
            { pubkey: market.bids, isSigner: false, isWritable: false },
            { pubkey: market.asks, isSigner: false, isWritable: false },
        ];

        let raydium_add_liquidity_data = serialise_raydium_remove_liquidity_instruction(lp_amount);

        const list_instruction = new TransactionInstruction({
            keys: keys,
            programId: getRaydiumPrograms(Config).AmmV4,
            data: raydium_add_liquidity_data,
        });

        let list_txArgs = await get_current_blockhash("");

        let list_transaction = new Transaction(list_txArgs);
        list_transaction.feePayer = wallet.publicKey;

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

    return { RemoveLiquidityRaydiumClassic, isLoading };
};

export default useRemoveLiquidityRaydiumClassic;
