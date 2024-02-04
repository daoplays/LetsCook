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
import {LaunchInstruction} from "./state"


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
        (args) =>
            new PlaceLimit_Instruction(
                args.instruction!,
                args.side!,
                args.in_amount!,
                args.data!,
            ),
        "PlaceLimit_Instruction",
    );
}

export function serialise_PlaceLimit_instruction(side: number, in_amount : bignum, jup_data : number[]): Buffer {
    const data = new PlaceLimit_Instruction(
        LaunchInstruction.place_limit_order,
        side,
        in_amount,
        jup_data
    );
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
        (args) =>
            new PlaceCancel_Instruction(
                args.instruction!,
                args.side!,
                args.in_amount!,
                args.data!,
            ),
        "PlaceCancel_Instruction",
    );
}

export function serialise_PlaceCancel_instruction(side: number, in_amount : bignum, jup_data : number[]): Buffer {
    const data = new PlaceCancel_Instruction(
        LaunchInstruction.cancel_limit_order,
        side,
        in_amount,
        jup_data
    );
    const [buf] = PlaceCancel_Instruction.struct.serialize(data);

    return buf;
}