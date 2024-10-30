"use client";

import { PropsWithChildren, createContext, useContext, MutableRefObject, SetStateAction, Dispatch } from "react";
import { TradeHistoryItem } from "@jup-ag/limit-order-sdk";
import { LaunchData, UserData, LaunchDataUserInput, JoinData, MintData, ListingData } from "../components/Solana/state";
import { CollectionDataUserInput, CollectionData } from "../components/collection/collectionState";
import { AMMData, MMLaunchData, MMUserData, OpenOrder } from "../components/Solana/jupiter_state";
interface AppRootTypes {
    sidePanelCollapsed: boolean;
    setSidePanelCollapsed: Dispatch<SetStateAction<boolean>>;
    launchList: Map<string, LaunchData>;
    homePageList: Map<string, LaunchData>;
    userList: Map<string, UserData>;
    currentUserData: UserData;
    isLaunchDataLoading: boolean;
    isHomePageDataLoading: boolean;
    checkProgramData: () => Promise<void>;
    newLaunchData: MutableRefObject<LaunchDataUserInput>;
    joinData: Map<string, JoinData>;
    mmLaunchData: Map<string, MMLaunchData>;
    mmUserData: Map<string, MMUserData>;
    ammData: Map<string, AMMData>;
    userSOLBalance: number;
    SOLPrice: number;
    mintData: Map<String, MintData>;
    newCollectionData: MutableRefObject<CollectionDataUserInput>;
    collectionList: Map<string, CollectionData>;
    selectedNetwork: string;
    setSelectedNetwork: Dispatch<SetStateAction<string>>;
    listingData: Map<string, ListingData>;
    setListingData: Dispatch<SetStateAction<Map<string, ListingData>>>;
    setMintData: Dispatch<SetStateAction<Map<string, MintData>>>;
    jupPrices: Map<string, number>;
}

export const AppRootContext = createContext<AppRootTypes | null>(null);

export const AppRootContextProvider = ({
    sidePanelCollapsed,
    setSidePanelCollapsed,
    children,
    launchList,
    homePageList,
    userList,
    currentUserData,
    isLaunchDataLoading,
    isHomePageDataLoading,
    checkProgramData,
    newLaunchData,
    joinData,
    mmLaunchData,
    mmUserData,
    ammData,
    userSOLBalance,
    SOLPrice,
    mintData,
    newCollectionData,
    collectionList,
    selectedNetwork,
    setSelectedNetwork,
    listingData,
    setListingData,
    setMintData,
    jupPrices,
}: PropsWithChildren<AppRootTypes>) => {
    return (
        <AppRootContext.Provider
            value={{
                sidePanelCollapsed,
                setSidePanelCollapsed,
                launchList,
                homePageList,
                userList,
                currentUserData,
                isLaunchDataLoading,
                isHomePageDataLoading,
                checkProgramData,
                newLaunchData,
                joinData,
                mmLaunchData,
                mmUserData,
                ammData,
                userSOLBalance,
                SOLPrice,
                mintData,
                newCollectionData,
                collectionList,
                setSelectedNetwork,
                selectedNetwork,
                listingData,
                setListingData,
                setMintData,
                jupPrices,
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
