import { useEffect, useState, useCallback, useRef } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { request_raw_account_data } from "../../../../components/Solana/state";
import {CITIZENS, CitizenUserData} from "../../../../components/curated/citizens/state";

const useCitizenData = () => {
    // State to store the token balance and any error messages
    const [userData, setUserData] = useState<CitizenUserData | null>(null);

    const userDataAccount = useRef<PublicKey | null>(null);

    const [error, setError] = useState<string | null>(null);

    const check_initial_data = useRef<boolean>(true);

    // Get the Solana connection and wallet
    const { connection } = useConnection();
    const wallet = useWallet();

    // Ref to store the subscription ID, persists across re-renders
    const subscriptionRef = useRef<number | null>(null);

    // Function to get the user's token account address
    const getUserDataAccount = useCallback(() => {
        if (!wallet.publicKey) return null;

        return PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), Buffer.from("UserData")],
            CITIZENS,
        )[0];
    }, [wallet.publicKey]);

    // Function to fetch the current assignment data
    const fetchUserData = useCallback(async () => {
        if (!check_initial_data.current) {
            return;
        }

        let userDataAccount = getUserDataAccount();

        if (!userDataAccount) {
            return;
        }

        check_initial_data.current = false;

        let userData = await request_raw_account_data("", userDataAccount);

        if (userData === null) {
            return;
        }

        const [updated_data] = CitizenUserData.struct.deserialize(userData);

        setUserData(updated_data);
    }, [getUserDataAccount]);


    // Callback function to handle account changes
    const handleAccountChange = useCallback((accountInfo: any) => {
        let account_data = Buffer.from(accountInfo.data, "base64");

        if (account_data.length === 0) {
            setUserData(null);
            return;
        }

        const [updated_data] = CitizenUserData.struct.deserialize(account_data);

        setUserData(updated_data);
    }, []);

    // Effect to set up the subscription and fetch initial data
    useEffect(() => {
        if (!wallet || !wallet.publicKey) {
            setUserData(null);
            setError(null);
            return;
        }

        const userAccount = getUserDataAccount();
        if (!userAccount) return;

        // Fetch the initial account data
        fetchUserData();

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
    }, [connection, wallet, fetchUserData, getUserDataAccount, handleAccountChange]);

    

    // Return the current token balance and any error message
    return { userData};
};

export default useCitizenData;
