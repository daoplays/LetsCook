"use client";

import { PropsWithChildren, createContext, useContext, MutableRefObject } from "react";
import { LaunchData, UserData, LaunchDataUserInput, JoinData } from "../components/Solana/state";

interface AppRootTypes {
    launchList: LaunchData[];
    homePageList: LaunchData[];
    userList: UserData[];
    currentUserData: UserData;
    isLaunchDataLoading: boolean;
    isUserDataLoading: boolean;
    isHomePageDataLoading: boolean;
    checkLaunchData: () => Promise<void>;
    checkUserData: () => Promise<void>;
    newLaunchData: MutableRefObject<LaunchDataUserInput>;
    joinData: JoinData[];
}

export const AppRootContext = createContext<AppRootTypes | null>(null);

export const AppRootContextProvider = ({
    children,
    launchList,
    homePageList,
    userList,
    currentUserData,
    isLaunchDataLoading,
    isUserDataLoading,
    isHomePageDataLoading,
    checkLaunchData,
    checkUserData,
    newLaunchData,
    joinData,
}: PropsWithChildren<AppRootTypes>) => {
    return (
        <AppRootContext.Provider
            value={{
                launchList,
                homePageList,
                userList,
                currentUserData,
                isLaunchDataLoading,
                isUserDataLoading,
                isHomePageDataLoading,
                checkLaunchData,
                checkUserData,
                newLaunchData,
                joinData,
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
