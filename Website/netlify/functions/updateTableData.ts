import admin from "firebase-admin";
import { MarketMakingRow } from "../../hooks/tables/useMMTable";
import { Config, PROGRAM } from "../../components/Solana/constants";
import { PublicKey, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";
import { RunGPA, GPAccount, bignum_to_num, MintData } from "../../components/Solana/state";
import { AMMData, reward_date, reward_schedule } from "../../components/Solana/jupiter_state";
import { getTradeMintData } from "../../utils/getTokenMintData";
import { ListingData } from "@letscook/sdk/dist/state/listing";
import { fetchFromFirebase } from "@/utils/firebaseUtils";

// Initialize Firebase Admin SDK
let firebaseApp = null;
const getFirebaseApp = () => {
    if (!firebaseApp) {
        try {
            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: "letscooklistings",
                    clientEmail: "firebase-adminsdk-lzgk0@letscooklistings.iam.gserviceaccount.com",
                    privateKey: process.env.FIREBASE_KEY.replace(/\\n/g, "\n"),
                }),
                databaseURL: "https://letscooklistings-default-rtdb.firebaseio.com",
            });
        } catch (error) {
            if (error.code === "app/duplicate-app") {
                firebaseApp = admin.app();
            } else {
                console.error("Firebase admin initialization error:", error);
                throw error;
            }
        }
    }
    return firebaseApp;
};

// Helper function to serialize market making data
function serializeMMData(row: MarketMakingRow) {
    return {
        id: row.id,
        symbol: row.symbol,
        tokenIcon: row.tokenIcon,
        price: {
            value: row.price.value,
            display: row.price.display,
            decimals: row.price.decimals
        },
        liquidity: {
            value: row.liquidity.value,
            display: row.liquidity.display
        },
        rewards: {
            value: row.rewards.value,
            display: row.rewards.display,
            tokenIcon: row.rewards.tokenIcon
        },
        socials: row.socials,
        hype: {
            positiveVotes: row.hype.positiveVotes,
            negativeVotes: row.hype.negativeVotes,
            score: row.hype.score,
            launchId: row.hype.launchId,
            tokenMint: row.hype.tokenMint
        }
    };
}

exports.handler = async function (event, context) {
    console.log("Starting market making data update");

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // Fetch all required data from the blockchain
        const programData: GPAccount[] = await RunGPA();
        if (programData.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Failed to fetch program data" }),
            };
        }

        // Sort program data into respective arrays
        let ammData: AMMData[] = [];
        let listingData = new Map();
        let mintKeys: string[] = [];

        for (const account of programData) {
            const data = account.data;

            if (data[0] === 6) {
                try {
                    const [amm] = AMMData.struct.deserialize(data);
                    ammData.push(amm);
                    continue;
                } catch (error) {
                    console.log("Failed to deserialize listing data:", error);
                    continue;
                }
            }

            if (data[0] === 11) {
                try {
                    const [listing] = ListingData.struct.deserialize(account.data);
                    listingData.set(account.pubkey.toString(), listing);
                    mintKeys.push(listing.mint.toString());
                    continue;
                } catch (error) {
                    console.log("Failed to deserialize listing data:", error);
                    continue;
                }
            }
        }

        // Initialize Firebase and save the data
        const app = getFirebaseApp();
        const db = app.database();

       const priceEntry = await fetchFromFirebase(Config.NETWORK + "/prices/" + Config.token);

       if (!priceEntry) {
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    message: "Failed to update market making data",
                    error: "Failed to fetch SOL price"
                })
            };
       }
       const SOLPrice = priceEntry.price;

        // Process the data into market making rows
        const processedRows: MarketMakingRow[] = [];
        const PRECISION = BigInt(10 ** 9);

        for (const amm of ammData) {
            if (bignum_to_num(amm.start_time) === 0) continue;

            const listing_key = PublicKey.findProgramAddressSync(
                [amm.base_mint.toBytes(), Buffer.from("Listing")],
                PROGRAM
            )[0];

            const listing = listingData.get(listing_key.toString());
            if (!listing) continue;

            const price = amm.provider === 0
                ? Buffer.from(amm.last_price).readFloatLE(0)
                : 0;

            const scaled_quote_amount = (BigInt(amm.amm_quote_amount.toString()) * PRECISION) /
                BigInt(LAMPORTS_PER_SOL);

            const liquidity = Number(scaled_quote_amount) / Number(PRECISION) * SOLPrice;
            const rewards = reward_schedule(0, amm, listing.decimals);

            processedRows.push({
                id: listing.mint.toString(),
                symbol: listing.symbol,
                tokenIcon: listing.icon,
                price: {
                    value: price,
                    display: price < 1e-3 ? price.toExponential(3) : price.toFixed(Math.min(listing.decimals, 3)),
                    decimals: listing.decimals
                },
                liquidity: {
                    value: liquidity,
                    display: "$" + nFormatter(2 * liquidity, 2)
                },
                rewards: {
                    value: rewards,
                    display: nFormatter(rewards, 2),
                    tokenIcon: listing.icon
                },
                socials: listing.socials,
                hype: {
                    positiveVotes: listing.positive_votes,
                    negativeVotes: listing.negative_votes,
                    score: listing.positive_votes - listing.negative_votes,
                    launchId: bignum_to_num(listing.id),
                    tokenMint: listing.mint.toString()
                }
            });
        }

        
        const mmTableDatabase = db.ref(Config.NETWORK + "/marketMaking/");

        const now = new Date().getTime();
        const data = {
            timestamp: now,
            rows: processedRows.map(row => serializeMMData(row))
        };

        await mmTableDatabase.set(data);

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                message: "Market making data updated successfully",
                timestamp: now,
                rowCount: processedRows.length
            })
        };

    } catch (error) {
        console.error("Error updating market making data:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                message: "Failed to update market making data",
                error: error.message
            })
        };
    }
};

// Utility function for number formatting
const nFormatter = (num: number, digits: number): string => {
    if (num < 1) return num.toFixed(digits);
    
    const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "k" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "B" },
        { value: 1e12, symbol: "T" },
        { value: 1e15, symbol: "P" },
        { value: 1e18, symbol: "E" },
    ];
    
    const item = lookup.findLast((item) => num >= item.value);
    return item ? (num / item.value).toFixed(digits).concat(item.symbol) : "0";
};