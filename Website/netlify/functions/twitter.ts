const { TwitterApi } = require('twitter-api-v2');
import { request_raw_account_data, LaunchData } from "../../components/Solana/state";
import { PROGRAM } from "../../components/Solana/constants";
import { PublicKey } from "@solana/web3.js";

interface Result {
    statusCode: number;
    body: string;
}

exports.handler = async function (event, context) {
    console.log(event);

    const client = new TwitterApi({
        appKey: process.env.TWITTER_APP_KEY,
        appSecret: process.env.TWITTER_APP_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_SECRET
      });

    const page_name = JSON.parse(event.body)["page_name"]
    console.log(page_name);
    let launch_data_account = PublicKey.findProgramAddressSync(
        [Buffer.from(page_name.toString()), Buffer.from("Launch")],
        PROGRAM,
    )[0];

    try {
        const launch_account_data = await request_raw_account_data("", launch_data_account);

        const [new_launch_data] = LaunchData.struct.deserialize(launch_account_data);

        console.log(new_launch_data);

        let tweet_string = "$" + new_launch_data.symbol+ " is warming up on Let's Cook! See how its looking at https://letscook.wtf/launch/"+new_launch_data.page_name
    
        console.log(tweet_string);
        let response = await client.v2.tweet(tweet_string);
        //console.log(`Completed transaction ${response.data}`);

        var result: Result = { statusCode: 200, body: response.data.text };
        var Jresult = { statusCode: 200, body: JSON.stringify(result) };
        return Jresult;
    } catch (err) {
        console.log("TWITTER ERROR: ", err);
        var result: Result = { statusCode: 404, body: err };
        var Jresult = { statusCode: 404, body: JSON.stringify(result) };
        return Jresult;
    }
};