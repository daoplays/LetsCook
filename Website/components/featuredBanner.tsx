import { VStack, Text, Box, HStack, Flex, Show, Tooltip } from "@chakra-ui/react";
import { MdOutlineContentCopy } from "react-icons/md";
import { LaunchData } from "./Solana/state";
import Link from "next/link";
import useResponsive from "../hooks/useResponsive";
import Image from "next/image";
import WoodenButton from "../components/Buttons/woodenButton";
import "react-datepicker/dist/react-datepicker.css";
import trimAddress from "../hooks/trimAddress";
import Links from "./Buttons/links";
import { useEffect } from "react";
import { LaunchKeys } from "./Solana/constants";

interface FeaturedBannerProps {
    featuredLaunch: LaunchData;
}

const FeaturedBanner = ({ featuredLaunch }: FeaturedBannerProps) => {
    const { sm, lg } = useResponsive();

    if (!featuredLaunch) return;

    return (
        <Box
            h={lg ? 300 : 320}
            bg={"url(" + featuredLaunch.banner + ")"}
            bgSize="cover"
            boxShadow="0px 8px 12px 5px rgba(0, 0, 0, 0.30)inset"
            style={{ borderBottom: "1px solid #868E96", borderTop: "1px solid #868E96" }}
        >
            <Box bg="linear-gradient(180deg, rgba(255,255,255,0) -40%, rgba(0,0,0,1) 110%)" w="100%" h="100%">
                <Flex
                    flexDirection={lg ? "column" : "row"}
                    align="center"
                    justify={lg ? "center" : "space-between"}
                    px={sm ? 3 : 12}
                    pb={5}
                    h="100%"
                >
                    <HStack w="fit-content" gap={lg ? 5 : 8}>
                        {featuredLaunch !== null && (
                            <Image
                                src={featuredLaunch.icon}
                                width={lg ? 130 : 200}
                                height={lg ? 130 : 200}
                                alt="$LOGO"
                                hidden={lg}
                                style={{ borderRadius: sm ? "12px" : "8px" }}
                            />
                        )}
                        <VStack gap={lg ? 2 : 3} alignItems={lg ? "center" : "left"}>
                            <Flex gap={lg ? 2 : 6}>
                                <Text
                                    m={0}
                                    fontSize={lg ? 30 : 60}
                                    color="white"
                                    className="font-face-kg"
                                    style={{ wordBreak: "break-all" }}
                                    align={"center"}
                                >
                                    {featuredLaunch !== null ? "$" + featuredLaunch.symbol : ""}
                                </Text>
                                {!lg && featuredLaunch !== null && <Links featuredLaunch={featuredLaunch} />}
                            </Flex>
                            <HStack spacing={3} align="start" justify="start">
                                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={sm ? "large" : "x-large"}>
                                    CA:{" "}
                                    {featuredLaunch && featuredLaunch.keys && featuredLaunch.keys[LaunchKeys.MintAddress]
                                        ? trimAddress(featuredLaunch.keys[LaunchKeys.MintAddress].toString())
                                        : ""}
                                </Text>

                                <Tooltip label="Copy Contract Address" hasArrow fontSize="large" offset={[0, 10]}>
                                    <div
                                        style={{ cursor: "pointer" }}
                                        onClick={() =>
                                            navigator.clipboard.writeText(
                                                featuredLaunch && featuredLaunch.keys && featuredLaunch.keys[LaunchKeys.MintAddress]
                                                    ? featuredLaunch.keys[LaunchKeys.MintAddress].toString()
                                                    : "",
                                            )
                                        }
                                    >
                                        <MdOutlineContentCopy color="white" size={lg ? 25 : 35} />
                                    </div>
                                </Tooltip>

                                <Tooltip label="View in explorer" hasArrow fontSize="large" offset={[0, 10]}>
                                    <Link
                                        href={`https://solscan.io/account/${
                                            featuredLaunch && featuredLaunch.keys && featuredLaunch.keys[LaunchKeys.MintAddress]
                                                ? featuredLaunch.keys[LaunchKeys.MintAddress].toString()
                                                : ""
                                        }?cluster=devnet`}
                                        target="_blank"
                                    >
                                        <Image src="/images/solscan.png" width={lg ? 25 : 35} height={lg ? 25 : 35} alt="Solscan icon" />
                                    </Link>
                                </Tooltip>
                            </HStack>
                            <Text
                                fontFamily="ReemKufiRegular"
                                fontSize={lg ? "large" : "x-large"}
                                color="white"
                                maxW={sm ? "100%" : lg ? "600px" : "1024px"}
                                mr={lg ? 0 : 25}
                                mt={lg ? 0 : 2}
                                lineHeight={1.15}
                                align={lg ? "center" : "start"}
                            >
                                {featuredLaunch !== null ? featuredLaunch.description.substring(0, 200) : ""}
                            </Text>
                        </VStack>
                    </HStack>

                    {lg && featuredLaunch !== null && <Links featuredLaunch={featuredLaunch} />}

                    <Link href={`/launch/${featuredLaunch?.page_name}`} style={{ marginTop: lg ? 16 : 0 }}>
                        {featuredLaunch !== null &&
                            new Date().getTime() > featuredLaunch.launch_date &&
                            new Date().getTime() < featuredLaunch.end_date && <WoodenButton label="Mint Live" size={35} />}

                        {featuredLaunch !== null && new Date().getTime() < featuredLaunch.launch_date && (
                            <WoodenButton label="Mint Pending" size={35} width={340} />
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
