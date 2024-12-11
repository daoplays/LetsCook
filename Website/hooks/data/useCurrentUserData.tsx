import { useEffect, useState, useCallback, useRef } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { PROGRAM } from "@/components/Solana/constants";
import { UserData } from "@/components/Solana/state";

interface useAMMProps {
    user: PublicKey | null;
}

export const enum Achievements {
    UserName,
    Hype1,
    Hype25,
    Hype50,
    Hype100,
    Mint1,
    Mint25,
    Mint50,
    Mint100,
    Unwrap1,
    Unwrap25,
    Unwrap50,
    Unwrap100,
    Sauce100,
    Sauce500,
    Sauce1000,
    Sauce10k,
    LENGTH,
}
export const enum Achievement8 {
    LENGTH,
}

export const enum Achievement32 {
    NumMints,
    NumWraps,
    LENGTH,
}

export const enum Achievement64 {
    LENGTH,
}

export function checkAchievements(userData: UserData) {
    let achievements = new Array<boolean>(Achievements.LENGTH).fill(false);

    if (userData.user_name !== "") {
        achievements[Achievements.UserName] = true;
    }

    if (userData.total_points >= 100) {
        achievements[Achievements.Sauce100] = true;
    }
    if (userData.total_points >= 500) {
        achievements[Achievements.Sauce500] = true;
    }
    if (userData.total_points >= 1000) {
        achievements[Achievements.Sauce1000] = true;
    }
    if (userData.total_points >= 10000) {
        achievements[Achievements.Sauce10k] = true;
    }

    if (userData.votes.length >= 1) {
        achievements[Achievements.Hype1] = true;
    }
    if (userData.votes.length >= 25) {
        achievements[Achievements.Hype25] = true;
    }
    if (userData.votes.length >= 50) {
        achievements[Achievements.Hype50] = true;
    }
    if (userData.votes.length >= 100) {
        achievements[Achievements.Hype100] = true;
    }

    if (userData.stats.values.length >= Achievement32.NumMints && userData.stats.values[Achievement32.NumMints] >= 1) {
        achievements[Achievements.Mint1] = true;
    }
    if (userData.stats.values.length >= Achievement32.NumMints && userData.stats.values[Achievement32.NumMints] >= 25) {
        achievements[Achievements.Mint25] = true;
    }
    if (userData.stats.values.length >= Achievement32.NumMints && userData.stats.values[Achievement32.NumMints] >= 50) {
        achievements[Achievements.Mint50] = true;
    }
    if (userData.stats.values.length >= Achievement32.NumMints && userData.stats.values[Achievement32.NumMints] >= 100) {
        achievements[Achievements.Mint100] = true;
    }

    if (userData.stats.values.length >= Achievement32.NumWraps && userData.stats.values[Achievement32.NumWraps] >= 1) {
        achievements[Achievements.Unwrap1] = true;
    }
    if (userData.stats.values.length >= Achievement32.NumWraps && userData.stats.values[Achievement32.NumWraps] >= 25) {
        achievements[Achievements.Unwrap25] = true;
    }
    if (userData.stats.values.length >= Achievement32.NumWraps && userData.stats.values[Achievement32.NumWraps] >= 50) {
        achievements[Achievements.Unwrap50] = true;
    }
    if (userData.stats.values.length >= Achievement32.NumWraps && userData.stats.values[Achievement32.NumWraps] >= 100) {
        achievements[Achievements.Unwrap100] = true;
    }
    
    return achievements;

}


// Collections are already streamed via _contexts so we dont need to have a websocket here aswell
const useCurrentUserData = (props: useAMMProps | null) => {
    // State to store the token balance and any error messages
    const [userData, setUserData] = useState<UserData | null>(null);
    const [achievements, setAchievements] = useState<boolean[]>([]);
    const [error, setError] = useState<string | null>(null);

    const check_initial_data = useRef<boolean>(true);

    // Ref to store the subscription ID, persists across re-renders
    const subscriptionRef = useRef<number | null>(null);
    

    const { connection } = useConnection();

    const user = props?.user || null;

    const getUserDataAccount = useCallback(() => {
        if (!user) {
            setUserData(null);
            setError("No page name provided");
            return;
        }
        return  PublicKey.findProgramAddressSync([user.toBytes(), Buffer.from("User")], PROGRAM)[0];
    }, [user]);

    // Function to fetch the current assignment data
    const fetchInitialUserData = useCallback(async () => {
        if (!check_initial_data.current) {
            return;
        }

        let account = getUserDataAccount();

        if (!account) {
            return;
        }

        check_initial_data.current = false;

        let userAccountInfo = await connection.getAccountInfo(account);

        if (userAccountInfo === null) {
            return;
        }
        const [userData] = UserData.struct.deserialize(userAccountInfo.data);

        setUserData(userData);

        let achievements = checkAchievements(userData);
        setAchievements(achievements);

      
    }, [getUserDataAccount]);



    // Callback function to handle account changes
    const handleAccountChange = useCallback((accountInfo: any) => {
        let account_data = Buffer.from(accountInfo.data, "base64");

        if (account_data.length === 0) {
            setUserData(null);
            return;
        }

        const [updated_data] = UserData.struct.deserialize(account_data);

        setUserData(updated_data);

        let achievements = checkAchievements(userData);
        setAchievements(achievements);
    }, []);

    // Effect to set up the subscription and fetch initial data
    useEffect(() => {
        if (!user) {
            setUserData(null);
            setError(null);
            return;
        }

        const userAccount = getUserDataAccount();
        if (!userAccount) return;

        // Fetch the initial account data
        fetchInitialUserData();

        // Only set up a new subscription if one doesn't already exist
        if (subscriptionRef.current === null) {
            subscriptionRef.current = connection.onAccountChange(userAccount, handleAccountChange);
        }

       

        // Cleanup function to remove the subscription when the component unmounts
        // or when the dependencies change
        return () => {
            if (subscriptionRef.current !== null) {
                connection.removeAccountChangeListener(subscriptionRef.current);
                subscriptionRef.current = null;
            }
        };
    }, [
        connection,
        user,
        fetchInitialUserData,
        getUserDataAccount,
        handleAccountChange,
    ]);

    // Return the current token balance and any error message
    return {
        userData,
        achievements,
        error,
    };
};

export default useCurrentUserData;
