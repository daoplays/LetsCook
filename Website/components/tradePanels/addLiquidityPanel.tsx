import { VStack, HStack, Center, Divider, Input, InputRightElement, Text, InputGroup, Button } from "@chakra-ui/react";
import { PanelProps } from "./panelProps";
import Image from "next/image";
import useAddLiquidityRaydium from "../../hooks/raydium/useAddLiquidityRaydium";
import useRemoveLiquidityRaydium from "../../hooks/raydium/useRemoveLiquidityRaydium";
import useUpdateCookLiquidity from "../../hooks/jupiter/useUpdateCookLiquidity";
import { LaunchFlags } from "../Solana/constants";
import { getTransferFeeConfig, calculateFee } from "@solana/spl-token";
import formatPrice from "../../utils/formatPrice";

const AddLiquidityPanel = ({
    amm,
    amm_provider,
    base_mint,
    token_amount,
    connected,
    setTokenAmount,
    handleConnectWallet,
    amm_base_balance,
    amm_quote_balance,
    amm_lp_balance,
}: PanelProps) => {
    const { AddLiquidityRaydium, isLoading: addLiquidityRaydiumLoading } = useAddLiquidityRaydium(amm);
    const { UpdateCookLiquidity, isLoading: updateCookLiquidityLoading } = useUpdateCookLiquidity(amm);

    let isLoading = addLiquidityRaydiumLoading || updateCookLiquidityLoading;

    let base_raw = Math.floor(token_amount * Math.pow(10, base_mint.mint.decimals));
    let total_base_fee = 0;
    let base_transfer_fee_config = getTransferFeeConfig(base_mint.mint);
    if (base_transfer_fee_config !== null) {
        total_base_fee += Number(calculateFee(base_transfer_fee_config.newerTransferFee, BigInt(base_raw)));
    }

    let base_input_amount = base_raw - total_base_fee;

    let quote_output = (base_input_amount * amm_quote_balance) / (base_input_amount + amm_base_balance) / Math.pow(10, 9);
    let max_sol_amount = Math.floor(quote_output * Math.pow(10, 9));
    let quote_string = formatPrice(quote_output, 5);

    let lp_generated = (base_raw * (amm_lp_balance / amm_base_balance)) / Math.pow(10, 9);
    let lp_string = formatPrice(lp_generated, 5);

    console.log(base_input_amount, amm_quote_balance, amm_base_balance);

    return (
        <>
            <VStack align="start" w="100%">
                <HStack w="100%" justify="space-between">
                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                        Add:
                    </Text>
                </HStack>

                <InputGroup size="md">
                    <Input
                        color="white"
                        size="lg"
                        borderColor="rgba(134, 142, 150, 0.5)"
                        value={token_amount}
                        onChange={(e) => {
                            setTokenAmount(
                                !isNaN(parseFloat(e.target.value)) || e.target.value === "" ? parseFloat(e.target.value) : token_amount,
                            );
                        }}
                        type="number"
                        min="0"
                    />
                    <InputRightElement h="100%" w={50}>
                        <Image src={base_mint.icon} width={30} height={30} alt="" style={{ borderRadius: "100%" }} />
                    </InputRightElement>
                </InputGroup>
            </VStack>

            <VStack align="start" w="100%">
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    And:
                </Text>

                <InputGroup size="md">
                    <Input readOnly={true} color="white" size="lg" borderColor="rgba(134, 142, 150, 0.5)" value={quote_string} disabled />
                    <InputRightElement h="100%" w={50}>
                        <Image src={"/images/sol.png"} width={30} height={30} alt="SOL Icon" style={{ borderRadius: "100%" }} />
                    </InputRightElement>
                </InputGroup>
            </VStack>

            <>
                <VStack align="start" w="100%">
                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                        For:
                    </Text>

                    <InputGroup size="md">
                        <Input readOnly={true} color="white" size="lg" borderColor="rgba(134, 142, 150, 0.5)" value={lp_string} disabled />
                        <InputRightElement h="100%" w={50}>
                            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                                LP
                            </Text>
                        </InputRightElement>
                    </InputGroup>
                </VStack>
            </>

            <Button
                mt={2}
                size="lg"
                w="100%"
                px={4}
                py={2}
                bg={"#83FF81"}
                isLoading={isLoading}
                onClick={() => {
                    !connected
                        ? handleConnectWallet()
                        : amm_provider=== 0
                          ? UpdateCookLiquidity(token_amount * Math.pow(10, base_mint.mint.decimals), 0)
                          : AddLiquidityRaydium(
                                lp_generated * Math.pow(10, 9),
                                token_amount * Math.pow(10, base_mint.mint.decimals),
                                max_sol_amount,
                            );
                }}
            >
                <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
                    {!connected ? "Connect Wallet" : "Add Liquidity"}
                </Text>
            </Button>
        </>
    );
};

export default AddLiquidityPanel;
