import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import Head from "next/head";
import { request_raw_account_data } from "../../components/Solana/state";
import { Order } from "@jup-ag/limit-order-sdk";
import { bignum_to_num, LaunchData, MarketStateLayoutV2, request_token_amount, TokenAccount } from "../../components/Solana/state";
import { RPC_NODE, WSS_NODE, LaunchKeys } from "../../components/Solana/constants";
import { useCallback, useEffect, useState, useRef } from "react";
import { PublicKey, Connection } from "@solana/web3.js";
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
} from "@chakra-ui/react";
import OrdersTable from "../../components/tables/ordersTable";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";
import { MdOutlineContentCopy } from "react-icons/md";
import twitter from "../../public/socialIcons/new/XIcon.png";
import telegram from "../../public/socialIcons/new/telegramIcon.png";
import discord from "../../public/socialIcons/new/discordIcon.png";
import website from "../../public/socialIcons/new/websiteIcon.png";
import { PiArrowsOutLineVerticalLight } from "react-icons/pi";
import WoodenButton from "../../components/Buttons/woodenButton";
import useAppRoot from "../../context/useAppRoot";
import { Orderbook, Market } from "@openbook-dex/openbook";
import { ColorType, createChart, UTCTimestamp } from "lightweight-charts";
import trimAddress from "../../utils/trimAddress";
import { FaPowerOff } from "react-icons/fa";
import usePlaceLimitOrder from "../../hooks/jupiter/usePlaceLimitOrder";
import useCancelLimitOrder from "../../hooks/jupiter/useCancelLimitOrder";

interface OpenOrder {
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

async function getMarketData(market_address: string) {
    // Default options are marked with *
    const options = { method: "GET", headers: { "X-API-KEY": "e819487c98444f82857d02612432a051" } };
    let today = Math.floor(new Date().getTime() / 1000 / 24 / 60 / 60);
    let today_seconds = today * 24 * 60 * 60;

    let start_time = new Date(2024, 0, 1).getTime() / 1000;

    let url =
        "https://public-api.birdeye.so/public/history_price?address=" +
        market_address +
        "&address_type=pair&time_from=" +
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

function findLaunch(list: LaunchData[], page_name: string | string[]) {
    if (list === null || list === undefined || page_name === undefined || page_name === null) return null;

    let launchList = list.filter(function (item) {
        //console.log(new Date(bignum_to_num(item.launch_date)), new Date(bignum_to_num(item.end_date)))
        return item.page_name == page_name;
    });

    return launchList[0];
}

const TradePage = () => {
    const wallet = useWallet();
    const router = useRouter();
    const { sm } = useResponsive();

    const { launchList } = useAppRoot();
    const { pageName } = router.query;

    const [leftPanel, setLeftPanel] = useState("Info");

    const [additionalPixels, setAdditionalPixels] = useState(0);

    let launch = findLaunch(launchList, pageName);

    const [market_data, setMarketData] = useState<MarketData[]>([]);

    const [market, setMarket] = useState<Market | null>(null);
    const [base_address, setBaseAddress] = useState<PublicKey | null>(null);
    const [quote_address, setQuoteAddress] = useState<PublicKey | null>(null);
    const [lot_size, setLotSize] = useState<number | null>(null);

    const [base_amount, setBaseAmount] = useState<number | null>(null);
    const [quote_amount, setQuoteAmount] = useState<number | null>(null);

    const base_ws_id = useRef<number | null>(null);
    const quote_ws_id = useRef<number | null>(null);

    const last_base_amount = useRef<number>(0);
    const last_quote_amount = useRef<number>(0);

    const check_mm_data = useRef<boolean>(true);
    const check_market_data = useRef<boolean>(true);

    // when page unloads unsub from any active websocket listeners
    useEffect(() => {
        return () => {
            console.log("in use effect return");
            const unsub = async () => {
                const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });
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
    }, []);

    useEffect(() => {
        if (base_amount === null || quote_amount === null) {
            return;
        }

        if (base_amount === last_base_amount.current && quote_amount === last_quote_amount.current) {
            return;
        }

        let new_mid = quote_amount / base_amount;
        //console.log("new mid", best_bid.price, best_ask.price, new_mid);
        let today = Math.floor(new Date().getTime() / 1000 / 24 / 60 / 60);
        let today_seconds = today * 24 * 60 * 60;
        let new_market_data: MarketData = { time: today_seconds as UTCTimestamp, value: new_mid };
        const updated_price_data = [...market_data];
        //console.log("update Bid MD: ", updated_price_data[market_data.length - 1].value, new_market_data.value)
        updated_price_data[updated_price_data.length - 1] = new_market_data;
        setMarketData(updated_price_data);

        last_base_amount.current = base_amount;
        last_quote_amount.current = quote_amount;
    }, [base_amount, quote_amount, market_data]);

    const check_base_update = useCallback(
        async (result: any) => {
            //console.log(result);
            // if we have a subscription field check against ws_id

            let event_data = result.data;
            const [token_account] = TokenAccount.struct.deserialize(event_data);
            let amount = token_account.amount / Math.pow(10, launch.decimals);

            setBaseAmount(amount);
        },
        [launch],
    );

    const check_quote_update = useCallback(async (result: any) => {
        //console.log(result);
        // if we have a subscription field check against ws_id

        let event_data = result.data;
        const [token_account] = TokenAccount.struct.deserialize(event_data);
        let amount = token_account.amount / Math.pow(10, 9);

        setQuoteAmount(amount);
    }, []);

    // launch account subscription handler
    useEffect(() => {
        const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });

        if (base_ws_id.current === null && base_address !== null) {
            console.log("subscribe 1");

            base_ws_id.current = connection.onAccountChange(base_address, check_base_update, "confirmed");
        }

        if (quote_ws_id.current === null && quote_address !== null) {
            console.log("subscribe 2");

            quote_ws_id.current = connection.onAccountChange(quote_address, check_quote_update, "confirmed");
        }
    }, [base_address, quote_address, check_base_update, check_quote_update]);

    const CheckMarketData = useCallback(async () => {
        if (launch === null) return;

        let programAddress = new PublicKey("srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX");
        let amm_program = new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");

        const seed_base = launch.keys[LaunchKeys.MintAddress].toBase58().slice(0, 31);
        const marketAddress = await PublicKey.createWithSeed(launch.keys[LaunchKeys.Seller], seed_base + "1", programAddress);

        const ammAddress = PublicKey.findProgramAddressSync(
            [amm_program.toBytes(), marketAddress.toBytes(), Buffer.from("amm_associated_seed")],
            amm_program,
        )[0];

        const base_vault = PublicKey.findProgramAddressSync(
            [amm_program.toBytes(), marketAddress.toBytes(), Buffer.from("coin_vault_associated_seed")],
            amm_program,
        )[0];
        const quote_vault = PublicKey.findProgramAddressSync(
            [amm_program.toBytes(), marketAddress.toBytes(), Buffer.from("pc_vault_associated_seed")],
            amm_program,
        )[0];

        console.log(base_vault.toString(), quote_vault.toString());

        if (check_market_data.current === true) {
            //let account_data = await request_raw_account_data("", marketAddress);
            //const [market_data] = MarketStateLayoutV2.struct.deserialize(account_data);
            //let bid_address = market_data.bids;
            //let ask_address = market_data.asks;

            const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });
            let market = await Market.load(connection, marketAddress, {}, programAddress);
            //console.log(bignum_to_num(market.decoded.baseLotSize));

            setBaseAddress(base_vault);
            setQuoteAddress(quote_vault);
            setMarket(market);
            setLotSize(bignum_to_num(market.decoded.baseLotSize));

            let base_amount = await request_token_amount("", base_vault);
            let quote_amount = await request_token_amount("", quote_vault);

            setBaseAmount(base_amount / Math.pow(10, launch.decimals));
            setQuoteAmount(quote_amount / Math.pow(10, 9));

            let current_price = quote_amount / Math.pow(10, 9) / (base_amount / Math.pow(10, launch.decimals));

            console.log(base_amount / Math.pow(10, launch.decimals), quote_amount / Math.pow(10, 9), current_price);

            // get the current state of the bid and ask
            //let bid_account_data = await request_raw_account_data("", bid_address);
            // let ask_account_data = await request_raw_account_data("", ask_address);

            //let asks = Orderbook.decode(market, ask_account_data);
            //let bids = Orderbook.decode(market, bid_account_data);
            //
            // let ask_l2 = asks.getL2(1);
            // let bid_l2 = bids.getL2(1);

            //console.log("current bid/ask", ask_l2, bid_l2)

            let data = await getMarketData(ammAddress.toString());
            //console.log(data)
            setMarketData(data);
            check_market_data.current = false;
        }
    }, [launch]);

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

    if (launch === null) {
        return (
            <Head>
                <title>Let&apos;s Cook | Trade</title>
            </Head>
        );
    }

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Trade</title>
            </Head>
            <main style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)" }}>
                <HStack spacing={0} align="start">
                    <VStack
                        py={5}
                        align="start"
                        w={320}
                        style={{
                            minWidth: "350px",
                            borderRight: "0.5px solid rgba(134, 142, 150, 0.5)",
                        }}
                        spacing={8}
                    >
                        <HStack spacing={5} w="100%" px={5}>
                            <Image
                                alt="Launch icon"
                                src={launch.icon}
                                width={65}
                                height={65}
                                style={{ borderRadius: "8px", backgroundSize: "cover" }}
                            />
                            <VStack align="start" spacing={1}>
                                <Text
                                    m={0}
                                    fontSize={20}
                                    color="white"
                                    className="font-face-kg"
                                    style={{ wordBreak: "break-all" }}
                                    align={"center"}
                                >
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
                                        <Link
                                            href={`https://solscan.io/account/` + launch.keys[LaunchKeys.MintAddress].toString()}
                                            target="_blank"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Image src="/images/solscan.png" width={25} height={25} alt="Solscan icon" />
                                        </Link>
                                    </Tooltip>
                                </HStack>
                            </VStack>
                        </HStack>

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

                        {leftPanel === "Info" && <InfoContent />}

                        {leftPanel === "Trade" && <BuyAndSell />}
                    </VStack>

                    <VStack
                        align="start"
                        justify="start"
                        w="100%"
                        spacing={0}
                        style={{
                            minHeight: "100vh",
                            borderLeft: "0.5px solid rgba(134, 142, 150, 0.5)",
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
                                }}
                            />
                        </div>

                        <VStack w="100%">
                            <HStack
                                align="center"
                                w="100%"
                                px={4}
                                style={{ height: "45px", borderTop: "1px solid rgba(134, 142, 150, 0.5)" }}
                            >
                                <Text color="white" fontSize={sm ? "medium" : "large"} m={0}>
                                    Open Orders(1)
                                </Text>
                            </HStack>

                            <OrdersTable />
                        </VStack>
                    </VStack>
                </HStack>
            </main>
        </>
    );
};

const BuyAndSell = () => {
    const { xs } = useResponsive();
    const [selected, setSelected] = useState("Buy");

    const handleClick = (tab: string) => {
        setSelected(tab);
    };

    return (
        <VStack align="start" px={5} w="100%" mt={-2} spacing={4}>
            <HStack align="center" spacing={0} zIndex={99} w="100%">
                {["Buy", "Sell"].map((name, i) => {
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
                    0.00 {selected === "Buy" ? "USDC" : "$Dummy"}
                </Text>
            </HStack>

            <VStack align="start" w="100%">
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    Amount:
                </Text>
                <InputGroup size="md">
                    <Input color="white" size="lg" borderColor="rgba(134, 142, 150, 0.5)" />
                    <InputRightElement h="100%" w={50}>
                        <Image src={"https://snipboard.io/HZ789p.jpg"} width={30} height={30} alt="" style={{ borderRadius: "100%" }} />
                    </InputRightElement>
                </InputGroup>
            </VStack>

            <VStack align="start" w="100%">
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    Price Per Token:
                </Text>
                <InputGroup size="md">
                    <Input color="white" size="lg" borderColor="rgba(134, 142, 150, 0.5)" />
                    <InputRightElement h="100%" w={50}>
                        <Image src="/images/sol.png" width={30} height={30} alt="SOL Icon" />
                    </InputRightElement>
                </InputGroup>
            </VStack>

            <VStack align="start" w="100%">
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    You will {selected === "Buy" ? "Pay" : "Receive"}:
                </Text>
                <InputGroup size="md">
                    <Input color="white" size="lg" borderColor="rgba(134, 142, 150, 0.5)" />
                    <InputRightElement h="100%" w={50}>
                        <Image src="/images/sol.png" width={30} height={30} alt="SOL Icon" />
                    </InputRightElement>
                </InputGroup>
            </VStack>

            <VStack align="start" w="100%">
                <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                    Expiry:
                </Text>
                <Select placeholder="Never" color="white" size="lg" borderColor="rgba(134, 142, 150, 0.5)">
                    <option value="option1">15 Minutes</option>
                    <option value="option2">1 Hour</option>
                    <option value="option3">1 Day</option>
                    <option value="option2">3 Days</option>
                    <option value="option3">7 Days</option>
                    <option value="option2">30 Days</option>
                </Select>
            </VStack>

            <Button mt={2} size="lg" w="100%" px={4} py={2} bg={selected === "Buy" ? "#83FF81" : "#FF6E6E"}>
                <Text m={"0 auto"} fontSize="large" fontWeight="semibold">
                    Place Order
                </Text>
            </Button>

            <Card bg="transparent">
                <CardBody>
                    <Text mb={0} color="white" align="center" fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                        Limit Orders are placed via Jupiter Aggregator. <br />
                        <br /> MM Rewards are only granted on Buys through Let&apos;s Cook.
                    </Text>
                </CardBody>
            </Card>
        </VStack>
    );
};

const InfoContent = () => (
    <VStack spacing={8} w="100%" mb={3}>
        <HStack mt={-2} px={5} justify="space-between" w="100%">
            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                MM VOLUME (24h):
            </Text>
            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"large"}>
                1264 SOL
            </Text>
        </HStack>

        <HStack px={5} justify="space-between" w="100%">
            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                REWARD EMMISION (24h):
            </Text>
            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"large"}>
                X Token
            </Text>
        </HStack>

        <HStack px={5} justify="space-between" w="100%">
            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                REWARD RATE (24h):
            </Text>
            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"large"}>
                X Token / SOL
            </Text>
        </HStack>

        <HStack px={5} justify="space-between" w="100%">
            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                SUPPLY:
            </Text>
            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"large"}>
                4.269B
            </Text>
        </HStack>

        <HStack px={5} justify="space-between" w="100%">
            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                FDMC:
            </Text>
            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"large"}>
                252.14K USDC
            </Text>
        </HStack>

        <HStack px={5} justify="space-between" w="100%">
            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                TVL:
            </Text>
            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"large"}>
                40.371K USDC
            </Text>
        </HStack>

        <HStack px={5} justify="space-between" w="100%">
            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                HOLDERS:
            </Text>
            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"large"}>
                1362
            </Text>
        </HStack>

        <HStack px={5} justify="space-between" w="100%">
            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                HYPE:
            </Text>
            <HStack justify="center" align="center" gap={4} onClick={(e) => e.stopPropagation()}>
                <Tooltip label="Hype" hasArrow fontSize="large" offset={[0, 15]}>
                    <Image src="/images/thumbs-up.svg" width={30} height={30} alt="Thumbs Up" />
                </Tooltip>
                <Tooltip label="Not Hype" hasArrow fontSize="large" offset={[0, 15]}>
                    <Image src="/images/thumbs-down.svg" width={30} height={30} alt="Thumbs Down" />
                </Tooltip>
            </HStack>
        </HStack>

        <HStack px={5} justify="space-between" w="100%">
            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" fontSize={"medium"} opacity={0.5}>
                SOCIALS:
            </Text>
            <HStack justify="center" gap={3} onClick={(e) => e.stopPropagation()}>
                <Link href={"#"} target="_blank">
                    <Image src={twitter.src} alt="Twitter Icon" width={30} height={30} />
                </Link>
                <Link href="#" target="_blank">
                    <Image src={telegram.src} alt="Telegram Icon" width={30} height={30} />
                </Link>
                <Link href={"#"} target="_blank">
                    <Image src={discord.src} alt="Discord Icon" width={30} height={30} />
                </Link>
                <Link href={"#"} target="_blank">
                    <Image src={website.src} alt="Website Icon" width={30} height={30} />
                </Link>
            </HStack>
        </HStack>
    </VStack>
);

const ChartComponent = (props) => {
    const {
        data,
        additionalPixels,
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

        const totalHeight = (60 * window.innerHeight) / 100 + additionalPixels; // Calculate total height
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: backgroundColor },
                textColor,
            },
            width: chartContainerRef.current.clientWidth,
            height: totalHeight, // Use the calculated total height
        });

        chart.timeScale().fitContent();

        const newSeries = chart.addAreaSeries({ lineColor, topColor: areaTopColor, bottomColor: areaBottomColor });
        newSeries.setData(data);

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);

            chart.remove();
        };
    }, [data, backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor, additionalPixels]);

    return (
        <HStack
            ref={chartContainerRef}
            justify="center"
            id="chartContainer"
            bg="darkgray"
            w="100%"
            style={{
                height: `calc(60vh + ${additionalPixels}px)`,
                overflow: "auto",
                borderBottom: "1px solid rgba(134, 142, 150, 0.5)",
                position: "relative",
            }}
        />
    );
};

export default TradePage;
