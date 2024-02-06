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
import { LaunchData, bignum_to_num, myU64, JoinData, request_raw_account_data } from "../components/Solana/state";
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

export interface OpenOrder {
    publicKey: PublicKey;
    account: Order;
}

async function getMarketData() {
    // Default options are marked with *
    const options = { method: "GET", headers: { "X-API-KEY": "e819487c98444f82857d02612432a051" } };

    let start_time = new Date(2024, 1, 1, 0, 0, 0, 0).getTime();
    let end_time = new Date(2024, 1, 27, 0, 0, 0, 0).getTime();

    let url =
        "https://public-api.birdeye.so/public/history_price?address=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&address_type=token&type=15m&time_from=" +
        start_time +
        "&time_to=" +
        end_time;
    console.log(url);

    fetch(url, options)
        .then((response) => response.json())
        .then((response) => console.log(response))
        .catch((err) => console.error(err));
}

const MarketMaker = () => {
    const wallet = useWallet();
    const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
    const [mmUserData, setMMUserData] = useState<MMUserData[]>([]);
    const [mmLaunchData, setMMLaunchData] = useState<MMLaunchData[]>([]);

    const { PlaceLimitOrder } = usePlaceLimitOrder();
    const { CancelLimitOrder } = useCancelLimitOrder();
    const { GetMMTokens } = useGetMMTokens();

    const check_mm_data = useRef<boolean>(true);

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
            </main>
        </>
    );
};

export default MarketMaker;
