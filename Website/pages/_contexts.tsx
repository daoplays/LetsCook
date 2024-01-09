"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { RunLaunchDataGPA, LaunchData, UserData, RunUserDataGPA, bignum_to_num } from "../components/Solana/state";
import { useCallback, useEffect, useState, useRef, PropsWithChildren } from "react";
import { AppRootContextProvider } from "../context/useAppRoot";
import "bootstrap/dist/css/bootstrap.css";

const ContextProviders = ({ children }: PropsWithChildren) => {
    const wallet = useWallet();

    const [isLaunchDataLoading, setIsLaunchDataLoading] = useState(false);
    const [isUserDataLoading, setIsUserDataLoading] = useState(false);
    const [isHomePageDataLoading, setIsHomePageDataLoading] = useState(false);

    const [launch_data, setLaunchData] = useState<LaunchData[] | null>(null);
    const [home_page_data, setHomePageData] = useState<LaunchData[] | null>(null);

    const [user_data, setUserData] = useState<UserData[]>([]);
    const [current_user_data, setCurrentUserData] = useState<UserData | null>(null);

    const check_launch_data = useRef<boolean>(true);
    const check_user_data = useRef<boolean>(true);

    function filterTable({ list }: { list: LaunchData[] }) {
        let current_time = new Date().getTime();
        return list.filter(function (item) {
            //console.log(new Date(bignum_to_num(item.launch_date)), new Date(bignum_to_num(item.end_date)))
            return bignum_to_num(item.end_date) >= current_time;
        });
    }

    const CheckLaunchData = useCallback(async () => {
        if (!check_launch_data.current) return;

        setIsLaunchDataLoading(true);
        setIsHomePageDataLoading(true);

        let list = await RunLaunchDataGPA("");
        let close_filtered = filterTable({ list });
        //console.log("running GPA", list);
        setLaunchData(close_filtered);

        let home_page_data: LaunchData[] = [];
        let home_page_map = new Map<number, LaunchData>();
        for (let i = 0; i < close_filtered.length; i++) {
            let date = Math.floor(bignum_to_num(close_filtered[i].end_date) / (24 * 60 * 60 * 1000));
            //console.log(bignum_to_num(close_filtered[i].end_date), date);
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

        setHomePageData(home_page_data);
        check_launch_data.current = false;
        setIsLaunchDataLoading(false);
        setIsHomePageDataLoading(false);
    }, []);

    const CheckUserData = useCallback(async () => {
        if (!check_user_data.current) return;

        setIsUserDataLoading(true);

        let user_list = await RunUserDataGPA("");
        setUserData(user_list);

        if (wallet.publicKey !== null) {
            for (let i = 0; i < user_list.length; i++) {
                if (user_list[i].user_key.toString() == wallet.publicKey.toString()) {
                    console.log("have current user", user_list[i]);
                    setCurrentUserData(user_list[i]);
                    break;
                }
            }
        }

        setIsUserDataLoading(false);
    }, [wallet.publicKey]);

    const RecheckLaunchData = useCallback(async () => {
        check_launch_data.current = true;
        CheckLaunchData();
    }, [CheckLaunchData]);

    useEffect(() => {
        CheckLaunchData();
    }, [CheckLaunchData, wallet]);

    useEffect(() => {
        CheckUserData();
    }, [CheckUserData, wallet]);

    useEffect(() => {
        check_launch_data.current = true;
        check_user_data.current = true;
    }, [wallet]);

    return (
        <AppRootContextProvider
            launchList={launch_data}
            homePageList={home_page_data}
            userList={user_data}
            currentUserData={current_user_data}
            isLaunchDataLoading={isLaunchDataLoading}
            isUserDataLoading={isUserDataLoading}
            isHomePageDataLoading={isHomePageDataLoading}
            checkLaunchData={RecheckLaunchData}
        >
            {children}
        </AppRootContextProvider>
    );
};

export default ContextProviders;
