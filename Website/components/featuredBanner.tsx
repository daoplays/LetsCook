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
import {Socials} from "./Solana/constants"
import { LaunchData } from "./Solana/state";
import Links from "./Buttons/links";


interface FeaturedBannerProps {
    featuredLaunch: LaunchData;
}

const FeaturedBanner = ({ featuredLaunch }: FeaturedBannerProps) => {
    const { sm, md } = useResponsive();

    if (!featuredLaunch) return;

    return (
        <Box h={md ? 300 : 320} bg={"url("+featuredLaunch.banner+")"} bgSize="cover" boxShadow="0px 8px 12px 5px rgba(0, 0, 0, 0.30)inset ">
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
                        {featuredLaunch !== null && (
                            <Image
                                src={featuredLaunch.icon}
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
                                    {featuredLaunch !== null ? "$" + featuredLaunch.name : ""}
                                </Text>
                                {!md && featuredLaunch !== null && <Links featuredLaunch={featuredLaunch}/>}
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
                                {featuredLaunch !== null ? featuredLaunch.description : ""}
                            </Text>
                        </VStack>
                    </HStack>

                    <Show breakpoint="(max-width: 1024px)">{featuredLaunch !== null && <Links featuredLaunch={featuredLaunch}/>}</Show>

                    <Link href={`/launch/${featuredLaunch?.page_name}`} style={{ marginTop: sm ? 12 : 0 }}>
                        {featuredLaunch !== null &&
                            new Date().getTime() > featuredLaunch.launch_date &&
                            new Date().getTime() < featuredLaunch.end_date && <WoodenButton label="Mint Live" size={35} />}

                        {featuredLaunch !== null && new Date().getTime() < featuredLaunch.launch_date && (
                            <WoodenButton label="Mint Pending" size={35} />
                        )}

                        {featuredLaunch !== null && new Date().getTime() > featuredLaunch.end_date && (
                            <WoodenButton label="Mint Closed" size={35} />
                        )}
                    </Link>
                </Flex>
            </Box>
        </Box>
    );
};

export default FeaturedBanner;
