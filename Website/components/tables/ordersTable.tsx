import { Box, Button, Center, HStack, TableContainer, Text } from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";
import { useRouter } from "next/router";
import { JoinedLaunch, LaunchData, bignum_to_num } from "../Solana/state";
import { OpenOrder } from "../Solana/jupiter_state";

import { Connection, PublicKey } from "@solana/web3.js";
import { PROGRAM, RPC_NODE, LaunchKeys } from "../Solana/constants";
import { useWallet } from "@solana/wallet-adapter-react";
import { LimitOrderProvider, OrderHistoryItem, TradeHistoryItem, ownerFilter } from "@jup-ag/limit-order-sdk";
import { useEffect, useRef } from "react";
import useAppRoot from "../../context/useAppRoot";
import useCancelLimitOrder from "../../hooks/jupiter/useCancelLimitOrder";

interface Header {
    text: string;
    field: string | null;
}

function filterOrders(list: OpenOrder[], launch_data: LaunchData) {
    if (list === null || list === undefined) return [];
    if (launch_data === null) return [];

    return list.filter(function (item) {
        //console.log(new Date(bignum_to_num(item.launch_date)), new Date(bignum_to_num(item.end_date)))
        return (
            item.account.inputMint.toString() === launch_data.keys[LaunchKeys.MintAddress].toString() ||
            item.account.outputMint.toString() === launch_data.keys[LaunchKeys.MintAddress].toString()
        );
    });
}

function filterTrades(list: TradeHistoryItem[], launch_data: LaunchData) {
    if (list === null || list === undefined) return [];
    if (launch_data === null) return [];

    return list.filter(function (item) {
        //console.log(new Date(bignum_to_num(item.launch_date)), new Date(bignum_to_num(item.end_date)))
        return (
            item.order.inputMint.toString() === launch_data.keys[LaunchKeys.MintAddress].toString() ||
            item.order.outputMint.toString() === launch_data.keys[LaunchKeys.MintAddress].toString()
        );
    });
}

// The state prop is either "Open" or "Filled"
const OrdersTable = ({ launch_data, state }: { launch_data: LaunchData | null; state?: string }) => {
    const wallet = useWallet();
    const { sm } = useResponsive();
    const { userOrders, userTrades, checkUserOrders } = useAppRoot();
    const check_orders = useRef<boolean>(true);

    useEffect(() => {
        if (!check_orders.current) return;

        checkUserOrders();
        check_orders.current = false;
    }, [wallet, checkUserOrders]);

    const tableHeaders: Header[] = [
        { text: "SYMBOL", field: "symbol" },
        { text: "SIDE", field: "side" },
        { text: "COST", field: "cost" },
        { text: "PRICE", field: "price" },
        { text: "SIZE", field: "size" },
        { text: "FILL (%)", field: "fill" },
        { text: "EXPIRY", field: "expiry" },
        { text: "ACTION", field: "action" },
    ];

    let filtered_orders = filterOrders(userOrders, launch_data);
    let filtered_trades = filterTrades(userTrades, launch_data);

    //console.log(filtered_orders);
    //console.log(filtered_trades);

    return (
        <TableContainer w="100%">
            <table
                width="100%"
                className="custom-centered-table font-face-rk"
                style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 120%)" }}
            >
                <thead>
                    <tr
                        style={{
                            height: "50px",
                            borderTop: "1px solid rgba(134, 142, 150, 0.5)",
                            borderBottom: "1px solid rgba(134, 142, 150, 0.5)",
                        }}
                    >
                        {tableHeaders.map((i) => (
                            <th key={i.text} style={{ minWidth: sm ? "90px" : "120px" }}>
                                <HStack gap={sm ? 1 : 2} justify="center" style={{ cursor: i.text === "LOGO" ? "" : "pointer" }}>
                                    <Text fontSize={sm ? "medium" : "large"} m={0}>
                                        {i.text}
                                    </Text>
                                    {/* {i.text === "LOGO" || i.text === "END" ? <></> : <FaSort />} */}
                                </HStack>
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {state === "Open" && filtered_orders.map((order, i) => <OrderCard key={i} order={order} launch={launch_data} />)}
                    {state === "Filled" && filtered_trades.map((order, i) => <TradeCard key={i} order={order} launch={launch_data} />)}
                </tbody>
            </table>
        </TableContainer>
    );
};

const OrderCard = ({ order, launch }: { order: OpenOrder; launch: LaunchData }) => {
    const { sm, md, lg } = useResponsive();
    const { CancelLimitOrder } = useCancelLimitOrder();
    let is_buy = order.account.outputMint.toString() === launch.keys[LaunchKeys.MintAddress].toString();

    let cost = is_buy ? bignum_to_num(order.account.makingAmount) : bignum_to_num(order.account.takingAmount);
    let token_amount = is_buy ? bignum_to_num(order.account.takingAmount) : bignum_to_num(order.account.makingAmount);

    cost /= Math.pow(10, 9);
    token_amount /= Math.pow(10, launch.decimals);

    let sol_amount = (cost / token_amount).toPrecision(2);

    return (
        <tr
            style={{
                height: "60px",
                transition: "background-color 0.3s",
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = ""; // Reset to default background color
            }}
            // onClick={() => router.push(`/launch/${launch.launch_data.page_name}`)}
        >
            <td style={{ minWidth: "180px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {launch.symbol}
                </Text>
            </td>
            <td style={{ minWidth: "180px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {is_buy ? "BUY" : "SELL"}
                </Text>
            </td>
            <td style={{ minWidth: "120px" }}>
                <HStack justify="center">
                    <Text fontSize={lg ? "large" : "x-large"} m={0}>
                        {cost}
                    </Text>
                    <Image src="/images/sol.png" width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                </HStack>
            </td>

            <td style={{ minWidth: "150px" }}>
                <HStack justify="center">
                    <Text fontSize={lg ? "large" : "x-large"} m={0}>
                        {sol_amount}
                    </Text>
                    <Image src="/images/sol.png" width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                </HStack>
            </td>

            <td style={{ minWidth: "150px" }}>
                <HStack justify="center">
                    <Text fontSize={lg ? "large" : "x-large"} m={0}>
                        {token_amount}
                    </Text>
                    <Image src={launch.icon} width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                </HStack>
            </td>

            <td style={{ minWidth: "150px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    --
                </Text>
            </td>

            <td style={{ minWidth: "150px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    --
                </Text>
            </td>

            <td style={{ minWidth: md ? "120px" : "" }}>
                <Button
                    onClick={() => {
                        CancelLimitOrder(launch, order);
                    }}
                >
                    Cancel
                </Button>
            </td>
        </tr>
    );
};

const TradeCard = ({ order, launch }: { order: TradeHistoryItem; launch: LaunchData }) => {
    const { sm, md, lg } = useResponsive();
    let is_buy = order.order.outputMint.toString() === launch.keys[LaunchKeys.MintAddress].toString();

    let cost: number = is_buy ? bignum_to_num(order.inAmount) : bignum_to_num(order.outAmount);
    let token_amount: number = is_buy ? bignum_to_num(order.outAmount) : bignum_to_num(order.inAmount);

    console.log(cost, token_amount);

    cost /= Math.pow(10, 9);
    token_amount /= Math.pow(10, launch.decimals);

    let price = (cost / token_amount).toPrecision(2);

    return (
        <tr
            style={{
                height: "60px",
                transition: "background-color 0.3s",
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = ""; // Reset to default background color
            }}
            // onClick={() => router.push(`/launch/${launch.launch_data.page_name}`)}
        >
            <td style={{ minWidth: "180px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {launch.symbol}
                </Text>
            </td>
            <td style={{ minWidth: "180px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {is_buy ? "BUY" : "SELL"}
                </Text>
            </td>
            <td style={{ minWidth: "120px" }}>
                <HStack justify="center">
                    <Text fontSize={lg ? "large" : "x-large"} m={0}>
                        {cost}
                    </Text>
                    <Image src="/images/sol.png" width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                </HStack>
            </td>

            <td style={{ minWidth: "150px" }}>
                <HStack justify="center">
                    <Text fontSize={lg ? "large" : "x-large"} m={0}>
                        {price}
                    </Text>
                    <Image src="/images/sol.png" width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                </HStack>
            </td>

            <td style={{ minWidth: "150px" }}>
                <HStack justify="center">
                    <Text fontSize={lg ? "large" : "x-large"} m={0}>
                        {token_amount}
                    </Text>
                    <Image src={launch.icon} width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                </HStack>
            </td>

            <td style={{ minWidth: "150px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    --
                </Text>
            </td>

            <td style={{ minWidth: "150px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    --
                </Text>
            </td>

            <td style={{ minWidth: md ? "120px" : "" }}>{/* <Button>Withdraw</Button> */}</td>
        </tr>
    );
};

export default OrdersTable;
