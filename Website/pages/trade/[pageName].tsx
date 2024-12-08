import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MintData, ListingData } from "../../components/Solana/state";
import { MMLaunchData, reward_schedule, AMMData } from "../../components/Solana/jupiter_state";
import { bignum_to_num } from "../../components/Solana/state";
import { Config } from "../../components/Solana/constants";
import { useEffect, useState, useRef } from "react";
import { getTransferFeeConfig } from "@solana/spl-token";

import {
    HStack,
    VStack,
    Text,
    Box,
    Tooltip,
    Link,
    Modal,
    ModalBody,
    ModalContent,
    Input,
    ModalOverlay,
    useDisclosure,
} from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";
import { MdOutlineContentCopy } from "react-icons/md";
import { PiArrowsOutLineVerticalLight } from "react-icons/pi";
import { createChart, CrosshairMode } from "lightweight-charts";
import trimAddress from "../../utils/trimAddress";
import { FaChartLine, FaInfo } from "react-icons/fa";

import MyRewardsTable from "../../components/tables/myRewards";
import Links from "../../components/Buttons/links";
import { HypeVote } from "../../components/hypeVote";
import UseWalletConnection from "../../hooks/useWallet";
import ShowExtensions from "../../components/Solana/extensions";
import { getSolscanLink } from "../../utils/getSolscanLink";
import { IoMdSwap } from "react-icons/io";
import { FaPlusCircle } from "react-icons/fa";
import styles from "../../styles/Launch.module.css";

import RemoveLiquidityPanel from "../../components/tradePanels/removeLiquidityPanel";
import AddLiquidityPanel from "../../components/tradePanels/addLiquidityPanel";
import SellPanel from "../../components/tradePanels/sellPanel";
import BuyPanel from "../../components/tradePanels/buyPanel";
import formatPrice from "../../utils/formatPrice";
import Loader from "../../components/loader";
import useAddTradeRewards from "../../hooks/cookAMM/useAddTradeRewards";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import useAMM from "@/hooks/data/useAMM";
import useTokenBalance from "@/hooks/data/useTokenBalance";
import { useSOLPrice } from "@/hooks/data/useSOLPrice";
import useListing from "@/hooks/data/useListing";
import useGetUserBalance from "@/hooks/data/useGetUserBalance";

const TradePage = () => {
    const wallet = useWallet();
    const router = useRouter();

    const { xs, sm, lg } = useResponsive();

    const { SOLPrice } = useSOLPrice();

    const { userBalance: userSOLBalance } = useGetUserBalance();

    const { pageName } = router.query;

    const [leftPanel, setLeftPanel] = useState("Info");

    const [additionalPixels, setAdditionalPixels] = useState(0);

    const [mobilePageContent, setMobilePageContent] = useState("Chart");

    const {
        amm,
        ammPlugins,
        baseMint,
        quoteMint,
        lpMint,
        baseTokenAccount: ammBaseAddress,
        quoteTokenAccount: ammQuoteAddress,
        baseTokenBalance: ammBaseAmount,
        quoteTokenBalance: ammQuoteAmount,
        lpAmount: ammLPAmount,
        marketData,
        lastDayVolume,
        currentRewards,
        error: ammError,
    } = useAMM({ pageName: pageName as string | null });

    const { listing, error: listingError } = useListing({ tokenMintAddress: baseMint?.mint.address });

    const { tokenBalance: userBaseAmount } = useTokenBalance({ mintData: baseMint });
    const { tokenBalance: userQuoteAmount } = useTokenBalance({ mintData: quoteMint });
    const { tokenBalance: userLPAmount } = useTokenBalance({ mintData: lpMint });

    const handleMouseDown = () => {
        document.addEventListener("mousemove", handleMouseMove);

        document.addEventListener("mouseup", () => {
            document.removeEventListener("mousemove", handleMouseMove);
        });
    };

    const handleMouseMove = (event) => {
        setAdditionalPixels((prevPixels) => prevPixels + event.movementY);
    };

    if (listing === null || amm === null || !baseMint) {
        return <Loader />;
    }

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Trade</title>
            </Head>
            <main className="md:p-8">
                <HStack className="gap-2" align="start" pb={sm ? 14 : 0}>
                    {(!sm || (sm && (mobilePageContent === "Info" || mobilePageContent === "Trade"))) && (
                        <VStack
                            align="start"
                            w={sm ? "100%" : 320}
                            className="min-w-[375px] rounded-xl border-t-[3px] border-orange-700 bg-[#161616] bg-opacity-75 bg-clip-padding shadow-2xl backdrop-blur-sm backdrop-filter"
                            gap={0}
                        >
                            <HStack
                                spacing={5}
                                w="100%"
                                px={5}
                                pb={sm ? 5 : 0}
                                style={{ borderBottom: sm ? "0.5px solid rgba(134, 142, 150, 0.5)" : "" }}
                                className="py-4"
                            >
                                <Image
                                    alt="Launch icon"
                                    src={baseMint.icon}
                                    width={65}
                                    height={65}
                                    style={{ borderRadius: "8px", backgroundSize: "cover" }}
                                />
                                <VStack align="start" spacing={1}>
                                    <p className="text-xl text-white">{baseMint.symbol}</p>
                                    <HStack spacing={3} align="start" justify="start">
                                        <p className="text-lg text-white">{trimAddress(baseMint.mint.address.toString())}</p>

                                        <Tooltip label="Copy Contract Address" hasArrow fontSize="large" offset={[0, 10]}>
                                            <div
                                                style={{ cursor: "pointer" }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    navigator.clipboard.writeText(baseMint.mint.address.toString());
                                                }}
                                            >
                                                <MdOutlineContentCopy color="white" size={25} />
                                            </div>
                                        </Tooltip>

                                        <Tooltip label="View in explorer" hasArrow fontSize="large" offset={[0, 10]}>
                                            <Link
                                                href={getSolscanLink(baseMint.mint.address, "Token")}
                                                target="_blank"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Image src="/images/solscan.png" width={25} height={25} alt="Solscan icon" />
                                            </Link>
                                        </Tooltip>
                                    </HStack>
                                </VStack>
                            </HStack>

                            {!sm && (
                                <div className="w-full px-4 pb-4">
                                    <Button
                                        onClick={() => {
                                            leftPanel === "Info"
                                                ? setLeftPanel("Trade")
                                                : leftPanel === "Trade"
                                                  ? setLeftPanel("Info")
                                                  : setLeftPanel("Info");
                                        }}
                                        className="w-full px-10 py-8 text-2xl transition-all hover:opacity-90"
                                    >
                                        {leftPanel === "Info" ? "Trade" : "Info"}
                                    </Button>
                                </div>
                            )}

                            {leftPanel === "Info" && (
                                <InfoContent
                                    listing={listing}
                                    amm={amm}
                                    base_mint={baseMint}
                                    volume={lastDayVolume}
                                    mm_data={currentRewards}
                                    price={marketData && marketData.length > 0 ? marketData[marketData.length - 1].close : 0}
                                    sol_price={SOLPrice}
                                    quote_amount={ammQuoteAmount}
                                />
                            )}

                            {leftPanel === "Trade" && (
                                <BuyAndSell
                                    amm={amm}
                                    base_mint={baseMint}
                                    base_balance={ammBaseAmount}
                                    quote_balance={ammQuoteAmount}
                                    amm_lp_balance={ammLPAmount}
                                    user_base_balance={userBaseAmount}
                                    user_lp_balance={userLPAmount}
                                    userSOLBalance={userSOLBalance}
                                />
                            )}
                        </VStack>
                    )}

                    {(!sm || (sm && mobilePageContent === "Chart")) && (
                        <VStack
                            align="start"
                            justify="start"
                            w="100%"
                            spacing={1}
                            style={{
                                minHeight: "100vh",
                                overflow: "auto",
                            }}
                        >
                            {/* <div className="w-full overflow-auto rounded-lg bg-[#161616] bg-opacity-75 bg-clip-padding p-3 shadow-2xl backdrop-blur-sm backdrop-filter"> */}
                            <ChartComponent data={marketData} additionalPixels={additionalPixels} />
                            {/* </div> */}
                            <div
                                style={{
                                    width: "100%",
                                    height: "0px",
                                    cursor: "ns-resize",
                                    position: "relative",
                                }}
                                onMouseDown={handleMouseDown}
                            >
                                <PiArrowsOutLineVerticalLight
                                    size={26}
                                    style={{
                                        position: "absolute",
                                        color: "white",
                                        margin: "auto",
                                        top: 0,
                                        left: 0,
                                        bottom: 0,
                                        right: 0,
                                        opacity: 0.75,
                                        zIndex: 99,
                                    }}
                                />
                            </div>

                            <MyRewardsTable amm={amm} />

                            {!wallet.connected && (
                                <HStack w="100%" align="center" justify="center" mt={25}>
                                    <Text fontSize={lg ? "large" : "x-large"} m={0} color={"white"} style={{ opacity: 0.5 }}>
                                        Connect your wallet to see your orders
                                    </Text>
                                </HStack>
                            )}
                        </VStack>
                    )}
                </HStack>

                {sm && (
                    <HStack
                        bg="url(/images/footer_fill.jpeg)"
                        bgSize="cover"
                        boxShadow="0px 3px 13px 13px rgba(0, 0, 0, 0.55)"
                        position="fixed"
                        bottom={0}
                        h={16}
                        w="100%"
                        gap={2}
                        justify="space-around"
                    >
                        <VStack
                            spacing={0.5}
                            w="120px"
                            onClick={() => {
                                setMobilePageContent("Chart");
                            }}
                        >
                            <FaChartLine size={24} color={"#683309"} />
                            <Text mb={0} color={"#683309"} fontSize="medium" fontWeight="bold">
                                Chart
                            </Text>
                        </VStack>

                        <VStack
                            w="120px"
                            onClick={() => {
                                setMobilePageContent("Trade");
                                setLeftPanel("Trade");
                            }}
                        >
                            <IoMdSwap size={28} color={"#683309"} />
                            <Text mb={0} color={"#683309"} fontSize="medium" fontWeight="bold">
                                Buy/Sell
                            </Text>
                        </VStack>

                        <VStack
                            w="120px"
                            onClick={() => {
                                setMobilePageContent("Info");
                                setLeftPanel("Info");
                            }}
                        >
                            <FaInfo size={24} color={"#683309"} />
                            <Text mb={0} color={"#683309"} fontSize="medium" fontWeight="bold">
                                Info
                            </Text>
                        </VStack>
                    </HStack>
                )}
            </main>
        </>
    );
};

const AddRewardModal = ({ amm, isOpen, onClose }: { amm: AMMData; isOpen: boolean; onClose: () => void }) => {
    const { xs, lg } = useResponsive();
    const [quantity, setQuantity] = useState<string>("");
    const { AddTradeRewards } = useAddTradeRewards();

    const handleSubmit = (e) => {
        let value = parseInt(quantity);
        if (isNaN(value)) {
            toast.error("Invalid quantity");
            return;
        }
        if (!amm) {
            toast.error("Waiting for AMM Data");
            return;
        }
        AddTradeRewards(amm.base_mint.toString(), amm.quote_mint.toString(), value);
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent
                    bg="url(/images/square-frame.png)"
                    bgSize="contain"
                    bgRepeat="no-repeat"
                    h={345}
                    py={xs ? 6 : 12}
                    px={xs ? 8 : 10}
                >
                    <ModalBody>
                        <VStack align="start" justify={"center"} h="100%" spacing={0} mt={xs ? -8 : 0}>
                            <Text className="font-face-kg" color="white" fontSize="x-large">
                                Total Rewards
                            </Text>
                            <Input
                                placeholder={"Enter Total Reward Quantity"}
                                size={lg ? "md" : "lg"}
                                maxLength={25}
                                required
                                type="text"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                color="white"
                            />
                            <HStack mt={xs ? 6 : 10} justify="end" align="end" w="100%">
                                <Text
                                    mr={3}
                                    align="end"
                                    fontSize={"medium"}
                                    style={{
                                        fontFamily: "KGSummerSunshineBlackout",
                                        color: "#fc3838",
                                        cursor: "pointer",
                                    }}
                                    onClick={onClose}
                                >
                                    GO BACK
                                </Text>
                                <button
                                    type="button"
                                    onClick={async (e) => {
                                        handleSubmit(e);
                                    }}
                                    className={`${styles.nextBtn} font-face-kg`}
                                >
                                    Add
                                </button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};

const BuyAndSell = ({
    amm,
    base_mint,
    base_balance,
    quote_balance,
    amm_lp_balance,
    user_base_balance,
    user_lp_balance,
    userSOLBalance,
}: {
    amm: AMMData;
    base_mint: MintData;
    base_balance: number;
    quote_balance: number;
    amm_lp_balance: number;
    user_base_balance: number;
    user_lp_balance: number;
    userSOLBalance: number;
}) => {
    const { xs } = useResponsive();
    const wallet = useWallet();
    const { handleConnectWallet } = UseWalletConnection();
    const [selected, setSelected] = useState("Buy");
    const [token_amount, setTokenAmount] = useState<number>(0);
    const [sol_amount, setSOLAmount] = useState<number>(0);

    const handleClick = (tab: string) => {
        setSelected(tab);
    };

    //console.log(base_balance/Math.pow(10, 6), quote_balance)

    let transfer_fee = 0;
    let max_transfer_fee = 0;
    let transfer_fee_config = getTransferFeeConfig(base_mint.mint);
    if (transfer_fee_config !== null) {
        transfer_fee = transfer_fee_config.newerTransferFee.transferFeeBasisPoints;
        max_transfer_fee = Number(transfer_fee_config.newerTransferFee.maximumFee) / Math.pow(10, base_mint.mint.decimals);
    }

    return (
        <VStack align="start" w="100%" gap={0}>
            <HStack align="center" spacing={0} zIndex={99} w="100%" className="px-4">
                {["Buy", "Sell", "LP+", "LP-"].map((name, i) => {
                    const isActive = selected === name;

                    const baseStyle = {
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                    };

                    const activeStyle = {
                        background: isActive ? "#edf2f7" : "transparent",
                        color: isActive ? "black" : "white",
                        borderRadius: isActive ? "6px" : "",
                        border: isActive ? "none" : "",
                    };

                    return (
                        <Box
                            key={i}
                            style={{
                                ...baseStyle,
                                ...activeStyle,
                            }}
                            onClick={() => {
                                handleClick(name);
                            }}
                            px={4}
                            py={2}
                            w={"50%"}
                        >
                            <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
                                {name}
                            </Text>
                        </Box>
                    );
                })}
            </HStack>
            <div className="mt-1 flex w-full justify-between px-4 py-3">
                <span className="text-md text-white text-opacity-50">Available Balance:</span>
                <span className="text-md text-white/50">
                    {selected === "Buy"
                        ? userSOLBalance.toFixed(5)
                        : selected === "LP-"
                          ? user_lp_balance < 1e-3
                              ? user_lp_balance.toExponential(3)
                              : user_lp_balance.toFixed(Math.min(3))
                          : user_base_balance.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                            })}{" "}
                    {selected === "Buy" ? Config.token : selected === "LP-" ? "LP" : base_mint.symbol}
                </span>
            </div>
            {/* 

            <div className="flex w-full justify-between border-b border-gray-600/50 px-4 py-3">
                <span className="text-md text- text-white text-opacity-50">AMM LP Fee:</span>
                <span className="text-md text-white">{(amm.fee * 0.01).toFixed(2)}%</span>
            </div>

            <div className="flex w-full justify-between border-b border-gray-600/50 px-4 py-3">
                <span className="text-md text- text-white text-opacity-50">Transfer Fee (bps):</span>
                <span className="text-md text-white">{transfer_fee}</span>
            </div>

            <div className="flex w-full justify-between border-b border-gray-600/50 px-4 py-3">
                <span className="text-md text- text-white text-opacity-50">Max Transfer Fee ({base_mint.symbol}):</span>
                <span className="text-md text-white">{max_transfer_fee}</span>
            </div> */}

            {selected === "Buy" && (
                <BuyPanel
                    amm={amm}
                    base_mint={base_mint}
                    user_base_balance={user_base_balance}
                    user_quote_balance={userSOLBalance}
                    sol_amount={sol_amount}
                    token_amount={token_amount}
                    connected={wallet.connected}
                    setSOLAmount={setSOLAmount}
                    setTokenAmount={setTokenAmount}
                    handleConnectWallet={handleConnectWallet}
                    amm_base_balance={base_balance}
                    amm_quote_balance={quote_balance}
                />
            )}
            {selected === "Sell" && (
                <SellPanel
                    amm={amm}
                    base_mint={base_mint}
                    user_base_balance={user_base_balance}
                    user_quote_balance={userSOLBalance}
                    sol_amount={sol_amount}
                    token_amount={token_amount}
                    connected={wallet.connected}
                    setSOLAmount={setSOLAmount}
                    setTokenAmount={setTokenAmount}
                    handleConnectWallet={handleConnectWallet}
                    amm_base_balance={base_balance}
                    amm_quote_balance={quote_balance}
                />
            )}
            {selected === "LP+" && (
                <AddLiquidityPanel
                    amm={amm}
                    base_mint={base_mint}
                    user_base_balance={user_base_balance}
                    user_quote_balance={userSOLBalance}
                    sol_amount={sol_amount}
                    token_amount={token_amount}
                    connected={wallet.connected}
                    setSOLAmount={setSOLAmount}
                    setTokenAmount={setTokenAmount}
                    handleConnectWallet={handleConnectWallet}
                    amm_base_balance={base_balance}
                    amm_quote_balance={quote_balance}
                    amm_lp_balance={amm_lp_balance}
                />
            )}
            {selected === "LP-" && (
                <RemoveLiquidityPanel
                    amm={amm}
                    base_mint={base_mint}
                    user_base_balance={user_base_balance}
                    user_quote_balance={userSOLBalance}
                    user_lp_balance={user_lp_balance}
                    sol_amount={sol_amount}
                    token_amount={token_amount}
                    connected={wallet.connected}
                    setSOLAmount={setSOLAmount}
                    setTokenAmount={setTokenAmount}
                    handleConnectWallet={handleConnectWallet}
                    amm_base_balance={base_balance}
                    amm_quote_balance={quote_balance}
                    amm_lp_balance={amm_lp_balance}
                />
            )}
        </VStack>
    );
};

const InfoContent = ({
    listing,
    amm,
    base_mint,
    price,
    sol_price,
    quote_amount,
    volume,
    mm_data,
}: {
    listing: ListingData;
    amm: AMMData;
    base_mint: MintData;
    price: number;
    sol_price: number;
    quote_amount: number;
    volume: number;
    mm_data: MMLaunchData | null;
}) => {
    const { isOpen: isRewardsOpen, onOpen: onRewardsOpen, onClose: onRewardsClose } = useDisclosure();

    let current_date = Math.floor((new Date().getTime() / 1000 - bignum_to_num(amm.start_time)) / 24 / 60 / 60);
    let reward = reward_schedule(current_date, amm, base_mint);
    if (mm_data !== null && mm_data !== undefined) {
        reward = bignum_to_num(mm_data.token_rewards) / Math.pow(10, base_mint.mint.decimals);
    }

    let total_supply = Number(base_mint.mint.supply) / Math.pow(10, base_mint.mint.decimals);
    let market_cap = total_supply * price * sol_price;
    let liquidity = Math.min(market_cap, 2 * (quote_amount / Math.pow(10, 9)) * sol_price);

    let market_cap_string =
        sol_price === 0
            ? "--"
            : market_cap.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
              });

    let liquidity_string =
        sol_price === 0
            ? "--"
            : liquidity.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
              });

    return (
        <>
            <div className="-mt-2 flex w-full flex-col space-y-0">
                <div className="flex w-full justify-between border-b border-gray-600/50 px-4 py-3">
                    <span className="text-md text- text-white text-opacity-50">Pool:</span>
                    <div className="flex items-center space-x-2">
                        <span className="text-md text-white">{amm.provider === 0 ? "Let's Cook" : "Raydium"}</span>
                        {amm.provider === 0 && <Image src="/favicon.ico" alt="Cook Icon" width={30} height={30} />}
                        {amm.provider === 1 && <Image src="/images/raydium.png" alt="Raydium Icon" width={30} height={30} />}
                    </div>
                </div>

                <div className="flex w-full justify-between border-b border-gray-600/50 px-4 py-3">
                    <span className="text-md text- text-white text-opacity-50">Price:</span>
                    <div className="flex items-center space-x-2">
                        <span className="text-md text-white">{formatPrice(price, 5)}</span>
                        <Image src={Config.token_image} width={30} height={30} alt="SOL Icon" />
                    </div>
                </div>

                <div className="flex w-full justify-between border-b border-gray-600/50 px-4 py-3">
                    <span className="text-md text- text-white text-opacity-50">Volume (24h):</span>
                    <div className="flex items-center space-x-2">
                        <span className="text-md text-white">{volume ? volume.toLocaleString() : 0}</span>
                        <Image src={Config.token_image} width={30} height={30} alt="Token Icon" />
                    </div>
                </div>

                <div className="flex w-full justify-between border-b border-gray-600/50 px-4 py-3">
                    <span className="text-md text- text-white text-opacity-50">Market Making Volume:</span>
                    <span className="text-md text-white">
                        {mm_data ? (bignum_to_num(mm_data.buy_amount) / Math.pow(10, base_mint.mint.decimals)).toLocaleString() : 0}
                    </span>
                </div>

                <div className="flex w-full justify-between border-b border-gray-600/50 px-4 py-3">
                    <div className="flex items-center space-x-2">
                        <span className="text-md text- text-white text-opacity-50">Market Making Rewards:</span>
                        {reward === 0 && (
                            <span className="text-md text- text-white text-opacity-50">
                                <FaPlusCircle onClick={() => onRewardsOpen()} />
                            </span>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-md text-white">{reward.toLocaleString()}</span>
                        <Image src={base_mint.icon} width={30} height={30} alt="Token Icon" />
                    </div>
                </div>

                <div className="flex w-full justify-between border-b border-gray-600/50 px-4 py-3">
                    <span className="text-md text- text-white text-opacity-50">Token Supply:</span>
                    <span className="text-md text-white">{total_supply.toLocaleString()}</span>
                </div>
                {/*<div className="flex w-full justify-between border-b border-gray-600/50 px-4 py-3">
                    <span className="text-md text- text-white text-opacity-50">Market Cap:</span>
                    <span className="text-md text-white">${market_cap_string}</span>
                </div>*/}

                <div className="flex w-full justify-between border-b border-gray-600/50 px-4 py-3">
                    <span className="text-md text- text-white text-opacity-50">Liquidity:</span>
                    <span className="text-md text-white">${liquidity_string}</span>
                </div>

                <div className="flex w-full justify-between border-b border-gray-600/50 px-4 py-3">
                    <span className="text-md text- text-white text-opacity-50">Hype:</span>
                    <HypeVote
                        launch_type={0}
                        launch_id={listing.id}
                        page_name={""}
                        positive_votes={listing.positive_votes}
                        negative_votes={listing.negative_votes}
                        isTradePage={true}
                        listing={listing}
                    />
                </div>

                {/* Socials */}
                <div className="flex w-full justify-between px-4 py-3">
                    <span className="text-md text- text-white text-opacity-50">Socials:</span>
                    <Links socials={listing.socials} isTradePage={true} />
                </div>

                {/* Extensions */}
                {base_mint.extensions !== 0 && (
                    <div className="flex w-full justify-between border-b border-gray-600/50 px-4 py-3">
                        <span className="text-md text- text-white text-opacity-50">Extensions:</span>
                        <ShowExtensions extension_flag={base_mint.extensions} />
                    </div>
                )}
            </div>
            <AddRewardModal amm={amm} isOpen={isRewardsOpen} onClose={onRewardsClose} />
        </>
    );
};

const ChartComponent = (props) => {
    const { data, additionalPixels } = props;

    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef(null);

    useEffect(() => {
        if (!data) return;

        const handleResize = () => {
            if (chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        if (chartContainerRef.current) {
            const chart = createChart(chartContainerRef.current, {
                layout: {
                    background: { color: "#171B26" },
                    textColor: "#DDD",
                },
                grid: {
                    vertLines: { color: "#242733" },
                    horzLines: { color: "#242733" },
                },
                timeScale: {
                    timeVisible: true,
                    secondsVisible: false,
                },
                crosshair: {
                    mode: CrosshairMode.Normal,
                },
                width: chartContainerRef.current.clientWidth,
                height: chartContainerRef.current.clientHeight,
            });

            chartRef.current = chart;

            const series = chart.addCandlestickSeries({
                upColor: "#00C38C",
                downColor: "#F94D5C",
                borderVisible: false,
                wickUpColor: "#00C38C",
                wickDownColor: "#F94D5C",
                priceFormat: {
                    type: "custom",
                    formatter: (price) => price.toExponential(2),
                    minMove: 0.000000001,
                },
            });

            seriesRef.current = series;
            series.setData(data);

            chart.timeScale().fitContent();

            window.addEventListener("resize", handleResize);

            return () => {
                window.removeEventListener("resize", handleResize);
                chart.remove();
            };
        }
    }, [data]);

    useEffect(() => {
        if (seriesRef.current) {
            seriesRef.current.setData(data);
        }
    }, [data]);

    useEffect(() => {
        if (chartContainerRef.current && chartRef.current) {
            const newHeight = `calc(60vh + ${additionalPixels}px)`;
            chartContainerRef.current.style.height = newHeight;
            chartRef.current.applyOptions({
                height: chartContainerRef.current.clientHeight,
            });
        }
    }, [additionalPixels]);

    return (
        <HStack
            ref={chartContainerRef}
            className="rounded-xl"
            justify="center"
            id="chartContainer"
            w="100%"
            h={`calc(60vh + ${additionalPixels}px)`}
            style={{
                overflow: "auto",
                position: "relative",
            }}
            spacing={0}
        />
    );
};

export default TradePage;
