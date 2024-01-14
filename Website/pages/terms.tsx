"use client";

import { VStack, Text, Box, List, ListItem, Center, HStack } from "@chakra-ui/react";
import useResponsive from "../hooks/useResponsive";
import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE } from "../components/Solana/constants";

const TermsPage = () => {
    const { sm, lg } = useResponsive();

    const content = [
        {
            title: "WHAT IS LET'S COOK?",
            description:
                "LET’S COOK is a decentralized tool available for anybody to create and launch their own memecoins on the Solana blockchain network.",
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
            description: "LET’S COOK does not operate secondary memecoin markets. Participate in secondary markets at your own risk.",
        },
        {
            title: "SECURITIES AND LEGALITY",
            description:
                "LET’S COOK is not designed or intended for the sale of securities. Creators are responsible for ensuring that their tokens are not securities and that their sales are legal in their jurisdictions.",
        },
        {
            title: "PLATFORM LIABILITY",
            description:
                "LET’S COOK is not responsible or liable for creators that misuse the website to organize unlawful sales of securities.",
        },
        {
            title: "CREATOR CONTROL",
            description:
                "LET’S COOK does not and cannot control what creators do with the tokens released into their control according to their launch settings. Please review the Distribution information for each launch carefully and vote accordingly to share your sentiment with other users.",
        },
        {
            title: "USER PRIVACY",
            description: "LET’S COOK does not collect any user information other than the Public Keys of wallets connected to the website.",
        },
        {
            title: "TRANSACTION TRANSPARENCY",
            description: "Transactions performed through LET’S COOK are not private and can be viewed publicly on Solana block explorers.",
        },
        {
            title: "DISCLAIMER OF WARRANTIES",
            description:
                "This website and the corresponding Solana program are provided “as is”. LET’S COOK hereby disclaims all warranties of any kind, whether express or implied, statutory or otherwise.",
        },
        {
            title: "LIMITATION OF LIABILITY",
            description:
                "In no event shall LET’S COOK be liable for any direct, indirect, incidental, special, consequential or punitive damages resulting from the use or inability to use the website or program.",
        },
        {
            title: "RIGHT TO UPDATE",
            description:
                "We reserve the right, at our sole discretion, to update the LET’S COOK website and/or Solana program and to modify or replace these Terms and Conditions at any time.",
        },
    ];

    return (
        <main style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)", padding: "50px 0" }}>
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
                            TERMS & CONDITIONS
                        </h2>
                        <Text align="center" lineHeight={1.25}>
                            By using this site, you agree to the following Terms and Conditions:
                        </Text>
                    </VStack>

                    <VStack spacing={sm ? 10 : 20} align={sm ? "center" : "start"}>
                        {content.map((i, index) => (
                            <VStack spacing={sm ? 1 : 3} align={sm ? "center" : "start"}>
                                <h2
                                    className="font-face-kg"
                                    style={{ fontSize: DUNGEON_FONT_SIZE, textAlign: sm ? "center" : "start", lineHeight: 1.5 }}
                                >
                                    {index + 1}. {i.title}
                                </h2>
                                <Text align={sm ? "center" : "start"} fontSize={sm ? "large" : "x-large"} lineHeight={1.25}>
                                    {i.description}
                                </Text>
                            </VStack>
                        ))}
                    </VStack>
                </VStack>
            </Center>
        </main>
    );
};

export default TermsPage;
