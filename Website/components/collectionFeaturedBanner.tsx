import { VStack, Text, Box, HStack, Flex, Show, Tooltip, Badge, Progress } from "@chakra-ui/react";
import { MdOutlineContentCopy } from "react-icons/md";
import { LaunchData } from "./Solana/state";
import Link from "next/link";
import useResponsive from "../hooks/useResponsive";
import Image from "next/image";
import WoodenButton from "./Buttons/woodenButton";
import "react-datepicker/dist/react-datepicker.css";
import trimAddress from "../utils/trimAddress";
import Links from "./Buttons/links";
import { useEffect } from "react";
import { CollectionKeys, LaunchKeys } from "./Solana/constants";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useRouter } from "next/router";
import { CollectionData } from "./collection/collectionState";
import { getSolscanLink } from "../utils/getSolscanLink";

interface CollectionFeaturedBannerProps {
    featuredLaunch: CollectionData;
    isHomePage?: boolean;
}

const CollectionFeaturedBanner = ({ featuredLaunch, isHomePage }: CollectionFeaturedBannerProps) => {
    const { sm, lg } = useResponsive();
    const router = useRouter();

    if (!featuredLaunch) return;

    return (
        <Box
            h={lg ? 300 : 320}
            bg={"url(" + featuredLaunch.banner + ")"}
            bgSize="cover"
            boxShadow="0px 8px 12px 5px rgba(0, 0, 0, 0.30)inset"
        >
            <Box
                bg="linear-gradient(180deg, rgba(255,255,255,0) -40%, rgba(0,0,0,1) 110%)"
                w="100%"
                h="100%"
                onClick={() => isHomePage && router.push(`/launch/${featuredLaunch?.page_name}`)}
                style={{ cursor: isHomePage ? "pointer" : "default" }}
            >
                <Flex
                    gap={lg ? 5 : 8}
                    flexDirection={lg || isHomePage ? "column" : "row"}
                    align={lg || !isHomePage ? "center" : "start"}
                    justify={!lg && !isHomePage ? "space-between" : "center"}
                    px={sm ? 3 : 12}
                    py={5}
                    h="100%"
                >
                    <HStack spacing={lg ? 0 : 8} w="fit-content" mt={!isHomePage ? 0 : -2}>
                        {featuredLaunch !== null && (
                            <Image
                                src={featuredLaunch.collection_icon_url}
                                width={lg ? 130 : 200}
                                height={lg ? 130 : 200}
                                alt="$LOGO"
                                hidden={lg}
                                style={{ borderRadius: sm ? "12px" : "8px", backgroundSize: "cover" }}
                            />
                        )}
                        <VStack gap={lg ? 2 : 3} alignItems={lg ? "center" : "left"}>
                            <Flex gap={lg ? 2 : 5} alignItems="center">
                                <Text
                                    m={0}
                                    fontSize={lg ? 30 : 60}
                                    color="white"
                                    className="font-face-kg"
                                    style={{ wordBreak: "break-word" }}
                                    align={"center"}
                                >
                                    {featuredLaunch !== null ? featuredLaunch.collection_name : ""}
                                </Text>

                                {!lg && featuredLaunch !== null && <Links socials={featuredLaunch.socials} />}
                            </Flex>

                            {!isHomePage && (
                                <HStack spacing={3} align="start" justify="start">
                                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={sm ? "large" : "x-large"}>
                                        CA:{" "}
                                        {featuredLaunch && featuredLaunch.keys && featuredLaunch.keys[CollectionKeys.CollectionMint]
                                            ? trimAddress(featuredLaunch.keys[CollectionKeys.CollectionMint].toString())
                                            : ""}
                                    </Text>

                                    <Tooltip label="Copy Contract Address" hasArrow fontSize="large" offset={[0, 10]}>
                                        <div
                                            style={{ cursor: "pointer" }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navigator.clipboard.writeText(
                                                    featuredLaunch &&
                                                        featuredLaunch.keys &&
                                                        featuredLaunch.keys[CollectionKeys.CollectionMint]
                                                        ? featuredLaunch.keys[CollectionKeys.CollectionMint].toString()
                                                        : "",
                                                );
                                            }}
                                        >
                                            <MdOutlineContentCopy color="white" size={lg ? 25 : 35} />
                                        </div>
                                    </Tooltip>

                                    <Tooltip label="View in explorer" hasArrow fontSize="large" offset={[0, 10]}>
                                        <Link
                                            href={getSolscanLink(featuredLaunch.keys[CollectionKeys.CollectionMint], "Collection")}
                                            target="_blank"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Image
                                                src="/images/solscan.png"
                                                width={lg ? 25 : 35}
                                                height={lg ? 25 : 35}
                                                alt="Solscan icon"
                                            />
                                        </Link>
                                    </Tooltip>
                                </HStack>
                            )}

                            <Text
                                fontFamily="ReemKufiRegular"
                                fontSize={lg ? "large" : "x-large"}
                                color="white"
                                maxW={sm ? "100%" : lg ? "600px" : "1024px"}
                                mr={lg ? 0 : 25}
                                mt={lg ? 0 : 2}
                                mb={0}
                                lineHeight={1.15}
                                align={lg ? "center" : "start"}
                            >
                                {featuredLaunch !== null ? featuredLaunch.description.substring(0, 200) : ""}
                            </Text>
                        </VStack>
                    </HStack>

                    {lg && featuredLaunch !== null && <Links socials={featuredLaunch.socials} />}
                </Flex>
            </Box>
        </Box>
    );
};

export default CollectionFeaturedBanner;
