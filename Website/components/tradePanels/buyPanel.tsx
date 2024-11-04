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
    Collapse,
    Box,
    AbsoluteCenter,
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
import { ChevronDown } from "lucide-react";
import { getTransferFeeConfig } from "@solana/spl-token";

function getBaseOutput(
    quote_input_amount: number,
    amm_base_balance: number,
    amm_quote_balance: number,
    fee: number,
    baseDecimals: number,
): number[] {
    let amm_quote_fee = Math.ceil((quote_input_amount * fee) / 100 / 100);
    let input_ex_fees = quote_input_amount - amm_quote_fee;

    let base_output = (input_ex_fees * amm_base_balance) / (amm_quote_balance + input_ex_fees) / Math.pow(10, baseDecimals);

    let price = amm_quote_balance / Math.pow(10, 9) / (amm_base_balance / Math.pow(10, baseDecimals));
    let base_no_slip = input_ex_fees / Math.pow(10, 9) / price;

    return [base_output, base_no_slip];
}

function getScalingFactor(quoteAmount: number, pluginData: AMMPluginData): number {
    let threshold = bignum_to_num(pluginData.liquidity_threshold);
    //console.log("Scaling factor", quoteAmount, threshold,  Math.min(1, ((pluginData.liquidity_scalar / 10) * quoteAmount) / threshold));
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
    baseDecimals: number,
): number[] {
    let maxChunks = 50;
    let min_chunk_size = 100;
    let chunks = Math.min(maxChunks, Math.floor(inputAmount / min_chunk_size) + 1);

    if (chunks === 0) return [0, 0];

    let chunkSize = inputAmount / chunks;
    let currentQuote = quoteAmount;
    let currentBase = baseAmount;
    let totalOutput = 0;
    let noSlipOutput = 0;

    for (let i = 0; i < chunks; i++) {
        let scaling = getScalingFactor(currentQuote, pluginData);
        let amm_quote_fee = (chunkSize * fee) / 100 / 100;
        let input_ex_fees = chunkSize - amm_quote_fee;
        let scaledInput = input_ex_fees * scaling;
        //console.log("chunk", i, "input", chunkSize, "fee", amm_quote_fee, "ex", input_ex_fees);
        let output = (scaledInput * currentBase) / (currentQuote + scaledInput);

        let price = currentQuote / Math.pow(10, 9) / (currentBase / Math.pow(10, baseDecimals));
        let base_no_slip = scaledInput / Math.pow(10, 9) / price;

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
    const [isOpen, setIsOpen] = useState(false);

    let isLoading = placingOrder || placingRaydiumOrder;

    if (base_mint === null || base_mint === undefined || amm === null || amm === undefined) {
        return <></>;
    }

    let quote_raw = Math.floor(sol_amount * Math.pow(10, 9));

    let plugins: AMMPluginData = getAMMPlugins(amm);
    //console.log(plugins)

    let base_output = plugins.liquidity_active
        ? CalculateChunkedOutput(quote_raw, amm_quote_balance, amm_base_balance, amm.fee, plugins, base_mint.mint.decimals)
        : getBaseOutput(quote_raw, amm_base_balance, amm_quote_balance, amm.fee, base_mint.mint.decimals);

    let base_rate = plugins.liquidity_active
    ? CalculateChunkedOutput(1 * Math.pow(10, 9), amm_quote_balance, amm_base_balance, 0, plugins, base_mint.mint.decimals)
    : getBaseOutput(1 * Math.pow(10, 9), amm_base_balance, amm_quote_balance, 0, base_mint.mint.decimals);

    let base_output_string = formatPrice(base_output[0], base_mint.mint.decimals);
    let base_rate_string = formatPrice(base_rate[0], base_mint.mint.decimals);

    //console.log(amm_base_balance, amm_quote_balance);

    let slippage = base_output[1] / base_output[0] - 1;

    let slippage_string = isNaN(slippage) ? "0" : (slippage * 100).toFixed(2);
    base_output_string += slippage > 0 ? " (" + slippage_string + "%)" : "";

    const AMMfee = (amm.fee * 0.001).toFixed(3);

    let transfer_fee = 0;
    let max_transfer_fee = 0;
    let transfer_fee_config = getTransferFeeConfig(base_mint.mint);
    if (transfer_fee_config !== null) {
        transfer_fee = transfer_fee_config.newerTransferFee.transferFeeBasisPoints;
        max_transfer_fee = Number(transfer_fee_config.newerTransferFee.maximumFee) / Math.pow(10, base_mint.mint.decimals);
    }

    return (
        <div className="flex w-full flex-col gap-4 px-4 pb-6">
            <VStack align="start" w="100%">
                <HStack w="100%" justify="space-between">
                    <p className="text-md text-white text-opacity-50">You&apos;re paying</p>

                    <HStack spacing={2}>
                        <p
                            className="text-md cursor-pointer text-white text-opacity-50"
                            onClick={() => {
                                setSOLAmount(user_quote_balance / 2);
                            }}
                        >
                            Half
                        </p>
                        <Center height="15px">
                            <Divider orientation="vertical" opacity={0.25} />
                        </Center>
                        <p
                            className="text-md cursor-pointer text-white text-opacity-50"
                            onClick={() => {
                                setSOLAmount(user_quote_balance);
                            }}
                        >
                            Max
                        </p>
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
                <p className="text-md text-white text-opacity-50">To Receive</p>

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

            <div className="-mt-2 flex w-full max-w-md flex-col rounded-lg bg-white/5">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-[0.6rem] text-white transition-colors hover:bg-white/10`}
                >
                    <div className="flex items-center space-x-2">
                        <span>Transaction Details</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                    <div className="flex flex-col gap-3 rounded-md px-3 py-3 text-white text-opacity-50">
                        <HStack w="100%" justify="space-between">
                            <p className="text-md text-opacity-50">Rate</p>
                            <p className="text-right">
                                1 {Config.token} = {base_rate_string} {base_mint.symbol}
                            </p>
                        </HStack>

                        <HStack w="100%" justify="space-between">
                            <p className="text-md">Liquidity Provider Fee</p>
                            <p>{AMMfee}%</p>
                        </HStack>

                        <HStack w="100%" justify="space-between">
                            <p className="text-md text-opacity-50">Slippage</p>
                            <p> {slippage_string}%</p>
                        </HStack>

                        {max_transfer_fee > 0 && (
                            <>
                                <div className="h-1 w-full border-b border-gray-600/50"></div>

                                <HStack w="100%" justify="space-between">
                                    <p className="text-md">Transfer Fee</p>
                                    <p>{transfer_fee / 100}%</p>
                                </HStack>

                                <HStack w="100%" justify="space-between">
                                    <p className="text-md text-opacity-50">Max Transfer Fee</p>
                                    <p>
                                        {" "}
                                        {max_transfer_fee} {base_mint.symbol}
                                    </p>
                                </HStack>
                            </>
                        )}
                    </div>
                )}
            </div>

            <Button
                mt={-2}
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

            <Text mt={-1} color="white" align="center" fontSize={"medium"} opacity={0.5}>
                MM Rewards are only granted on Buys through Let&apos;s Cook.
            </Text>
        </div>
    );
};

export default BuyPanel;
