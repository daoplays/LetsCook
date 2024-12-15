import { useEffect, useState, useCallback, useRef } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { AssetWithMetadata } from "../../pages/collection/[pageName]";
import { getOwnedCollectionAssets, getOwnedCollectionAssetsDAS } from "./useNFTBalance";

interface UseOwnedNFTsProps {
    collectionAddress: PublicKey | null;
}

interface OwnedNFTsState {
    assets: AssetWithMetadata[];
    isLoading: boolean;
    error: string | null;
    lastUpdateTime: number | null;
}

const POLLING_INTERVAL = 1000; // 1 second
const FALLBACK_TIMEOUT = 5000; // 5 seconds
const MAX_RETRIES = 5;

const useOwnedNFTs = ({ collectionAddress }: UseOwnedNFTsProps) => {
    const [state, setState] = useState<OwnedNFTsState>({
        assets: [],
        isLoading: false,
        error: null,
        lastUpdateTime: null
    });
    
    // Internal state for controlling polling behavior
    const [expectingUpdate, setExpectingUpdate] = useState(true);
    
    const wallet = useWallet();
    
    const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const retryCountRef = useRef(0);
    const previousAssetsLengthRef = useRef<number | null>(null);

    const clearTimeouts = useCallback(() => {
        if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current);
            pollingTimeoutRef.current = null;
        }
        if (fallbackTimeoutRef.current) {
            clearTimeout(fallbackTimeoutRef.current);
            fallbackTimeoutRef.current = null;
        }
    }, []);

    const fetchAssets = useCallback(async (useFallback: boolean = false) => {
        if (!collectionAddress || !wallet.publicKey) return;

        try {
            setState(prev => ({ ...prev, isLoading: true }));
            
            let newAssets: Map<string, AssetWithMetadata>;
            
            if (useFallback) {
                // Use on-chain data as fallback
                newAssets = await getOwnedCollectionAssets(collectionAddress, wallet.publicKey);
                if (!newAssets) throw new Error("Failed to fetch assets from blockchain");
            } else {
                // Use DAS
                newAssets = await getOwnedCollectionAssetsDAS(collectionAddress, wallet.publicKey);
                if (!newAssets) throw new Error("Failed to fetch assets from DAS");
            }

            const assetsArray = Array.from(newAssets.values());
            
            // Check if the number of assets has changed
            const hasChanged = previousAssetsLengthRef.current !== null && 
                             previousAssetsLengthRef.current !== assetsArray.length;
            
            previousAssetsLengthRef.current = assetsArray.length;

            setState(prev => ({
                assets: assetsArray,
                isLoading: false,
                error: null,
                lastUpdateTime: Date.now()
            }));

            // If we're expecting a change and we see one, we can stop polling
            if (expectingUpdate && hasChanged) {
                clearTimeouts();
                setExpectingUpdate(false);
            }

        } catch (error) {
            console.error("Error fetching owned NFTs:", error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message
            }));
        }
    }, [collectionAddress, wallet.publicKey, expectingUpdate, clearTimeouts]);

    useEffect(() => {
        if (!collectionAddress || !wallet.publicKey) {
            setState({
                assets: [],
                isLoading: false,
                error: null,
                lastUpdateTime: null
            });
            return;
        }

        // Initial fetch
        fetchAssets();

        // If we're expecting an update, start polling
        if (expectingUpdate) {
            // Set up fallback timeout
            fallbackTimeoutRef.current = setTimeout(async () => {
                console.log("DAS timeout reached, using fallback");
                await fetchAssets(true); // Use fallback
                clearTimeouts(); // Clear all timeouts regardless of whether we saw a change
                setExpectingUpdate(false); // Stop expecting updates after fallback
                retryCountRef.current = MAX_RETRIES; // Ensure we stop polling
            }, FALLBACK_TIMEOUT);

            // Set up polling
            const poll = async () => {
                await fetchAssets();
                retryCountRef.current++;

                if (retryCountRef.current < MAX_RETRIES && expectingUpdate) {
                    pollingTimeoutRef.current = setTimeout(poll, POLLING_INTERVAL);
                } else {
                    clearTimeouts();
                    setExpectingUpdate(false);
                }
            };

            pollingTimeoutRef.current = setTimeout(poll, POLLING_INTERVAL);
        }

        return () => {
            clearTimeouts();
            retryCountRef.current = 0;
            previousAssetsLengthRef.current = null;
        };
    }, [collectionAddress, wallet.publicKey, expectingUpdate, fetchAssets, clearTimeouts]);

    const refetch = useCallback(() => {
        clearTimeouts();
        retryCountRef.current = 0;
        previousAssetsLengthRef.current = null;
        setExpectingUpdate(true);
        return fetchAssets();
    }, [fetchAssets, clearTimeouts]);

    return {
        assets: state.assets,
        refetch,
        setExpectingUpdate
    };
};

export default useOwnedNFTs;