import { Box, Center, HStack, Text, VStack } from "@chakra-ui/react";
import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE } from "../components/Solana/constants";
import salad2 from "../public/images/salad2.png";
import hotdog from "../public/images/hotdog.png";
import pizza from "../public/images/pizza.png";
import pasta from "../public/images/Pasta.png";
import fries from "../public/images/fries.webp";
import veggies from "../public/images/veggies.webp";
import tomato from "../public/images/tomato.webp";
import salad1 from "../public/images/salad1.webp";
import sauce from "../public/images/sauce.png";
import Head from "next/head";
import Image from "next/image";
import useResponsive from "../hooks/useResponsive";

const FAQ = () => {
    const { sm, lg } = useResponsive();

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | FAQs</title>
            </Head>
            <main className="bg-[#161616] bg-opacity-75 bg-clip-padding px-6 py-6 shadow-2xl backdrop-blur-sm backdrop-filter md:rounded-xl md:border-t-[3px] md:px-12 md:py-8">
                <Center>
                    <VStack
                        px={sm ? 6 : 12}
                        spacing={10}
                        width={lg ? "100%" : "85%"}
                        className="font-face-rk"
                        style={{ color: "white", fontSize: DUNGEON_FONT_SIZE }}
                    >
                        <VStack spacing={0}>
                            <h2
                                className="font-face-kg"
                                style={{ fontSize: DEFAULT_FONT_SIZE, textAlign: sm ? "center" : "start", lineHeight: 1.5 }}
                            >
                                FREQUENTLY ASKED QUESTIONS
                            </h2>
                        </VStack>

                        <VStack spacing={sm ? 10 : 20} align={sm ? "center" : "start"}>
                            <VStack spacing={sm ? 1 : 3} align={sm ? "center" : "start"}>
                                <h2
                                    className="font-face-kg"
                                    style={{
                                        fontSize: sm ? 18 : DUNGEON_FONT_SIZE,
                                        textAlign: sm ? "center" : "start",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    WHAT IS LET&apos;S COOK?
                                </h2>
                                <HStack spacing={12} align="center">
                                    <Text m={0} align={sm ? "center" : "start"} fontSize={sm ? "large" : "x-large"} lineHeight={1.25}>
                                        LET&apos;S COOK is the best place to launch Solana memecoins. Our fully-automated and permissionless
                                        platform provides the lowest cost and best user experience for both degens and meme creators.
                                    </Text>
                                    <Image src={hotdog.src} width={150} height={150} alt={"Hotdog"} hidden={sm} />
                                </HStack>
                            </VStack>

                            <VStack spacing={sm ? 1 : 3} align={sm ? "center" : "start"}>
                                <h2
                                    className="font-face-kg"
                                    style={{
                                        fontSize: sm ? 18 : DUNGEON_FONT_SIZE,
                                        textAlign: sm ? "center" : "start",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    WHY SOLANA?
                                </h2>
                                <HStack spacing={12} align="center">
                                    <Image src={pizza.src} width={150} height={150} alt={"Pizza"} hidden={sm} />
                                    <Text m={0} align={sm ? "center" : "start"} fontSize={sm ? "large" : "x-large"} lineHeight={1.25}>
                                        The Solana network is the next-gen L1 blockchain with the highest marketcap, lowest transaction
                                        fees, fastest settlement, and best capital efficiency in the market. It also has a fanatical user
                                        base and strong developer ecosystem.
                                    </Text>
                                </HStack>
                            </VStack>

                            <VStack spacing={sm ? 1 : 3} align={sm ? "center" : "start"}>
                                <h2
                                    className="font-face-kg"
                                    style={{
                                        fontSize: sm ? 18 : DUNGEON_FONT_SIZE,
                                        textAlign: sm ? "center" : "start",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    How do LET&apos;S COOK fair-launches work?
                                </h2>
                                <HStack spacing={12} align="center">
                                    <Text m={0} align={sm ? "center" : "start"} fontSize={sm ? "large" : "x-large"} lineHeight={1.25}>
                                        Each launch, or &quot;Cook&quot;, bootstraps memecoin liquidity fairly by raffling a portion of the
                                        total token supply. Users may buy Tickets to a Cook while it is open and claim their winning Tickets
                                        once it closes. Non-winning Tickets are refunded their Ticket Price.
                                    </Text>
                                    <Image src={pasta.src} width={150} height={150} alt={"Pasta"} hidden={sm} />
                                </HStack>
                            </VStack>

                            <VStack spacing={sm ? 1 : 3} align={sm ? "center" : "start"}>
                                <h2
                                    className="font-face-kg"
                                    style={{
                                        fontSize: sm ? 18 : DUNGEON_FONT_SIZE,
                                        textAlign: sm ? "center" : "start",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    What is &apos;Guaranteed Liquidity,&apos; and why is it important for a Cook?
                                </h2>
                                <HStack spacing={12} align="center">
                                    <Image src={salad2.src} width={150} height={150} alt={"Salad"} hidden={sm} />
                                    <Text m={0} align={sm ? "center" : "start"} fontSize={sm ? "large" : "x-large"} lineHeight={1.25}>
                                        &apos;Guaranteed Liquidity&apos; is the minimum amount of SOL that must to be raised for the launch
                                        to proceed. If this threshold isn&apos;t met, all tickets are refunded. This mechanism has three
                                        positive outcomes:
                                        <ul style={{ marginTop: "15px", textAlign: "start" }}>
                                            <li>Minimizes the risk from failed launches for users.</li>
                                            <li>Reduces the cost of failed launches for creators.</li>
                                            <li>Concentrates liquidity into fewer, higher-quality memes.</li>
                                        </ul>
                                    </Text>
                                </HStack>
                            </VStack>

                            <VStack spacing={sm ? 1 : 3} align={sm ? "center" : "start"}>
                                <h2
                                    className="font-face-kg"
                                    style={{
                                        fontSize: sm ? 18 : DUNGEON_FONT_SIZE,
                                        textAlign: sm ? "center" : "start",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    How is the liquidity pool created, and what measures are in place to prevent rug-pulls?
                                </h2>
                                <HStack spacing={12} align="center">
                                    <Text m={0} align={sm ? "center" : "start"} fontSize={sm ? "large" : "x-large"} lineHeight={1.25}>
                                        Our on-chain program creates Liquidity Pools on Raydium, pairing a portion of the memecoin supply
                                        with the SOL raised during the Cook. The program then burns the Liquidity Provider tokens,
                                        permanently locking the liquidity in the pool. It also revokes all update authorities automatically.
                                    </Text>
                                    <Image src={sauce.src} width={150} height={150} alt={"Sauce"} hidden={sm} />
                                </HStack>
                            </VStack>

                            <VStack spacing={sm ? 1 : 3} align={sm ? "center" : "start"}>
                                <h2
                                    className="font-face-kg"
                                    style={{
                                        fontSize: sm ? 18 : DUNGEON_FONT_SIZE,
                                        textAlign: sm ? "center" : "start",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    What do the &apos;hype&apos; percentages represent, and how is this rating calculated?
                                </h2>
                                <HStack spacing={12} align="center">
                                    <Image src={tomato.src} width={220} height={220} alt={"Tomato"} hidden={sm} />
                                    <Text m={0} align={sm ? "center" : "start"} fontSize={sm ? "large" : "x-large"} lineHeight={1.25}>
                                        Users can vote up or down on an upcoming token launch to express their sentiment on it. The Hype
                                        rating is calculated based on the net number of positive votes from all users.
                                    </Text>
                                </HStack>
                            </VStack>

                            <VStack spacing={sm ? 1 : 3} align={sm ? "center" : "start"}>
                                <h2
                                    className="font-face-kg"
                                    style={{
                                        fontSize: sm ? 18 : DUNGEON_FONT_SIZE,
                                        textAlign: sm ? "center" : "start",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    How are features memecoins selected?
                                </h2>
                                <HStack spacing={12} align="center">
                                    <Text m={0} align={sm ? "center" : "start"} fontSize={sm ? "large" : "x-large"} lineHeight={1.25}>
                                        The Home page banner showcases the Cook with the highest Hype rating for that day. The Upcoming list
                                        displays the top-hyped tokens for future dates, ensuring visibility for the most promising launches.
                                    </Text>
                                    <Image src={veggies.src} width={150} height={150} alt={"Veggies"} hidden={sm} />
                                </HStack>
                            </VStack>

                            <VStack spacing={sm ? 1 : 3} align={sm ? "center" : "start"}>
                                <h2
                                    className="font-face-kg"
                                    style={{
                                        fontSize: sm ? 18 : DUNGEON_FONT_SIZE,
                                        textAlign: sm ? "center" : "start",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    How can users check the full schedule of upcoming Cooks and their details?
                                </h2>
                                <HStack spacing={12} align="center">
                                    <Image src={salad1.src} width={150} height={150} alt={"Salad"} hidden={sm} />
                                    <Text m={0} align={sm ? "center" : "start"} fontSize={sm ? "large" : "x-large"} lineHeight={1.25}>
                                        Users can view the full schedule of Cooks through the Calendar page. This page displays all
                                        scheduled launches, complete with their hype ratings, minimum liquidity requirements, and launch
                                        times, allowing users to plan their participation.
                                    </Text>
                                </HStack>
                            </VStack>

                            <VStack spacing={sm ? 1 : 3} align={sm ? "center" : "start"}>
                                <h2
                                    className="font-face-kg"
                                    style={{
                                        fontSize: sm ? 18 : DUNGEON_FONT_SIZE,
                                        textAlign: sm ? "center" : "start",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    How much does LET&apos;S COOK charge for launches?
                                </h2>
                                <HStack spacing={12} align="center">
                                    <Text m={0} align={sm ? "center" : "start"} fontSize={sm ? "large" : "x-large"} lineHeight={1.25}>
                                        LET&apos;S COOK charges a non-refundable platform fee of 0.01 SOL on every mint. There are no fees
                                        to set up a Cook. This fee supports additional feature development and marketing.
                                    </Text>
                                    <Image src={fries.src} width={150} height={120} alt={"Fries"} hidden={sm} />
                                </HStack>
                            </VStack>

                            <VStack spacing={sm ? 1 : 3} align={sm ? "center" : "start"}>
                                <h2
                                    className="font-face-kg"
                                    style={{
                                        fontSize: sm ? 18 : DUNGEON_FONT_SIZE,
                                        textAlign: sm ? "center" : "start",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    What is SAUCE?
                                </h2>
                                <HStack spacing={12} align="center">
                                    <Text m={0} align={sm ? "center" : "start"} fontSize={sm ? "large" : "x-large"} lineHeight={1.25}>
                                        SAUCE is our platform currency. It is not tradeable to avoid security regulations. You can earn
                                        SAUCE by voting, buying tickets, or successfully launching memecoins on LET&apos;S COOK. SAUCE will
                                        be used to claim perks and rewards on LET&apos;S COOK like whitelist spots, memecoin airdrops, and
                                        $COOK (once it is released).
                                    </Text>
                                </HStack>
                            </VStack>

                            <VStack spacing={sm ? 1 : 3} align={sm ? "center" : "start"}>
                                <h2
                                    className="font-face-kg"
                                    style={{
                                        fontSize: sm ? 18 : DUNGEON_FONT_SIZE,
                                        textAlign: sm ? "center" : "start",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    What is $COOK?
                                </h2>
                                <HStack spacing={12} align="center">
                                    <Text m={0} align={sm ? "center" : "start"} fontSize={sm ? "large" : "x-large"} lineHeight={1.25}>
                                        THE CHEF is a Market Making Incentives Program inspired by Curve on Ethereum. THE CHEF issues $COOK
                                        tokens as an incentive to Market Makers of specific token pairs. $COOK can be staked for governance
                                        power over THE CHEF’s parameters, including:
                                        <ul style={{ marginTop: "15px", textAlign: "start" }}>
                                            <li>$COOK Gauges</li>
                                            <li>$COOK Inflation Rate</li>
                                            <li>$COOK Transfer Tax Rate</li>
                                            <li>$COOK Staking Rewards Rate</li>
                                            <li>$COOK Staking Cooldown Length</li>
                                        </ul>
                                    </Text>
                                </HStack>
                            </VStack>
                        </VStack>
                    </VStack>
                </Center>
            </main>
        </>
    );
};

export default FAQ;
