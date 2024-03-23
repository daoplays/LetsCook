"use client";

import { PropsWithChildren, createContext, useContext, MutableRefObject } from "react";
import { TradeHistoryItem } from "@jup-ag/limit-order-sdk";
import { LaunchData, UserData, LaunchDataUserInput, JoinData } from "../components/Solana/state";
import { AMMData, MMLaunchData, MMUserData, OpenOrder } from "../components/Solana/jupiter_state";

interface AppRootTypes {
    launchList: LaunchData[];
    homePageList: LaunchData[];
    tradePageList: Map<string, LaunchData>;
    userList: UserData[];
    currentUserData: UserData;
    isLaunchDataLoading: boolean;
    isHomePageDataLoading: boolean;
    checkProgramData: () => Promise<void>;
    newLaunchData: MutableRefObject<LaunchDataUserInput>;
    joinData: JoinData[];
    mmLaunchData: MMLaunchData[];
    mmUserData: MMUserData[];
    checkUserOrders: () => Promise<void>;
    userOrders: OpenOrder[];
    userTrades: TradeHistoryItem[];
    ammData : AMMData[]
}

export const AppRootContext = createContext<AppRootTypes | null>(null);

export const AppRootContextProvider = ({
    children,
    launchList,
    homePageList,
    tradePageList,
    userList,
    currentUserData,
    isLaunchDataLoading,
    isHomePageDataLoading,
    checkProgramData,
    newLaunchData,
    joinData,
    mmLaunchData,
    mmUserData,
    checkUserOrders,
    userOrders,
    userTrades,
    ammData
}: PropsWithChildren<AppRootTypes>) => {
    return (
        <AppRootContext.Provider
            value={{
                launchList,
                homePageList,
                tradePageList,
                userList,
                currentUserData,
                isLaunchDataLoading,
                isHomePageDataLoading,
                checkProgramData,
                newLaunchData,
                joinData,
                mmLaunchData,
                mmUserData,
                checkUserOrders,
                userOrders,
                userTrades,
                ammData
            }}
        >
            {children}
        </AppRootContext.Provider>
    );
};

const useAppRoot = () => {
    const context = useContext(AppRootContext);

    if (!context) {
        throw new Error("No AppRootContext");
    }

    return context;
};

export default useAppRoot;
