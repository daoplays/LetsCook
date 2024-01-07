"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { RunLaunchDataGPA, LaunchData, UserData, RunUserDataGPA } from "../components/Solana/state";
import { useCallback, useEffect, useState, useRef, PropsWithChildren } from "react";
import { AppRootContextProvider } from "../context/useAppRoot";
import "bootstrap/dist/css/bootstrap.css";

const ContextProviders = ({ children }: PropsWithChildren) => {
    const wallet = useWallet();

    const [isLaunchDataLoading, setIsLaunchDataLoading] = useState(false);
    const [isUserDataLoading, setIsUserDataLoading] = useState(false);

    const [launch_data, setLaunchData] = useState<LaunchData[]>([]);

    const [user_data, setUserData] = useState<UserData[]>([]);
    const [current_user_data, setCurrentUserData] = useState<UserData | null>(null);

    const check_launch_data = useRef<boolean>(true);
    const check_user_data = useRef<boolean>(true);



    const CheckLaunchData = useCallback(async () => {
        if (!check_launch_data.current) return;

        setIsLaunchDataLoading(true);

        let list = await RunLaunchDataGPA("");
        console.log("running GPA", list);
        setLaunchData(list);

        check_launch_data.current = false;
        setIsLaunchDataLoading(false);
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
        CheckLaunchData()
      
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
            userList={user_data}
            currentUserData={current_user_data}
            isLaunchDataLoading={isLaunchDataLoading}
            isUserDataLoading={isUserDataLoading}
            checkLaunchData={RecheckLaunchData}
        >
            {children}
        </AppRootContextProvider>
    );
};

export default ContextProviders;
