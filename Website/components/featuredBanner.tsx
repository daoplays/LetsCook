import { VStack, Text, Box, HStack, Flex, Show } from "@chakra-ui/react";
import Link from "next/link";
import useResponsive from "../hooks/useResponsive";
import Image from "next/image";
import WoodenButton from "../components/Buttons/woodenButton";
import twitter from "../public/socialIcons/twitter.svg";
import telegram from "../public/socialIcons/telegram.svg";
import discord from "../public/socialIcons/discord.svg";
import website from "../public/socialIcons/website.svg";
import "react-datepicker/dist/react-datepicker.css";
import useAppRoot from "../context/useAppRoot";
import { useEffect, useState } from "react";
import { LaunchData } from "./Solana/state";

const FeaturedBanner = () => {
    const { sm, md } = useResponsive();
    const { launchList } = useAppRoot();

    const [featureLaunch, setFeaturedLaunch] = useState<LaunchData | null>(null);

    useEffect(() => setFeaturedLaunch(launchList[0]), launchList);

    if (!featureLaunch) return;

    const Links = () => (
        <HStack gap={3}>
            <Link href={featureLaunch !== null ? "https://twitter.com/" + featureLaunch.twitter : "#"} target="_blank">
                <Image src={twitter.src} alt="Twitter Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
            </Link>
            <Link href={featureLaunch !== null ? "https://twitter.com/" + featureLaunch.telegram : "#"} target="_blank">
                <Image src={telegram.src} alt="Telegram Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
            </Link>
            <Link href={featureLaunch !== null ? "https://twitter.com/" + featureLaunch.twitter : "#"} target="_blank">
                <Image src={discord.src} alt="Discord Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
            </Link>
            <Link href={featureLaunch !== null ? featureLaunch.website : "#"} target="_blank">
                <Image src={website.src} alt="Website Icon" width={md ? 30 : 40} height={md ? 30 : 40} />
            </Link>
        </HStack>
    );

    return (
        <Box h={md ? 300 : 320} bg="url(/images/Banner.png)" bgSize="cover" boxShadow="0px 8px 12px 5px rgba(0, 0, 0, 0.30)inset ">
            <Box bg="linear-gradient(180deg, rgba(255,255,255,0) -40%, rgba(0,0,0,1) 110%)" w="100%" h="100%">
                <Flex
                    flexDirection={md ? "column" : "row"}
                    align="center"
                    justify={md ? "center" : "space-between"}
                    px={sm ? 3 : 12}
                    pb={5}
                    h="100%"
                >
                    <HStack w="fit-content" gap={md ? 5 : 8}>
                        {featureLaunch !== null && (
                            <Image
                                src={featureLaunch.icon}
                                width={md ? 130 : 200}
                                height={md ? 130 : 200}
                                alt="$LOGO"
                                hidden={md}
                                style={{ borderRadius: sm ? "12px" : "8px" }}
                            />
                        )}
                        <VStack gap={md ? 1 : 3} alignItems={md ? "center" : "left"}>
                            <Flex gap={md ? 2 : 6}>
                                <Text
                                    m={0}
                                    fontSize={md ? 30 : 60}
                                    color="white"
                                    className="font-face-kg"
                                    style={{ wordBreak: "break-all" }}
                                    align={"center"}
                                >
                                    {featureLaunch !== null ? "$" + featureLaunch.name : ""}
                                </Text>
                                {!md && featureLaunch !== null && <Links />}
                            </Flex>
                            <Text
                                fontFamily="ReemKufiRegular"
                                fontSize={md ? "large" : "x-large"}
                                color="white"
                                maxW={sm ? "100%" : md ? "600px" : "850px"}
                                mr={md ? 0 : 25}
                                lineHeight={1.15}
                                align={md ? "center" : "start"}
                            >
                                {featureLaunch !== null ? featureLaunch.description : ""}
                            </Text>
                        </VStack>
                    </HStack>

                    <Show breakpoint="(max-width: 1024px)">{featureLaunch !== null && <Links />}</Show>

                    <Link href={`/launch/${featureLaunch?.page_name}`} style={{ marginTop: sm ? 12 : 0 }}>
                        {featureLaunch !== null && new Date().getTime() >= featureLaunch.launch_date && (
                            <WoodenButton label="Mint Live" size={35} />
                        )}
                        {featureLaunch !== null && new Date().getTime() < featureLaunch.launch_date && (
                            <WoodenButton label="Mint Pending" size={35} />
                        )}
                        {featureLaunch !== null && new Date().getTime() >= featureLaunch.end_date && (
                            <WoodenButton label="Mint Closed" size={35} />
                        )}
                    </Link>
                </Flex>
            </Box>
        </Box>
    );
};

export default FeaturedBanner;
