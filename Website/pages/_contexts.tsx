"use client";

import { useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { LimitOrderProvider, OrderHistoryItem, TradeHistoryItem, ownerFilter } from "@jup-ag/limit-order-sdk";
import {
    LaunchData,
    UserData,
    bignum_to_num,
    LaunchDataUserInput,
    defaultUserInput,
    JoinData,
    RunGPA,
    serialise_basic_instruction,
    LaunchInstruction,
    get_current_blockhash,
    send_transaction,
    GPAccount,
} from "../components/Solana/state";
import { AMMData, MMLaunchData, MMUserData, OpenOrder } from "../components/Solana/jupiter_state";
import { RPC_NODE, WSS_NODE, PROGRAM, LaunchFlags, SYSTEM_KEY } from "../components/Solana/constants";
import { PublicKey, Connection, Keypair, TransactionInstruction, Transaction } from "@solana/web3.js";
import { useCallback, useEffect, useState, useRef, PropsWithChildren } from "react";
import { AppRootContextProvider } from "../context/useAppRoot";
import bs58 from "bs58";
import "bootstrap/dist/css/bootstrap.css";

async function getUserTrades(wallet: WalletContextState): Promise<TradeHistoryItem[]> {
    if (wallet === null || wallet.publicKey === null || !wallet.connected || wallet.disconnecting) return;

    const connection = new Connection(RPC_NODE);
    let user_pda_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User_PDA")], PROGRAM)[0];

    const limitOrder = new LimitOrderProvider(connection, null);

    const tradeHistory: TradeHistoryItem[] = await limitOrder.getTradeHistory({
        wallet: user_pda_account.toBase58(),
        take: 100, // optional, default is 20, maximum is 100
        // lastCursor: order.id // optional, for pagination
    });

    return tradeHistory;
}

async function getUserOrders(wallet: WalletContextState): Promise<OpenOrder[]> {
    if (wallet === null || wallet.publicKey === null) return [];

    const connection = new Connection(RPC_NODE);
    let user_pda_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User_PDA")], PROGRAM)[0];

    const limitOrder = new LimitOrderProvider(connection, null);
    const openOrder: OpenOrder[] = await limitOrder.getOrders([ownerFilter(user_pda_account)]);

    return openOrder;
}

const GetProgramData = async (check_program_data, setProgramData, setIsLaunchDataLoading, setIsHomePageDataLoading) => {
    if (!check_program_data.current) return;

    setIsLaunchDataLoading(true);
    setIsHomePageDataLoading(true);

    let list = await RunGPA();

    //console.log("check program data");
    //console.trace()
    setProgramData(list);

    //console.log(list);

    setIsLaunchDataLoading(false);
    setIsHomePageDataLoading(false);

    check_program_data.current = false;
};

const ContextProviders = ({ children }: PropsWithChildren) => {
    const wallet = useWallet();

    const [isLaunchDataLoading, setIsLaunchDataLoading] = useState(false);
    const [isHomePageDataLoading, setIsHomePageDataLoading] = useState(false);

    const [program_data, setProgramData] = useState<GPAccount[] | null>(null);

    const [launch_data, setLaunchData] = useState<LaunchData[] | null>(null);
    const [home_page_data, setHomePageData] = useState<LaunchData[] | null>(null);
    const [trade_page_data, setTradePageData] = useState<Map<string, LaunchData> | null>(null);

    const [user_data, setUserData] = useState<UserData[]>([]);
    const [current_user_data, setCurrentUserData] = useState<UserData | null>(null);

    const [join_data, setJoinData] = useState<JoinData[]>([]);
    const [mm_launch_data, setMMLaunchData] = useState<MMLaunchData[]>([]);
    const [mm_user_data, setMMUserData] = useState<MMUserData[]>([]);

    const [amm_data, setAMMData] = useState<AMMData[]>([]);

    const [userOrders, setUserOrders] = useState<OpenOrder[]>([]);
    const [userTrades, setUserTrades] = useState<TradeHistoryItem[]>([]);

    const check_program_data = useRef<boolean>(true);
    const last_program_data_update = useRef<number>(0);

    const user_account_ws_id = useRef<number | null>(null);

    const newLaunchData = useRef<LaunchDataUserInput>({ ...defaultUserInput });

    function closeFilterTable({ list }: { list: LaunchData[] }) {
        let current_time = new Date().getTime();
        return list.filter(function (item) {
            //console.log(new Date(bignum_to_num(item.launch_date)), new Date(bignum_to_num(item.end_date)))
            return bignum_to_num(item.end_date) >= current_time;
        });
    }

    function tradeFilterTable({ list }: { list: LaunchData[] }) {
        return list.filter(function (item) {
            //console.log(new Date(bignum_to_num(item.launch_date)), new Date(bignum_to_num(item.end_date)))
            return item.flags[LaunchFlags.LPState] === 2;
        });
    }

    // websockets for monitoring user data

    const check_user_update = useCallback(
        async (result: any) => {
            //console.log(result);
            // if we have a subscription field check against ws_id

            let event_data = result.data;

            //console.log("have event data", event_data, user_account_ws_id.current);
            let account_data = Buffer.from(event_data, "base64");
            try {
                const [updated_data] = UserData.struct.deserialize(account_data);

                //console.log(updated_data);

                if (current_user_data === null) {
                    setCurrentUserData(updated_data);
                    return;
                }

                if (updated_data.total_points > current_user_data.total_points) {
                    setCurrentUserData(updated_data);
                }
            } catch (error) {
                console.log("error reading user data");
                setCurrentUserData(null);
            }
        },
        [current_user_data],
    );

    // launch account subscription handler
    useEffect(() => {
        const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });

        if (user_account_ws_id.current === null && wallet !== null && wallet.publicKey !== null) {
            //console.log("subscribe to user data");
            let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

            user_account_ws_id.current = connection.onAccountChange(user_data_account, check_user_update, "confirmed");
        }
    }, [wallet, check_user_update]);

    const CloseAccount = useCallback(
        async ({ account }: { account: PublicKey }) => {
            if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

            const instruction_data = serialise_basic_instruction(LaunchInstruction.close_account);

            var account_vector = [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: account, isSigner: false, isWritable: true },
                { pubkey: SYSTEM_KEY, isSigner: false, isWritable: true },
            ];

            const list_instruction = new TransactionInstruction({
                keys: account_vector,
                programId: PROGRAM,
                data: instruction_data,
            });

            let txArgs = await get_current_blockhash("");

            let transaction = new Transaction(txArgs);
            transaction.feePayer = wallet.publicKey;

            transaction.add(list_instruction);

            try {
                let signed_transaction = await wallet.signTransaction(transaction);
                const encoded_transaction = bs58.encode(signed_transaction.serialize());

                var transaction_response = await send_transaction("", encoded_transaction);
            } catch (error) {
                console.log(error);
                return;
            }
        },
        [wallet],
    );

    useEffect(() => {
        if (program_data === null) return;

        //console.log("update data");
        let wallet_bytes = PublicKey.default.toBytes();
        let have_wallet = false;
        // console.log("wallet", wallet !== null ? wallet.toString() : "null");
        if (wallet !== null && wallet.publicKey !== null) {
            wallet_bytes = wallet.publicKey.toBytes();
            have_wallet = true;
        }

        let launch_data: LaunchData[] = [];
        let user_data: UserData[] = [];
        let join_data: JoinData[] = [];
        let mm_launch_data: MMLaunchData[] = [];
        let mm_user_data: MMUserData[] = [];
        let amm_data: AMMData[] = [];

        console.log("program_data", program_data.length);

        for (let i = 0; i < program_data.length; i++) {
            let data = program_data[i].data;

            //CloseAccount({account: program_data[i].pubkey});

            if (data[0] === 0) {
                try {
                    const [launch] = LaunchData.struct.deserialize(data);
                    // console.log("data ", i, launch.page_name);

                    launch_data.push(launch);
                } catch (error) {
                    console.log("bad launch data", data);
                }
                continue;
            }

            if (data[0] === 2) {
                const [user] = UserData.struct.deserialize(data);
                //console.log("user", user);
                user_data.push(user);
                continue;
            }

            if (data[0] === 5) {
                const [mm] = MMLaunchData.struct.deserialize(data);
                // console.log("launch mm", mm);
                mm_launch_data.push(mm);
                continue;
            }

            if (data[0] === 6) {
                const [amm] = AMMData.struct.deserialize(data);
                amm_data.push(amm);
                continue;
            }

            // other data depends on a wallet
            if (!have_wallet) continue;

            // both join and MM user data have the user key in the same place
            let comp_wallet_bytes = new Uint8Array(data.slice(1, 33));

            let isEqual = true;
            for (let i = 0; i < wallet_bytes.length && isEqual; i++) {
                isEqual = wallet_bytes[i] === comp_wallet_bytes[i];
            }

            if (!isEqual) continue;

            if (data[0] === 3) {
                const [join] = JoinData.struct.deserialize(data);
                //console.log("join", join);

                join_data.push(join);
                continue;
            }

            if (data[0] === 4) {
                const [mm_user] = MMUserData.struct.deserialize(data);
                //console.log("user mm", mm_user);

                mm_user_data.push(mm_user);
                continue;
            }
        }

        //console.log("launch data", launch_data);
        setLaunchData(launch_data);
        setUserData(user_data);
        setJoinData(join_data);
        setMMLaunchData(mm_launch_data);
        setMMUserData(mm_user_data);
        setAMMData(amm_data);

        if (have_wallet) {
            for (let i = 0; i < user_data.length; i++) {
                if (user_data[i].user_key.equals(wallet.publicKey)) {
                    setCurrentUserData(user_data[i]);
                    break;
                }
            }
        }

        // set up the home page data
        let close_filtered = closeFilterTable({ list: launch_data });

        let home_page_data: LaunchData[] = [];
        let home_page_map = new Map<number, LaunchData>();
        for (let i = 0; i < close_filtered.length; i++) {
            let date = Math.floor(bignum_to_num(close_filtered[i].end_date) / (24 * 60 * 60 * 1000));
            //console.log(close_filtered[i].symbol, new Date(bignum_to_num(close_filtered[i].end_date)), date);
            if (home_page_map.has(date)) {
                let current_entry: LaunchData = home_page_map.get(date);
                let current_hype = current_entry.positive_votes - current_entry.negative_votes;
                let new_hype = close_filtered[i].positive_votes - close_filtered[i].negative_votes;
                if (new_hype > current_hype) {
                    home_page_map.set(date, close_filtered[i]);
                }
            } else {
                home_page_map.set(date, close_filtered[i]);
            }
        }

        home_page_map.forEach((value, key) => {
            home_page_data.push(value);
        });

        home_page_data.sort((a, b) => {
            if (a.end_date < b.end_date) {
                return -1;
            }
            if (a.end_date > b.end_date) {
                return 1;
            }
            return 0;
        });
        //console.log(home_page_data, bignum_to_num(home_page_data[0].total_supply));
        setHomePageData(home_page_data);

        // set up the map for the trade page
        let trade_filtered = tradeFilterTable({ list: launch_data });
        let trade_page_map = new Map<string, LaunchData>();
        for (let i = 0; i < trade_filtered.length; i++) {
            trade_page_map.set(trade_filtered[i].page_name, trade_filtered[i]);
        }
        setTradePageData(trade_page_map);
    }, [program_data, wallet]);

    const ReGetProgramData = useCallback(async () => {
        check_program_data.current = true;
        GetProgramData(check_program_data, setProgramData, setIsLaunchDataLoading, setIsHomePageDataLoading);
    }, []);

    useEffect(() => {
        let current_time = new Date().getTime();
        if (current_time - last_program_data_update.current < 1000) return;

        last_program_data_update.current = current_time;

        GetProgramData(check_program_data, setProgramData, setIsLaunchDataLoading, setIsHomePageDataLoading);
    }, []);

    const checkUserOrders = useCallback(async () => {
        let userOrders: OpenOrder[] = await getUserOrders(wallet);
        let userTrades: TradeHistoryItem[] = await getUserTrades(wallet);

        setUserOrders(userOrders);
        setUserTrades(userTrades);
    }, [wallet]);

    return (
        <AppRootContextProvider
            launchList={launch_data}
            homePageList={home_page_data}
            tradePageList={trade_page_data}
            userList={user_data}
            currentUserData={current_user_data}
            joinData={join_data}
            mmLaunchData={mm_launch_data}
            mmUserData={mm_user_data}
            isLaunchDataLoading={isLaunchDataLoading}
            isHomePageDataLoading={isHomePageDataLoading}
            checkProgramData={ReGetProgramData}
            newLaunchData={newLaunchData}
            checkUserOrders={checkUserOrders}
            userOrders={userOrders}
            userTrades={userTrades}
            ammData={amm_data}
        >
            {children}
        </AppRootContextProvider>
    );
};

export default ContextProviders;
