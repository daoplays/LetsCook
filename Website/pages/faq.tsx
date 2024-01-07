import { Box, Center, HStack, Text } from "@chakra-ui/react";
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

import Image from "next/image";

const FAQ = () => {
    return (
        <main style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)", padding: "50px 0" }}>
            <Center>
                <Box width="80%">
                    <div className="font-face-rk" style={{ color: "white", fontSize: DUNGEON_FONT_SIZE }}>
                        <h2 className="font-face-kg" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            <Center>FREQUENTLY ASKED QUESTIONS</Center>
                        </h2>
                        <br />

                        <h2 className="mt-5  font-face-kg" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            1. WHAT IS LET&apos;S COOK?
                        </h2>
                        <br />
                        <HStack>
                            <Text>
                            LET'S COOK is the best place to launch Solana memecoins. Our fully-automated and permissionless platform provides the lowest cost and best user experience for both degens and meme creators.
                            </Text>

                            <Image src={hotdog.src} width={150} height={150} alt={"Hotdog"} />
                        </HStack>

                        <h2 className="mt-5  font-face-kg" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            2. WHY SOLANA?
                        </h2>
                        <br />

                        <HStack>
                            <Image src={pizza.src} width={150} height={150} alt={"Pizza"} />

                            <Text>
                            The Solana network is the next-gen L1 blockchain with the highest marketcap, lowest transaction fees, fastest settlement, and best capital efficiency in the market. It also has a fanatical user base and strong developer ecosystem.
                            </Text>
                        </HStack>

                        <h2 className="mt-5  font-face-kg" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            3. How do LET'S COOK fair-launches work?
                        </h2>
                        <br />

                        <HStack>
                            <Text>
                            Each launch, or "Cook", bootstraps memecoin liquidity fairly by raffling a portion of the total token supply. Users may buy Tickets to a Cook while it is open and claim their winning Tickets once it closes. Non-winning Tickets are refunded their Ticket Price.
                            </Text>

                            <Image src={pasta.src} width={150} height={150} alt={"Hotdog"} />
                        </HStack>

                        <h2 className="mt-5  font-face-kg" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            4. What is 'Guaranteed Liquidity,' and why is it important for a Cook?
                        </h2>
                        <br />

                        <HStack>
                            <Image src={salad2.src} width={150} height={150} alt={"Salad"} />
                            <Text>
                            'Guaranteed Liquidity' is the minimum amount of SOL that must to be raised for the launch to proceed. If this threshold isn't met, all tickets are refunded. This mechanism has three positive outcomes:
                            <ul>
                                <li>    
                                Minimizes the risk from failed launches for users.
                                </li>
                                <li>
                                Reduces the cost of failed launches for creators.
                                </li>
                                <li>
                                Concentrates liquidity into fewer, higher-quality memes.
                                </li>
                            </ul>
                            </Text>
                        </HStack>


                        <h2 className="mt-5  font-face-kg" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            5. How is the liquidity pool created, and what measures are in place to prevent rug-pulls?
                        </h2>
                        <br />

                        <HStack>
                            <Text>
                            Our on-chain program creates Liquidity Pools on Raydium, pairing a portion of the memecoin supply with the SOL raised during the Cook. The program then burns the Liquidity Provider tokens, permanently locking the liquidity in the pool. It also revokes all update authorities automatically.
                            </Text>

                            <Image src={sauce.src} width={150} height={150} alt={"Hotdog"} />
                        </HStack>

                        <h2 className="mt-5  font-face-kg" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            6. What do the 'hype' percentages represent, and how is this rating calculated?
                        </h2>
                        <br />

                        <HStack>
                            <Image src={tomato.src} width={150} height={150} alt={"Salad"} />
                            <Text>
                            Users can vote up or down on an upcoming token launch to express their sentiment on it. The Hype rating is calculated based on the total number of votes and their Like:Dislike ratio.
                            </Text>
                        </HStack>

                        <h2 className="mt-5  font-face-kg" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            7. How are features memecoins selected?
                        </h2>
                        <br />

                        <HStack>
                            <Text>
                            The Home page banner showcases the Cook with the highest Hype rating for that day. The Upcoming list displays the top-hyped tokens for future dates, ensuring visibility for the most promising launches.
                            </Text>

                            <Image src={veggies.src} width={150} height={150} alt={"Hotdog"} />
                        </HStack>

                        <h2 className="mt-5  font-face-kg" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            8. How can users check the full schedule of upcoming Cooks and their details?
                        </h2>
                        <br />

                        <HStack>
                            <Image src={salad1.src} width={150} height={150} alt={"Salad"} />
                            <Text>
                            Users can view the full schedule of Cooks through the Calendar page. This page displays all scheduled launches, complete with their hype ratings, minimum liquidity requirements, and launch times, allowing users to plan their participation.
                            </Text>
                        </HStack>

                        <h2 className="mt-5  font-face-kg" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            9. How much does LET'S COOK charge for launches?
                        </h2>
                        <br />

                        <HStack>
                            <Text>
                            LET'S COOK charges a non-refundable platform fee of 0.01 SOL per ticket purchased. There are no fees to set up a Cook. This fee supports additional feature development and marketing.
                            </Text>

                            <Image src={fries.src} width={150} height={150} alt={"Hotdog"} />
                        </HStack>
                    </div>
                </Box>
            </Center>
        </main>
    );
};

export default FAQ;
