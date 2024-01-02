import { Box, Center, HStack, Text } from "@chakra-ui/react";

import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE } from "./Solana/constants";

import salad2 from "../public/images/salad2.png";
import hotdog from "../public/images/hotdog.png";
import pizza from "../public/images/pizza.png";
import pasta from "../public/images/Pasta.png";
import Image from "next/image";

export function FAQScreen() {
    return (
        <>
            <Center mb="5rem">
                <Box width="80%">
                    <div className="font-face-rk" style={{ color: "white", fontSize: DUNGEON_FONT_SIZE }}>
                        <h2 className="mt-5 font-face-kg" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            <Center>FREQUENTLY ASKED QUESTIONS</Center>
                        </h2>
                        <br />

                        <h2 className="mt-5  font-face-kg" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            1. WTF IS LET&apos;'S COOK?
                        </h2>
                        <br />
                        <HStack>
                            <Text>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sit amet semper purus. Proin lorem sapien,
                                placerat vel urna quis, blandit pulvinar purus. Vestibulum lobortis risus ut egestas placerat. Donec lorem
                                quam, tristique at nibh quis, facilisis rhoncus magna. Nam fermentum sodales lectus sit amet vehicula.
                            </Text>

                            <Image src={hotdog.src} width={150} height={150} alt={"Hotdog"} />
                        </HStack>

                        <h2 className="mt-5  font-face-kg" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            2. WHAT ARE SAUCE POINTS?
                        </h2>
                        <br />

                        <HStack>
                            <Image src={pizza.src} width={150} height={150} alt={"Pizza"} />

                            <Text>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sit amet semper purus. Proin lorem sapien,
                                placerat vel urna quis, blandit pulvinar purus. Vestibulum lobortis risus ut egestas placerat. Donec lorem
                                quam, tristique at nibh quis, facilisis rhoncus magna. Nam fermentum sodales lectus sit amet vehicula.
                            </Text>
                        </HStack>

                        <h2 className="mt-5  font-face-kg" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            3. HOW DO I EARN SAUCE POINTS?
                        </h2>
                        <br />

                        <HStack>
                            <Text>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sit amet semper purus. Proin lorem sapien,
                                placerat vel urna quis, blandit pulvinar purus. Vestibulum lobortis risus ut egestas placerat. Donec lorem
                                quam, tristique at nibh quis, facilisis rhoncus magna. Nam fermentum sodales lectus sit amet vehicula.
                            </Text>

                            <Image src={pasta.src} width={150} height={150} alt={"Hotdog"} />
                        </HStack>

                        <h2 className="mt-5  font-face-kg" style={{ fontSize: DEFAULT_FONT_SIZE }}>
                            4. WHY SOLANA?
                        </h2>
                        <br />

                        <HStack>
                            <Image src={salad2.src} width={150} height={150} alt={"Salad"} />
                            <Text>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sit amet semper purus. Proin lorem sapien,
                                placerat vel urna quis, blandit pulvinar purus. Vestibulum lobortis risus ut egestas placerat. Donec lorem
                                quam, tristique at nibh quis, facilisis rhoncus magna. Nam fermentum sodales lectus sit amet vehicula.
                            </Text>
                        </HStack>
                    </div>
                </Box>
            </Center>
        </>
    );
}
