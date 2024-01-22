const { TwitterApi } = require("twitter-api-v2");
import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";
import type { Config } from "@netlify/functions";

interface Result {
    statusCode: number;
    body: string;
}

export default async (req: Request) => {
    const { next_run } = await req.json();

    console.log("Received event! Next invocation at:", next_run);

    const client = new TwitterApi({
        appKey: process.env.TWITTER_APP_KEY,
        appSecret: process.env.TWITTER_APP_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    try {
        let new_list = await fetch("https://token.jup.ag/strict").then((res) => res.json());

        const store = getStore({
            name: "strictList",
            siteID: process.env.NETLIFY_SITE_ID,
            token: process.env.NETLIFY_TOKEN,
        });
        const oldList = await store.get("list");
        let old_list = JSON.parse(oldList);

        // we only care about additions compared to the old list
        let additions: string[] = [];
        for (let i = 0; i < new_list.length; i++) {
            let address = new_list[i]["address"];
            let found: boolean = false;
            for (let j = 0; j < old_list.length; j++) {
                if (old_list[j]["address"] === address) {
                    found = true;
                    break;
                }
            }
            if (found === false) {
                let has_dollar: boolean = new_list[i]["symbol"][0] === "$";
                let symbol: string = has_dollar ? new_list[i]["symbol"] : "$" + new_list[i]["symbol"];
                let tweet: string =
                    symbol + " is now validated at @JupiterExchange CA: " + address + ". Find upcoming memecoins at https://letscook.wtf";
                additions.push(tweet);
            }
        }

        if (additions.length === 0) {
            console.log("no new additions")
            return;
        }

        console.log("have ", additions.length, " new additions")
        for (let i = 0; i < additions.length; i++) {
            console.log(additions[i]);
            //let response = await client.v2.tweet(additions[i]);
        }

        await store.set("list", JSON.stringify(new_list));

        return;
    } catch (err) {
        console.log("TWITTER ERROR: ", err);
        return;
    }
};

export const config: Config = {
    schedule: "@hourly",
};
