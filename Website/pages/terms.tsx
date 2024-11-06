"use client";

import { VStack, Text, Box, List, ListItem, Center, HStack } from "@chakra-ui/react";
import useResponsive from "../hooks/useResponsive";
import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE } from "../components/Solana/constants";
import Head from "next/head";

const TermsPage = () => {
    const { sm, lg } = useResponsive();

    const content = [
        {
            title: "WHAT IS LET'S COOK?",
            description:
                "Let's Cook is a decentralized tool available for anybody to create and launch their own memecoins on the Solana blockchain network.",
        },
        {
            title: "MEMECOIN DEFINITION",
            description:
                "Memecoins are tokenized memes, not investments or securities. Users have no reasonable expectation of profit by using this site, especially not from the efforts of others.",
        },
        {
            title: "VIRALITY AND INTERNET HIVEMIND",
            description:
                "The virality of a memecoin depends on the tastes of the internet hivemind and the whims of a disorganized mob of token holders and social media memesters, not on the efforts of any team.",
        },
        {
            title: "SECONDARY MARKET CAUTION",
            description:
                "Secondary markets for memecoins are illiquid and volatile. Financial exposure to memecoins is more akin to competitive gambling than it is to investing. Again, memecoins are not investments.",
        },
        {
            title: "MEMECOIN LIFESPAN",
            description:
                "As with any meme or joke, memecoins can get stale and boring over time. Virtually all memecoins eventually end up illiquid and worthless on secondary markets.",
        },
        {
            title: "DECENTRALIZED SECONDARY MARKETS",
            description:
                "Secondary markets for almost all memecoins are decentralized. There are no government regulators to enforce anti-market manipulation regulations.",
        },
        {
            title: "LET’S COOK AND SECONDARY MARKETS",
            description: "Let's Cook does not operate secondary memecoin markets. Participate in secondary markets at your own risk.",
        },
        {
            title: "SECURITIES AND LEGALITY",
            description:
                "Let's Cook is not designed or intended for the sale of securities. Creators are responsible for ensuring that their tokens are not securities and that their sales are legal in their jurisdictions.",
        },
        {
            title: "PLATFORM LIABILITY",
            description:
                "Let's Cook is not responsible or liable for creators that misuse the website to organize unlawful sales of securities.",
        },
        {
            title: "CREATOR CONTROL",
            description:
                "Let's Cook does not and cannot control what creators do with the tokens released into their control according to their launch settings. Please review the Distribution information for each launch carefully and vote accordingly to share your sentiment with other users.",
        },
        {
            title: "USER PRIVACY",
            description: "Let's Cook does not collect any user information other than the Public Keys of wallets connected to the website.",
        },
        {
            title: "TRANSACTION TRANSPARENCY",
            description: "Transactions performed through Let's Cook are not private and can be viewed publicly on Solana block explorers.",
        },
        {
            title: "DISCLAIMER OF WARRANTIES",
            description:
                "This website and the corresponding Solana program are provided “as is”. Let's Cook hereby disclaims all warranties of any kind, whether express or implied, statutory or otherwise.",
        },
        {
            title: "LIMITATION OF LIABILITY",
            description:
                "In no event shall Let's Cook be liable for any direct, indirect, incidental, special, consequential or punitive damages resulting from the use or inability to use the website or program.",
        },
        {
            title: "RIGHT TO UPDATE",
            description:
                "We reserve the right, at our sole discretion, to update the Let's Cook website and/or Solana program and to modify or replace these Terms and Conditions at any time.",
        },
    ];

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Terms</title>
            </Head>
            <main className="md:p-8">
                <VStack
                    gap={8}
                    className="mx-auto flex w-full flex-col items-center justify-center bg-[#161616] bg-opacity-75 bg-clip-padding px-6 py-6 text-white shadow-2xl backdrop-blur-sm backdrop-filter md:rounded-xl md:border-t-[3px] md:border-orange-700 md:px-12 md:py-8 lg:w-[875px]"
                >
                    <VStack spacing={2}>
                        <div className="flex flex-col gap-2">
                            <Text className="text-center text-3xl font-semibold text-white lg:text-4xl">Terms & Conditions</Text>
                        </div>
                        <p>By using this site, you agree to the following Terms and Conditions:</p>
                    </VStack>

                    <div className="flex flex-col gap-10">
                        {content.map((i, index) => (
                            <div key={i.title} className="flex flex-col gap-2">
                                <h2 className="font-bold">
                                    {index + 1}. {i.title}
                                </h2>
                                <p className="text-opacity-75 md:text-start">{i.description}</p>
                            </div>
                        ))}
                    </div>
                </VStack>
            </main>
        </>
    );
};

export default TermsPage;
