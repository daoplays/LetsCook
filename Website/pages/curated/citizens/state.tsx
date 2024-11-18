import { BeetStruct, u8 } from "@metaplex-foundation/beet";
import { publicKey } from "@metaplex-foundation/beet-solana";
import { PublicKey } from "@solana/web3.js";

export const CITIZENS: PublicKey = new PublicKey("GHCgKkVaCSnz7ueNJFe7s2dZfYToAWXxcfzWmkjwjwBh");


export class CitizenUserData {
    constructor(
        readonly asset: PublicKey,
        readonly mission_difficulty: number,
        readonly mission_status: number
    ) {}

    static readonly struct = new BeetStruct<CitizenUserData>(
        [
            ["asset", publicKey],
            ["mission_difficulty", u8],
            ["mission_status", u8]
        ],
        (args) => new CitizenUserData(args.asset!, args.mission_difficulty!, args.mission_status!),
        "CitizenUserData",
    );
}
