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
} from "@metaplex-foundation/beet";
import { publicKey } from "@metaplex-foundation/beet-solana";
import { Wallet, WalletContextState, useWallet } from "@solana/wallet-adapter-react";
import { Order } from "@jup-ag/limit-order-sdk";

import { LaunchInstruction, uInt8ToLEBytes, bignum_to_num, Distribution, LaunchData } from "./state";

export interface OpenOrder {
    publicKey: PublicKey;
    account: Order;
}

export function reward_schedule(date: number, launch_data: LaunchData): number {
    let reward_frac = launch_data.distribution[Distribution.MMRewards] / 100;
    let total_supply = bignum_to_num(launch_data.total_supply);
    let mm_amount = total_supply * reward_frac;
    console.log(reward_frac, total_supply, mm_amount);
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
        readonly volume: number,
    ) {}

    static readonly struct = new FixableBeetStruct<OHLCV>(
        [
            ["timestamp", i64],
            ["open", uniformFixedSizeArray(u8, 4)],
            ["high", uniformFixedSizeArray(u8, 4)],
            ["low", uniformFixedSizeArray(u8, 4)],
            ["close", uniformFixedSizeArray(u8, 4)],
            ["volume", u64],
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

export class AMMData {
    constructor(
        readonly account_type: number,
        readonly base_mint: PublicKey,
        readonly quote_mint: PublicKey,
        readonly lp_mint: PublicKey,
        readonly base_key: PublicKey,
        readonly quote_key: PublicKey,
        readonly fee: number,
        readonly num_data_accounts: number,
        readonly last_price: number[],
        readonly transferring: number,
        readonly lp_amount: bignum
    ) {}

    static readonly struct = new FixableBeetStruct<AMMData>(
        [
            ["account_type", u8],
            ["base_mint", publicKey],
            ["quote_mint", publicKey],
            ["lp_mint", publicKey],
            ["base_key", publicKey],
            ["quote_key", publicKey],
            ["fee", u16],
            ["num_data_accounts", u32],
            ["last_price", uniformFixedSizeArray(u8, 4)],
            ["transferring", u8],
            ["lp_amount", u64],
        ],
        (args) =>
            new AMMData(
                args.account_type!,
                args.base_mint!,
                args.quote_mint!,
                args.lp_mint!,
                args.base_key!,
                args.quote_key!,
                args.fee!,
                args.num_data_accounts!,
                args.last_price!,
                args.transferring!,
                args.lp_amount!,
            ),
        "AMMData",
    );
}

export class MMUserData {
    constructor(
        readonly account_type: number,
        readonly user_key: PublicKey,
        readonly mint_key: PublicKey,
        readonly date: number,
        readonly buy_amount: bignum,
        readonly sell_amount: bignum,
    ) {}

    static readonly struct = new FixableBeetStruct<MMUserData>(
        [
            ["account_type", u8],
            ["user_key", publicKey],
            ["mint_key", publicKey],
            ["date", u32],
            ["buy_amount", u64],
            ["sell_amount", u64],
        ],
        (args) => new MMUserData(args.account_type!, args.user_key!, args.mint_key!, args.date!, args.buy_amount!, args.sell_amount!),
        "MMUserData",
    );
}

export class MMLaunchData {
    constructor(
        readonly account_type: number,
        readonly mint_key: PublicKey,
        readonly date: number,
        readonly token_rewards: bignum,
        readonly buy_amount: bignum,
        readonly amount_distributed: bignum,
        readonly fraction_distributed: bignum,
    ) {}

    static readonly struct = new FixableBeetStruct<MMLaunchData>(
        [
            ["account_type", u8],
            ["mint_key", publicKey],
            ["date", u32],
            ["token_rewards", u64],
            ["buy_amount", u64],
            ["amount_distributed", u64],
            ["fraction_distributed", u64],
        ],
        (args) =>
            new MMLaunchData(
                args.account_type!,
                args.mint_key!,
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
    ) {}

    static readonly struct = new FixableBeetStruct<ClaimReward_Instruction>(
        [
            ["instruction", u8],
            ["date", u32],
        ],
        (args) => new ClaimReward_Instruction(args.instruction!, args.date!),
        "ClaimReward_Instruction",
    );
}

export function serialise_ClaimReward_instruction(date: number): Buffer {
    const data = new ClaimReward_Instruction(LaunchInstruction.get_mm_rewards, date);
    const [buf] = ClaimReward_Instruction.struct.serialize(data);

    return buf;
}
