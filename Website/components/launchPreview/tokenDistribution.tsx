import { VStack, HStack, Flex, Box, Text } from "@chakra-ui/react";
import { PieChart } from "react-minimal-pie-chart";
import useResponsive from "../../hooks/useResponsive";
import { LaunchData, bignum_to_num } from "../Solana/state";

interface TokenDistributionProps {
    launchData?: LaunchData;
}

const TokenDistribution = ({ launchData }: TokenDistributionProps) => {
    const { xs, md } = useResponsive();

    const distribution = launchData.distribution
        ? launchData.distribution
              .map((value, index) => ({
                  title: ["Let's Cook Raffle", "Liquidity Pool", "LP Rewards", "Airdrops", "Team", "Others"][index],
                  value,
                  color: ["#FF5151", "#489CFF", "#74DD5A", "#FFEF5E", "#B96CF6", "#FF994E"][index],
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

            <Flex align="center" justify="center" flexDirection={md ? "column" : "row"} w="100%" gap={xs ? 3 : 12} mt={3}>
                <VStack gap={6} align="start">
                    {distribution.map((i) => {
                        if (i.value <= 0) return;
                        return (
                            <HStack gap={4} key={i.title}>
                                <Box borderRadius={6} bg={i.color} h={35} w={35} />{" "}
                                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={md ? "large" : "x-large"}>
                                    {i.title} - {i.value}%
                                </Text>
                            </HStack>
                        );
                    })}
                </VStack>

                <PieChart animate={true} totalValue={100} data={distribution} style={{ width: xs ? "100%" : "400px", height: "400px" }} />
            </Flex>
        </VStack>
    );
};

export default TokenDistribution;
