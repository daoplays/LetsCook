"use client";

import { PropsWithChildren, createContext, useContext, MutableRefObject, SetStateAction, Dispatch } from "react";
import { TradeHistoryItem } from "@jup-ag/limit-order-sdk";
import { LaunchData, UserData, LaunchDataUserInput, JoinData } from "../components/Solana/state";
import { CollectionDataUserInput, CollectionData, LookupData } from "../components/collection/collectionState";
import { AMMData, MMLaunchData, MMUserData, OpenOrder } from "../components/Solana/jupiter_state";
import { PublicKey } from "@solana/web3.js";
import { Mint } from "@solana/spl-token";
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
    ammData: AMMData[];
    userSOLBalance: number;
    SOLPrice: number;
    mintData: Map<String, Mint>;
    newCollectionData: MutableRefObject<CollectionDataUserInput>;
    collectionList: CollectionData[];
    NFTLookup: MutableRefObject<Map<String, Map<String, LookupData>>>;
    // selectedNetwork: string;
    // setSelectedNetwork: Dispatch<SetStateAction<string>>;
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
    ammData,
    userSOLBalance,
    SOLPrice,
    mintData,
    newCollectionData,
    collectionList,
    NFTLookup,
    // selectedNetwork,
    // setSelectedNetwork,
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
                ammData,
                userSOLBalance,
                SOLPrice,
                mintData,
                newCollectionData,
                collectionList,
                NFTLookup,
                // setSelectedNetwork,
                // selectedNetwork,
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
