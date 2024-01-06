"use client";

import { PropsWithChildren, createContext, useContext } from "react";
import { LaunchData, UserData } from "../components/Solana/state";

interface AppRootTypes {
    launchList: LaunchData[];
    userList: UserData[];
    currentUserData: UserData;
    isLaunchDataLoading: boolean;
    isUserDataLoading: boolean;
}

export const AppRootContext = createContext<AppRootTypes | null>(null);

export const AppRootContextProvider = ({
    children,
    launchList,
    userList,
    currentUserData,
    isLaunchDataLoading,
    isUserDataLoading,
}: PropsWithChildren<AppRootTypes>) => {
    return (
        <AppRootContext.Provider
            value={{
                launchList,
                userList,
                currentUserData,
                isLaunchDataLoading,
                isUserDataLoading,
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
