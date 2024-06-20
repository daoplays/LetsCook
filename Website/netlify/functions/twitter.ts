const { TwitterApi } = require("twitter-api-v2");
import { request_raw_account_data, LaunchData, bignum_to_num, ListingData } from "../../components/Solana/state";
import { PROGRAM, LaunchKeys, LaunchFlags } from "../../components/Solana/constants";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

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
        accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    const page_name = JSON.parse(event.body)["page_name"];
    console.log(page_name);
    let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(page_name.toString()), Buffer.from("Launch")], PROGRAM)[0];

    try {
        const launch_account_data = await request_raw_account_data("", launch_data_account);
        const [new_launch_data] = LaunchData.struct.deserialize(launch_account_data);

        const listing_data = await request_raw_account_data("", new_launch_data.listing);
        const [listing] = ListingData.struct.deserialize(listing_data);

        let current_time = new Date().getTime();
        if (current_time / 1000 - bignum_to_num(new_launch_data.last_interaction) > 5 * 60) {
            var result: Result = { statusCode: 404, body: "Launch occured too long ago to tweet" };
            var Jresult = { statusCode: 404, body: JSON.stringify(result) };
            return Jresult;
        }

        console.log(new_launch_data);

        if (new_launch_data.flags[LaunchFlags.LPState] !== 2) {
            var result: Result = { statusCode: 404, body: "launch not yet created LP" };
            var Jresult = { statusCode: 404, body: JSON.stringify(result) };
            return Jresult;
        }

        let liquidity = (new_launch_data.num_mints * bignum_to_num(new_launch_data.ticket_price)) / LAMPORTS_PER_SOL;
        let raydium_link = "https://raydium.io/swap/?inputCurrency=" + listing.mint.toString() + "&outputCurrency=sol&fixed=in";

        let tweet_string =
            "🔥 COOK OUT: $" +
            listing.symbol +
            " LP is now Live with " +
            liquidity.toFixed(2) +
            " SOL of liquidity on @RaydiumProtocol " +
            raydium_link +
            " Find more upcoming memecoins at https://letscook.wtf";

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
