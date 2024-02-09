import {
    Center,
    VStack,
    Text,
    Box,
    HStack,
    Flex,
    Tooltip,
    Checkbox,
    Input,
    Button,
    useNumberInput,
    Progress,
    Divider,
} from "@chakra-ui/react";
import { LaunchData, bignum_to_num, myU64, JoinData, request_raw_account_data, MarketStateLayoutV2 } from "../components/Solana/state";
import { PROGRAM, RPC_NODE, WSS_NODE } from "../components/Solana/constants";
import { useCallback, useEffect, useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL, Connection, Keypair, Transaction } from "@solana/web3.js";
import Head from "next/head";
import { LimitOrderProvider } from "@jup-ag/limit-order-sdk";
import BN from "bn.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { MMLaunchData, MMUserData, RunMMLaunchDataGPA, RunMMUserDataGPA } from "../components/Solana/jupiter_state";
import bs58 from "bs58";
import { ownerFilter } from "@jup-ag/limit-order-sdk";
import { OrderHistoryItem, TradeHistoryItem, Order } from "@jup-ag/limit-order-sdk";
import usePlaceLimitOrder from "../hooks/jupiter/usePlaceLimitOrder";
import useCancelLimitOrder from "../hooks/jupiter/useCancelLimitOrder";
import useGetMMTokens from "../hooks/jupiter/useGetMMTokens";
import { Orderbook, Market } from "@openbook-dex/openbook";
import { MarketV2 } from "@raydium-io/raydium-sdk";
import { ColorType, createChart, UTCTimestamp } from "lightweight-charts";

export interface OpenOrder {
    publicKey: PublicKey;
    account: Order;
}

interface MarketData {
    time: UTCTimestamp;
    value: number;
}

interface Level {
    price: number;
    quantity: number;
}

async function getMarketData() {
    // Default options are marked with *
    const options = { method: "GET", headers: { "X-API-KEY": "e819487c98444f82857d02612432a051" } };
    let today = Math.floor(new Date().getTime() / 1000 / 24 / 60 / 60);
    let today_seconds = today * 24 * 60 * 60;

    let start_time = new Date(2024, 0, 1).getTime() / 1000;
    let end_time = new Date(2024, 1, 1).getTime() / 1000;

    let url =
        "https://public-api.birdeye.so/public/history_price?address=8BnEgHoWFysVcuFFX7QztDmzuH8r5ZFvyP3sYwn1XTh6&address_type=pair&time_from=" +
        start_time +
        "&time_to=" +
        today_seconds;

    let result = await fetch(url, options).then((response) => response.json());

    console.log(result);
    let data = [];
    for (let i = 0; i < result["data"]["items"].length; i++) {
        let item = result["data"]["items"][i];
        data.push({ time: item.unixTime as UTCTimestamp, value: item.value });
    }

    return data;
}
const ChartComponent = (props) => {
    const {
        data,
        colors: {
            backgroundColor = "white",
            lineColor = "#2962FF",
            textColor = "black",
            areaTopColor = "#2962FF",
            areaBottomColor = "rgba(41, 98, 255, 0.28)",
        } = {},
    } = props;

    const chartContainerRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: backgroundColor },
                textColor,
            },
            width: chartContainerRef.current.clientWidth,
            height: 300,
        });
        chart.timeScale().fitContent();

        const newSeries = chart.addAreaSeries({ lineColor, topColor: areaTopColor, bottomColor: areaBottomColor });
        newSeries.setData(data);

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);

            chart.remove();
        };
    }, [data, backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor]);

    return <div ref={chartContainerRef} />;
};

const MarketMaker = () => {
    const wallet = useWallet();
    const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
    const [mmUserData, setMMUserData] = useState<MMUserData[]>([]);
    const [mmLaunchData, setMMLaunchData] = useState<MMLaunchData[]>([]);
    const [market_data, setMarketData] = useState<MarketData[]>([]);

    const [market, setMarket] = useState<Market | null>(null);
    const [bid_address, setBidAddress] = useState<PublicKey | null>(null);
    const [ask_address, setAskAddress] = useState<PublicKey | null>(null);

    const [best_bid, setBestBid] = useState<Level | null>(null);
    const [best_ask, setBestAsk] = useState<Level | null>(null);

    const { PlaceLimitOrder } = usePlaceLimitOrder();
    const { CancelLimitOrder } = useCancelLimitOrder();
    const { GetMMTokens } = useGetMMTokens();

    const bids_ws_id = useRef<number | null>(null);
    const asks_ws_id = useRef<number | null>(null);

    const last_bid = useRef<number>(0);
    const last_ask = useRef<number>(0);

    const check_mm_data = useRef<boolean>(true);
    const check_market_data = useRef<boolean>(true);
    // when page unloads unsub from any active websocket listeners
    useEffect(() => {
        return () => {
            console.log("in use effect return");
            const unsub = async () => {
                const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });
                if (bids_ws_id.current !== null) {
                    await connection.removeAccountChangeListener(bids_ws_id.current);
                    bids_ws_id.current = null;
                }
                if (asks_ws_id.current !== null) {
                    await connection.removeAccountChangeListener(asks_ws_id.current);
                    asks_ws_id.current = null;
                }
            };
            unsub();
        };
    }, []);

    useEffect(() => {
        if (best_bid === null || best_ask === null) {
            return;
        }

        if (best_bid.price === last_bid.current && best_ask.price === last_ask.current) {
            return;
        }

        let new_mid = 0.5 * (best_bid.price + best_ask.price);
        //console.log("new mid", best_bid.price, best_ask.price, new_mid);
        let today = Math.floor(new Date().getTime() / 1000 / 24 / 60 / 60);
        let today_seconds = today * 24 * 60 * 60;
        let new_market_data: MarketData = { time: today_seconds as UTCTimestamp, value: new_mid };
        const updated_price_data = [...market_data];
        //console.log("update Bid MD: ", updated_price_data[market_data.length - 1].value, new_market_data.value)
        updated_price_data[updated_price_data.length - 1] = new_market_data;
        setMarketData(updated_price_data);

        last_bid.current = best_bid.price;
        last_ask.current = best_ask.price;
    }, [best_bid, best_ask, market_data]);

    const check_bid_update = useCallback(
        async (result: any) => {
            //console.log(result);
            // if we have a subscription field check against ws_id

            let event_data = result.data;

            let bids = Orderbook.decode(market, event_data);

            let l2 = bids.getL2(1);

            let best_bid: Level = { price: l2[0][0], quantity: l2[0][1] };
            setBestBid(best_bid);
        },
        [market],
    );

    const check_ask_update = useCallback(
        async (result: any) => {
            //console.log(result);
            // if we have a subscription field check against ws_id

            let event_data = result.data;

            let asks = Orderbook.decode(market, event_data);

            let l2 = asks.getL2(1);
            //console.log("have ask data", l2[0][0], l2[0][1]);

            let best_ask: Level = { price: l2[0][0], quantity: l2[0][1] };
            setBestAsk(best_ask);
        },
        [market],
    );

    // launch account subscription handler
    useEffect(() => {
        const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });

        if (bids_ws_id.current === null && bid_address !== null) {
            console.log("subscribe 1");

            bids_ws_id.current = connection.onAccountChange(bid_address, check_bid_update, "confirmed");
        }

        if (asks_ws_id.current === null && ask_address !== null) {
            console.log("subscribe 2");

            asks_ws_id.current = connection.onAccountChange(ask_address, check_ask_update, "confirmed");
        }
    }, [bid_address, ask_address, check_bid_update, check_ask_update]);

    const CheckMarketData = useCallback(async () => {
        let marketAddress = new PublicKey("8BnEgHoWFysVcuFFX7QztDmzuH8r5ZFvyP3sYwn1XTh6");
        let programAddress = new PublicKey("srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX");

        if (check_market_data.current === true) {
            let account_data = await request_raw_account_data("", marketAddress);
            const [market_data] = MarketStateLayoutV2.struct.deserialize(account_data);
            let bid_address = market_data.bids;
            let ask_address = market_data.asks;

            const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });
            let market = await Market.load(connection, marketAddress, {}, programAddress);

            setBidAddress(bid_address);
            setAskAddress(ask_address);
            setMarket(market);

            let data = await getMarketData();
            //console.log(data)
            setMarketData(data);
            check_market_data.current = false;
        }
    }, []);

    useEffect(() => {
        CheckMarketData();
    }, [CheckMarketData]);

    const CheckMMData = useCallback(async () => {
        if (!check_mm_data.current) return;
        if (wallet === null || wallet.publicKey === null || !wallet.connected || wallet.disconnecting) return;

        console.log("check mm data", wallet.connected, wallet.connecting, wallet.disconnecting);

        let user_list = await RunMMUserDataGPA(wallet);
        setMMUserData(user_list);
        let launch_list = await RunMMLaunchDataGPA();
        setMMLaunchData(launch_list);

        console.log("User", user_list);
        console.log("Launch", launch_list);

        check_mm_data.current = false;
    }, [wallet]);

    useEffect(() => {
        if (wallet === null || wallet.publicKey === null || !wallet.connected || wallet.disconnecting) return;

        CheckMMData();
    }, [wallet, CheckMMData]);

    const RecheckMMData = useCallback(async () => {
        check_mm_data.current = true;
        CheckMMData();
    }, [CheckMMData]);

    async function getUserOrders() {
        const connection = new Connection(RPC_NODE);
        let user_pda_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User_PDA")], PROGRAM)[0];

        const limitOrder = new LimitOrderProvider(connection, null);
        const openOrder: OpenOrder[] = await limitOrder.getOrders([ownerFilter(user_pda_account)]);

        const orderHistory: OrderHistoryItem[] = await limitOrder.getOrderHistory({
            wallet: user_pda_account.toBase58(),
            take: 20, // optional, default is 20, maximum is 100
            // lastCursor: order.id // optional, for pagination
        });

        const tradeHistory: TradeHistoryItem[] = await limitOrder.getTradeHistory({
            wallet: user_pda_account.toBase58(),
            take: 20, // optional, default is 20, maximum is 100
            // lastCursor: order.id // optional, for pagination
        });

        console.log(openOrder);
        console.log(orderHistory);
        setOpenOrders(openOrder);
    }

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Test</title>
            </Head>
            <main style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)" }}>
                <Center>
                    <Button
                        size="lg"
                        onClick={() => {
                            getUserOrders();
                        }}
                    >
                        Check Orders
                    </Button>
                    <Button
                        size="lg"
                        onClick={() => {
                            CancelLimitOrder(openOrders[0]);
                        }}
                    >
                        Cancel Order
                    </Button>
                    <Button
                        size="lg"
                        onClick={() => {
                            PlaceLimitOrder();
                        }}
                    >
                        Submit Order
                    </Button>
                    <Button
                        size="lg"
                        onClick={() => {
                            GetMMTokens();
                        }}
                    >
                        Get MM Tokens
                    </Button>
                    <Button
                        size="lg"
                        onClick={() => {
                            RecheckMMData();
                        }}
                    >
                        Get MM Data
                    </Button>
                </Center>

                <ChartComponent data={market_data}></ChartComponent>
            </main>
        </>
    );
};

export default MarketMaker;
