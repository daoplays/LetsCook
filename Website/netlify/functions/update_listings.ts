import { request_raw_account_data, LaunchData, bignum_to_num, ListingData } from "../../components/Solana/state";
import { PROGRAM, LaunchKeys, LaunchFlags } from "../../components/Solana/constants";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import admin from "firebase-admin";

exports.handler = async function (event, context) {
    console.log(event);

    let event_body = JSON.parse(event.body);
    let mint = event_body["address"];

    if (!admin.apps.length) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: "letscooklistings",
                    clientEmail: "firebase-adminsdk-lzgk0@letscooklistings.iam.gserviceaccount.com",
                    privateKey: process.env.FIREBASE_KEY.replace(/\\n/g, "\n"),
                }),
                databaseURL: "https://letscooklistings-default-rtdb.firebaseio.com",
            });
        } catch (error) {
            console.log("Firebase admin initialization error:", error.stack);
        }
    }

    let mint_key = new PublicKey(mint);
    let listing_account = PublicKey.findProgramAddressSync([mint_key.toBytes(), Buffer.from("Listing")], PROGRAM)[0];

    const db = admin.database();
    const database = db.ref("data/" + listing_account.toString());

    try {
        const listing_data = await request_raw_account_data("", listing_account);
        if (listing_data === null) {
            var Jresult = { statusCode: 404, body: JSON.stringify({ message: "listing error" }) };
            return Jresult;
        }
        try {
            const [listing] = ListingData.struct.deserialize(listing_data);
            //console.log("in update listings", JSON.stringify(listing));

            await database.set(JSON.stringify(listing));
        } catch (error) {
            console.log("ERROR: ", error);
            var Jresult = { statusCode: 404, body: JSON.stringify({ message: "listing error" }) };
            return Jresult;
        }

        var Jresult = { statusCode: 200, body: JSON.stringify({ message: "listing updated" }) };
        return Jresult;
    } catch (err) {
        console.log("ERROR: ", err);
        var Jresult = { statusCode: 404, body: JSON.stringify({ message: "listing error" }) };
        return Jresult;
    }
};
