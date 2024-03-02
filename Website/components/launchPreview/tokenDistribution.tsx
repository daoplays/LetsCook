import { VStack, HStack, Flex, Box, Text } from "@chakra-ui/react";
import { PieChart } from "react-minimal-pie-chart";
import useResponsive from "../../hooks/useResponsive";
import { Distribution, LaunchData, bignum_to_num } from "../Solana/state";
import styles from "../../styles/Launch.module.css";
import { distributionLabels } from "../../constant/root";
interface TokenDistributionProps {
    launchData?: LaunchData;
}

const TokenDistribution = ({ launchData }: TokenDistributionProps) => {
    const { xs, sm, md } = useResponsive();

    const distribution = launchData.distribution
        ? launchData.distribution
              .map((value, index) => ({
                  title: distributionLabels.fields[index].title,
                  value,
                  color: distributionLabels.fields[index].color,
              }))
              .filter((item) => item.value > 0)
        : [];

    let first_creator_title = "";
    for (let i = 0; i < distribution.length; i++) {
        if (
            distribution[i].title === distributionLabels.fields[3].title ||
            distribution[i].title === distributionLabels.fields[4].title ||
            distribution[i].title === distributionLabels.fields[5].title ||
            distribution[i].title === distributionLabels.fields[6].title
        ) {
            first_creator_title = distribution[i].title;
            break;
        }
    }

    return (
        <VStack w="100%" my={10}>
            <Text m={0} fontSize={md ? "xl" : 30} color="white" className="font-face-kg">
                Distribution
            </Text>
            <HStack align="center" justify="center" style={{ cursor: "pointer" }}>
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={md ? "large" : "x-large"}>
                    Total Supply: {bignum_to_num(launchData.total_supply).toLocaleString()}
                </Text>
            </HStack>

            <Flex align="center" justify="space-evenly" flexDirection={md ? "column" : "row"} w="100%" gap={8} mt={8}>
                <VStack gap={6} align="start" ml={12}>
                    {distribution.map((i, index) => {
                        if (i.value <= 0) return;
                        //console.log(i.title, i.value);
                        return (
                            <VStack gap={6} align="start" key={i.title}>
                                {i.title === "Raffle (SOL)" && (
                                    <HStack gap={4} ml={sm ? -12 : -14}>
                                        <Box bg="white" h={35} w={35} />{" "}
                                        <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={md ? "large" : "x-large"}>
                                            {distributionLabels.headers[0].title}
                                        </Text>
                                    </HStack>
                                )}

                                {i.title === "Market Maker Rewards" && (
                                    <HStack gap={4} ml={sm ? -12 : -14} mt={6}>
                                        <Box bg="#a3a3a3" h={35} w={35} />{" "}
                                        <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={md ? "large" : "x-large"}>
                                            {distributionLabels.headers[1].title}
                                        </Text>
                                    </HStack>
                                )}
                                {i.title === first_creator_title && (
                                    <HStack gap={4} ml={sm ? -12 : -14} mt={6}>
                                        <Box bg="#666666" h={35} w={35} />{" "}
                                        <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={md ? "large" : "x-large"}>
                                            {distributionLabels.headers[2].title}
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
                                title: distributionLabels.headers[0].title,
                                value:
                                    (distribution[Distribution.Raffle]?.value ? distribution[Distribution.Raffle]?.value : 0) +
                                    (distribution[Distribution.LP]?.value ? distribution[Distribution.LP]?.value : 0),
                                color: distributionLabels.headers[0].color,
                            },
                            {
                                title: distributionLabels.headers[1].title,
                                value: distribution[Distribution.MMRewards]?.value ? distribution[Distribution.MMRewards]?.value : 0,
                                color: distributionLabels.headers[1].color,
                            },
                            {
                                title: distributionLabels.headers[2].title,
                                value:
                                    (distribution[Distribution.LPRewards]?.value ? distribution[Distribution.LPRewards]?.value : 0) +
                                    (distribution[Distribution.Team]?.value ? distribution[Distribution.Team]?.value : 0) +
                                    (distribution[Distribution.Airdrops]?.value ? distribution[Distribution.Airdrops]?.value : 0) +
                                    (distribution[Distribution.Other]?.value ? distribution[Distribution.Other]?.value : 0),
                                color: distributionLabels.headers[2].color,
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
