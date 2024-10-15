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
    MARKET_STATE_LAYOUT_V3,
} from "@raydium-io/raydium-sdk";

import { ComputeBudgetProgram } from "@solana/web3.js";

import { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { LaunchKeys, LaunchFlags } from "../../components/Solana/constants";
import { make_tweet } from "../../components/launch/twitter";
import { BeetStruct, bignum, u64, u8, uniformFixedSizeArray } from "@metaplex-foundation/beet";
import { AMMData, MarketStateLayoutV2, RaydiumAMM } from "../../components/Solana/jupiter_state";
import useWrapSOL from "../useWrapSOL";

const PROGRAMIDS = Config.PROD ? MAINNET_PROGRAM_ID : DEVNET_PROGRAM_ID;

const ZERO = new BN(0);
type BN = typeof ZERO;

function serialise_raydium_swap_classic_instruction(token_amount: number, sol_amount: number, order_type: number): Buffer {
    let base_in_discriminator: number[] = [143, 190, 90, 218, 196, 30, 51, 222];
    let base_out_discriminator: number[] = [55, 217, 98, 86, 163, 74, 180, 173];

    let discriminator = order_type === 0 ? base_out_discriminator : base_in_discriminator;
    let inAmount = order_type === 0 ? sol_amount : token_amount;
    let outAmount = 0; //order_type === 0 ? token_amount : sol_amount;

    console.log("in and out:", inAmount, outAmount);
    const data = new RaydiumSwap_Instruction(LaunchInstruction.swap_raydium_classic, order_type, discriminator, inAmount, outAmount);

    const [buf] = RaydiumSwap_Instruction.struct.serialize(data);

    return buf;
}

class RaydiumSwap_Instruction {
    constructor(
        readonly instruction: number,
        readonly side: number,
        readonly discriminator: number[],
        readonly in_amount: bignum,
        readonly out_amount: bignum,
    ) {}

    static readonly struct = new BeetStruct<RaydiumSwap_Instruction>(
        [
            ["instruction", u8],
            ["side", u8],
            ["discriminator", uniformFixedSizeArray(u8, 8)],
            ["in_amount", u64],
            ["out_amount", u64],
        ],
        (args) => new RaydiumSwap_Instruction(args.instruction!, args.side!, args.discriminator!, args.in_amount!, args.out_amount!),
        "RaydiumSwap_Instruction",
    );
}

const useSwapRaydiumClassic = (amm: AMMData) => {
    const wallet = useWallet();
    const { WrapSOL, isLoading: wrap_loading } = useWrapSOL();

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

    const SwapRaydiumClassic = async (token_amount: number, sol_amount: number, order_type: number) => {
        // if we have already done this then just skip this step

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        let base_mint = amm.base_mint;
        let quote_mint = amm.quote_mint;

        let user_base_account = await getAssociatedTokenAddress(
            base_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );

        let user_quote_account = await getAssociatedTokenAddress(
            quote_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );

        let inKey = order_type === 0 ? user_quote_account : user_base_account;
        let outKey = order_type === 0 ? user_base_account : user_quote_account;

        let inMint = order_type === 0 ? quote_mint : base_mint;
        let outMint = order_type === 0 ? base_mint : quote_mint;

        let amm_seed_keys = [];
        if (base_mint.toString() < quote_mint.toString()) {
            amm_seed_keys.push(base_mint);
            amm_seed_keys.push(quote_mint);
        } else {
            amm_seed_keys.push(quote_mint);
            amm_seed_keys.push(base_mint);
        }

        let amm_data_account = PublicKey.findProgramAddressSync(
            [amm_seed_keys[0].toBytes(), amm_seed_keys[1].toBytes(), Buffer.from("Raydium")],
            PROGRAM,
        )[0];

        console.log(bignum_to_num(amm.start_time));
        let current_date = Math.floor((new Date().getTime() / 1000 - bignum_to_num(amm.start_time)) / 24 / 60 / 60);
        let date_bytes = uInt32ToLEBytes(current_date);

        let launch_date_account = PublicKey.findProgramAddressSync(
            [amm_data_account.toBytes(), date_bytes, Buffer.from("LaunchDate")],
            PROGRAM,
        )[0];

        let user_date_account = PublicKey.findProgramAddressSync(
            [amm_data_account.toBytes(), wallet.publicKey.toBytes(), date_bytes],
            PROGRAM,
        )[0];

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

        const keys = [
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: amm.pool, isSigner: false, isWritable: true },
            { pubkey: poolInfo.authority, isSigner: false, isWritable: false },
            { pubkey: ray_pool.openOrders, isSigner: false, isWritable: true },
            { pubkey: ray_pool.targetOrders, isSigner: false, isWritable: true },
            { pubkey: ray_pool.baseVault, isSigner: false, isWritable: true },
            { pubkey: ray_pool.quoteVault, isSigner: false, isWritable: true },

            { pubkey: ray_pool.marketProgramId, isSigner: false, isWritable: false },
            { pubkey: ray_pool.marketId, isSigner: false, isWritable: true },
            { pubkey: market.bids, isSigner: false, isWritable: true },
            { pubkey: market.asks, isSigner: false, isWritable: true },
            { pubkey: market.eventQueue, isSigner: false, isWritable: true },
            { pubkey: market.baseVault, isSigner: false, isWritable: true },
            { pubkey: market.quoteVault, isSigner: false, isWritable: true },
            { pubkey: poolInfo.marketAuthority, isSigner: false, isWritable: true },

            { pubkey: inKey, isSigner: false, isWritable: true },
            { pubkey: outKey, isSigner: false, isWritable: true },
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: PROGRAMIDS.AmmV4, isSigner: false, isWritable: false },

            { pubkey: amm_data_account, isSigner: false, isWritable: true },
            { pubkey: launch_date_account, isSigner: false, isWritable: true },
            { pubkey: user_date_account, isSigner: false, isWritable: true },
            { pubkey: amm_data_account, isSigner: false, isWritable: true },
            { pubkey: inMint, isSigner: false, isWritable: true },
            { pubkey: outMint, isSigner: false, isWritable: true },
            { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
        ];

        let raydium_swap_data = serialise_raydium_swap_classic_instruction(token_amount, sol_amount, order_type);

        const list_instruction = new TransactionInstruction({
            keys: keys,
            programId: PROGRAM,
            data: raydium_swap_data,
        });

        let list_txArgs = await get_current_blockhash("");

        let list_transaction = new Transaction(list_txArgs);
        list_transaction.feePayer = wallet.publicKey;
        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
        list_transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));

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

    return { SwapRaydiumClassic, isLoading };
};

export default useSwapRaydiumClassic;
