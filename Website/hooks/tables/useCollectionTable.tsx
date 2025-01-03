import { useCallback, useMemo, useState, useEffect } from 'react';
import { CollectionData, getCollectionPlugins } from '@letscook/sdk/dist/state/collections';
import useAppRoot from '../../context/useAppRoot';
import { fetchFromFirebase } from '@/utils/firebaseUtils';
import { CollectionKeys, Config } from '@/components/Solana/constants';
import { bignum_to_num } from '@letscook/sdk';

export interface CollectionRow {
    id: string;                    // page_name
    name: string;                  // collection_name
    iconUrl: string;              // collection_icon_url
    hype: {
        positiveVotes: number;
        negativeVotes: number;
        score: number;
        launchId: number;
    };
    price: {
        value: number;           // normalized price
        display: string;        // formatted price
        tokenIcon: string;     // token icon URL
        tokenSymbol: string;  // token symbol
    };
    unwrapFee: {
        value: number;        // fee in basis points
        display: string;     // formatted percentage
        isMintOnly: boolean; // if true, shows "--"
    };
    supply: {
        total: number;
        available: string;    // string because it can be "Unlimited"
    };
    hasDescription: boolean;  // used to determine View/Edit button
}

export interface SortConfig {
    field: string | null;
    direction: 'asc' | 'desc';
}

export const useCollectionTable = (collectionList: CollectionData[]) => {
    const { mintData } = useAppRoot();
    const [baseData, setBaseData] = useState<CollectionRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        field: 'hype',
        direction: 'desc'
    });

    // Load Firebase data for initial quick display
    useEffect(() => {
        const loadFirebaseData = async () => {
            try {
                const fbData = await fetchFromFirebase(`${Config.NETWORK}/collections`);
                if (fbData?.rows && fbData.timestamp) {
                    setBaseData(fbData.rows);
                    setIsLoading(false);
                }
            } catch (err) {
                console.warn("Failed to load Firebase data:", err);
            } finally {
                // Mark initial load as complete regardless of success or failure
                setInitialLoadComplete(true);
            }
        };

        loadFirebaseData();
    }, []);

    // Process raw collection data into display-ready format
    useEffect(() => {
        if (!initialLoadComplete || !mintData || !collectionList) {
            return;
        }

        try {
            const processedRows: CollectionRow[] = [];

            for (const collection of collectionList) {
                const pluginData = getCollectionPlugins(collection);
                const tokenMint = mintData.get(collection.keys[CollectionKeys.MintAddress].toString());
                
                if (!tokenMint) continue;

                const numAvailable = collection.collection_meta["__kind"] === "RandomUnlimited" 
                    ? "Unlimited" 
                    : collection.num_available.toString();

                const normalizedPrice = bignum_to_num(collection.swap_price) / Math.pow(10, collection.token_decimals);

                processedRows.push({
                    id: collection.page_name,
                    name: collection.collection_name,
                    iconUrl: collection.collection_icon_url,
                    hype: {
                        positiveVotes: collection.positive_votes,
                        negativeVotes: collection.negative_votes,
                        score: collection.positive_votes - collection.negative_votes,
                        launchId: bignum_to_num(collection.launch_id)
                    },
                    price: {
                        value: normalizedPrice,
                        display: normalizedPrice.toFixed(3),
                        tokenIcon: tokenMint.icon,
                        tokenSymbol: tokenMint.symbol
                    },
                    unwrapFee: {
                        value: collection.swap_fee,
                        display: pluginData.mintOnly ? "--" : (collection.swap_fee / 100).toString(),
                        isMintOnly: pluginData.mintOnly
                    },
                    supply: {
                        total: Number(collection.total_supply),
                        available: numAvailable
                    },
                    hasDescription: collection.description !== ""
                });
            }

            setBaseData(processedRows);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to process collection data'));
        } finally {
            setIsLoading(false);
        }
    }, [mintData, collectionList, initialLoadComplete]);

    // Handle sorting
    const sortedData = useMemo(() => {
        if (!sortConfig.field) {
            return baseData;
        }

        return [...baseData].sort((a, b) => {
            let comparison = 0;
            
            switch(sortConfig.field) {
                case 'name':
                    return sortConfig.direction === 'asc' 
                        ? a.name.localeCompare(b.name)
                        : b.name.localeCompare(a.name);
                case 'hype':
                    comparison = a.hype.score - b.hype.score;
                    break;
                case 'tokensPerNft':
                    comparison = a.price.value - b.price.value;
                    break;
                case 'unwrapFee':
                    comparison = a.unwrapFee.value - b.unwrapFee.value;
                    break;
                case 'totalSupply':
                    comparison = a.supply.total - b.supply.total;
                    break;
                case 'numAvailable':
                    const aValue = a.supply.available === "Unlimited" ? Infinity : Number(a.supply.available);
                    const bValue = b.supply.available === "Unlimited" ? Infinity : Number(b.supply.available);
                    comparison = aValue - bValue;
                    break;
                default:
                    return 0;
            }

            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
    }, [baseData, sortConfig]);

    const handleSort = useCallback((field: string | null) => {
        if (!field) return;
        
        setSortConfig(prevState => ({
            field,
            direction: 
                prevState.field === field && prevState.direction === 'asc'
                    ? 'desc'
                    : 'asc'
        }));
    }, []);

    return {
        rows: sortedData,
        isLoading,
        error,
        sortConfig,
        handleSort
    };
};