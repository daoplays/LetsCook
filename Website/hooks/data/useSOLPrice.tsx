import { useState, useEffect, useCallback, useRef } from "react";
import { Config } from "../../components/Solana/constants";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const useSOLPrice = () => {
    const [SOLPrice, setPrice] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const have_price = useRef<boolean>(false);

    const fetchPrice = useCallback(async () => {
        const options = { method: "GET" };
        const url = `https://price.jup.ag/v4/price?ids=${Config.token}`;

        try {
            const response = await fetch(url, options);
            const result = await response.json();
            console.log("price result", result);
            setPrice(result.data[Config.token].price);
            have_price.current = true;
            setError(null);
        } catch (error) {
            console.log("error getting price", error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const getSOLPrice = useCallback(async () => {
        if (have_price.current) {
            return;
        }
        setLoading(true);
        try {
            await fetchPrice();
        } catch (error) {
            console.log("First attempt failed, retrying after 1 second...");
            await delay(1000); // Wait for 1 second
            try {
                await fetchPrice();
            } catch (retryError) {
                console.log("Retry failed", retryError);
                setError("Failed to fetch SOL price after retry");
            }
        }
    }, [fetchPrice]);

    useEffect(() => {
        getSOLPrice();
    }, [getSOLPrice]);

    return { SOLPrice, loading, error, refetch: getSOLPrice };
};
