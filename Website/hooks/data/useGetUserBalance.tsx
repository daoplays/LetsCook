import { useEffect, useState, useCallback, useRef } from "react";
import { request_current_balance } from "../../components/Solana/state";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

// Collections are already streamed via _contexts so we dont need to have a websocket here aswell
const useGetUserBalance = () => {
    const wallet = useWallet();
    const [error, setError] = useState<string | null>(null);
    const [userBalance, setUserBalance] = useState<number>(0);

    const check_initial = useRef<boolean>(true);

    // Ref to store the subscription ID, persists across re-renders
    const subscriptionRef = useRef<number | null>(null);

    const { connection } = useConnection();

    const fetchInitialBalance = useCallback(async () => {
        if (wallet === null || wallet.publicKey === null || !check_initial.current) {
            return;
        }

        let balance = await request_current_balance("", wallet.publicKey);
        setUserBalance(balance);
        check_initial.current = false;
    }, [wallet]);

    const handleAccountChange = useCallback(async (result: any) => {
        try {
            let balance = result["lamports"] / 1e9;
            setUserBalance(balance);
        } catch (error) {}
    }, []);

    // Effect to set up the subscription and fetch initial data
    useEffect(() => {
        if (!wallet || !wallet.publicKey) {
            setUserBalance(0);
            setError(null);
            return;
        }

        // Fetch the initial account data
        fetchInitialBalance();

        // Only set up a new subscription if one doesn't already exist
        if (subscriptionRef.current === null) {
            subscriptionRef.current = connection.onAccountChange(wallet.publicKey, handleAccountChange);
        }

        // Cleanup function to remove the subscription when the component unmounts
        // or when the dependencies change
        return () => {
            if (subscriptionRef.current !== null) {
                connection.removeAccountChangeListener(subscriptionRef.current);
                subscriptionRef.current = null;
            }
        };
    }, [connection, wallet, fetchInitialBalance, handleAccountChange]);

    // Return the current token balance and any error message
    return { userBalance, error };
};

export default useGetUserBalance;
