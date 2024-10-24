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

    const [sliderValue, setSliderValue] = useState<number>(1);
    const [showTooltip, setShowTooltip] = useState<boolean>(false);

    const labelStyles = {
        mt: "2",
        ml: "-2.5",
        fontSize: "sm",
    };

    let isLoading = placingOrder || placingRaydiumOrder;

    if (base_mint === null || base_mint === undefined || amm === null || amm === undefined) {
        return <></>;
    }

    let liquidity_factor = 1;
    for (let i = 0; i < amm.plugins.length; i++) {
        console.log(amm.plugins[i])
        if (amm.plugins[i]["__kind"] == "LiquidityScaling") {
            let amm_plugin = amm.plugins[i];
            let threshold = bignum_to_num(amm_plugin["threshold"]);
            if (amm_quote_balance < threshold) {
                liquidity_factor = Math.min(1, (amm_plugin["scalar"] / 100) * amm_quote_balance / threshold)
                console.log("liquidity factor: ", liquidity_factor);
            }
       }
    }

    let quote_raw = Math.floor(sol_amount * Math.pow(10, 9));
    let amm_quote_fee = Math.ceil((quote_raw * amm.fee) / 100 / 100);
    let quote_input_amount = quote_raw - amm_quote_fee;
    let base_output =
    liquidity_factor * (quote_input_amount * amm_base_balance) / (amm_quote_balance + quote_input_amount) / Math.pow(10, base_mint.mint.decimals);
    let base_output_string = formatPrice(base_output, base_mint.mint.decimals);

    console.log(amm_base_balance, amm_quote_balance);
    let price = amm_quote_balance / Math.pow(10, 9) / (amm_base_balance / Math.pow(10, base_mint.mint.decimals));
    let base_no_slip = sol_amount / price;
    let slippage = base_no_slip / base_output - 1;

    let slippage_string = isNaN(slippage) ? "0" : (slippage * 100).toFixed(2);
    base_output_string += slippage > 0 ? " (" + slippage_string + "%)" : "";

    let quote_deposit_amount = quote_raw / sliderValue;
    let base_deposit_amount =
        (quote_deposit_amount * amm_base_balance) / (quote_deposit_amount + quote_input_amount) / Math.pow(10, base_mint.mint.decimals);

    let liquidation_price = quote_input_amount / (base_deposit_amount + base_output);

    let liquidation_price_string = formatPrice(liquidation_price, 5);

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
                            ? SwapRaydium(base_output * Math.pow(10, base_mint.mint.decimals), 2 * sol_amount * Math.pow(10, 9), 0)
                            : SwapRaydiumClassic(base_output * Math.pow(10, base_mint.mint.decimals), sol_amount * Math.pow(10, 9), 0);
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
