const Arweave = require("arweave");
import { JWKInterface } from "arweave/node/lib/wallet";

interface Result {
    statusCode: number;
    body: string;
}

exports.handler = async function (event, context) {
    console.log(event);
    // #1 Get the data from the POST request; encoded as base64 string.
    const data = JSON.parse(event.body)["data"];

    // #2 Make a connection to Arweave server; following standard example.
    const arweave = Arweave.init({
        host: "arweave.net",
        port: 443,
        protocol: "https",
    });

    // #3 Load our key from the .env file
    const arweaveKey = JSON.parse(process.env.ARWEAVE_KEY!) as JWKInterface;

    // #4 Check out wallet balance. We should probably fail if too low?
    const arweaveWallet = await arweave.wallets.jwkToAddress(arweaveKey);
    const arweaveWalletBallance = await arweave.wallets.getBalance(arweaveWallet);

    console.log("current arweave balance: ", arweaveWalletBallance);

    try {
        // #5 Core flow: create a transaction, upload and wait for the status!
        let transaction = await arweave.createTransaction({ data: data }, arweaveKey);
        transaction.addTag("Content-Type", "application/json");
        await arweave.transactions.sign(transaction, arweaveKey);
        const response = await arweave.transactions.post(transaction);
        const status = await arweave.transactions.getStatus(transaction.id);
        console.log(`Completed transaction ${transaction.id} with status code ${status}!`);

        var result: Result = { statusCode: 200, body: `https://www.arweave.net/${transaction.id}?ext=json` };
        var Jresult = { statusCode: 200, body: JSON.stringify(result) };
        return Jresult;
    } catch (err) {
        console.log("ARWEAVE ERROR: ", err);
        var result: Result = { statusCode: 404, body: err };
        var Jresult = { statusCode: 404, body: JSON.stringify(result) };
        return Jresult;
    }
};
