import { Text, Box, HStack, Flex } from "@chakra-ui/react";
import { useState } from "react";
import useResponsive from "../../hooks/useResponsive";
import Head from "next/head";
import MarketMakingTable from "../../components/tables/marketMakingTable";
import OrdersTable from "../../components/tables/ordersTable";

const MarketMaker = () => {
    const { xs, sm } = useResponsive();
    const [selected, setSelected] = useState("Markets");

    const handleClick = (tab: string) => {
        setSelected(tab);
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
                    gap={2}
                    alignItems="center"
                    justifyContent={"start"}
                    style={{ position: "relative", flexDirection: sm ? "column-reverse" : "row" }}
                >
                    <HStack align="center" spacing={0} zIndex={99} w="100%" mt={xs ? 1 : 0}>
                        {["Markets", "Orders"].map((name, i) => {
                            const isActive = selected === name;

                            const baseStyle = {
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer",
                            };

                            const activeStyle = {
                                background: isActive ? "#edf2f7" : "transparent",
                                color: isActive ? "black" : "white",
                                borderRadius: isActive ? "6px" : "",
                                border: isActive ? "none" : "",
                            };

                            return (
                                <Box
                                    key={i}
                                    style={{
                                        ...baseStyle,
                                        ...activeStyle,
                                    }}
                                    onClick={() => {
                                        handleClick(name);
                                    }}
                                    px={4}
                                    py={2}
                                    w={xs ? "50%" : "fit-content"}
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
                        {selected === "Markets" ? "Market Making" : "My Orders"}
                    </Text>
                </Flex>

                {selected === "Markets" && <MarketMakingTable />}

                {selected === "Orders" && <OrdersTable />}
            </main>
        </>
    );
};

export default MarketMaker;
