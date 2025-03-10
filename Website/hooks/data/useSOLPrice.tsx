import { useState, useEffect, useCallback, useRef } from "react";
import { Config } from "../../components/Solana/constants";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, Database } from "firebase/database";
import { firebaseConfig } from "../../components/Solana/constants";
import { WRAPPED_SOL } from "@letscook/sdk";
import { fetchFromFirebase } from "@/utils/firebaseUtils";

export const useSOLPrice = () => {
    const [SOLPrice, setPrice] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const have_price = useRef<boolean>(false);
    const lastDBUpdate = useRef<number>(0);
    const [databaseLoaded, setDatabaseLoaded] = useState<boolean>(false);

    let MAX_RETRIES = 60;
    const currentTries = useRef<number>(0);

    const fetchInitialPrice = useCallback(async () => {
        // if for some reason this is called after the price has been set from the jupiter api then just return
        if (have_price.current || lastDBUpdate.current > 0) return;

        const entry = await fetchFromFirebase(Config.NETWORK + "/prices/" + Config.token);
        
        if (entry === null) {
            return;
        }

        console.log("Setting Price From DB:", entry.price, entry.timestamp);
        lastDBUpdate.current = entry.timestamp;
        setPrice(entry.price);
        setDatabaseLoaded(true);
    }, []);

    const fetchPrice = useCallback(async () => {
        const options = { method: "GET" };

        let mint = WRAPPED_SOL.toString();
        if (Config.NETWORK === "eclipse") {
            mint = "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs";
        }
        const url = `https://api.jup.ag/price/v2?ids=${mint}`;

        try {
            const response = await fetch(url, options);
            const result = await response.json();
            let token_result = result.data[mint];
            if (!token_result) {
                throw new Error("Price not found");
            }

            setPrice(token_result.price);
            setError(null);
            have_price.current = true;

            if (new Date().getTime() - lastDBUpdate.current > 60 * 60 * 1000) {
                await fetch("/.netlify/functions/updateSolPrice", {
                    method: "POST",
                    body: JSON.stringify({}),
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
            }

            return true; // Indicate successful fetch
        } catch (error) {
            //console.log("error getting price", error);
            setError("Failed to fetch SOL price");
            currentTries.current++;
            if (currentTries.current >= MAX_RETRIES) {
                console.log("Max retries reached");
                return true; // Indicate successful fetch
            }
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
        // first try and get from the database
        fetchInitialPrice();
    }, []);

    useEffect(() => {
        if (!databaseLoaded) return;

        // then start fetching the price from jupiter
        startFetchingPrice();

        // Cleanup function to clear the interval when the component unmounts
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [databaseLoaded]);

    return { SOLPrice, loading, error };
};
