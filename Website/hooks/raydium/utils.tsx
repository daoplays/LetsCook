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
