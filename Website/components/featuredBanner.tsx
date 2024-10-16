import { VStack, Text, Box, HStack, Flex, Show, Tooltip, Badge, Progress } from "@chakra-ui/react";
import { MdOutlineContentCopy } from "react-icons/md";
import { LaunchData, ListingData } from "./Solana/state";
import Link from "next/link";
import useResponsive from "../hooks/useResponsive";
import Image from "next/image";
import WoodenButton from "../components/Buttons/woodenButton";
import "react-datepicker/dist/react-datepicker.css";
import trimAddress from "../utils/trimAddress";
import Links from "./Buttons/links";
import { useEffect } from "react";
import { Config, LaunchFlags, LaunchKeys } from "./Solana/constants";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useRouter } from "next/router";
import { getSolscanLink } from "../utils/getSolscanLink";
import ShowExtensions from "./Solana/extensions";
import { HypeVote } from "./hypeVote";

interface FeaturedBannerProps {
    featuredLaunch: LaunchData;
    featuredListing: ListingData;
    isHomePage?: boolean;
}

const FeaturedBanner = ({ featuredLaunch, featuredListing, isHomePage }: FeaturedBannerProps) => {
    const { sm, lg } = useResponsive();
    const router = useRouter();

    if (!featuredLaunch || !featuredListing) return;

    return (
        <Box
            h={lg ? 300 : 320}
            bg={"url(" + featuredListing.banner + ")"}
            bgSize="cover"
            boxShadow="0px 8px 12px 5px rgba(0, 0, 0, 0.30)inset"
            style={{ borderBottom: "1px solid #868E96", borderTop: "1px solid #868E96", position: "relative" }}
        >
            <HStack position="absolute" top={5} right={5} style={{ cursor: "pointer" }} hidden={isHomePage}>
                <HypeVote
                    launch_type={0}
                    launch_id={featuredListing.id}
                    page_name={""}
                    positive_votes={featuredListing.positive_votes}
                    negative_votes={featuredListing.negative_votes}
                    isTradePage={false}
                    listing={featuredListing}
                />
            </HStack>

            <Box
                bg="linear-gradient(180deg, rgba(255,255,255,0) -40%, rgba(0,0,0,1) 110%)"
                w="100%"
                h="100%"
                onClick={() => isHomePage && router.push(`/launch/${featuredLaunch?.page_name}`)}
                style={{ cursor: isHomePage ? "pointer" : "default" }}
            >
                <Flex
                    gap={lg ? 2 : 8}
                    flexDirection={lg || isHomePage ? "column" : "row"}
                    align={lg || !isHomePage ? "center" : "start"}
                    justify={!lg && !isHomePage ? "space-between" : "center"}
                    px={sm ? 3 : 12}
                    py={5}
                    h="100%"
                >
                    {isHomePage && lg && (
                        <Badge colorScheme="whatsapp" h="fit-content" borderRadius={3}>
                            Hyped Today
                        </Badge>
                    )}

                    <HStack spacing={lg ? 0 : 8} w="fit-content" mt={!isHomePage ? 0 : -2}>
                        {featuredLaunch !== null && (
                            <VStack justifyContent="center" align="center" mt={3}>
                                <Image
                                    src={featuredListing.icon}
                                    width={lg ? 130 : 200}
                                    height={lg ? 130 : 200}
                                    alt="$LOGO"
                                    hidden={lg}
                                    style={{ borderRadius: sm ? "12px" : "8px", backgroundSize: "cover" }}
                                />
                                <HStack
                                    hidden={lg}
                                    // border="1px solid rgba(255,255,255,0.15)"
                                    p={2}
                                    w="100%"
                                    // borderRadius={8}
                                    justify="center"
                                >
                                    <ShowExtensions extension_flag={featuredLaunch.flags[LaunchFlags.Extensions]} />
                                </HStack>
                            </VStack>
                        )}
                        <VStack gap={lg ? 2 : 3} alignItems={lg ? "center" : "left"}>
                            <Flex gap={lg ? 2 : 5} alignItems="center">
                                <Text
                                    m={0}
                                    fontSize={lg ? 30 : 60}
                                    color="white"
                                    className="font-face-kg"
                                    style={{ wordBreak: "break-all" }}
                                    align={"center"}
                                >
                                    {featuredLaunch !== null ? featuredListing.symbol : ""}
                                </Text>

                                {!lg && featuredLaunch !== null && <Links socials={featuredListing.socials} />}

                                {isHomePage && !lg && (
                                    <Badge colorScheme="whatsapp" h="fit-content" borderRadius={3}>
                                        Hyped Today
                                    </Badge>
                                )}
                            </Flex>

                            {!isHomePage && (
                                <HStack spacing={3} align="start" justify="start">
                                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={sm ? "large" : "x-large"}>
                                        CA:{" "}
                                        {featuredLaunch && featuredLaunch.keys && featuredListing.mint
                                            ? trimAddress(featuredListing.mint.toString())
                                            : ""}
                                    </Text>

                                    <Tooltip label="Copy Contract Address" hasArrow fontSize="large" offset={[0, 10]}>
                                        <div
                                            style={{ cursor: "pointer" }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navigator.clipboard.writeText(
                                                    featuredLaunch && featuredLaunch.keys && featuredListing.mint
                                                        ? featuredListing.mint.toString()
                                                        : "",
                                                );
                                            }}
                                        >
                                            <MdOutlineContentCopy color="white" size={lg ? 25 : 35} />
                                        </div>
                                    </Tooltip>

                                    <Tooltip label="View in explorer" hasArrow fontSize="large" offset={[0, 10]}>
                                        <Link
                                            href={getSolscanLink(featuredListing.mint, "Token")}
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

                                    {Config.NETWORK !== "eclipse" && (
                                        <Tooltip label="Rug Check" hasArrow fontSize="large" offset={[0, 10]}>
                                            <Link
                                                href={`https://rugcheck.xyz/tokens/${
                                                    featuredLaunch && featuredLaunch.keys && featuredListing.mint
                                                        ? featuredListing.mint.toString()
                                                        : ""
                                                }`}
                                                target="_blank"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Image
                                                    src="/images/rugcheck.jpeg"
                                                    width={lg ? 25 : 35}
                                                    height={lg ? 25 : 35}
                                                    alt="Rugcheck icon"
                                                    style={{ borderRadius: "100%" }}
                                                />
                                            </Link>
                                        </Tooltip>
                                    )}
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
                                {featuredLaunch !== null ? featuredListing.description.substring(0, 200) : ""}
                            </Text>
                            <HStack hidden={!lg}>
                                <ShowExtensions extension_flag={featuredLaunch.flags[LaunchFlags.Extensions]} />
                            </HStack>
                        </VStack>
                    </HStack>

                    {lg && featuredLaunch !== null && <Links socials={featuredListing.socials} />}

                    {!isHomePage && (
                        // <Link href={`/launch/${featuredLaunch?.page_name}`} >
                        <>
                            {featuredLaunch !== null &&
                                new Date().getTime() > featuredLaunch.launch_date &&
                                new Date().getTime() < featuredLaunch.end_date && <WoodenButton label="Mint Live" size={35} />}

                            {featuredLaunch !== null && new Date().getTime() < featuredLaunch.launch_date && (
                                <WoodenButton label="Mint Pending" size={35} width={340} />
                            )}

                            {featuredLaunch !== null && new Date().getTime() > featuredLaunch.end_date && (
                                <WoodenButton label="Mint Closed" size={35} />
                            )}
                        </>
                        // </Link>
                    )}

                    {isHomePage && (
                        <HStack w="100%" style={{ position: "relative", alignItems: "center", justifyContent: "center" }}>
                            <Progress
                                w="100%"
                                h={29}
                                borderRadius={20}
                                sx={{
                                    "& > div": {
                                        background: "linear-gradient(180deg, #8DFE7A 0%, #3E9714 100%)",
                                    },
                                }}
                                size="sm"
                                max={(featuredLaunch.num_mints * featuredLaunch.ticket_price) / LAMPORTS_PER_SOL}
                                min={0}
                                value={
                                    (Math.min(featuredLaunch.num_mints, featuredLaunch.tickets_sold) * featuredLaunch.ticket_price) /
                                    LAMPORTS_PER_SOL
                                }
                                boxShadow="0px 5px 15px 0px rgba(0,0,0,0.6) inset"
                            />
                            <HStack style={{ position: "absolute", zIndex: 1 }}>
                                <Text m="0" color="black" fontSize={sm ? "medium" : "large"} fontFamily="ReemKufiRegular">
                                    Guaranteed Liquidity:
                                </Text>
                                <HStack justify="center">
                                    <Text m="0" color="black" fontSize={sm ? "medium" : "large"} fontFamily="ReemKufiRegular">
                                        {(Math.min(featuredLaunch.num_mints, featuredLaunch.tickets_sold) * featuredLaunch.ticket_price) /
                                            LAMPORTS_PER_SOL}{" "}
                                        of {(featuredLaunch.num_mints * featuredLaunch.ticket_price) / LAMPORTS_PER_SOL}
                                    </Text>
                                    <Image
                                        src={Config.token_image}
                                        width={20}
                                        height={20}
                                        alt="SOL Icon"
                                        style={{ marginLeft: sm ? 0 : -3 }}
                                    />
                                </HStack>
                            </HStack>
                        </HStack>
                    )}
                </Flex>
            </Box>
        </Box>
    );
};

export default FeaturedBanner;
