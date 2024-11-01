import { request_raw_account_data, LaunchData, bignum_to_num, ListingData, TokenAccount } from "../../components/Solana/state";
import { PROGRAM, LaunchKeys, LaunchFlags, Config, WRAPPED_SOL } from "../../components/Solana/constants";
import { PublicKey, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";
import admin from "firebase-admin";
import { RaydiumAMM } from "@/components/Solana/jupiter_state";

// Helper function to fetch price from Jupiter API
async function fetchJupiterPrice() {
    try {
        const connection = new Connection("https://kimmie-wuj3pm-fast-mainnet.helius-rpc.com");
        let pool_address =
            Config.token === "SOL" ? "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2" : "EoNrn8iUhwgJySD1pHu8Qxm5gSQqLK3za4m8xzD2RuEb";

        let poolAccount = await connection.getAccountInfo(new PublicKey(pool_address));
        const [rayPool] = RaydiumAMM.struct.deserialize(poolAccount.data);

        let baseBalance = await connection.getTokenAccountBalance(rayPool.baseVault);
        let quoteBalance = await connection.getTokenAccountBalance(rayPool.quoteVault);
        let baseAmount = Number(baseBalance.value.amount) / Math.pow(10, baseBalance.value.decimals);
        let quoteAmount = Number(quoteBalance.value.amount) / Math.pow(10, quoteBalance.value.decimals);
        let price = quoteAmount / baseAmount;
        return price;
    } catch (error) {
        console.log("ERROR: ", error);
        return 0;
    }
}

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
            // Check if the error is about the app already existing
            if (error.code === "app/duplicate-app") {
                firebaseApp = admin.app(); // Get the existing app
            } else {
                console.error("Firebase admin initialization error:", error);
                throw error;
            }
        }
    }
    return firebaseApp;
};

exports.handler = async function (event, context) {
    console.log(event);

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const SOLPrice = await fetchJupiterPrice();
    if (SOLPrice === 0) {
        return {
            statusCode: 404,
            body: JSON.stringify({ message: "Failed to fetch price" }),
        };
    }

    // Initialize Firebase and get database reference
    const app = getFirebaseApp();
    const db = app.database();
    const database = db.ref(Config.NETWORK + "/prices/" + Config.token);
    let now = new Date().getTime();

    try {
        if (SOLPrice === 0) {
            var Jresult = { statusCode: 404, body: JSON.stringify({ message: "no price available" }) };
            return Jresult;
        }
        try {
            const data = {
                price: SOLPrice,
                timestamp: now,
            };

            await database.set(data);
        } catch (error) {
            console.log("ERROR: ", error);
            var Jresult = { statusCode: 404, body: JSON.stringify({ message: "error setting price" }) };
            return Jresult;
        }

        var Jresult = { statusCode: 200, body: JSON.stringify({ message: "price updated" }) };
        return Jresult;
    } catch (err) {
        console.log("ERROR: ", err);
        var Jresult = { statusCode: 404, body: JSON.stringify({ message: "error setting price" }) };
        return Jresult;
    }
};
