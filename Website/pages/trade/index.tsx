import { Text, Box, HStack, Flex, AbsoluteCenter } from "@chakra-ui/react";
import { useState } from "react";
import useResponsive from "../../hooks/useResponsive";
import Head from "next/head";
import MarketMakingTable from "../../components/tables/marketMakingTable";
import useAppRoot from "../../context/useAppRoot";
import MyRewardsTable from "../../components/tables/myRewards";
import { useWallet } from "@solana/wallet-adapter-react";
import { absoluteAmount } from "@metaplex-foundation/umi";

const MarketMaker = () => {
    const { xs, sm, lg } = useResponsive();
    const wallet = useWallet();
    const [selected, setSelected] = useState("Markets");
    const [selectedSubTab, setSelectedSubTab] = useState("Open");
    const { launchList } = useAppRoot();

    const handleClick = (tab: string) => {
        setSelected(tab);
    };

    const handleSubTabClick = (tab: string) => {
        setSelectedSubTab(tab);
    };

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Trade</title>
            </Head>
            <main className="md:p-8">
                <Flex
                    py={18}
                    gap={5}
                    alignItems="center"
                    justifyContent={"start"}
                    style={{ position: "relative" }} className={"px-2 lg:absolute lg:top-[30px] flex-col-reverse lg:flex-row"}
                >
                    <HStack align="center" spacing={0} zIndex={99} w="100%" mt={xs ? 1 : -2}>
                        {/* add rewards  */}
                        {["Markets", "Rewards"].map((name, i) => {
                            const isActive = selected === name;

                            const baseStyle = {
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer",
                            };

                            const activeStyle = {
                                color: "white",
                                borderBottom: isActive ? "2px solid white" : "",
                                opacity: isActive ? 1 : 0.5,
                            };

                            const mobileBaseStyle = {
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer",
                            };

                            const mobileActiveStyle = {
                                background: isActive ? "#edf2f7" : "transparent",
                                color: isActive ? "black" : "white",
                                borderRadius: isActive ? "6px" : "",
                                border: isActive ? "none" : "",
                            };

                            const base = sm ? mobileBaseStyle : baseStyle;
                            const active = sm ? mobileActiveStyle : activeStyle;

                            return (
                                <Box
                                    key={i}
                                    style={{
                                        ...base,
                                        ...active,
                                    }}
                                    onClick={() => {
                                        handleClick(name);
                                    }}
                                    px={4}
                                    py={2}
                                    w={sm ? "50%" : "fit-content"}
                                >
                                    <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
                                        {name}
                                    </Text>
                                </Box>
                            );
                        })}
                    </HStack>
                    <Text
                        className="text-center text-3xl font-semibold text-white lg:text-4xl lg:pb-16 lg:!absolute lg:hidden"
                        style={{ position:"static", left: 0, right: 0, margin: "auto" }}
                        align={"center"}
                    >
                        {selected === "Markets" ? "Markets" : selected === "Rewards" ? "Rewards" : "My Orders"}
                    </Text>

                    {selected === "Orders" && (
                        <HStack spacing={3}>
                            {["Open", "Filled"].map((name, i) => {
                                const isActive = selectedSubTab === name;

                                const baseStyle = {
                                    display: "flex",
                                    alignItems: "center",
                                    cursor: "pointer",
                                };

                                const activeStyle = {
                                    color: "white",
                                    borderBottom: isActive ? "2px solid white" : "",
                                    opacity: isActive ? 1 : 0.5,
                                };

                                return (
                                    <HStack
                                        key={i}
                                        style={{
                                            ...baseStyle,
                                            ...activeStyle,
                                        }}
                                        onClick={() => {
                                            handleSubTabClick(name);
                                        }}
                                        px={4}
                                        py={2}
                                        mt={-2}
                                        w={"fit-content"}
                                        justify="center"
                                    >
                                        <Text m={"0 auto"} fontSize="medium" fontWeight="semibold">
                                            {name}
                                        </Text>
                                    </HStack>
                                );
                            })}
                        </HStack>
                    )}
                </Flex>

                {selected === "Markets" && <MarketMakingTable />}

                {!wallet.connected && selected === "Orders" && (
                    <HStack w="100%" align="center" justify="center" mt={25}>
                        <Text fontSize={lg ? "large" : "x-large"} m={0} color={"white"} style={{ cursor: "pointer" }}>
                            Connect your wallet to see your orders
                        </Text>
                    </HStack>
                )}

                {selected === "Rewards" && <MyRewardsTable amm={null} />}

                {!wallet.connected && selected === "Rewards" && (
                    <HStack w="100%" align="center" justify="center" mt={25}>
                        <Text fontSize={lg ? "large" : "x-large"} m={0} color={"white"} style={{ cursor: "pointer" }}>
                            Connect your wallet to see your rewards
                        </Text>
                    </HStack>
                )}
            </main>
        </>
    );
};

export default MarketMaker;
