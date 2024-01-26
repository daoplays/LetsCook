import { VStack, HStack, Flex, Box, Text } from "@chakra-ui/react";
import { PieChart } from "react-minimal-pie-chart";
import useResponsive from "../../hooks/useResponsive";
import { LaunchData, bignum_to_num } from "../Solana/state";
import styles from "../../styles/Launch.module.css";
interface TokenDistributionProps {
    launchData?: LaunchData;
}

const TokenDistribution = ({ launchData }: TokenDistributionProps) => {
    const { xs, sm, md } = useResponsive();

    const distribution = launchData.distribution
        ? launchData.distribution
              .map((value, index) => ({
                  title: ["Raffle (SOL)", "$TOKEN", "Liquidity Provider Rewards", "Team", "Airdrops / Marketing", "Others"][index],
                  value,
                  color: ["#FF6651", "#FF9548", "#C6FE7D", "#8CB3FF", "#988FFF", "#FD98FE"][index],
              }))
              .filter((item) => item.value > 0)
        : [];

    return (
        <VStack w="100%" my={10}>
            <Text m={0} fontSize={md ? "xl" : 30} color="white" className="font-face-kg">
                Distribution
            </Text>
            <HStack align="center" justify="center" style={{ cursor: "pointer" }}>
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={md ? "large" : "x-large"}>
                    Total Supply: {bignum_to_num(launchData.total_supply)}
                </Text>
            </HStack>

            <Flex align="center" justify="space-evenly" flexDirection={md ? "column" : "row"} w="100%" gap={8} mt={8}>
                <VStack gap={6} align="start" ml={12}>
                    {distribution.map((i, index) => {
                        if (i.value <= 0) return;

                        return (
                            <VStack gap={6} align="start" key={i.title}>
                                {i.title === "Raffle (SOL)" && (
                                    <HStack gap={4} ml={sm ? -12 : -14}>
                                        <Box bg="white" h={35} w={35} />{" "}
                                        <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={md ? "large" : "x-large"}>
                                            Liquidity Pool
                                        </Text>
                                    </HStack>
                                )}

                                {i.title === "Liquidity Provider Rewards" && (
                                    <HStack gap={4} ml={sm ? -12 : -14} mt={6}>
                                        <Box bg="#a3a3a3" h={35} w={35} />{" "}
                                        <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={md ? "large" : "x-large"}>
                                            Liquidity Rewards
                                        </Text>
                                    </HStack>
                                )}

                                {i.title === "Team" && (
                                    <HStack gap={4} ml={sm ? -12 : -14} mt={6}>
                                        <Box bg="#666666" h={35} w={35} />{" "}
                                        <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={md ? "large" : "x-large"}>
                                            Creator Control
                                        </Text>
                                    </HStack>
                                )}

                                <HStack gap={4}>
                                    <Box bg={i.color} h={35} w={35} />{" "}
                                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={md ? "large" : "x-large"}>
                                        {i.title} - {i.value}%
                                    </Text>
                                </HStack>
                            </VStack>
                        );
                    })}
                </VStack>
                <VStack spacing={6} justify="center" align="center" py={8} h="fit-content" style={{ position: "relative" }}>
                    <PieChart
                        animate={true}
                        totalValue={100}
                        data={distribution}
                        style={{ width: xs ? "90%" : "380px", position: "relative", zIndex: 2 }}
                    />

                    <PieChart
                        animate={true}
                        totalValue={100}
                        data={[
                            {
                                title: "Liquidity Pool",
                                value:
                                    (distribution[0]?.value ? distribution[0]?.value : 0) +
                                    (distribution[1]?.value ? distribution[1]?.value : 0),
                                color: "white",
                            },
                            {
                                title: "Liquidity Rewards",
                                value: distribution[2]?.value ? distribution[2]?.value : 0,
                                color: "#a3a3a3",
                            },
                            {
                                title: "Creator Control",
                                value:
                                    (distribution[3]?.value ? distribution[3]?.value : 0) +
                                    (distribution[4]?.value ? distribution[4]?.value : 0) +
                                    (distribution[5]?.value ? distribution[5]?.value : 0),
                                color: "#666666",
                            },
                        ]}
                        style={{ width: md ? "110%" : "440px", position: "absolute", zIndex: 1 }}
                    />
                </VStack>
            </Flex>
        </VStack>
    );
};

export default TokenDistribution;
