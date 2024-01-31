import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import Head from "next/head";
import { LimitOrderProvider } from "@jup-ag/limit-order-sdk";
import BN from "bn.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { get_current_blockhash, send_transaction, serialise_HypeVote_instruction, UserData } from "../../components/Solana/state";
import bs58 from "bs58";
import { ownerFilter } from "@jup-ag/limit-order-sdk";
import { OrderHistoryItem, TradeHistoryItem, Order } from "@jup-ag/limit-order-sdk";
import { LaunchData, bignum_to_num, myU64, JoinData, request_raw_account_data } from "../../components/Solana/state";
import { PROGRAM, RPC_NODE, WSS_NODE } from "../../components/Solana/constants";
import { useCallback, useEffect, useState, useRef } from "react";
import { PublicKey, LAMPORTS_PER_SOL, Connection, Keypair, Transaction } from "@solana/web3.js";
import { HStack, VStack } from "@chakra-ui/react";
import OrdersTable from "../../components/tables/ordersTable";

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

interface OpenOrder {
    publicKey: PublicKey;
    account: Order;
}

const TradePage = () => {
    const wallet = useWallet();
    const router = useRouter();
    const { pageName } = router.query;
    const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);

    async function getUserOrders() {
        const connection = new Connection(RPC_NODE);

        const limitOrder = new LimitOrderProvider(connection, null);
        const openOrder: OpenOrder[] = await limitOrder.getOrders([ownerFilter(wallet.publicKey)]);

        const orderHistory: OrderHistoryItem[] = await limitOrder.getOrderHistory({
            wallet: wallet.publicKey.toBase58(),
            take: 20, // optional, default is 20, maximum is 100
            // lastCursor: order.id // optional, for pagination
        });

        const tradeHistory: TradeHistoryItem[] = await limitOrder.getTradeHistory({
            wallet: wallet.publicKey.toBase58(),
            take: 20, // optional, default is 20, maximum is 100
            // lastCursor: order.id // optional, for pagination
        });

        console.log(openOrder);
        console.log(orderHistory);
        setOpenOrders(openOrder);
    }

    const SubmitOrder = useCallback(async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        const usdc_mint = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
        const wsol_mint = new PublicKey("So11111111111111111111111111111111111111112");

        const connection = new Connection(RPC_NODE);

        const limitOrder = new LimitOrderProvider(connection, null);
        // Base key are used to generate a unique order id
        const base = Keypair.generate();

        const { tx, orderPubKey } = await limitOrder.createOrder({
            owner: wallet.publicKey,
            inAmount: new BN(10000), // 1000000 => 1 USDC if inputToken.address is USDC mint
            outAmount: new BN(1000000000),
            inputMint: usdc_mint,
            outputMint: wsol_mint,
            expiredAt: null, // new BN(new Date().valueOf() / 1000)
            base: base.publicKey,
        });
        console.log(tx.instructions);
        console.log(tx.instructions[0].programId.toString());

        //console.log(tx.instructions[0].programId.toString())

        let check_account = await getAssociatedTokenAddress(
            usdc_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );
        let check_account2 = await getAssociatedTokenAddress(
            usdc_mint, // mint
            base.publicKey, // owner
            true, // allow owner off curve
        );
        let check_account3 = await getAssociatedTokenAddress(
            wsol_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );
        let check_account4 = await getAssociatedTokenAddress(
            wsol_mint, // mint
            base.publicKey, // owner
            true, // allow owner off curve
        );
        console.log("user token", check_account.toString());
        console.log("base token", check_account2.toString());

        console.log("user quote", check_account3.toString());
        console.log("base quote", check_account4.toString());

        let test_txArgs = await get_current_blockhash("");

        let tst_transaction = new Transaction(test_txArgs);
        tst_transaction.feePayer = wallet.publicKey;

        console.log(tx);

        tst_transaction.add(tx.instructions[0]);

        tst_transaction.partialSign(base);

        try {
            let signed_transaction = await wallet.signTransaction(tst_transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);
            console.log(transaction_response);
        } catch (error) {
            console.log(error);
        }
    }, [wallet]);

    const CancelOrder = useCallback(async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;
        if (openOrders.length == 0) return;

        console.log(bignum_to_num(openOrders[0].account.borrowMakingAmount));
        console.log(bignum_to_num(openOrders[0].account.makingAmount));
        console.log(bignum_to_num(openOrders[0].account.oriMakingAmount));
        console.log(bignum_to_num(openOrders[0].account.oriTakingAmount));

        const connection = new Connection(RPC_NODE);

        const limitOrder = new LimitOrderProvider(connection, null);
        // Base key are used to generate a unique order id

        const tx = await limitOrder.cancelOrder({
            owner: wallet.publicKey,
            orderPubKey: openOrders[0].publicKey,
        });

        console.log(tx);
        let test_txArgs = await get_current_blockhash("");

        let tst_transaction = new Transaction(test_txArgs);
        tst_transaction.feePayer = wallet.publicKey;

        tst_transaction.add(tx.instructions[0]);

        try {
            let signed_transaction = await wallet.signTransaction(tst_transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);
            console.log(transaction_response);
        } catch (error) {
            console.log(error);
        }
    }, [openOrders, wallet]);

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Trade</title>
            </Head>
            <main style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)" }}>
                <VStack>
                    <OrdersTable />
                </VStack>
            </main>
        </>
    );
};

export default TradePage;
