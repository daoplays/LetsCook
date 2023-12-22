import { Center, VStack, Text, Box, HStack } from "@chakra-ui/react";

import { FaTwitter, FaTwitch } from "react-icons/fa";

import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE } from "./Solana/constants";
import { LaunchData } from "./Solana/state";

import logo from "../public/images/sauce.png";
import tickets from "../public/images/Mint.png";
import tickets2 from "../public/images/Mint2.png";
import bar from "../public/images/bar.png";

export function TokenScreen({ launch_data }: { launch_data: LaunchData }) {
    let name = launch_data.name;

    return (
        <Center mt="20px" width="90%">
            <VStack>
                <HStack>
                    <img src={logo.src} width="auto" alt={""} style={{ maxHeight: "200px", maxWidth: "200px" }} />
                    <VStack>
                        <Text color="white" className="font-face-kg" textAlign={"center"} fontSize={DEFAULT_FONT_SIZE}>
                            {name}
                        </Text>
                        <Text color="white" className="font-face-rk" textAlign={"center"} fontSize={10}>
                            solscan link
                        </Text>
                        <Text color="white" className="font-face-rk" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sit amet semper purus. Proin lorem sapien, placerat
                            vel urna quis, blandit pulvinar purus. Vestibulum lobortis risus ut egestas placerat. Donec lorem quam,
                            tristique at nibh quis, facilisis rhoncus magna. Nam fermentum sodales lectus sit amet vehicula.
                        </Text>
                        <HStack>
                            <FaTwitter color="white" />
                            <FaTwitch color="white" />
                            <Text m="0" color="white" className="font-face-rk" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                                24 Jan 2024
                            </Text>
                        </HStack>
                    </VStack>
                </HStack>

                <HStack mt="50px" spacing={"200px"}>
                    <VStack>
                        <Text color="white" className="font-face-kg" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                            2000 MINTS = 20% OF TOTAL SUPPLY
                        </Text>
                        <HStack>
                            <Text m="0" color="white" className="font-face-kg" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                                1 MINT = 2000000
                            </Text>
                            <img src={logo.src} width="auto" alt={""} style={{ maxHeight: "50px", maxWidth: "50px" }} />
                        </HStack>
                        <Text m="0" color="white" className="font-face-kg" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                            0.5 SOL PER TICKET
                        </Text>
                    </VStack>
                    <VStack>
                        <HStack>
                            <img src={tickets2.src} width="auto" alt={""} style={{ maxHeight: "160px", maxWidth: "160px" }} />
                            <img src={tickets.src} width="auto" alt={""} style={{ maxHeight: "200px", maxWidth: "200px" }} />
                        </HStack>
                        <Text m="0" color="white" className="font-face-kg" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                            Platform Fee: 0.02 SOL per ticket
                            <br />
                            (50% goes to token LP)
                        </Text>
                    </VStack>
                </HStack>

                <VStack mt="50px">
                    <Text m="0" color="white" className="font-face-kg" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                        Tickets Sold: 1400
                        <br />
                        Guaranteed Liquidity (SOL): 714/1000
                    </Text>
                    <img src={bar.src} width="auto" alt={""} style={{ maxHeight: "160px", maxWidth: "700px" }} />
                    <Text m="0" color="white" className="font-face-kg" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                        REFUND FOR ALL IF LIQUIDITY THRESHOLD NOT REACHED
                        <br />
                        REFUND FOR LOSING TICKETS
                    </Text>
                </VStack>

                <VStack mt="50px">
                    <Text m="0" color="white" className="font-face-kg" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                        DISTRIBUTION
                    </Text>
                    <Text m="0" color="white" className="font-face-rt" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                        Total Supply: 4.20B
                    </Text>
                </VStack>
            </VStack>
        </Center>
    );
}
