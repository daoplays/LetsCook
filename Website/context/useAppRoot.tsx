"use client";

import { PropsWithChildren, createContext, useContext, MutableRefObject } from "react";
import { LaunchData, UserData, LaunchDataUserInput } from "../components/Solana/state";

interface AppRootTypes {
    launchList: LaunchData[];
    homePageList: LaunchData[];
    userList: UserData[];
    currentUserData: UserData;
    isLaunchDataLoading: boolean;
    isUserDataLoading: boolean;
    isHomePageDataLoading: boolean;
    checkLaunchData: () => Promise<void>;
    newLaunchData: MutableRefObject<LaunchDataUserInput>;
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
    newLaunchData,
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
                newLaunchData,
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
