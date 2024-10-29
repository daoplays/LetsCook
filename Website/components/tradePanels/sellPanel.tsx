import { VStack, HStack, Center, Divider, Input, InputRightElement, Text, InputGroup, Button } from "@chakra-ui/react";
import { PanelProps } from "./panelProps";
import Image from "next/image";
import usePlaceMarketOrder from "../../hooks/jupiter/usePlaceMarketOrder";
import useSwapRaydium from "../../hooks/raydium/useSwapRaydium";
import { getTransferFeeConfig, calculateFee } from "@solana/spl-token";
import formatPrice from "../../utils/formatPrice";
import useSwapRaydiumClassic from "../../hooks/raydium/useSwapRaydiumClassic";
import { Config } from "../Solana/constants";
import { AMMPluginData, getAMMPlugins } from "../Solana/jupiter_state";
import { bignum_to_num } from "../Solana/state";

function getQuoteOutput(
    base_input_amount: number,
    amm_base_balance: number,
    amm_quote_balance: number,
    fee: number,
    quoteDecimals: number,
    baseDecimals: number,
): number[] {
    let amm_base_fee = Math.ceil((base_input_amount * fee) / 100 / 100);
    let input_ex_fees = base_input_amount - amm_base_fee;

    let quote_output = (input_ex_fees * amm_quote_balance) / (amm_base_balance + input_ex_fees) / Math.pow(10, quoteDecimals);

    let price = amm_quote_balance / Math.pow(10, quoteDecimals) / (amm_base_balance / Math.pow(10, baseDecimals));
    let quoteNoSlip = (input_ex_fees / Math.pow(10, baseDecimals)) * price;

    return [quote_output, quoteNoSlip];
}

function getScalingFactor(quoteAmount: number, pluginData: AMMPluginData): number {
    let threshold = bignum_to_num(pluginData.liquidity_threshold);
    if (quoteAmount > threshold) {
        return 1.0;
    }

    let scaling = Math.min(1, ((pluginData.liquidity_scalar / 10) * quoteAmount) / threshold);
    if (scaling > 1) return 1;

    if (scaling < 0.0002) return 0.0002;

    return scaling;
}

function CalculateChunkedOutput(
    inputAmount: number,
    quoteAmount: number,
    baseAmount: number,
    fee: number,
    pluginData: AMMPluginData,
    quoteDecimals: number,
    baseDecimals: number,
): number[] {
    let maxChunks = 50;
    let min_chunk_size = 100000;
    let chunks = Math.min(maxChunks, Math.floor(inputAmount / min_chunk_size) + 1);

    if (chunks === 0) return [0, 0];

    let chunkSize = inputAmount / chunks;
    let currentQuote = quoteAmount;
    let currentBase = baseAmount;
    let totalOutput = 0;
    let noSlipOutput = 0;

    for (let i = 0; i < chunks; i++) {
        let scaling = getScalingFactor(currentQuote, pluginData);
        let amm_fee = Math.ceil((chunkSize * fee) / 100 / 100);
        let input_ex_fees = chunkSize - amm_fee;
        let scaledInput = input_ex_fees / scaling;
        let output = (scaledInput * currentQuote) / (currentBase + scaledInput);

        let price = currentQuote / Math.pow(10, quoteDecimals) / (currentBase / Math.pow(10, baseDecimals));
        let quoteNoSlip = (scaledInput / Math.pow(10, baseDecimals)) * price;

        //console.log("chunk", i, "input", chunkSize, "output", output / Math.pow(10, quoteDecimals), "quoteNoSlip", quoteNoSlip, "slippage", 100 * (quoteNoSlip / (output / Math.pow(10, 9)) - 1));

        noSlipOutput += quoteNoSlip;
        totalOutput += output;
        currentQuote -= output;
        currentBase += chunkSize;
    }

    //console.log("Final", totalOutput / Math.pow(10, quoteDecimals), noSlipOutput);

    return [totalOutput / Math.pow(10, quoteDecimals), noSlipOutput];
}

const SellPanel = ({
    amm,
    base_mint,
    user_base_balance,
    sol_amount,
    token_amount,
    connected,
    setTokenAmount,
    handleConnectWallet,
    amm_base_balance,
    amm_quote_balance,
}: PanelProps) => {
    const { PlaceMarketOrder, isLoading: placingOrder } = usePlaceMarketOrder(amm);
    const { SwapRaydium, isLoading: placingRaydiumOrder } = useSwapRaydium(amm);
    const { SwapRaydiumClassic, isLoading: placingRaydiumClassicOrder } = useSwapRaydiumClassic(amm);

    let isLoading = placingOrder || placingRaydiumOrder;

    let base_raw = Math.floor(token_amount * Math.pow(10, base_mint.mint.decimals));
    let plugins: AMMPluginData = getAMMPlugins(amm);
    let quote_output = plugins.liquidity_active
        ? CalculateChunkedOutput(base_raw, amm_quote_balance, amm_base_balance, amm.fee, plugins, 9, base_mint.mint.decimals)
        : getQuoteOutput(base_raw, amm_base_balance, amm_quote_balance, amm.fee, 9, base_mint.mint.decimals);

    let quote_output_string = formatPrice(quote_output[0], 5);

    let slippage = quote_output[1] / quote_output[0] - 1;

    let slippage_string = isNaN(slippage) ? "0" : (slippage * 100).toFixed(2);
    quote_output_string += slippage > 0 ? " (" + slippage_string + "%)" : "";

    return (
        <>
            <VStack align="start" w="100%">
                <HStack w="100%" justify="space-between">
                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                        Swap:
                    </Text>

                    <HStack spacing={2}>
                        <Text
                            m={0}
                            color={"white"}
                            fontFamily="ReemKufiRegular"
                            fontSize={"medium"}
                            opacity={0.5}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                                setTokenAmount(user_base_balance / Math.pow(10, base_mint.mint.decimals) / 2);
                            }}
                        >
                            Half
                        </Text>
                        <Center height="15px">
                            <Divider orientation="vertical" opacity={0.25} />
                        </Center>
                        <Text
                            m={0}
                            color={"white"}
                            fontFamily="ReemKufiRegular"
                            fontSize={"medium"}
                            opacity={0.5}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                                setTokenAmount(user_base_balance / Math.pow(10, base_mint.mint.decimals));
                            }}
                        >
                            Max
                        </Text>
                    </HStack>
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
                    For:
                </Text>

                <InputGroup size="md">
                    <Input
                        readOnly={true}
                        color="white"
                        size="lg"
                        borderColor="rgba(134, 142, 150, 0.5)"
                        value={quote_output_string === "NaN" ? "0" : quote_output_string}
                        disabled
                    />
                    <InputRightElement h="100%" w={50}>
                        <Image src={Config.token_image} width={30} height={30} alt="SOL Icon" style={{ borderRadius: "100%" }} />
                    </InputRightElement>
                </InputGroup>
            </VStack>

            <Button
                mt={2}
                size="lg"
                w="100%"
                px={4}
                py={2}
                bg={"#FF6E6E"}
                isLoading={isLoading}
                onClick={() => {
                    !connected
                        ? handleConnectWallet()
                        : amm.provider === 0
                          ? PlaceMarketOrder(token_amount, sol_amount, 1)
                          : amm.provider === 1
                            ? SwapRaydium(token_amount * Math.pow(10, base_mint.mint.decimals), 0, 1)
                            : SwapRaydiumClassic(token_amount * Math.pow(10, base_mint.mint.decimals), 0, 1);
                }}
            >
                <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
                    {!connected ? "Connect Wallet" : "Sell"}
                </Text>
            </Button>
        </>
    );
};

export default SellPanel;
