import {
    array,
    BeetStruct,
    bignum,
    dataEnum,
    DataEnumKeyAsKind,
    FixableBeet,
    FixableBeetArgsStruct,
    FixableBeetStruct,
    u32,
    u64,
    u8,
} from "@metaplex-foundation/beet";
import { publicKey } from "@metaplex-foundation/beet-solana";
import { PublicKey } from "@solana/web3.js";

export const CITIZENS: PublicKey = new PublicKey("5CP8WP4Wj9eTvZeVNyLKWz1fQgE2fCdeMLFkGQ7JqeYF");

type CitizenPluginEnum = {
    Achievements: {
        num_easy_missions: number;
    };
};
type CitizenPlugin = DataEnumKeyAsKind<CitizenPluginEnum>;

const citizenPluginBeet = dataEnum<CitizenPluginEnum>([
    [
        "Achievements",
        new FixableBeetArgsStruct<CitizenPluginEnum["Achievements"]>([["num_easy_missions", u32]], 'CitizenPluginEnum["Achievements"]'),
    ],
]) as FixableBeet<CitizenPlugin>;

export class CitizenUserData {
    constructor(
        readonly asset: PublicKey,
        readonly mission_difficulty: number,
        readonly mission_status: number,
        readonly randoms_address: PublicKey,
        readonly slot: bignum,
        readonly plugins: Array<DataEnumKeyAsKind<CitizenPluginEnum>>,
    ) {}

    static readonly struct = new FixableBeetStruct<CitizenUserData>(
        [
            ["asset", publicKey],
            ["mission_difficulty", u8],
            ["mission_status", u8],
            ["randoms_address", publicKey],
            ["slot", u64],
            ["plugins", array(citizenPluginBeet) as FixableBeet<Array<DataEnumKeyAsKind<CitizenPluginEnum>>>],
        ],
        (args) =>
            new CitizenUserData(
                args.asset!,
                args.mission_difficulty!,
                args.mission_status!,
                args.randoms_address!,
                args.slot!,
                args.plugins!,
            ),
        "CitizenUserData",
    );
}
