"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import {
    RunLaunchDataGPA,
    LaunchData,
    UserData,
    RunUserDataGPA,
    bignum_to_num,
    LaunchDataUserInput,
    defaultUserInput,
    JoinData,
    RunJoinDataGPA,
} from "../components/Solana/state";
import { RPC_NODE, WSS_NODE, PROGRAM } from "../components/Solana/constants";
import { PublicKey, Connection, Keypair } from "@solana/web3.js";
import { useCallback, useEffect, useState, useRef, PropsWithChildren } from "react";
import { AppRootContextProvider } from "../context/useAppRoot";


import "bootstrap/dist/css/bootstrap.css";

const CheckLaunchData = async (
    check_launch_data,
    setIsLaunchDataLoading,
    setIsHomePageDataLoading,
    setLaunchData,
    filterTable,
    setHomePageData,
) => {
    if (!check_launch_data.current) return;


    setIsLaunchDataLoading(true);
    setIsHomePageDataLoading(true);

    let list = await RunLaunchDataGPA("");

    console.log("check launch data");
    setLaunchData(list);

    let close_filtered = filterTable({ list });

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
    setIsLaunchDataLoading(false);
    setIsHomePageDataLoading(false);
    check_launch_data.current = false;
};

const ContextProviders = ({ children }: PropsWithChildren) => {
    const wallet = useWallet();

    const [isLaunchDataLoading, setIsLaunchDataLoading] = useState(false);
    const [isUserDataLoading, setIsUserDataLoading] = useState(false);
    const [isHomePageDataLoading, setIsHomePageDataLoading] = useState(false);

    const [launch_data, setLaunchData] = useState<LaunchData[] | null>(null);
    const [home_page_data, setHomePageData] = useState<LaunchData[] | null>(null);

    const [user_data, setUserData] = useState<UserData[]>([]);
    const [current_user_data, setCurrentUserData] = useState<UserData | null>(null);

    const [join_data, setJoinData] = useState<JoinData[]>([]);

    const check_launch_data = useRef<boolean>(true);
    const check_user_data = useRef<boolean>(true);
    const check_join_data = useRef<boolean>(true);

    const user_account_ws_id = useRef<number | null>(null);

    const newLaunchData = useRef<LaunchDataUserInput>({ ...defaultUserInput });

    function filterTable({ list }: { list: LaunchData[] }) {
        let current_time = new Date().getTime();
        return list.filter(function (item) {
            //console.log(new Date(bignum_to_num(item.launch_date)), new Date(bignum_to_num(item.end_date)))
            return bignum_to_num(item.end_date) >= current_time;
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

    const CheckUserData = useCallback(async () => {
        if (!check_user_data.current) return;
        if (wallet === null || wallet.publicKey === null || !wallet.connected || wallet.disconnecting) return;

        console.log("check user data", wallet.connected, wallet.connecting, wallet.disconnecting);

        setIsUserDataLoading(true);

        let user_list = await RunUserDataGPA("");
        setUserData(user_list);

        if (wallet.publicKey !== null) {
            for (let i = 0; i < user_list.length; i++) {
                if (user_list[i].user_key.toString() == wallet.publicKey.toString()) {
                    //console.log("have current user", user_list[i]);
                    setCurrentUserData(user_list[i]);
                    break;
                }
            }
        }
        setIsUserDataLoading(false);
        check_user_data.current = false;
    }, [wallet]);

    const CheckJoinedData = useCallback(async () => {
        if (!check_join_data.current) return;
        if (wallet === null || wallet.publicKey === null || !wallet.connected || wallet.disconnecting) return;

        console.log("check join data");

        let join_data_list = await RunJoinDataGPA(wallet);
        setJoinData(join_data_list);
        check_join_data.current = false;
    }, [wallet]);

    const RecheckLaunchData = useCallback(async () => {
        check_launch_data.current = true;
        CheckLaunchData(check_launch_data, setIsLaunchDataLoading, setIsHomePageDataLoading, setLaunchData, filterTable, setHomePageData);
        check_join_data.current = true;
        CheckJoinedData();
    }, [CheckJoinedData]);

    const RecheckUserhData = useCallback(async () => {
        check_user_data.current = true;
        CheckUserData();
        check_user_data.current = true;
    }, [CheckUserData]);

    useEffect(() => {
        CheckLaunchData(check_launch_data, setIsLaunchDataLoading, setIsHomePageDataLoading, setLaunchData, filterTable, setHomePageData);
    }, []);

    useEffect(() => {
        if (wallet === null || wallet.publicKey === null || !wallet.connected || wallet.disconnecting) return;

        check_user_data.current = true;
        check_join_data.current = true;

        CheckUserData();
        CheckJoinedData();
    }, [wallet, CheckUserData, CheckJoinedData]);

    return (
        <AppRootContextProvider
            launchList={launch_data}
            homePageList={home_page_data}
            userList={user_data}
            currentUserData={current_user_data}
            joinData={join_data}
            isLaunchDataLoading={isLaunchDataLoading}
            isUserDataLoading={isUserDataLoading}
            isHomePageDataLoading={isHomePageDataLoading}
            checkLaunchData={RecheckLaunchData}
            checkUserData={RecheckUserhData}
            newLaunchData={newLaunchData}
        >
            {children}
        </AppRootContextProvider>
    );
};

export default ContextProviders;
