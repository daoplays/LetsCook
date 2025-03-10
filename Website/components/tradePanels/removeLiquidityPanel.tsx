import { VStack, HStack, Center, Divider, Input, InputRightElement, Text, InputGroup, Button } from "@chakra-ui/react";
import { PanelProps } from "./panelProps";
import Image from "next/image";
import useRemoveLiquidityRaydium from "../../hooks/raydium/useRemoveLiquidityRaydium";
import useUpdateCookLiquidity from "../../hooks/jupiter/useUpdateCookLiquidity";
import formatPrice from "../../utils/formatPrice";
import useRemoveLiquidityRaydiumClassic from "../../hooks/raydium/useRemoveLiquidityRaydiumClassc";
import { Config } from "../Solana/constants";

const RemoveLiquidityPanel = ({
    amm,
    token_amount,
    base_mint,
    connected,
    setTokenAmount,
    handleConnectWallet,
    user_lp_balance,
    amm_quote_balance,
    amm_base_balance,
    amm_lp_balance,
}: PanelProps) => {
    const { RemoveLiquidityRaydium, isLoading: removeLiquidityRaydiumLoading } = useRemoveLiquidityRaydium(amm);
    const { RemoveLiquidityRaydiumClassic, isLoading: RemoveLiquidityRaydiumClassicLoading } = useRemoveLiquidityRaydiumClassic(amm);
    const { UpdateCookLiquidity, isLoading: updateCookLiquidityLoading } = useUpdateCookLiquidity(amm);

    let isLoading = removeLiquidityRaydiumLoading || updateCookLiquidityLoading;

    let lp_raw = Math.floor(token_amount * Math.pow(10, 9));
    let lp_quote_output = (amm_quote_balance * lp_raw) / amm_lp_balance;
    let lp_base_output = (amm_base_balance * lp_raw) / amm_lp_balance;

    let quote_output_string = formatPrice(lp_quote_output, 5);
    let base_output_string = formatPrice(lp_base_output, base_mint.mint.decimals);

    return (
        <div className="flex w-full flex-col gap-2 px-4 pb-6">
            <VStack align="start" w="100%">
                <HStack w="100%" justify="space-between">
                    <p className="text-md text-white text-opacity-50">Withdraw Amount</p>

                    <HStack spacing={2}>
                        <p
                            className="text-md cursor-pointer text-white text-opacity-50"
                            onClick={() => {
                                setTokenAmount(user_lp_balance / 2);
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
                                setTokenAmount(user_lp_balance);
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
                        value={formatPrice(token_amount, 5)}
                        onChange={(e) => {
                            setTokenAmount(
                                !isNaN(parseFloat(e.target.value)) || e.target.value === "" ? parseFloat(e.target.value) : token_amount,
                            );
                        }}
                        type="number"
                        min="0"
                    />
                    <InputRightElement h="100%" w={50}>
                        <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                            LP
                        </Text>
                    </InputRightElement>
                </InputGroup>
            </VStack>

            <VStack align="start" w="100%" className="py-2">
                <p className="text-md text-white text-opacity-50">You&apos;ll Receive</p>
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

            <>
                <VStack align="start" w="100%">
                    <InputGroup size="md">
                        <Input
                            readOnly={true}
                            color="white"
                            size="lg"
                            borderColor="rgba(134, 142, 150, 0.5)"
                            value={base_output_string}
                            disabled
                        />
                        <InputRightElement h="100%" w={50}>
                            <Image src={base_mint.icon} width={30} height={30} alt="" style={{ borderRadius: "100%" }} />
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
                bg={"#FF6E6E"}
                isLoading={isLoading}
                onClick={() => {
                    !connected
                        ? handleConnectWallet()
                        : amm.provider === 0
                          ? UpdateCookLiquidity(lp_raw, 1)
                          : amm.provider === 1
                            ? RemoveLiquidityRaydium(lp_raw)
                            : RemoveLiquidityRaydiumClassic(lp_raw);
                }}
            >
                <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
                    {!connected ? "Connect Wallet" : "Remove Liquidity"}
                </Text>
            </Button>
        </div>
    );
};

export default RemoveLiquidityPanel;
