import { ComputeBudgetProgram, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { Config, PROGRAM, SYSTEM_KEY } from "../../components/Solana/constants";
import { UserData, getRecentPrioritizationFees, get_current_blockhash, request_raw_account_data, serialise_HypeVote_instruction } from "../../components/Solana/state";


export default async function handler(req, res) {
   

    // Handle OPTIONS method
    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Encoding, Accept-Encoding");

        res.status(200).end();
        return;
    }

    if (req.method === "GET") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Encoding, Accept-Encoding");

        try {
            const { wallet } = req.query;

            let wallet_address = new PublicKey(wallet);
            let user_data_account = PublicKey.findProgramAddressSync([wallet_address.toBytes(), Buffer.from("User")], PROGRAM)[0];
           
            let user_data_raw = await request_raw_account_data("", user_data_account);
            if (!user_data_raw) {
                const data = {
                    result: 0,
                    message: "User data does not exist"
                }
                res.status(200).json(data);
                return 
            }

            const [user_data] = UserData.struct.deserialize(user_data_raw);

            if (!user_data) {
                const data = {
                    result: 0,
                    message: "Invalid user data"
                }
                res.status(200).json(data);
                return 
            }

            let points = user_data.total_points;

            if (points < 100) {
                const data = {
                    result: 0,
                    message: "User has not achieved quest"
                }
                res.status(200).json(data);
                return 
            }


            const data = {
                result: 1,
                message: "User has achieved quest"
            }
            res.status(200).json(data);
            return 
            
        } catch (error) {
            res.status(400).json({ result: 0, error: "Invalid wallet" });
        }
    } else {
        // Handle any other HTTP method
        res.setHeader("Allow", ["GET"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
