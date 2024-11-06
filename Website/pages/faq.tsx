"use client";

import { VStack, Text } from "@chakra-ui/react";
import useResponsive from "../hooks/useResponsive";
import Head from "next/head";

const FAQ = () => {
    const { sm, lg } = useResponsive();

    const faqContent = [
        {
            title: "WHAT IS LET'S COOK?",
            description:
                "Let's Cook is the best place to launch hybrid NFTs & Memecoins. Our fully-automated and permissionless platform provides the lowest cost and best user experience for both degens and meme creators.",
        },
        {
            title: "WHY SOLANA?",
            description:
                "The Solana network is the next-gen L1 blockchain with the highest marketcap, lowest transaction fees, fastest settlement, and best capital efficiency in the market. It also has a fanatical user base and strong developer ecosystem.",
        },
        {
            title: "HOW DO LET'S COOK FAIR-LAUNCHES WORK?",
            description:
                "Each launch, or 'Cook', bootstraps memecoin liquidity fairly by raffling a portion of the total token supply. Users may buy Tickets to a Cook while it is open and claim their winning Tickets once it closes. Non-winning Tickets are refunded their Ticket Price.",
        },
        {
            title: "WHAT IS 'GUARANTEED LIQUIDITY,' AND WHY IS IT IMPORTANT FOR A COOK?",
            description:
                "'Guaranteed Liquidity' is the minimum amount of SOL that must to be raised for the launch to proceed. If this threshold isn't met, all tickets are refunded. This mechanism minimizes risk from failed launches for users, reduces cost of failed launches for creators, and concentrates liquidity into fewer, higher-quality memes.",
        },
        {
            title: "HOW IS THE LIQUIDITY POOL CREATED?",
            description:
                "Our on-chain program creates Liquidity Pools on Raydium, pairing a portion of the memecoin supply with the SOL raised during the Cook. The program then burns the Liquidity Provider tokens, permanently locking the liquidity in the pool. It also revokes all update authorities automatically.",
        },
        {
            title: "WHAT DO THE 'HYPE' PERCENTAGES REPRESENT?",
            description:
                "Users can vote up or down on an upcoming token launch to express their sentiment on it. The Hype rating is calculated based on the net number of positive votes from all users.",
        },
        {
            title: "HOW ARE FEATURES MEMECOINS SELECTED?",
            description:
                "The Home page banner showcases the Cook with the highest Hype rating for that day. The Upcoming list displays the top-hyped tokens for future dates, ensuring visibility for the most promising launches.",
        },
        {
            title: "HOW CAN USERS CHECK THE FULL SCHEDULE?",
            description:
                "Users can view the full schedule of Cooks through the Calendar page. This page displays all scheduled launches, complete with their hype ratings, minimum liquidity requirements, and launch times, allowing users to plan their participation.",
        },
        {
            title: "HOW MUCH DOES LET'S COOK CHARGE?",
            description:
                "Let's Cook charges a non-refundable platform fee of 0.01 SOL on every mint. There are no fees to set up a Cook. This fee supports additional feature development and marketing.",
        },
        {
            title: "WHAT IS SAUCE?",
            description:
                "SAUCE is our platform currency. It is not tradeable to avoid security regulations. You can earn SAUCE by voting, buying tickets, or successfully launching memecoins on LET'S COOK. SAUCE will be used to claim perks and rewards on LET'S COOK like whitelist spots, memecoin airdrops, and $COOK (once it is released).",
        },
        {
            title: "WHAT IS $COOK?",
            description:
                "THE CHEF is a Market Making Incentives Program inspired by Curve on Ethereum. THE CHEF issues $COOK tokens as an incentive to Market Makers of specific token pairs. $COOK can be staked for governance power over THE CHEF's parameters, including $COOK Gauges, Inflation Rate, Transfer Tax Rate, Staking Rewards Rate, and Staking Cooldown Length.",
        },
    ];

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | FAQs</title>
            </Head>
            <main className="md:p-8">
                <VStack
                    gap={8}
                    className="mx-auto flex w-full flex-col items-center justify-center bg-[#161616] bg-opacity-75 bg-clip-padding px-6 py-6 text-white shadow-2xl backdrop-blur-sm backdrop-filter md:rounded-xl md:border-t-[3px] md:border-orange-700 md:px-12 md:py-8 lg:w-[875px]"
                >
                    <VStack spacing={2}>
                        <Text className="text-center text-3xl font-semibold text-white lg:text-4xl">Frequently Asked Questions</Text>
                    </VStack>

                    <div className="flex flex-col gap-10">
                        {faqContent.map((item, index) => (
                            <div key={item.title} className="flex flex-col gap-2">
                                <h2 className="font-bold">
                                    {index + 1}. {item.title}
                                </h2>
                                <p className="text-opacity-75 md:text-start">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </VStack>
            </main>
        </>
    );
};

export default FAQ;
