import { Text, Box, HStack, Flex } from "@chakra-ui/react";
import { useState } from "react";
import useResponsive from "../../hooks/useResponsive";
import Head from "next/head";
import MarketMakingTable from "../../components/tables/marketMakingTable";
import OrdersTable from "../../components/tables/ordersTable";
import useAppRoot from "../../context/useAppRoot";
import MyRewardsTable from "../../components/tables/myRewards";
import { useWallet } from "@solana/wallet-adapter-react";

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
            <main>
                <Flex
                    px={4}
                    py={18}
                    gap={5}
                    alignItems="center"
                    justifyContent={"start"}
                    style={{ position: "relative", flexDirection: sm ? "column-reverse" : "row" }}
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
                        fontSize={sm ? 25 : 35}
                        color="white"
                        className="font-face-kg"
                        style={{ position: sm ? "static" : "absolute", left: 0, right: 0, margin: "auto" }}
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

                {selected === "Markets" && <MarketMakingTable launchList={launchList} />}

                {selected === "Orders" && <OrdersTable state={selectedSubTab} launch_data={null} />}

                {!wallet.connected && selected === "Orders" && (
                    <HStack w="100%" align="center" justify="center" mt={25}>
                        <Text fontSize={lg ? "large" : "x-large"} m={0} color={"white"} style={{ cursor: "pointer" }}>
                            Connect your wallet to see your orders
                        </Text>
                    </HStack>
                )}

                {selected === "Rewards" && <MyRewardsTable amm={null} amm_provider={0} />}

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
