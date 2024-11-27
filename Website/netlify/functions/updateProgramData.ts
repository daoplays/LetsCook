import { ListingData, RunGPA, GPAccount, MintData } from "../../components/Solana/state";
import { CollectionKeys, Config } from "../../components/Solana/constants";
import { getTradeMintData, serializeMintData } from "../../utils/getTokenMintData";
import admin from "firebase-admin";
import { CollectionData } from "@/components/collection/collectionState";

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

// Helper function to serialize GPAccount data
function serializeGPAccount(account: GPAccount) {
    return {
        pubkey: account.pubkey.toString(), // Convert PublicKey to string
        data: account.data.toString("base64"), // Convert Buffer to base64 string
    };
}

exports.handler = async function (event, context) {
    console.log(event);

    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    const programData: GPAccount[] = await RunGPA();
    if (programData.length === 0) {
        return {
            statusCode: 404,
            body: JSON.stringify({ message: "Failed to fetch program data" }),
        };
    }

    let ammData: GPAccount[] = [];
    let listingData: GPAccount[] = [];
    let mintKeys: string[] = [];

    for (let i = 0; i < programData.length; i++) {
        let data = programData[i].data;

        if (data[0] === 6) {
            ammData.push(programData[i]);
            continue;
        }

        if (data[0] === 11) {
            listingData.push(programData[i]);
            try {
                const [listing] = ListingData.struct.deserialize(programData[i].data);
                mintKeys.push(listing.mint.toString());
            } catch (error) {
                console.log("Failed to deserialize listing data:", error);
            }
            continue;
        }

        if (data[0] === 8) {
            const [collection] = CollectionData.struct.deserialize(data);
            if (!mintKeys.includes(collection.keys[CollectionKeys.MintAddress].toString()))
                mintKeys.push(collection.keys[CollectionKeys.MintAddress].toString());
            continue;
        }
    }

    let mintMap = await getTradeMintData(mintKeys);
    let mintVector: MintData[] = [];
    mintMap.forEach((mint) => {
        mintVector.push(mint);
    });

    // Initialize Firebase and get database reference
    const app = getFirebaseApp();
    const db = app.database();
    const accountsDatabase = db.ref(Config.NETWORK + "/accounts/");
    const tokensDatabase = db.ref(Config.NETWORK + "/tokens/");

    let now = new Date().getTime();

    try {
        try {
            // Create the data structure
            const data = {
                timestamp: now,
                listingData: listingData.map((account) => serializeGPAccount(account)),
                ammData: ammData.map((account) => serializeGPAccount(account)),
            };

            await accountsDatabase.set(data);

            // Create the data structure
            const tokenData = {
                timestamp: now,
                mintData: mintVector.map((mint) => serializeMintData(mint)),
            };

            await tokensDatabase.set(tokenData);
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
