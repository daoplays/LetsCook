import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
    request_raw_account_data,
    UserData,
    request_current_balance,
    request_token_supply,
    uInt32ToLEBytes,
    MintInfo,
} from "../../components/Solana/state";
import { TimeSeriesData, MMLaunchData, reward_schedule, AMMData, RaydiumAMM } from "../../components/Solana/jupiter_state";
import { Order } from "@jup-ag/limit-order-sdk";
import {
    bignum_to_num,
    LaunchData,
    MarketStateLayoutV2,
    request_token_amount,
    TokenAccount,
    RequestTokenHolders,
} from "../../components/Solana/state";
import { Config, LaunchKeys, PROGRAM, LaunchFlags } from "../../components/Solana/constants";
import { useCallback, useEffect, useState, useRef } from "react";
import { PublicKey, Connection } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, Mint, getTransferFeeConfig, calculateFee, unpackMint } from "@solana/spl-token";

import {
    HStack,
    VStack,
    Text,
    Box,
    Tooltip,
    Link,
    Input,
    InputGroup,
    InputRightElement,
    Button,
    Select,
    Card,
    CardBody,
    Divider,
    Center,
} from "@chakra-ui/react";
import OrdersTable from "../../components/tables/ordersTable";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";
import { MdOutlineContentCopy } from "react-icons/md";
import { PiArrowsOutLineVerticalLight } from "react-icons/pi";
import WoodenButton from "../../components/Buttons/woodenButton";
import useAppRoot from "../../context/useAppRoot";
import { ColorType, createChart, CrosshairMode, LineStyle, UTCTimestamp } from "lightweight-charts";
import trimAddress from "../../utils/trimAddress";
import { FaChartLine, FaInfo, FaPowerOff } from "react-icons/fa";
import usePlaceMarketOrder from "../../hooks/jupiter/usePlaceMarketOrder";
import useCancelLimitOrder from "../../hooks/jupiter/useCancelLimitOrder";
import useGetMMTokens from "../../hooks/jupiter/useGetMMTokens";

import { formatCurrency } from "@coingecko/cryptoformat";
import MyRewardsTable from "../../components/tables/myRewards";
import Links from "../../components/Buttons/links";
import { HypeVote } from "../../components/hypeVote";
import UseWalletConnection from "../../hooks/useWallet";
import ShowExtensions from "../../components/Solana/extensions";
import { getSolscanLink } from "../../utils/getSolscanLink";
import { IoMdSwap } from "react-icons/io";
import useSwapRaydium from "../../hooks/raydium/useSwapRaydium";
import { Liquidity } from "@raydium-io/raydium-sdk";
import { getLaunchOBMAccount, getRaydiumPrograms } from "../../hooks/raydium/utils";
import useAddLiquidityRaydium from "../../hooks/raydium/useAddLiquidityRaydium";
import useRemoveLiquidityRaydium from "../../hooks/raydium/useRemoveLiquidityRaydium";
import useUpdateCookLiquidity from "../../hooks/jupiter/useUpdateCookLiquidity";

interface MarketData {
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

async function getBirdEyeData(setMarketData: any) {
    let market_address = "GtKKKs3yaPdHbQd2aZS4SfWhy8zQ988BJGnKNndLxYsN";
    // Default options are marked with *
    const options = { method: "GET", headers: { "X-API-KEY": "e819487c98444f82857d02612432a051" } };
    let today_seconds = Math.floor(new Date().getTime() / 1000);

    let start_time = new Date(2024, 0, 1).getTime() / 1000;
    let end_time = new Date(2024, 5, 1).getTime() / 1000;

    let url =
        "https://public-api.birdeye.so/defi/ohlcv/pair?address=" +
        market_address +
        "&type=15m" +
        "&time_from=" +
        start_time +
        "&time_to=" +
        today_seconds;

    console.log(url);
    let result = await fetch(url, options).then((response) => response.json());

    let data: MarketData[] = [];
    for (let i = 0; i < result["data"]["items"].length; i++) {
        let item = result["data"]["items"][i];
        data.push({ time: item.unixTime as UTCTimestamp, open: item.o, high: item.h, low: item.l, close: item.c, volume: item.v });
    }
    console.log(data);
    setMarketData(data);
    //return data;
}

function findLaunch(list: LaunchData[], page_name: string | string[]) {
    if (list === null || list === undefined || page_name === undefined || page_name === null) return null;

    let launchList = list.filter(function (item) {
        //console.log(new Date(bignum_to_num(item.launch_date)), new Date(bignum_to_num(item.end_date)))
        return item.page_name == page_name;
    });

    return launchList[0];
}

function findAMM(list: AMMData[], base_mint: PublicKey) {
    if (list === null || list === undefined || base_mint === undefined || base_mint === null) return null;

    let launchList = list.filter(function (item) {
        //console.log(new Date(bignum_to_num(item.launch_date)), new Date(bignum_to_num(item.end_date)))
        return item.base_mint.equals(base_mint);
    });

    return launchList[0];
}

function filterLaunchRewards(list: MMLaunchData[], launch_data: LaunchData) {
    if (list === null || list === undefined) return [];
    if (launch_data === null || launch_data === undefined) return [];

    let current_date = Math.floor((new Date().getTime() / 1000 - bignum_to_num(launch_data.last_interaction)) / 24 / 60 / 60);

    return list.filter(function (item) {
        //console.log(new Date(bignum_to_num(item.launch_date)), new Date(bignum_to_num(item.end_date)))
        return item.mint_key.equals(launch_data.keys[LaunchKeys.MintAddress]) && item.date == current_date;
    });
}

const TradePage = () => {
    const wallet = useWallet();
    const { connection } = useConnection();
    const router = useRouter();
    const { xs, sm, lg } = useResponsive();

    const { launchList, ammData, currentUserData, mmLaunchData, SOLPrice, mintData } = useAppRoot();
    const { pageName } = router.query;

    const [leftPanel, setLeftPanel] = useState("Info");

    const [additionalPixels, setAdditionalPixels] = useState(0);

    const [selectedTab, setSelectedTab] = useState("Rewards");

    const [mobilePageContent, setMobilePageContent] = useState("Chart");

    const handleClick = (tab: string) => {
        setSelectedTab(tab);
    };

    const [market_data, setMarketData] = useState<MarketData[]>([]);
    const [daily_data, setDailyData] = useState<MarketData[]>([]);

    const [last_day_volume, setLastDayVolume] = useState<number>(0);

    const [base_address, setBaseAddress] = useState<PublicKey | null>(null);
    const [quote_address, setQuoteAddress] = useState<PublicKey | null>(null);
    const [price_address, setPriceAddress] = useState<PublicKey | null>(null);
    const [user_address, setUserAddress] = useState<PublicKey | null>(null);

    const [base_amount, setBaseAmount] = useState<number | null>(null);
    const [quote_amount, setQuoteAmount] = useState<number | null>(null);
    const [lp_amount, setLPAmount] = useState<number | null>(null);

    const [user_amount, setUserAmount] = useState<number>(0);

    const [total_supply, setTotalSupply] = useState<number>(0);
    const [num_holders, setNumHolders] = useState<number>(0);

    const [launch, setLaunch] = useState<LaunchData | null>(null);
    const [amm, setAMM] = useState<AMMData | null>(null);
    const [base_mint, setBaseMint] = useState<MintInfo | null>(null);

    const base_ws_id = useRef<number | null>(null);
    const quote_ws_id = useRef<number | null>(null);
    const price_ws_id = useRef<number | null>(null);
    const user_token_ws_id = useRef<number | null>(null);

    const last_base_amount = useRef<number>(0);
    const last_quote_amount = useRef<number>(0);

    const check_mm_data = useRef<boolean>(true);
    const check_market_data = useRef<boolean>(true);

    // when page unloads unsub from any active websocket listeners
    useEffect(() => {
        return () => {
            //console.log("in use effect return");
            const unsub = async () => {
                if (base_ws_id.current !== null) {
                    await connection.removeAccountChangeListener(base_ws_id.current);
                    base_ws_id.current = null;
                }
                if (quote_ws_id.current !== null) {
                    await connection.removeAccountChangeListener(quote_ws_id.current);
                    quote_ws_id.current = null;
                }
            };
            unsub();
        };
    }, [connection]);

    useEffect(() => {
        if (ammData === null || launchList === null || mintData === null) return;

        let launch = findLaunch(launchList, pageName);
        setLaunch(launch);

        let amm = findAMM(ammData, launch.keys[LaunchKeys.MintAddress]);
        setAMM(amm);

        let base_mint = mintData.get(launch.keys[LaunchKeys.MintAddress].toString());
        setBaseMint(base_mint);
    }, [launchList, ammData, mintData, pageName]);

    useEffect(() => {
        if (base_amount === null || quote_amount === null) {
            return;
        }

        if (base_amount === last_base_amount.current && quote_amount === last_quote_amount.current) {
            return;
        }

        last_base_amount.current = base_amount;
        last_quote_amount.current = quote_amount;
    }, [base_amount, quote_amount, market_data]);

    const check_base_update = useCallback(async (result: any) => {
        //console.log(result);
        // if we have a subscription field check against ws_id

        let event_data = result.data;
        const [token_account] = TokenAccount.struct.deserialize(event_data);
        let amount = bignum_to_num(token_account.amount);
        console.log("update base amount", amount);
        setBaseAmount(amount);
    }, []);

    const check_quote_update = useCallback(async (result: any) => {
        //console.log(result);
        // if we have a subscription field check against ws_id

        let event_data = result.data;
        const [token_account] = TokenAccount.struct.deserialize(event_data);
        let amount = bignum_to_num(token_account.amount);
        console.log("update quote amount", amount);

        setQuoteAmount(amount);
    }, []);

    const check_price_update = useCallback(
        async (result: any) => {
            //console.log(result);
            // if we have a subscription field check against ws_id

            let event_data = result.data;
            const [price_data] = TimeSeriesData.struct.deserialize(event_data);
            console.log("updated price data", price_data);

            let data: MarketData[] = [];

            for (let i = 0; i < price_data.data.length; i++) {
                let item = price_data.data[i];
                let time = bignum_to_num(item.timestamp) * 60;

                let open = Buffer.from(item.open).readFloatLE(0);
                let high = Buffer.from(item.high).readFloatLE(0);
                let low = Buffer.from(item.low).readFloatLE(0);
                let close = Buffer.from(item.close).readFloatLE(0);
                let volume = bignum_to_num(item.volume) / Math.pow(10, launch.decimals);

                data.push({ time: time as UTCTimestamp, open: open, high: high, low: low, close: close, volume: volume });
                //console.log("new data", data);
            }
            setMarketData(data);
        },
        [launch],
    );

    const check_user_token_update = useCallback(async (result: any) => {
        //console.log(result);
        // if we have a subscription field check against ws_id

        let event_data = result.data;
        const [token_account] = TokenAccount.struct.deserialize(event_data);
        let amount = bignum_to_num(token_account.amount);
        // console.log("update quote amount", amount);

        setUserAmount(amount);
    }, []);

    // launch account subscription handler
    useEffect(() => {
        if (base_ws_id.current === null && base_address !== null) {
            //console.log("subscribe 1");

            base_ws_id.current = connection.onAccountChange(base_address, check_base_update, "confirmed");
        }

        if (quote_ws_id.current === null && quote_address !== null) {
            // console.log("subscribe 2");

            quote_ws_id.current = connection.onAccountChange(quote_address, check_quote_update, "confirmed");
        }

        if (price_ws_id.current === null && price_address !== null) {
            price_ws_id.current = connection.onAccountChange(price_address, check_price_update, "confirmed");
        }

        if (user_token_ws_id.current === null && price_address !== null) {
            user_token_ws_id.current = connection.onAccountChange(user_address, check_user_token_update, "confirmed");
        }
    }, [
        connection,
        base_address,
        quote_address,
        price_address,
        user_address,
        check_price_update,
        check_base_update,
        check_quote_update,
        check_user_token_update,
    ]);

    const CheckMarketData = useCallback(async () => {
        console.log("check market data");
        if (launch === null || amm === null) return;

        const token_mint = launch.keys[LaunchKeys.MintAddress];
        const wsol_mint = new PublicKey("So11111111111111111111111111111111111111112");

        let amm_seed_keys = [];
        if (token_mint.toString() < wsol_mint.toString()) {
            amm_seed_keys.push(token_mint);
            amm_seed_keys.push(wsol_mint);
        } else {
            amm_seed_keys.push(wsol_mint);
            amm_seed_keys.push(token_mint);
        }

        let amm_data_account = PublicKey.findProgramAddressSync(
            [amm_seed_keys[0].toBytes(), amm_seed_keys[1].toBytes(), Buffer.from("AMM")],
            PROGRAM,
        )[0];

        let base_amm_account = amm.base_key;

        let quote_amm_account = amm.quote_key;
        

       
        console.log("base key", base_amm_account.toString());

        let user_token_account_key = await getAssociatedTokenAddress(
            token_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            base_mint.program,
        );

        // console.log(base_amm_account.toString(), quote_amm_account.toString());

        if (check_market_data.current === true) {
            setBaseAddress(base_amm_account);
            setQuoteAddress(quote_amm_account);
            setUserAddress(user_token_account_key);

            let base_amount = await request_token_amount("", base_amm_account);
            let quote_amount = await request_token_amount("", quote_amm_account);
            let user_amount = await request_token_amount("", user_token_account_key);

            setBaseAmount(base_amount);
            setQuoteAmount(quote_amount);
            setUserAmount(user_amount);

            let total_supply = await request_token_supply("", token_mint);
            setTotalSupply(total_supply / Math.pow(10, launch.decimals));

            if (launch.flags[LaunchFlags.AMMProvider] > 0) {
                getBirdEyeData(setMarketData);
                //let market = await getLaunchOBMAccount(Config, launch);
                //let ray_key = Liquidity.getAssociatedId({programId: getRaydiumPrograms(Config).AmmV4, marketId : market.publicKey})
                //let ray_account = await connection.getAccountInfo(ray_key)
                //const [rayAMM] = RaydiumAMM.struct.deserialize(ray_account.data);
                //console.log("raydium: ", rayAMM.status.toString(), rayAMM.baseNeedTakePnl.toString(), rayAMM.quoteNeedTakePnl.toString())
                return;
            }

            let index_buffer = uInt32ToLEBytes(0);
            let price_data_account = PublicKey.findProgramAddressSync(
                [amm_data_account.toBytes(), index_buffer, Buffer.from("TimeSeries")],
                PROGRAM,
            )[0];

            setPriceAddress(price_data_account);

            let price_data_buffer = await request_raw_account_data("", price_data_account);
            const [price_data] = TimeSeriesData.struct.deserialize(price_data_buffer);

            //console.log(price_data.data);
            let data: MarketData[] = [];
            let daily_data: MarketData[] = [];

            let now = new Date().getTime() / 1000;
            let last_volume = 0;

            let last_date = -1;
            for (let i = 0; i < price_data.data.length; i++) {
                let item = price_data.data[i];
                let time = bignum_to_num(item.timestamp) * 60;
                let date = Math.floor(time / 24 / 60 / 60) * 24 * 60 * 60;

                let open = Buffer.from(item.open).readFloatLE(0);
                let high = Buffer.from(item.high).readFloatLE(0);
                let low = Buffer.from(item.low).readFloatLE(0);
                let close = Buffer.from(item.close).readFloatLE(0);
                let volume = bignum_to_num(item.volume / Math.pow(10, launch.decimals));

                if (now - time < 24 * 60 * 60) {
                    last_volume += volume;
                }

                data.push({ time: time as UTCTimestamp, open: open, high: high, low: low, close: close, volume: volume });

                if (date !== last_date) {
                    daily_data.push({ time: date as UTCTimestamp, open: open, high: high, low: low, close: close, volume: volume });
                    last_date = date;
                } else {
                    daily_data[daily_data.length - 1].high =
                        high > daily_data[daily_data.length - 1].high ? high : daily_data[daily_data.length - 1].high;
                    daily_data[daily_data.length - 1].low =
                        low < daily_data[daily_data.length - 1].low ? low : daily_data[daily_data.length - 1].low;
                    daily_data[daily_data.length - 1].close = close;
                    daily_data[daily_data.length - 1].volume += volume;
                }
            }
            setMarketData(data);
            setDailyData(daily_data);
            setLastDayVolume(last_volume);
            check_market_data.current = false;
        }
    }, [launch, amm, base_mint, wallet.publicKey]);

    useEffect(() => {
        CheckMarketData();
    }, [CheckMarketData]);

    const handleMouseDown = () => {
        document.addEventListener("mousemove", handleMouseMove);

        document.addEventListener("mouseup", () => {
            document.removeEventListener("mousemove", handleMouseMove);
        });
    };

    const handleMouseMove = (event) => {
        setAdditionalPixels((prevPixels) => prevPixels + event.movementY);
    };

    if (launch === null || amm === null || base_mint === null || mmLaunchData === null) {
        return (
            <Head>
                <title>Let&apos;s Cook | Trade</title>
            </Head>
        );
    }

    let latest_rewards = filterLaunchRewards(mmLaunchData, launch);

    const Details = () => {
        return (
            <HStack spacing={5} w="100%" px={5} pb={sm ? 5 : 0} style={{ borderBottom: sm ? "0.5px solid rgba(134, 142, 150, 0.5)" : "" }}>
                <Image
                    alt="Launch icon"
                    src={launch.icon}
                    width={65}
                    height={65}
                    style={{ borderRadius: "8px", backgroundSize: "cover" }}
                />
                <VStack align="start" spacing={1}>
                    <Text m={0} fontSize={20} color="white" className="font-face-kg" style={{ wordBreak: "break-all" }} align={"center"}>
                        {launch.symbol}
                    </Text>
                    <HStack spacing={3} align="start" justify="start">
                        <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"large"}>
                            {trimAddress(launch.keys[LaunchKeys.MintAddress].toString())}
                        </Text>

                        <Tooltip label="Copy Contract Address" hasArrow fontSize="large" offset={[0, 10]}>
                            <div
                                style={{ cursor: "pointer" }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigator.clipboard.writeText(launch.keys[LaunchKeys.MintAddress].toString());
                                }}
                            >
                                <MdOutlineContentCopy color="white" size={25} />
                            </div>
                        </Tooltip>

                        <Tooltip label="View in explorer" hasArrow fontSize="large" offset={[0, 10]}>
                            <Link href={getSolscanLink(launch, "Token")} target="_blank" onClick={(e) => e.stopPropagation()}>
                                <Image src="/images/solscan.png" width={25} height={25} alt="Solscan icon" />
                            </Link>
                        </Tooltip>
                    </HStack>
                </VStack>
            </HStack>
        );
    };

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Trade</title>
            </Head>
            <main
                style={{
                    background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)",
                    height: sm ? "100vh" : "",
                }}
            >
                <HStack spacing={0} align="start" pb={sm ? 14 : 0}>
                    {(!sm || (sm && (mobilePageContent === "Info" || mobilePageContent === "Trade"))) && (
                        <VStack
                            py={5}
                            align="start"
                            w={sm ? "100%" : 320}
                            style={{
                                minWidth: "350px",
                                borderRight: "0.5px solid rgba(134, 142, 150, 0.5)",
                            }}
                            spacing={8}
                        >
                            <Details />

                            {!sm && (
                                <Box px={5} mt={-2} pb={5} width="100%" style={{ borderBottom: "1px solid rgba(134, 142, 150, 0.5)" }}>
                                    <WoodenButton
                                        action={() => {
                                            leftPanel === "Info"
                                                ? setLeftPanel("Trade")
                                                : leftPanel === "Trade"
                                                  ? setLeftPanel("Info")
                                                  : setLeftPanel("Info");
                                        }}
                                        label={leftPanel === "Info" ? "Place Order" : "Info"}
                                        size={22}
                                        width="100%"
                                    />
                                </Box>
                            )}

                            {leftPanel === "Info" && (
                                <InfoContent
                                    launch={launch}
                                    volume={last_day_volume}
                                    mm_data={latest_rewards.length > 0 ? latest_rewards[0] : null}
                                    price={market_data.length > 0 ? market_data[market_data.length - 1].close : 0}
                                    total_supply={total_supply}
                                    sol_price={SOLPrice}
                                    quote_amount={quote_amount}
                                    num_holders={num_holders}
                                />
                            )}

                            {leftPanel === "Trade" && (
                                <BuyAndSell
                                    launch={launch}
                                    amm={amm}
                                    mint_data={base_mint.mint}
                                    base_balance={base_amount}
                                    quote_balance={quote_amount}
                                    user_balance={user_amount}
                                />
                            )}
                        </VStack>
                    )}

                    {(!sm || (sm && mobilePageContent === "Chart")) && (
                        <VStack
                            align="start"
                            justify="start"
                            w="100%"
                            spacing={0}
                            style={{
                                minHeight: "100vh",
                                overflow: "auto",
                            }}
                        >
                            <ChartComponent data={market_data} additionalPixels={additionalPixels} />

                            <div
                                style={{
                                    width: "100%",
                                    height: "10px",
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

                            <HStack
                                justify="space-between"
                                align="center"
                                w="100%"
                                px={4}
                                style={{
                                    height: "55px",
                                    borderTop: "1px solid rgba(134, 142, 150, 0.5)",
                                }}
                            >
                                <HStack spacing={3}>
                                    {["Rewards"].map((name, i) => {
                                        const isActive = selectedTab === name;

                                        const baseStyle = {
                                            display: "flex",
                                            alignItems: "center",
                                            cursor: "pointer",
                                        };

                                        const activeStyle = {
                                            color: "white",
                                            borderBottom: isActive ? "2px solid white" : "",
                                            opacity: isActive ? 1 : 0.5,
                                        };

                                        return (
                                            <HStack
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
                                                mt={-2}
                                                w={"fit-content"}
                                                justify="center"
                                            >
                                                <Text m={"0 auto"} fontSize="medium" fontWeight="semibold">
                                                    {name}
                                                </Text>
                                            </HStack>
                                        );
                                    })}
                                </HStack>
                            </HStack>

                            {selectedTab === "Rewards" && wallet.connected && <MyRewardsTable launch_data={launch} />}

                            {(selectedTab === "Open" || selectedTab === "Filled") && wallet.connected && (
                                <OrdersTable state={selectedTab} launch_data={launch} />
                            )}

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
                            <Text mb={0} color={"#683309"} fontSize="medium" fontFamily="ReemKufiRegular" fontWeight="bold">
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
                            <Text mb={0} mt={-2} color={"#683309"} fontSize="medium" fontFamily="ReemKufiRegular" fontWeight="bold">
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
                            <Text mb={0} color={"#683309"} fontSize="medium" fontFamily="ReemKufiRegular" fontWeight="bold">
                                Info
                            </Text>
                        </VStack>
                    </HStack>
                )}
            </main>
        </>
    );
};

const BuyAndSell = ({
    launch,
    amm,
    mint_data,
    base_balance,
    quote_balance,
    user_balance,
}: {
    launch: LaunchData;
    amm: AMMData;
    mint_data: Mint;
    base_balance: number;
    quote_balance: number;
    user_balance: number;
}) => {
    const { xs } = useResponsive();
    const wallet = useWallet();
    const { handleConnectWallet } = UseWalletConnection();
    const [selected, setSelected] = useState("Buy");
    const [token_amount, setTokenAmount] = useState<number>(0);
    const [sol_amount, setSOLAmount] = useState<number>(0);
    const [order_type, setOrderType] = useState<number>(0);
    const { PlaceMarketOrder, isLoading: placingOrder } = usePlaceMarketOrder();
    const { SwapRaydium, isLoading: placingRaydiumOrder } = useSwapRaydium(launch);
    const { AddLiquidityRaydium, isLoading: addLiquidityRaydiumLoading } = useAddLiquidityRaydium(launch);
    const { RemoveLiquidityRaydium, isLoading: removeLiquidityRaydiumLoading } = useRemoveLiquidityRaydium(launch);
    const { UpdateCookLiquidity, isLoading: updateCookLiquidityLoading } = useUpdateCookLiquidity();

    const { userSOLBalance } = useAppRoot();

    const handleClick = (tab: string) => {
        setSelected(tab);

        if (tab == "Buy") setOrderType(0);
        if (tab == "Sell") setOrderType(1);
    };

    let amm_provider = launch.flags[LaunchFlags.AMMProvider];

    let base_raw = Math.floor(token_amount * Math.pow(10, launch.decimals));
    let total_base_fee = 0;
    let transfer_fee = 0;
    let max_transfer_fee = 0;
    let transfer_fee_config = getTransferFeeConfig(mint_data);
    if (transfer_fee_config !== null) {
        transfer_fee = transfer_fee_config.newerTransferFee.transferFeeBasisPoints;
        max_transfer_fee = Number(transfer_fee_config.newerTransferFee.maximumFee) / Math.pow(10, launch.decimals);
        total_base_fee +=  Number(calculateFee(transfer_fee_config.newerTransferFee, BigInt(base_raw)));
    }

    let amm_base_fee = Math.ceil((base_raw - total_base_fee)* amm.fee/100/100);
    total_base_fee += amm_base_fee;

    let base_input_amount = base_raw - total_base_fee;

    let quote_output =
        (base_input_amount * quote_balance) /
        (base_input_amount + base_balance) /
        Math.pow(10, 9);

    console.log("base in/out", base_input_amount / Math.pow(10, launch.decimals), quote_output)

    let quote_raw = Math.floor(sol_amount * Math.pow(10, 9));
    let amm_quote_fee = Math.ceil(quote_raw * amm.fee/100/100);
    let quote_input_amount = quote_raw - amm_quote_fee;
    let base_output =
        (quote_input_amount * base_balance) / (quote_balance + quote_input_amount) / Math.pow(10, launch.decimals);
    
    console.log("quote in/out", quote_input_amount / Math.pow(10, 9), amm_quote_fee, base_output)


    let price = quote_balance / Math.pow(10, 9) / (base_balance / Math.pow(10, launch.decimals));
    
    let base_no_slip = sol_amount / price;
    let quote_no_slip = token_amount * price;

    let max_sol_amount = Math.floor(quote_no_slip * Math.pow(10, 9) * 2);

    let slippage = order_type == 0 ? base_no_slip / base_output - 1 : quote_no_slip / quote_output - 1;

    let slippage_string = isNaN(slippage) ? "0" : (slippage * 100).toFixed(2);

    let quote_output_string = quote_output <= 1e-3 ? quote_output.toExponential(3) : quote_output.toFixed(5);
    quote_output_string += slippage > 0 ? " (" + slippage_string + "%)" : "";

    let base_output_string =
        base_output === 0
            ? "0"
            : base_output <= 1e-3
              ? base_output.toExponential(3)
              : base_output.toLocaleString("en-US", { minimumFractionDigits: launch.decimals, maximumFractionDigits: launch.decimals });

    base_output_string += slippage > 0 ? " (" + slippage_string + "%)" : "";

    return (
        <VStack align="start" px={5} w="100%" mt={-2} spacing={4}>
            <HStack align="center" spacing={0} zIndex={99} w="100%">
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

            <HStack justify="space-between" w="100%" mt={2}>
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    Available Balance:
                </Text>
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"}>
                    {selected === "Buy"
                        ? userSOLBalance.toFixed(5)
                        : (user_balance / Math.pow(10, launch.decimals)).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                          })}{" "}
                    {selected === "Buy" ? "SOL" : launch.symbol}
                </Text>
            </HStack>
            <HStack justify="space-between" w="100%" mt={2}>
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    AMM Fee (bps):
                </Text>
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"}>
                    {amm.fee}
                </Text>
            </HStack>
            <HStack justify="space-between" w="100%" mt={2}>
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    Transfer Fee (bps):
                </Text>
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"}>
                    {transfer_fee}
                </Text>
            </HStack>
            <HStack justify="space-between" w="100%" mt={2}>
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    Max Transfer Fee ({launch.symbol}):
                </Text>
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"}>
                    {max_transfer_fee}
                </Text>
            </HStack>

            <VStack align="start" w="100%">
                <HStack w="100%" justify="space-between">
                    {selected === "LP+" ? (
                        <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                            Add:
                        </Text>
                    ) : selected == "LP-" ? (
                        <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                            Remove:
                        </Text>
                    ) : (
                        <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                            Swap:
                        </Text>
                    )}
                    <HStack spacing={2}>
                        <Text
                            m={0}
                            color={"white"}
                            fontFamily="ReemKufiRegular"
                            fontSize={"medium"}
                            opacity={0.5}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                                if (selected === "Buy") {
                                    setSOLAmount(parseFloat(userSOLBalance.toFixed(5)) / 2);
                                }

                                if (selected === "Sell") {
                                    setTokenAmount(user_balance / Math.pow(10, launch.decimals) / 2);
                                }
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
                                if (selected === "Buy") {
                                    setSOLAmount(parseFloat(userSOLBalance.toFixed(5)) - 0.01);
                                }

                                if (selected === "Sell") {
                                    setTokenAmount(user_balance / Math.pow(10, launch.decimals));
                                }
                            }}
                        >
                            Max
                        </Text>
                    </HStack>
                </HStack>
                {selected === "Buy" ? (
                    <InputGroup size="md">
                        <Input
                            color="white"
                            size="lg"
                            borderColor="rgba(134, 142, 150, 0.5)"
                            value={sol_amount}
                            onChange={(e) => {
                               setSOLAmount(
                                          !isNaN(parseFloat(e.target.value)) || e.target.value === ""
                                              ? parseFloat(e.target.value)
                                              : sol_amount,
                                      )
                                    
                            }}
                            type="number"
                            min="0"
                        />
                        <InputRightElement h="100%" w={50}>
                            <Image
                                src={"/images/sol.png"}
                                width={30}
                                height={30}
                                alt="SOL Icon"
                                style={{ borderRadius: "100%" }}
                            />
                        </InputRightElement>
                    </InputGroup>
                ) : (
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
                            {selected !== "LP-" ? (
                                <Image src={launch.icon} width={30} height={30} alt="" style={{ borderRadius: "100%" }} />
                            ) : (
                                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                                    LP
                                </Text>
                            )}
                        </InputRightElement>
                    </InputGroup>
                )}
            </VStack>

            <VStack align="start" w="100%">
                {selected === "LP+" ? (
                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                        And:
                    </Text>
                ) : selected === "Sell" || selected === "LP+" ? (
                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                        For:
                    </Text>
                ) : (
                    <></>
                )}
                {selected === "Buy" ? (
                    <InputGroup size="md">
                        <Input
                            readOnly={true}
                            color="white"
                            size="lg"
                            borderColor="rgba(134, 142, 150, 0.5)"
                            value={
                                base_output_string === "NaN"
                                        ? "0"
                                        : base_output_string
                                   
                            }
                            disabled
                        />
                        <InputRightElement h="100%" w={50}>
                            <Image
                                src={ launch.icon }
                                width={30}
                                height={30}
                                alt=""
                                style={{ borderRadius: "100%" }}
                            />
                        </InputRightElement>
                    </InputGroup>
                ) : selected === "Sell" || selected === "LP+" ? (
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
                ) : (
                    <></>
                )}
            </VStack>

            {selected === "LP+" ? (
                <Button
                    mt={2}
                    size="lg"
                    w="100%"
                    px={4}
                    py={2}
                    bg={"#83FF81"}
                    isLoading={addLiquidityRaydiumLoading}
                    onClick={() => {
                        !wallet.connected
                            ? handleConnectWallet()
                            : amm_provider === 0
                              ? UpdateCookLiquidity(launch, token_amount, 0 )
                              : AddLiquidityRaydium(token_amount * Math.pow(10, launch.decimals), max_sol_amount);
                    }}
                >
                    <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
                        {!wallet.connected ? "Connect Wallet" : "Add Liquidity"}
                    </Text>
                </Button>
            ) : selected === "LP-" ? (
                <Button
                    mt={2}
                    size="lg"
                    w="100%"
                    px={4}
                    py={2}
                    bg={"#FF6E6E"}
                    isLoading={addLiquidityRaydiumLoading}
                    onClick={() => {
                        !wallet.connected
                            ? handleConnectWallet()
                            : amm_provider === 0
                              ? {}
                              : RemoveLiquidityRaydium(token_amount * Math.pow(10, launch.decimals));
                    }}
                >
                    <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
                        {!wallet.connected ? "Connect Wallet" : "Remove Liquidity"}
                    </Text>
                </Button>
            ) : (
                <>
                    <Button
                        mt={2}
                        size="lg"
                        w="100%"
                        px={4}
                        py={2}
                        bg={selected === "Buy" ? "#83FF81" : "#FF6E6E"}
                        isLoading={placingOrder}
                        onClick={() => {
                            !wallet.connected
                                ? handleConnectWallet()
                                : amm_provider === 0
                                  ? PlaceMarketOrder(launch, token_amount, sol_amount, order_type)
                                  : SwapRaydium(
                                        order_type === 1 ? token_amount * Math.pow(10, launch.decimals) : 0,
                                        order_type === 1 ? 0 : sol_amount * Math.pow(10, 9),
                                        order_type,
                                    );
                        }}
                    >
                        <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
                            {!wallet.connected ? "Connect Wallet" : selected === "Buy" ? "Buy" : selected === "Sell" ? "Sell" : ""}
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
            )}
        </VStack>
    );
};

const InfoContent = ({
    launch,
    price,
    sol_price,
    quote_amount,
    volume,
    total_supply,
    mm_data,
    num_holders,
}: {
    launch: LaunchData;
    price: number;
    sol_price: number;
    quote_amount: number;
    volume: number;
    total_supply: number;
    mm_data: MMLaunchData | null;
    num_holders: number;
}) => {
    const wallet = useWallet();
    const { GetMMTokens } = useGetMMTokens();

    let current_date = Math.floor((new Date().getTime() / 1000 - bignum_to_num(launch.last_interaction)) / 24 / 60 / 60);
    let reward = reward_schedule(current_date, launch);
    if (mm_data !== null) {
        reward = bignum_to_num(mm_data.token_rewards) / Math.pow(10, launch.decimals);
    }

    return (
        <VStack spacing={8} w="100%" mb={3}>
            <HStack mt={-2} px={5} justify="space-between" w="100%">
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    PRICE:
                </Text>
                <HStack>
                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"large"}>
                        {price < 1e-3 ? price.toExponential(3) : price.toFixed(Math.min(launch.decimals, 3))}
                    </Text>
                    <Image src="/images/sol.png" width={30} height={30} alt="SOL Icon" />
                </HStack>
            </HStack>

            <HStack mt={-2} px={5} justify="space-between" w="100%">
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    VOLUME (24h):
                </Text>
                <HStack>
                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"large"}>
                        {volume.toLocaleString()}
                    </Text>
                    <Image src={launch.icon} width={30} height={30} alt="Token Icon" />
                </HStack>
            </HStack>

            <HStack px={5} justify="space-between" w="100%">
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    SESSION REWARDS:
                </Text>
                <HStack>
                    <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"large"}>
                        {reward.toLocaleString()}
                    </Text>
                    <Image src={launch.icon} width={30} height={30} alt="Token Icon" />
                </HStack>
            </HStack>

            <HStack px={5} justify="space-between" w="100%">
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    MM SESSION VOLUME:
                </Text>
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"large"}>
                    {mm_data !== null ? (bignum_to_num(mm_data.buy_amount) / Math.pow(10, launch.decimals)).toLocaleString() : 0}
                </Text>
            </HStack>

            <HStack px={5} justify="space-between" w="100%">
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    SUPPLY:
                </Text>
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"large"}>
                    {total_supply.toLocaleString()}
                </Text>
            </HStack>

            <HStack px={5} justify="space-between" w="100%">
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    FDMC:
                </Text>
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"large"}>
                    {(total_supply * price * sol_price).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}{" "}
                    USDC
                </Text>
            </HStack>

            <HStack px={5} justify="space-between" w="100%">
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    TVL:
                </Text>
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"large"}>
                    {((quote_amount / Math.pow(10, 9)) * sol_price).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}{" "}
                    USDC
                </Text>
            </HStack>

            <HStack px={5} justify="space-between" w="100%">
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    HYPE:
                </Text>
                <HypeVote
                    launch_type={0}
                    launch_id={launch.game_id}
                    page_name={launch.page_name}
                    positive_votes={launch.positive_votes}
                    negative_votes={launch.negative_votes}
                    seller_key={launch.keys[LaunchKeys.Seller]}
                    isTradePage={true}
                />
            </HStack>

            <HStack px={5} justify="space-between" w="100%">
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    SOCIALS:
                </Text>
                <Links socials={launch.socials} isTradePage={true} />
            </HStack>
            <HStack px={5} justify="space-between" w="100%">
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    EXTENSIONS:
                </Text>
                <ShowExtensions extension_flag={launch.flags[LaunchFlags.Extensions]} />
            </HStack>
        </VStack>
    );
};

const ChartComponent = (props) => {
    const { data, additionalPixels } = props;

    const chartContainerRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        };

        const totalHeight = (60 * window.innerHeight) / 100 + additionalPixels; // Calculate total height
        const chart = createChart(chartContainerRef.current);

        const myPriceFormatter = (p) => p.toExponential(2);

        chart.applyOptions({
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
        });

        chart.timeScale().fitContent();

        const newSeries = chart.addCandlestickSeries({
            upColor: "#4EFF3F",
            downColor: "#ef5350",
            borderVisible: false,
            wickUpColor: "#4EFF3F",
            wickDownColor: "#ef5350",
            priceFormat: {
                type: "custom",
                formatter: (price) => price.toExponential(2),
                minMove: 0.000000001,
            },
        });

        newSeries.setData(data);

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            chart.remove();
        };
    }, [data, additionalPixels]);

    return (
        <HStack
            ref={chartContainerRef}
            justify="center"
            id="chartContainer"
            w="100%"
            style={{
                height: `calc(60vh + ${additionalPixels}px)`,
                overflow: "auto",
                position: "relative",
                borderBottom: "1px solid rgba(134, 142, 150, 0.5)",
            }}
        />
    );
};

export default TradePage;
