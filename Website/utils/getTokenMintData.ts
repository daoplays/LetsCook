import { getMintData } from "../components/amm/launch";
import { Config } from "../components/Solana/constants";
import { MintData } from "../components/Solana/state";
import { Connection, PublicKey } from "@solana/web3.js";
import { Mint, unpackMint } from "@solana/spl-token";

export function serializeMint(mint: Mint): any {
    return {
        address: mint.address.toString(),
        mintAuthority: mint.mintAuthority?.toString() || null,
        supply: mint.supply.toString(),
        decimals: mint.decimals,
        isInitialized: mint.isInitialized,
        freezeAuthority: mint.freezeAuthority?.toString() || null,
        tlvData: mint.tlvData.toString("base64"),
    };
}

export function deserializeMint(serializedMint: any): Mint {
    return {
        address: new PublicKey(serializedMint.address),
        mintAuthority: serializedMint.mintAuthority ? new PublicKey(serializedMint.mintAuthority) : null,
        supply: BigInt(serializedMint.supply),
        decimals: serializedMint.decimals,
        isInitialized: serializedMint.isInitialized,
        freezeAuthority: serializedMint.freezeAuthority ? new PublicKey(serializedMint.freezeAuthority) : null,
        tlvData: Buffer.from(serializedMint.tlvData, "base64"),
    };
}

export function serializeMintData(mintData: MintData) {
    return {
        mint: serializeMint(mintData.mint),
        uri: mintData.uri,
        name: mintData.name,
        symbol: mintData.symbol,
        icon: mintData.icon,
        extensions: mintData.extensions,
        token_program: mintData.token_program.toString(),
    };
}

export function deserializeMintData(serializedMintData: any): MintData {
    return {
        mint: deserializeMint(serializedMintData.mint),
        uri: serializedMintData.uri,
        name: serializedMintData.name,
        symbol: serializedMintData.symbol,
        icon: serializedMintData.icon,
        extensions: serializedMintData.extensions,
        token_program: new PublicKey(serializedMintData.token_program),
    };
}

const BATCH_SIZE = 100; // Solana's maximum batch size for getMultipleAccountsInfo

export const getTradeMintData = async (trade_keys: String[]) => {
    const connection = new Connection(Config.RPC_NODE);
    let mint_map = new Map<String, MintData>();

    // Convert all trade_keys to PublicKey objects
    const pubkeys: PublicKey[] = trade_keys.map((key) => new PublicKey(key));

    // Process in batches of 100
    for (let i = 0; i < pubkeys.length; i += BATCH_SIZE) {
        let start_idx = i;
        let end_idx = Math.min(i + BATCH_SIZE, pubkeys.length);
        const batch = pubkeys.slice(start_idx, end_idx);
        try {
            const batchResults = await connection.getMultipleAccountsInfo(batch, "confirmed");

            // Process each result in the batch
            for (let j = 0; j < batchResults.length; j++) {
                const result = batchResults[j];
                const pubkey = batch[j];

                if (result) {
                    try {
                        const mint = unpackMint(pubkey, result, result.owner);

                        const mint_data = await getMintData(connection, mint, result.owner);
                        if (mint_data) mint_map.set(pubkey.toString(), mint_data);
                    } catch (error) {
                        console.log("Failed to process mint:", pubkey.toString());
                        console.log(error);
                    }
                } else {
                    console.log("No data found for mint:", pubkey.toString());
                }
            }
        } catch (error) {
            console.log("Failed to fetch batch starting at index", i);
            console.log(error);
            return null;
        }
    }

    return mint_map;
};
