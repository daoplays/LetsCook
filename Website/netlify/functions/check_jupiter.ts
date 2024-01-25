const { TwitterApi } = require("twitter-api-v2");
import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";
import type { Config } from "@netlify/functions";
import { JupCSVToList } from "../../utils/JupCSVToList";

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
        let new_list_string = await JupCSVToList();

        let new_list = JSON.parse(new_list_string);

        const store = getStore({
            name: "strictList",
            siteID: process.env.NETLIFY_SITE_ID,
            token: process.env.NETLIFY_TOKEN,
        });
        const oldList = await store.get("list");
        let old_list = JSON.parse(oldList);

        // we only care about additions compared to the old list
        let tweets: string[] = [];
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

            // we also need to check for duplicate additions :|
            for (let j = 0; j < additions.length; j++) {
                if (additions[j]["address"] === address) {
                    found = true;
                    break;
                }
            }

            if (found === false) {
                let symbol: string = new_list[i]["symbol"];
                let tweet: string =
                    symbol +
                    " is now validated at @JupiterExchange CA: " +
                    address +
                    ". Find upcoming memecoins at Let's Cook! https://letscook.wtf";
                tweets.push(tweet);
                additions.push(JSON.stringify(new_list[i]));
            }
        }

        if (tweets.length === 0) {
            console.log("no new additions");
            return new Response("Ok");
        }

        console.log("have ", tweets.length, " new additions");

        // if we have an unreasonable number of additions something has probably gone wrong
        if (tweets.length > 20) {
            console.log("list lengths very different, saving new list and exiting");
            await store.set("list", JSON.stringify(new_list));
            return new Response("Ok");
        }

        for (let i = 0; i < tweets.length; i++) {
            console.log(tweets[i]);
            let response = await client.v2.tweet(tweets[i]);
            old_list.push(additions[i]);
        }

        await store.set("list", JSON.stringify(old_list));

        return new Response("Ok");
    } catch (err) {
        console.log("TWITTER ERROR: ", err);
        return new Response("Error");
    }
};

export const config: Config = {
    schedule: "@hourly",
};
