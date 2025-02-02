import { useEffect, useMemo, useState } from "react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { PROGRAM } from "../../components/Solana/constants";
import { bignum_to_num } from "../../components/Solana/state";
import { reward_date, reward_schedule } from "../../components/Solana/jupiter_state";
import useAppRoot from "../../context/useAppRoot";
import { bignum } from "@metaplex-foundation/beet";
import { fetchFromFirebase } from "@/utils/firebaseUtils";

// Display-ready type for the table
export interface MarketMakingRow {
    id: string; // mint address string
    symbol: string;
    tokenIcon: string;
    price: {
        value: number;
        display: string;
        decimals: number;
    };
    liquidity: {
        value: number;
        display: string;
    };
    rewards: {
        value: number;
        display: string;
        tokenIcon: string;
    };
    socials: string[];
    hype: {
        positiveVotes: number;
        negativeVotes: number;
        score: number;
        launchId: number;
        tokenMint: string;
    };
}

export interface SortConfig {
    field: string;
    direction: "asc" | "desc";
}

const PRECISION = BigInt(10 ** 9);

const nFormatter = (num: number, digits: number): string => {
    if (num < 1) return num.toFixed(digits);

    const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "k" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "B" },
        { value: 1e12, symbol: "T" },
        { value: 1e15, symbol: "P" },
        { value: 1e18, symbol: "E" },
    ];

    const item = lookup.findLast((item) => num >= item.value);
    return item ? (num / item.value).toFixed(digits).concat(item.symbol) : "0";
};

export const useMarketMakingData = () => {
    const { ammData, SOLPrice, mintData, listingData, jupPrices, mmLaunchData } = useAppRoot();
    const [baseData, setBaseData] = useState<MarketMakingRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "liquidity", direction: "desc" });
    const [searchTerm, setSearchTerm] = useState("");
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);

    // Load Firebase data for initial quick display
    useEffect(() => {
        const loadFirebaseData = async () => {
            try {
                const fbData = await fetchFromFirebase(`${Config.NETWORK}/marketMaking`);
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

    // Process raw data into display-ready format
    useEffect(() => {
        if (!mintData || !listingData || !ammData) {
            setIsLoading(true);
            return;
        }

        try {
            const processedRows: MarketMakingRow[] = [];

            ammData.forEach((amm) => {
                if (bignum_to_num(amm.start_time) === 0) return;

                const listing_key = PublicKey.findProgramAddressSync([amm.base_mint.toBytes(), Buffer.from("Listing")], PROGRAM)[0];

                const listing = listingData.get(listing_key.toString());
                const mint = mintData.get(amm.base_mint.toString());

                if (!listing || !mint) return;

                const price =
                    amm.provider === 0 ? Buffer.from(amm.last_price).readFloatLE(0) : jupPrices.get(amm.base_mint.toString()) || 0;

                const scaled_quote_amount = (BigInt(amm.amm_quote_amount.toString()) * PRECISION) / BigInt(LAMPORTS_PER_SOL);

                const liquidity = (Number(scaled_quote_amount) / Number(PRECISION)) * SOLPrice;
                const total_supply = Number(mint.mint.supply) / Math.pow(10, mint.mint.decimals);
                const market_cap = total_supply * price * SOLPrice;

                const current_reward_date = reward_date(amm);
                const mm_data = mmLaunchData?.get(amm.pool.toString() + "_" + current_reward_date.toString());
                const rewards = mm_data
                    ? bignum_to_num(mm_data.token_rewards) / Math.pow(10, mint.mint.decimals)
                    : reward_schedule(0, amm, mint);

                processedRows.push({
                    id: listing.mint.toString(),
                    symbol: listing.symbol,
                    tokenIcon: mint.icon,
                    price: {
                        value: price,
                        display: price < 1e-3 ? price.toExponential(3) : price.toFixed(Math.min(mint.mint.decimals, 3)),
                        decimals: mint.mint.decimals,
                    },
                    liquidity: {
                        value: liquidity,
                        display: "$" + nFormatter(Math.min(market_cap, 2 * liquidity), 2),
                    },
                    rewards: {
                        value: rewards,
                        display: nFormatter(rewards, 2),
                        tokenIcon: listing.icon,
                    },
                    socials: listing.socials,
                    hype: {
                        positiveVotes: listing.positive_votes,
                        negativeVotes: listing.negative_votes,
                        score: listing.positive_votes - listing.negative_votes,
                        launchId: bignum_to_num(listing.id),
                        tokenMint: listing.mint.toString(),
                    },
                });
            });

            setBaseData(processedRows);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error("Failed to process market making data"));
        } finally {
            setIsLoading(false);
        }
    }, [mintData, listingData, ammData, SOLPrice, jupPrices, mmLaunchData]);

    // Handle sorting and filtering
    const processedData = useMemo(() => {
        const filteredData = [...baseData].filter((row) => row.symbol.toLowerCase().includes(searchTerm.toLowerCase()));

        const sortedData = filteredData.sort((a, b) => {
            const multiplier = sortConfig.direction === "desc" ? -1 : 1;

            switch (sortConfig.field) {
                case "symbol":
                    return multiplier * a.symbol.localeCompare(b.symbol);
                case "price":
                    return multiplier * (a.price.value - b.price.value);
                case "liquidity":
                    return multiplier * (a.liquidity.value - b.liquidity.value);
                case "rewards":
                    return multiplier * (a.rewards.value - b.rewards.value);
                case "hype":
                    return multiplier * (a.hype.score - b.hype.score);
                default:
                    return 0;
            }
        });

        // Calculate pagination
        const totalPages = Math.ceil(sortedData.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

        return {
            data: paginatedData,
            totalItems: sortedData.length,
            totalPages,
        };
    }, [baseData, searchTerm, sortConfig, currentPage, itemsPerPage]);

    return {
        rows: processedData.data,
        totalItems: processedData.totalItems,
        totalPages: processedData.totalPages,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        setItemsPerPage,
        isLoading,
        error,
        sortConfig,
        setSortConfig,
        searchTerm,
        setSearchTerm,
    };
};
