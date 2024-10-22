import { useState, useEffect, useCallback, useRef } from "react";
import { Config } from "../../components/Solana/constants";

export const useSOLPrice = () => {
    const [SOLPrice, setPrice] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const have_price = useRef<boolean>(false);

    const fetchPrice = useCallback(async () => {
        const options = { method: "GET" };
        const url = `https://price.jup.ag/v4/price?ids=${Config.token}`;

        try {
            const response = await fetch(url, options);
            const result = await response.json();
            console.log("price result", result);
            setPrice(result.data[Config.token].price);
            setError(null);
            have_price.current = true;
            return true; // Indicate successful fetch
        } catch (error) {
            console.log("error getting price", error);
            setError("Failed to fetch SOL price");
            return false; // Indicate failed fetch
        } finally {
            setLoading(false);
        }
    }, []);

    const startFetchingPrice = useCallback(() => {
        const fetchAndRetry = async () => {
            const success = await fetchPrice();
            if (success) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                console.log("Price fetched successfully, stopping retries");
            } else {
                console.log("Fetch failed, will retry in 1 second");
            }
        };

        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        // Start the interval
        intervalRef.current = setInterval(fetchAndRetry, 1000);

        // Trigger the first fetch immediately
        fetchAndRetry();
    }, [fetchPrice]);

    useEffect(() => {
        startFetchingPrice();

        // Cleanup function to clear the interval when the component unmounts
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [startFetchingPrice]);

    return { SOLPrice, loading, error };
};
