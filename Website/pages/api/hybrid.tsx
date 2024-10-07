import { ComputeBudgetProgram, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { CollectionKeys, Config, PROGRAM, SYSTEM_KEY } from "../../components/Solana/constants";
import {
    getRecentPrioritizationFees,
    get_current_blockhash,
    request_raw_account_data,
    serialise_HypeVote_instruction,
} from "../../components/Solana/state";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";
import { CollectionData } from "../../components/collection/collectionState";
import useWrapNFT, { GetWrapInstructions } from "../../hooks/collections/useWrapNFT";
import { getMintData, setMintData } from "../../components/amm/launch";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
    // ...
    // The value of `databaseURL` depends on the location of the database
    databaseURL: "https://letscooklistings-default-rtdb.firebaseio.com/",
};

export default async function handler(req, res) {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);

    // Initialize Realtime Database and get a reference to the service
    const database = getDatabase(app);

    // Handle OPTIONS method
    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Encoding, Accept-Encoding");

        res.status(200).end();
        return;
    }

    if (req.method === "GET") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Encoding, Accept-Encoding");

        try {
            const { name } = req.query;

            let collection_key = PublicKey.findProgramAddressSync([Buffer.from(name), Buffer.from("Collection")], PROGRAM)[0];
            const snapshot = await get(ref(database, "data/" + collection_key.toString()));

            let listing = JSON.parse(snapshot.val());

            // Your data here
            const data = {
                title: listing.collection_name + " Collection Swap:  " + listing.num_available + " available",
                icon: listing.collection_icon_url,
                description: "Create collections and more at letscook.wtf!",
                label: "Collection Swap",
                links: {
                    actions: [
                        {
                            label: "Wrap", // button text
                            href: "/api/hybrid?name=" + name + "&action=wrap",
                        },
                        {
                            label: "Unwrap", // button text
                            href: "/api/hybrid?name=" + name + "&action=unwrap",
                        },
                    ],
                },
            };
            res.status(200).json(data);
        } catch (error) {
            res.status(400).json({ error: "Invalid mint" });
        }
    } else if (req.method === "POST") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        console.log("in post");
        try {
            const { account } = req.body;

            if (!account) {
                console.log("No account found");
                return res.status(400).json({ error: "Account parameter is required" });
            }
            console.log("have account", account);
            const { name, action } = req.query;

            let collection_key = PublicKey.findProgramAddressSync([Buffer.from(name), Buffer.from("Collection")], PROGRAM)[0];
            let collection_data = await request_raw_account_data("", collection_key);
            const [collection] = CollectionData.struct.deserialize(collection_data);
            let mint_data = await setMintData(collection.keys[CollectionKeys.MintAddress].toString());

            let user = new PublicKey(account);
            let instructions = await GetWrapInstructions(collection, mint_data, user, null);

            let txArgs = await get_current_blockhash("");

            let message = new TransactionMessage({ payerKey: user, recentBlockhash: txArgs.blockhash, instructions });
            let compiled = message.compileToV0Message();
            let transaction = new VersionedTransaction(compiled);
            let encoded_transaction = Buffer.from(transaction.serialize()).toString("base64");

            // Process the decoded account (this is a placeholder, replace with your actual logic)
            const processedData = {
                transaction: encoded_transaction,
                message: "Swap a random NFT from this collection for tokens.  For more info visit letscook.wtf!",
            };

            res.status(200).json(processedData);
        } catch (error) {
            console.error("Error processing request:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    } else {
        // Handle any other HTTP method
        res.setHeader("Allow", ["GET", "POST"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
