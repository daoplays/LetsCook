import { useCallback, useMemo, useState } from 'react';
import { CollectionData, getCollectionPlugins } from '@letscook/sdk/dist/state/collections';
import { bignum_to_num } from '@letscook/sdk/dist/utils';
import useAppRoot from '../../context/useAppRoot';
import { CollectionKeys } from '@/components/Solana/constants';

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
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        field: 'hype',
        direction: 'desc'
    });

    // Process raw collection data into display-ready format
    const processedData = useMemo(() => {
        if (!mintData) return [];

        return collectionList.map(collection => {
            const pluginData = getCollectionPlugins(collection);
            const tokenMint = mintData.get(collection.keys[CollectionKeys.MintAddress].toString());
            
            if (!tokenMint) return null;

            const numAvailable = collection.collection_meta["__kind"] === "RandomUnlimited" 
                ? "Unlimited" 
                : collection.num_available.toString();

            const normalizedPrice = bignum_to_num(collection.swap_price) / Math.pow(10, collection.token_decimals);

            return {
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
            };
        }).filter((row): row is CollectionRow => row !== null);
    }, [collectionList, mintData]);

    // Handle sorting
    const sortedData = useMemo(() => {
        if (!sortConfig.field) {
            return processedData;
        }

        return [...processedData].sort((a, b) => {
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
    }, [processedData, sortConfig]);

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
        sortConfig,
        handleSort
    };
};