import { request_raw_account_data, LaunchData, bignum_to_num, ListingData } from "../../components/Solana/state";
import { PROGRAM, LaunchKeys, LaunchFlags } from "../../components/Solana/constants";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getStore } from "@netlify/blobs";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push } from "firebase/database";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
    // ...
    // The value of `databaseURL` depends on the location of the database
    databaseURL: "https://letscooklistings-default-rtdb.firebaseio.com/",
};

interface Result {
    statusCode: number;
    body: string;
}

exports.handler = async function (event, context) {
    console.log(event);

    let event_body = JSON.parse(event.body);
    let mint = event_body["address"];

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);

    // Initialize Realtime Database and get a reference to the service
    const database = getDatabase(app);

    try {
        let mint_key = new PublicKey(mint);
        let listing_account = PublicKey.findProgramAddressSync([mint_key.toBytes(), Buffer.from("Listing")], PROGRAM)[0];

        const listing_data = await request_raw_account_data("", listing_account);
        if (listing_data === null) {
            var Jresult = { statusCode: 404, body: JSON.stringify({ message: "listing error" }) };
            return Jresult;
        }
        try {
            const [listing] = ListingData.struct.deserialize(listing_data);
            console.log("in update listings", JSON.stringify(listing));

            await set(ref(database, "data/" + listing_account.toString()), JSON.stringify(listing));
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
