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
} from "@metaplex-foundation/beet";
import { publicKey } from "@metaplex-foundation/beet-solana";
import { Wallet, WalletContextState, useWallet } from "@solana/wallet-adapter-react";

import { DEBUG, RPC_NODE, PROGRAM, LaunchKeys, Socials } from "./constants";
import { Box } from "@chakra-ui/react";

import BN from "bn.js";
import bs58 from "bs58";
import { LaunchInstruction, uInt8ToLEBytes, postData } from "./state";

export function MM_reward_schedule(date: number, total_rewards: number): number {
    if (date < 0 || date >= 30) return 0;

    if (date < 10) return 0.05 * total_rewards;

    if (date >= 10 && date < 20) return 0.03 * total_rewards;

    if (date >= 20 && date < 30) return 0.02 * total_rewards;
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
        readonly sell_amount: bignum,
    ) {}

    static readonly struct = new FixableBeetStruct<MMLaunchData>(
        [
            ["account_type", u8],
            ["mint_key", publicKey],
            ["date", u32],
            ["token_rewards", u64],
            ["buy_amount", u64],
            ["sell_amount", u64],
        ],
        (args) =>
            new MMLaunchData(args.account_type!, args.mint_key!, args.date!, args.token_rewards!, args.buy_amount!, args.sell_amount!),
        "MMLaunchData",
    );
}

export async function RunMMUserDataGPA(wallet: WalletContextState | null): Promise<MMUserData[]> {
    let index_buffer = uInt8ToLEBytes(4);
    let account_bytes = bs58.encode(index_buffer);

    let wallet_bytes = PublicKey.default.toBase58();

    // console.log("wallet", wallet !== null ? wallet.toString() : "null");
    if (wallet !== null) {
        wallet_bytes = wallet.publicKey.toBase58();
    }

    var body = {
        id: 1,
        jsonrpc: "2.0",
        method: "getProgramAccounts",
        params: [
            PROGRAM.toString(),
            {
                filters: [{ memcmp: { offset: 0, bytes: account_bytes } }, { memcmp: { offset: 1, bytes: wallet_bytes } }],
                encoding: "base64",
                commitment: "confirmed",
            },
        ],
    };

    var program_accounts_result;
    try {
        program_accounts_result = await postData(RPC_NODE, "", body);
    } catch (error) {
        console.log(error);
        return [];
    }

    // console.log(program_accounts_result["result"]);

    let result: MMUserData[] = [];
    for (let i = 0; i < program_accounts_result["result"]?.length; i++) {
        // console.log(program_accounts_result["result"][i]);
        let encoded_data = program_accounts_result["result"][i]["account"]["data"][0];
        let decoded_data = Buffer.from(encoded_data, "base64");
        try {
            const [game] = MMUserData.struct.deserialize(decoded_data);
            result.push(game);
        } catch (error) {
            console.log(error);
        }
    }

    return result;
}

export async function RunMMLaunchDataGPA(): Promise<MMLaunchData[]> {
    let index_buffer = uInt8ToLEBytes(5);
    let account_bytes = bs58.encode(index_buffer);

    var body = {
        id: 1,
        jsonrpc: "2.0",
        method: "getProgramAccounts",
        params: [
            PROGRAM.toString(),
            { filters: [{ memcmp: { offset: 0, bytes: account_bytes } }], encoding: "base64", commitment: "confirmed" },
        ],
    };

    var program_accounts_result;
    try {
        program_accounts_result = await postData(RPC_NODE, "", body);
    } catch (error) {
        console.log(error);
        return [];
    }

    //console.log(program_accounts_result["result"]);

    let result: MMLaunchData[] = [];
    for (let i = 0; i < program_accounts_result["result"]?.length; i++) {
        // console.log(program_accounts_result["result"][i]);
        let encoded_data = program_accounts_result["result"][i]["account"]["data"][0];
        let decoded_data = Buffer.from(encoded_data, "base64");
        try {
            const [game] = MMLaunchData.struct.deserialize(decoded_data);
            result.push(game);
        } catch (error) {
            console.log(error);
        }
    }

    return result;
}

class PlaceLimit_Instruction {
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
    const data = new PlaceLimit_Instruction(LaunchInstruction.place_limit_order, side, in_amount, jup_data);
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
    const data = new PlaceCancel_Instruction(LaunchInstruction.cancel_limit_order, side, in_amount, jup_data);
    const [buf] = PlaceCancel_Instruction.struct.serialize(data);

    return buf;
}
