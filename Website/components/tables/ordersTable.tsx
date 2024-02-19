import { Box, Button, Center, HStack, TableContainer, Text } from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";
import { useRouter } from "next/router";
import { JoinedLaunch } from "../Solana/state";
import { Connection, PublicKey } from "@solana/web3.js";
import { PROGRAM, RPC_NODE } from "../Solana/constants";
import { useWallet } from "@solana/wallet-adapter-react";
import { LimitOrderProvider, OrderHistoryItem, TradeHistoryItem, ownerFilter } from "@jup-ag/limit-order-sdk";
import { useEffect, useState } from "react";

interface Header {
    text: string;
    field: string | null;
}

export interface OpenOrder {
    publicKey: PublicKey;
}

const OrdersTable = () => {
    const wallet = useWallet();
    const { sm } = useResponsive();

    const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);

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

    useEffect(() => {
        console.log(openOrders);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openOrders]);

    const tableHeaders: Header[] = [
        { text: "LOGO", field: null },
        { text: "SYMBOL", field: "symbol" },
        { text: "COST", field: "cost" },
        { text: "PRICE", field: "price" },
        { text: "SIZE", field: "size" },
        { text: "FILL (%)", field: "fill" },
        { text: "EXPIRY", field: "expiry" },
        { text: "ACTION", field: "action" },
    ];

    const sampleData = [
        {
            logo: "https://snipboard.io/HZ789p.jpg",
            symbol: "$Dummy",
            cost: "25",
            price: "0.0045",
            size: "5555.55",
            fill: "50",
            expiry: "13 Feb 2024",
        },
    ];

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
                    {sampleData.map((launch, i) => (
                        <LaunchCard key={i} launch={launch} />
                    ))}
                </tbody>
            </table>
        </TableContainer>
    );
};

const LaunchCard = ({ launch }: { launch: JoinedLaunch | any }) => {
    const router = useRouter();
    const { sm, md, lg } = useResponsive();

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
            <td style={{ minWidth: sm ? "90px" : "120px" }}>
                <Center>
                    <Box m={5} w={md ? 45 : 75} h={md ? 45 : 75} borderRadius={10}>
                        <Image
                            alt="Launch icon"
                            src={launch.logo}
                            width={md ? 45 : 75}
                            height={md ? 45 : 75}
                            style={{ borderRadius: "8px", backgroundSize: "cover" }}
                        />
                    </Box>
                </Center>
            </td>
            <td style={{ minWidth: "180px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {launch.symbol}
                </Text>
            </td>
            <td style={{ minWidth: "120px" }}>
                <HStack justify="center">
                    <Text fontSize={lg ? "large" : "x-large"} m={0}>
                        {launch.cost}
                    </Text>
                    <Image src="/images/usdc.png" width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                </HStack>
            </td>

            <td style={{ minWidth: "150px" }}>
                <HStack justify="center">
                    <Text fontSize={lg ? "large" : "x-large"} m={0}>
                        {launch.price}
                    </Text>
                    <Image src="/images/usdc.png" width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                </HStack>
            </td>

            <td style={{ minWidth: "150px" }}>
                <HStack justify="center">
                    <Text fontSize={lg ? "large" : "x-large"} m={0}>
                        {launch.size}
                    </Text>
                </HStack>
            </td>

            <td style={{ minWidth: "150px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {launch.fill}%
                </Text>
            </td>

            <td style={{ minWidth: "150px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {launch.expiry}
                </Text>
            </td>

            <td style={{ minWidth: md ? "120px" : "" }}>
                <Button onClick={(e) => e.stopPropagation()}>Cancel</Button>
            </td>
        </tr>
    );
};

export default OrdersTable;
