import {
    Token,
    DEVNET_PROGRAM_ID,
    MAINNET_PROGRAM_ID,
    RAYDIUM_MAINNET,
    LOOKUP_TABLE_CACHE,
    splitTxAndSigners,
    InnerSimpleTransaction,
    CacheLTA,
    InnerSimpleV0Transaction,
} from "@raydium-io/raydium-sdk";

import { PublicKey, Transaction, TransactionInstruction, Connection } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    LaunchData,
    LaunchInstruction,
    get_current_blockhash,
    myU64,
    send_transaction,
    serialise_basic_instruction,
    request_current_balance,
} from "../../components/Solana/state";
import { LaunchKeys, LaunchFlags, NetworkConfig } from "../../components/Solana/constants";
import { FixableBeetStruct, bignum, u64, u8, uniformFixedSizeArray } from "@metaplex-foundation/beet";
import { publicKey } from "@metaplex-foundation/beet-solana";

export async function generatePubKey({
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

export function getMarketSeedBase(launchData: LaunchData) {
    return launchData.keys[LaunchKeys.MintAddress].toBase58().slice(0, 31);
}

export function getRaydiumPrograms(Config) {
    return Config.PROD ? MAINNET_PROGRAM_ID : DEVNET_PROGRAM_ID;
}

export function getOBMSeedBase(launch: LaunchData) {
    const seed_base = launch.keys[LaunchKeys.MintAddress].toBase58().slice(0, 31);
    return seed_base;
}

export async function getLaunchOBMAccount(Config: NetworkConfig, launch: LaunchData) {
    const targetMargetId = await generatePubKey({
        fromPublicKey: launch.keys[LaunchKeys.Seller],
        seed: getOBMSeedBase(launch) + "1",
        programId: getRaydiumPrograms(Config).OPENBOOK_MARKET,
    });

    return targetMargetId;
}



export class RaydiumCPMM {
    constructor(
    readonly discriminator: number[],
    readonly amm_config: PublicKey,
    readonly pool_creator: PublicKey,
    readonly token_0_vault: PublicKey,
    readonly token_1_vault: PublicKey,
    readonly lp_mint: PublicKey,
    readonly token_0_mint: PublicKey,
    readonly token_1_mint: PublicKey,
    readonly token_0_program: PublicKey,
    readonly token_1_program: PublicKey,
    readonly observation_key: PublicKey,
    readonly auth_bump: number,
    readonly status: number,
    readonly lp_mint_decimals: number,
    readonly mint_0_decimals: number,
    readonly mint_1_decimals: number,
    readonly lp_supply: bignum,
    readonly protocol_fees_token_0: bignum,
    readonly protocol_fees_token_1: bignum,
    readonly fund_fees_token_0: bignum,
    readonly fund_fees_token_1: bignum,
    readonly open_time: bignum,
    readonly padding: bignum[],
) {}

static readonly struct = new FixableBeetStruct<RaydiumCPMM>(
[
    ["discriminator", uniformFixedSizeArray(u8, 8)],
    ["amm_config", publicKey],
    ["pool_creator", publicKey],
    ["token_0_vault", publicKey],
    ["token_1_vault", publicKey],
    ["lp_mint", publicKey],
    ["token_0_mint", publicKey],
    ["token_1_mint", publicKey],
    ["token_0_program", publicKey],
    ["token_1_program", publicKey],
    ["observation_key", publicKey],
    ["auth_bump", u8],
    ["status", u8],
    ["lp_mint_decimals", u8],
    ["mint_0_decimals", u8],
    ["mint_1_decimals", u8],
    ["lp_supply", u64],
    ["protocol_fees_token_0", u64],
    ["protocol_fees_token_1", u64],
    ["fund_fees_token_0", u64],
    ["fund_fees_token_1", u64],
    ["open_time", u64],
    ["padding", uniformFixedSizeArray(u64, 32)],
],
(args) =>
    new RaydiumCPMM(
        args.discriminator!,
        args.amm_config!,
        args.pool_creator!,
        args.token_0_vault!,
        args.token_1_vault!,
        args.lp_mint!,
        args.token_0_mint!,
        args.token_1_mint!,
        args.token_0_program!,
        args.token_1_program!,
        args.observation_key!,
        args.auth_bump!,
        args.status!,
        args.lp_mint_decimals!,
        args.mint_0_decimals!,
        args.mint_1_decimals!,
        args.lp_supply!,
        args.protocol_fees_token_0!,
        args.protocol_fees_token_1!,
        args.fund_fees_token_0!,
        args.fund_fees_token_1!,
        args.open_time!,
        args.padding!,
    ),
"RaydiumCPMM",
);
}

