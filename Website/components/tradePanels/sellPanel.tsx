import { VStack, HStack, Center, Divider, Input, InputRightElement, Text, InputGroup, Button } from "@chakra-ui/react";
import { PanelProps } from "./panelProps";
import Image from "next/image";
import usePlaceMarketOrder from "../../hooks/jupiter/usePlaceMarketOrder";
import useSwapRaydium from "../../hooks/raydium/useSwapRaydium";
import { LaunchFlags } from "../Solana/constants";
import { getTransferFeeConfig, calculateFee } from "@solana/spl-token";
import formatPrice from "../../utils/formatPrice";

const SellPanel = ({
    amm,
    base_mint,
    user_base_balance,
    sol_amount,
    token_amount,
    connected,
    setTokenAmount,
    handleConnectWallet,
    launch,
    amm_base_balance,
    amm_quote_balance,
}: PanelProps) => {
    const { PlaceMarketOrder, isLoading: placingOrder } = usePlaceMarketOrder();
    const { SwapRaydium, isLoading: placingRaydiumOrder } = useSwapRaydium(amm);

    let isLoading = placingOrder || placingRaydiumOrder;

    let base_raw = Math.floor(token_amount * Math.pow(10, base_mint.decimals));
    let total_base_fee = 0;
    let base_transfer_fee_config = getTransferFeeConfig(base_mint);
    if (base_transfer_fee_config !== null) {
        total_base_fee += Number(calculateFee(base_transfer_fee_config.newerTransferFee, BigInt(base_raw)));
    }

    total_base_fee += Math.ceil(((base_raw - total_base_fee) * amm.fee) / 100 / 100);

    let base_input_amount = base_raw - total_base_fee;
    console.log("sell fee", total_base_fee);
    let quote_output = (base_input_amount * amm_quote_balance) / (base_input_amount + amm_base_balance) / Math.pow(10, 9);
    let quote_output_string = formatPrice(quote_output, 5);

    let price = amm_quote_balance / Math.pow(10, 9) / (amm_base_balance / Math.pow(10, base_mint.decimals));
    let quote_no_slip = token_amount * price;
    let slippage = quote_no_slip / quote_output - 1;

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
                                setTokenAmount(user_base_balance / Math.pow(10, base_mint.decimals) / 2);
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
                                setTokenAmount(user_base_balance / Math.pow(10, base_mint.decimals));
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
                        <Image src={launch.icon} width={30} height={30} alt="" style={{ borderRadius: "100%" }} />
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
                        <Image src={"/images/sol.png"} width={30} height={30} alt="SOL Icon" style={{ borderRadius: "100%" }} />
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
                        : launch.flags[LaunchFlags.AMMProvider] === 0
                          ? PlaceMarketOrder(launch, token_amount, sol_amount, 1)
                          : SwapRaydium(token_amount * Math.pow(10, base_mint.decimals), 0, 1);
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
