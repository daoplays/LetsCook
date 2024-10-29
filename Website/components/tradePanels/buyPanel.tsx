import {
    VStack,
    HStack,
    Center,
    Divider,
    Input,
    InputRightElement,
    Text,
    InputGroup,
    Button,
    Card,
    CardBody,
    SliderMark,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    Slider,
    Tooltip,
} from "@chakra-ui/react";
import { PanelProps } from "./panelProps";
import Image from "next/image";
import usePlaceMarketOrder from "../../hooks/jupiter/usePlaceMarketOrder";
import useSwapRaydium from "../../hooks/raydium/useSwapRaydium";
import formatPrice from "../../utils/formatPrice";
import { useState } from "react";
import useSwapRaydiumClassic from "../../hooks/raydium/useSwapRaydiumClassic";
import { Config } from "../Solana/constants";
import { bignum_to_num } from "../Solana/state";
import { AMMPluginData, getAMMPlugins } from "../Solana/jupiter_state";

function getBaseOutput(quote_input_amount: number, amm_base_balance: number, amm_quote_balance: number, fee: number, baseDecimals: number) : number[] {
    let amm_quote_fee = Math.ceil((quote_input_amount * fee) / 100 / 100);
    let input_ex_fees = (quote_input_amount - amm_quote_fee);

    let base_output =
      ((input_ex_fees * amm_base_balance)) /
        (amm_quote_balance + input_ex_fees) /
        Math.pow(10, baseDecimals);

    let price = amm_quote_balance / Math.pow(10, 9) / (amm_base_balance / Math.pow(10, baseDecimals));
    let base_no_slip = (input_ex_fees / Math.pow(10,9)) / price;
    

    return [base_output, base_no_slip];
}

function getScalingFactor(quoteAmount: number, pluginData: AMMPluginData) : number {

    let threshold = bignum_to_num(pluginData.liquidity_threshold);
    //console.log("Scaling factor", quoteAmount, threshold,  Math.min(1, ((pluginData.liquidity_scalar / 10) * quoteAmount) / threshold));
    if (quoteAmount > threshold) {
        return 1.0;
    }

    let scaling = Math.min(1, ((pluginData.liquidity_scalar / 10) * quoteAmount) / threshold);
    if (scaling > 1)
        return 1;

    if (scaling < 0.0002)
        return 0.0002;

    return scaling;
}

function CalculateChunkedOutput(inputAmount: number, quoteAmount: number, baseAmount: number, fee: number, pluginData:AMMPluginData, baseDecimals: number) : number[] {

    let maxChunks = 50;
    let min_chunk_size = 100;
    let chunks = Math.min(maxChunks, Math.floor(inputAmount/min_chunk_size) + 1);

    if (chunks === 0) 
        return [0,0];

    let chunkSize = inputAmount / chunks;
    let currentQuote = quoteAmount;
    let currentBase = baseAmount;
    let totalOutput = 0;
    let noSlipOutput = 0;

    for (let i = 0; i < chunks; i++) {
        let scaling = getScalingFactor(currentQuote, pluginData);
        let amm_quote_fee = ((chunkSize * fee) / 100 / 100);
        let input_ex_fees = chunkSize - amm_quote_fee;
        let scaledInput = input_ex_fees * scaling;
        //console.log("chunk", i, "input", chunkSize, "fee", amm_quote_fee, "ex", input_ex_fees);
        let output = ((scaledInput * currentBase)) /
        (currentQuote + scaledInput)

        let price = currentQuote / Math.pow(10, 9) / (currentBase / Math.pow(10, baseDecimals));
        let base_no_slip = (scaledInput / Math.pow(10, 9)) / price;

        //console.log("chunk", i, "input", chunkSize, "output", output / Math.pow(10, baseDecimals), "NoSlip", base_no_slip, "slippage", 100 * (base_no_slip / (output / Math.pow(10, baseDecimals)) - 1));


        noSlipOutput += base_no_slip;

        totalOutput += output;
        currentQuote += chunkSize;
        currentBase -= output;
    }

    return [totalOutput / Math.pow(10, baseDecimals), noSlipOutput];
}

const BuyPanel = ({
    amm,
    base_mint,
    user_quote_balance,
    sol_amount,
    token_amount,
    connected,
    setSOLAmount,
    handleConnectWallet,
    amm_base_balance,
    amm_quote_balance,
}: PanelProps) => {
    const { PlaceMarketOrder, isLoading: placingOrder } = usePlaceMarketOrder(amm);
    const { SwapRaydium, isLoading: placingRaydiumOrder } = useSwapRaydium(amm);
    const { SwapRaydiumClassic, isLoading: placingRaydiumClassicOrder } = useSwapRaydiumClassic(amm);

    let isLoading = placingOrder || placingRaydiumOrder;

    if (base_mint === null || base_mint === undefined || amm === null || amm === undefined) {
        return <></>;
    }

    let quote_raw = Math.floor(sol_amount * Math.pow(10, 9));


    let plugins : AMMPluginData = getAMMPlugins(amm);
    //console.log(plugins)

    let base_output = plugins.liquidity_active ? CalculateChunkedOutput(quote_raw, amm_quote_balance, amm_base_balance, amm.fee, plugins, base_mint.mint.decimals) : getBaseOutput(quote_raw, amm_base_balance, amm_quote_balance, amm.fee, base_mint.mint.decimals);
   
    let base_output_string = formatPrice(base_output[0], base_mint.mint.decimals);

    //console.log(amm_base_balance, amm_quote_balance);

    let slippage = base_output[1] / base_output[0] - 1;

    let slippage_string = isNaN(slippage) ? "0" : (slippage * 100).toFixed(2);
    base_output_string += slippage > 0 ? " (" + slippage_string + "%)" : "";

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
                                setSOLAmount(user_quote_balance / 2);
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
                                setSOLAmount(user_quote_balance);
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
                        value={sol_amount}
                        onChange={(e) => {
                            setSOLAmount(
                                !isNaN(parseFloat(e.target.value)) || e.target.value === "" ? parseFloat(e.target.value) : sol_amount,
                            );
                        }}
                        type="number"
                        min="0"
                    />
                    <InputRightElement h="100%" w={50}>
                        <Image src={Config.token_image} width={30} height={30} alt="SOL Icon" style={{ borderRadius: "100%" }} />
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
                        value={base_output_string === "NaN" ? "0" : base_output_string}
                        disabled
                    />
                    <InputRightElement h="100%" w={50}>
                        <Image src={base_mint.icon} width={30} height={30} alt="" style={{ borderRadius: "100%" }} />
                    </InputRightElement>
                </InputGroup>
            </VStack>
            {/*
            <VStack align="start" w="100%">
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    Leverage:
                </Text>
                <Slider
                    id="slider"
                    defaultValue={1}
                    min={1}
                    max={100}
                    colorScheme="teal"
                    onChange={(v) => setSliderValue(v)}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    <SliderMark value={25} {...labelStyles}>
                        25
                    </SliderMark>
                    <SliderMark value={50} {...labelStyles}>
                        50
                    </SliderMark>
                    <SliderMark value={75} {...labelStyles}>
                        75
                    </SliderMark>

                    <SliderTrack>
                        <SliderFilledTrack />
                    </SliderTrack>
                    <Tooltip hasArrow bg="teal.500" color="white" placement="top" isOpen={showTooltip} label={`${sliderValue}x`}>
                        <SliderThumb />
                    </Tooltip>
                </Slider>
            </VStack>

            <VStack align="start" w="100%">
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    Liquidation Price:
                </Text>

                <InputGroup size="md">
                    <Input
                        readOnly={true}
                        color="white"
                        size="lg"
                        borderColor="rgba(134, 142, 150, 0.5)"
                        value={sliderValue === 1 ? "" : liquidation_price_string}
                        disabled
                    />
                    <InputRightElement h="100%" w={50}>
                        <Image src={Config.token_image} width={30} height={30} alt="" style={{ borderRadius: "100%" }} />
                    </InputRightElement>
                </InputGroup>
            </VStack>
*/}
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
                        : amm.provider === 0
                          ? PlaceMarketOrder(token_amount, sol_amount, 0)
                          : amm.provider === 1
                            ? SwapRaydium(base_output[0] * Math.pow(10, base_mint.mint.decimals), 2 * sol_amount * Math.pow(10, 9), 0)
                            : SwapRaydiumClassic(base_output[0] * Math.pow(10, base_mint.mint.decimals), sol_amount * Math.pow(10, 9), 0);
                }}
            >
                <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
                    {!connected ? "Connect Wallet" : "Buy"}
                </Text>
            </Button>

            <Card bg="transparent">
                <CardBody>
                    <Text mb={0} color="white" align="center" fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                        MM Rewards are only granted on Buys through Let&apos;s Cook.
                    </Text>
                </CardBody>
            </Card>
        </>
    );
};

export default BuyPanel;
