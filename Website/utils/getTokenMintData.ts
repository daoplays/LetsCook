import { getMintData } from "../components/amm/launch";
import { Config } from "../components/Solana/constants";
import { MintData } from "../components/Solana/state";
import { Connection, PublicKey } from "@solana/web3.js";
import { unpackMint } from "@solana/spl-token";

const BATCH_SIZE = 100; // Solana's maximum batch size for getMultipleAccountsInfo

export const getTradeMintData = async (trade_keys: String[]) => {
    const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });
    let mint_map = new Map<String, MintData>();

    // Convert all trade_keys to PublicKey objects
    const pubkeys: PublicKey[] = trade_keys.map((key) => new PublicKey(key));

    // Process in batches of 100
    for (let i = 0; i < pubkeys.length; i += BATCH_SIZE) {
        const batch = pubkeys.slice(i, i + BATCH_SIZE);
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
                        if (mint_data)
                            mint_map.set(pubkey.toString(), mint_data);
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
