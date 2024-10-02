import { Config } from "../components/Solana/constants";

export const isHomePageOnly = false;

export const distributionLabels = {
    headers: [
        { title: "Liquidity Pool", color: "white" },
        { title: "Let's Cook Rewards", color: "#a3a3a3" },
        { title: "Creator Control", color: "#666666" },
    ],
    fields: [
        { title: "Raffle (" + Config.token + ")", color: "#FF6651" },
        { title: "$TOKEN", color: "#FF9548" },
        { title: "Market Maker Rewards", color: "#66FF75" },
        { title: "Liquidity Provider Rewards", color: "#41F4FF" },
        { title: "Airdrops / Marketing", color: "#FFF069" },
        { title: "Team", color: "#8A7FFF" },
        { title: "Others", color: "#FD98FE" },
    ],
};
