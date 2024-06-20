import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
    FixableBeetStruct,
    BeetStruct,
    uniformFixedSizeArray,
    u8,
    u16,
    u32,
    u64,
    i64,
    bignum,
    utf8String,
    array,
    fixedSizeArray,
    u128,
    BeetArgsStruct,
    dataEnum,
    DataEnumKeyAsKind,
    FixableBeetArgsStruct,
    FixableBeet,
} from "@metaplex-foundation/beet";
import { publicKey } from "@metaplex-foundation/beet-solana";
import { Wallet, WalletContextState, useWallet } from "@solana/wallet-adapter-react";
import { Order } from "@jup-ag/limit-order-sdk";

import { LaunchInstruction, uInt8ToLEBytes, bignum_to_num, Distribution, LaunchData } from "./state";
import { PROGRAM } from "./constants";

export interface OpenOrder {
    publicKey: PublicKey;
    account: Order;
}

export function getAMMKey(amm: AMMData, amm_provider: number) {

    if (amm === null) {
        return null;
    }
    let amm_seed_keys = [];
    if (amm.base_mint.toString() < amm.quote_mint.toString()) {
        amm_seed_keys.push(amm.base_mint);
        amm_seed_keys.push(amm.quote_mint);
    } else {
        amm_seed_keys.push(amm.quote_mint);
        amm_seed_keys.push(amm.base_mint);
    }

    let amm_data_account = PublicKey.findProgramAddressSync(
        [amm_seed_keys[0].toBytes(), amm_seed_keys[1].toBytes(), Buffer.from(amm_provider == 0 ? "CookAMM" : "RaydiumCPMM")],
        PROGRAM,
    )[0];

    return amm_data_account;
}

export function reward_schedule(date: number, amm: AMMData): number {
    if (amm.plugins.length === 0) {
        return 0.0;
    }

    let mm_amount = amm.plugins[0]["total_tokens"];
    if (date < 10) {
        return 0.05 * mm_amount;
    }
    if (date >= 10 && date < 20) {
        return 0.03 * mm_amount;
    }
    if (date >= 20 && date < 30) {
        return 0.02 * mm_amount;
    }

    return 0.0;
}

export function MM_reward_schedule(date: number, total_rewards: number): number {
    if (date < 0 || date >= 30) return 0;

    if (date < 10) return 0.05 * total_rewards;

    if (date >= 10 && date < 20) return 0.03 * total_rewards;

    if (date >= 20 && date < 30) return 0.02 * total_rewards;
}

export class OHLCV {
    constructor(
        readonly timestamp: number,
        readonly open: number[],
        readonly high: number[],
        readonly low: number[],
        readonly close: number[],
        readonly volume: number[],
    ) {}

    static readonly struct = new FixableBeetStruct<OHLCV>(
        [
            ["timestamp", i64],
            ["open", uniformFixedSizeArray(u8, 4)],
            ["high", uniformFixedSizeArray(u8, 4)],
            ["low", uniformFixedSizeArray(u8, 4)],
            ["close", uniformFixedSizeArray(u8, 4)],
            ["volume", uniformFixedSizeArray(u8, 4)],
        ],
        (args) => new OHLCV(args.timestamp!, args.open!, args.high!, args.low!, args.close!, args.volume!),
        "OHLCV",
    );
}

export class TimeSeriesData {
    constructor(
        readonly account_type: number,
        readonly data: OHLCV[],
    ) {}

    static readonly struct = new FixableBeetStruct<TimeSeriesData>(
        [
            ["account_type", u8],
            ["data", array(OHLCV.struct)],
        ],
        (args) => new TimeSeriesData(args.account_type!, args.data!),
        "TimeSeriesData",
    );
}

type AMMPluginEnum = {
    TradeToEarn: { total_tokens: bignum; last_reward_date: number };
};
type AMMPlugin = DataEnumKeyAsKind<AMMPluginEnum>;

const ammPluginBeet = dataEnum<AMMPluginEnum>([
    [
        "TradeToEarn",
        new BeetArgsStruct<AMMPluginEnum["TradeToEarn"]>(
            [
                ["total_tokens", u64],
                ["last_reward_date", u32],
            ],
            'AMMPluginEnum["TradeToEarn"]',
        ),
    ],
]) as FixableBeet<AMMPlugin>;

export class AMMData {
    constructor(
        readonly account_type: number,
        readonly provider: number,
        readonly base_mint: PublicKey,
        readonly quote_mint: PublicKey,
        readonly lp_mint: PublicKey,
        readonly base_key: PublicKey,
        readonly quote_key: PublicKey,
        readonly fee: number,
        readonly num_data_accounts: number,
        readonly last_price: number[],
        readonly lp_amount: bignum,
        readonly borrow_cost: number,
        readonly leverage_fraction: number,
        readonly amm_base_amount: bignum,
        readonly amm_quote_amount: bignum,
        readonly short_base_amount: bignum,
        readonly long_quote_amount: bignum,
        readonly start_time: bignum,
        readonly plugins: AMMPluginEnum[],
    ) {}

    static readonly struct = new FixableBeetStruct<AMMData>(
        [
            ["account_type", u8],
            ["provider", u8],
            ["base_mint", publicKey],
            ["quote_mint", publicKey],
            ["lp_mint", publicKey],
            ["base_key", publicKey],
            ["quote_key", publicKey],
            ["fee", u16],
            ["num_data_accounts", u32],
            ["last_price", uniformFixedSizeArray(u8, 4)],
            ["lp_amount", u64],
            ["borrow_cost", u16],
            ["leverage_fraction", u16],
            ["amm_base_amount", u64],
            ["amm_quote_amount", u64],
            ["short_base_amount", u64],
            ["long_quote_amount", u64],
            ["start_time", u64],
            ["plugins", array(ammPluginBeet)],
        ],
        (args) =>
            new AMMData(
                args.account_type!,
                args.provider!,
                args.base_mint!,
                args.quote_mint!,
                args.lp_mint!,
                args.base_key!,
                args.quote_key!,
                args.fee!,
                args.num_data_accounts!,
                args.last_price!,
                args.lp_amount!,
                args.borrow_cost!,
                args.leverage_fraction!,
                args.amm_base_amount!,
                args.amm_quote_amount!,
                args.short_base_amount!,
                args.long_quote_amount!,
                args.start_time!,
                args.plugins!,
            ),
        "AMMData",
    );
}

export class MMUserData {
    constructor(
        readonly account_type: number,
        readonly user_key: PublicKey,
        readonly amm: PublicKey,
        readonly date: number,
        readonly buy_amount: bignum,
        readonly sell_amount: bignum,
    ) {}

    static readonly struct = new FixableBeetStruct<MMUserData>(
        [
            ["account_type", u8],
            ["user_key", publicKey],
            ["amm", publicKey],
            ["date", u32],
            ["buy_amount", u64],
            ["sell_amount", u64],
        ],
        (args) => new MMUserData(args.account_type!, args.user_key!, args.amm!, args.date!, args.buy_amount!, args.sell_amount!),
        "MMUserData",
    );
}

export class MMLaunchData {
    constructor(
        readonly account_type: number,
        readonly amm: PublicKey,
        readonly date: number,
        readonly token_rewards: bignum,
        readonly buy_amount: bignum,
        readonly amount_distributed: bignum,
        readonly fraction_distributed: bignum,
    ) {}

    static readonly struct = new FixableBeetStruct<MMLaunchData>(
        [
            ["account_type", u8],
            ["amm", publicKey],
            ["date", u32],
            ["token_rewards", u64],
            ["buy_amount", u64],
            ["amount_distributed", u64],
            ["fraction_distributed", u64],
        ],
        (args) =>
            new MMLaunchData(
                args.account_type!,
                args.amm!,
                args.date!,
                args.token_rewards!,
                args.buy_amount!,
                args.amount_distributed!,
                args.fraction_distributed!,
            ),
        "MMLaunchData",
    );
}

export class PlaceLimit_Instruction {
    constructor(
        readonly instruction: number,
        readonly side: number,
        readonly in_amount: bignum,
        readonly data: number[],
    ) {}

    static readonly struct = new FixableBeetStruct<PlaceLimit_Instruction>(
        [
            ["instruction", u8],
            ["side", u8],
            ["in_amount", u64],
            ["data", array(u8)],
        ],
        (args) => new PlaceLimit_Instruction(args.instruction!, args.side!, args.in_amount!, args.data!),
        "PlaceLimit_Instruction",
    );
}

export function serialise_PlaceLimit_instruction(side: number, in_amount: bignum, jup_data: number[]): Buffer {
    const data = new PlaceLimit_Instruction(LaunchInstruction.place_market_order, side, in_amount, jup_data);
    const [buf] = PlaceLimit_Instruction.struct.serialize(data);

    return buf;
}

class PlaceCancel_Instruction {
    constructor(
        readonly instruction: number,
        readonly side: number,
        readonly in_amount: bignum,
        readonly data: number[],
    ) {}

    static readonly struct = new FixableBeetStruct<PlaceCancel_Instruction>(
        [
            ["instruction", u8],
            ["side", u8],
            ["in_amount", u64],
            ["data", array(u8)],
        ],
        (args) => new PlaceCancel_Instruction(args.instruction!, args.side!, args.in_amount!, args.data!),
        "PlaceCancel_Instruction",
    );
}

export function serialise_PlaceCancel_instruction(side: number, in_amount: bignum, jup_data: number[]): Buffer {
    const data = new PlaceCancel_Instruction(0, side, in_amount, jup_data);
    const [buf] = PlaceCancel_Instruction.struct.serialize(data);

    return buf;
}

class ClaimReward_Instruction {
    constructor(
        readonly instruction: number,
        readonly date: number,
        readonly amm_provider: number,
    ) {}

    static readonly struct = new FixableBeetStruct<ClaimReward_Instruction>(
        [
            ["instruction", u8],
            ["date", u32],
            ["amm_provider", u8],
        ],
        (args) => new ClaimReward_Instruction(args.instruction!, args.date!, args.amm_provider!),
        "ClaimReward_Instruction",
    );
}

export function serialise_ClaimReward_instruction(date: number, amm_provider: number): Buffer {
    const data = new ClaimReward_Instruction(LaunchInstruction.get_mm_rewards, date, amm_provider);
    const [buf] = ClaimReward_Instruction.struct.serialize(data);

    return buf;
}

export class RaydiumAMM {
    constructor(
        readonly status: bignum,
        readonly nonce: bignum,
        readonly maxOrder: bignum,
        readonly depth: bignum,
        readonly baseDecimal: bignum,
        readonly quoteDecimal: bignum,
        readonly state: bignum,
        readonly resetFlag: bignum,
        readonly minSize: bignum,
        readonly volMaxCutRatio: bignum,
        readonly amountWaveRatio: bignum,
        readonly baseLotSize: bignum,
        readonly quoteLotSize: bignum,
        readonly minPriceMultiplier: bignum,
        readonly maxPriceMultiplier: bignum,
        readonly systemDecimalValue: bignum,
        readonly minSeparateNumerator: bignum,
        readonly minSeparateDenominator: bignum,
        readonly tradeFeeNumerator: bignum,
        readonly tradeFeeDenominator: bignum,
        readonly pnlNumerator: bignum,
        readonly pnlDenominator: bignum,
        readonly swapFeeNumerator: bignum,
        readonly swapFeeDenominator: bignum,
        readonly baseNeedTakePnl: bignum,
        readonly quoteNeedTakePnl: bignum,
        readonly quoteTotalPnl: bignum,
        readonly baseTotalPnl: bignum,
        readonly poolOpenTime: bignum,
        readonly punishPcAmount: bignum,
        readonly punishCoinAmount: bignum,
        readonly orderbookToInitTime: bignum,
        readonly swapBaseInAmount: bignum,
        readonly swapQuoteOutAmount: bignum,
        readonly swapBase2QuoteFee: bignum,
        readonly swapQuoteInAmount: bignum,
        readonly swapBaseOutAmount: bignum,
        readonly swapQuote2BaseFee: bignum,
        readonly baseVault: PublicKey,
        readonly quoteVault: PublicKey,
        readonly baseMint: PublicKey,
        readonly quoteMint: PublicKey,
        readonly lpMint: PublicKey,
        readonly openOrders: PublicKey,
        readonly marketId: PublicKey,
        readonly marketProgramId: PublicKey,
        readonly targetOrders: PublicKey,
        readonly padding1: bignum[],
        readonly owner: PublicKey,
        readonly lpReserve: bignum,
        readonly client_order_id: bignum,
        readonly padding: bignum[],
    ) {}

    static readonly struct = new FixableBeetStruct<RaydiumAMM>(
        [
            ["status", u64],
            ["nonce", u64],
            ["maxOrder", u64],
            ["depth", u64],
            ["baseDecimal", u64],
            ["quoteDecimal", u64],
            ["state", u64],
            ["resetFlag", u64],
            ["minSize", u64],
            ["volMaxCutRatio", u64],
            ["amountWaveRatio", u64],
            ["baseLotSize", u64],
            ["quoteLotSize", u64],
            ["minPriceMultiplier", u64],
            ["maxPriceMultiplier", u64],
            ["systemDecimalValue", u64],
            ["minSeparateNumerator", u64],
            ["minSeparateDenominator", u64],
            ["tradeFeeNumerator", u64],
            ["tradeFeeDenominator", u64],
            ["pnlNumerator", u64],
            ["pnlDenominator", u64],
            ["swapFeeNumerator", u64],
            ["swapFeeDenominator", u64],
            ["baseNeedTakePnl", u64],
            ["quoteNeedTakePnl", u64],
            ["quoteTotalPnl", u64],
            ["baseTotalPnl", u64],
            ["poolOpenTime", u64],
            ["punishPcAmount", u64],
            ["punishCoinAmount", u64],
            ["orderbookToInitTime", u64],
            ["swapBaseInAmount", u128],
            ["swapQuoteOutAmount", u128],
            ["swapBase2QuoteFee", u64],
            ["swapQuoteInAmount", u128],
            ["swapBaseOutAmount", u128],
            ["swapQuote2BaseFee", u64],
            ["baseVault", publicKey],
            ["quoteVault", publicKey],
            ["baseMint", publicKey],
            ["quoteMint", publicKey],
            ["lpMint", publicKey],
            ["openOrders", publicKey],
            ["marketId", publicKey],
            ["marketProgramId", publicKey],
            ["targetOrders", publicKey],
            ["padding1", uniformFixedSizeArray(u64, 8)],
            ["owner", publicKey],
            ["lpReserve", u64],
            ["client_order_id", u64],
            ["padding", uniformFixedSizeArray(u64, 2)],
        ],
        (args) =>
            new RaydiumAMM(
                args.status!,
                args.nonce!,
                args.maxOrder!,
                args.depth!,
                args.baseDecimal!,
                args.quoteDecimal!,
                args.state!,
                args.resetFlag!,
                args.minSize!,
                args.volMaxCutRatio!,
                args.amountWaveRatio!,
                args.baseLotSize!,
                args.quoteLotSize!,
                args.minPriceMultiplier!,
                args.maxPriceMultiplier!,
                args.systemDecimalValue!,
                args.minSeparateNumerator!,
                args.minSeparateDenominator!,
                args.tradeFeeNumerator!,
                args.tradeFeeDenominator!,
                args.pnlNumerator!,
                args.pnlDenominator!,
                args.swapFeeNumerator!,
                args.swapFeeDenominator!,
                args.baseNeedTakePnl!,
                args.quoteNeedTakePnl!,
                args.quoteTotalPnl!,
                args.baseTotalPnl!,
                args.poolOpenTime!,
                args.punishPcAmount!,
                args.punishCoinAmount!,
                args.orderbookToInitTime!,
                args.swapBaseInAmount!,
                args.swapQuoteOutAmount!,
                args.swapBase2QuoteFee!,
                args.swapQuoteInAmount!,
                args.swapQuoteOutAmount!,
                args.swapQuote2BaseFee!,
                args.baseVault!,
                args.quoteVault!,
                args.baseMint!,
                args.quoteMint!,
                args.lpMint!,
                args.openOrders!,
                args.marketId!,
                args.marketProgramId!,
                args.targetOrders!,
                args.padding1!,
                args.owner!,
                args.lpReserve!,
                args.client_order_id!,
                args.padding!,
            ),
        "RaydiumAMM",
    );
}
