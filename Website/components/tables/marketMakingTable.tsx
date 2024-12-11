import { useCallback, useEffect, useMemo, useState } from "react";
import React from 'react';
import Image from "next/image";
import { useRouter } from "next/router";
import { MintData, bignum_to_num } from "../Solana/state";
import { PROGRAM, Config } from "../Solana/constants";
import { AMMData, reward_date, reward_schedule } from "../Solana/jupiter_state";
import { FaSort } from "react-icons/fa";
import Loader from "../loader";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "../ui/input";
import { ListingData } from "@letscook/sdk/dist/state/listing";
import { HypeVote } from "../hypeVote";
import Links from "../Buttons/links";
import useAppRoot from "../../context/useAppRoot";
import { getAMMKeyFromMints } from "../Solana/jupiter_state";

interface AMMLaunch {
    amm_data: AMMData;
    mint: MintData;
    listing: ListingData;
    computedValues: {
        price: number;
        liquidity: number;
        liquidityString: string;
        rewards: number;
        hypeScore: number;
    };
}

interface SortConfig {
    field: string;
    direction: 'asc' | 'desc';
}

// Moved to component level to avoid recreation
const tableHeaders = [
    { text: "Token", field: "symbol" },
    { text: "Price", field: "price" },
    { text: "Liquidity", field: "liquidity" },
    { text: "Rewards (24h)", field: "rewards" },
    { text: "Socials", field: null },
    { text: "Hype", field: "hype" },
] as const;

const PRECISION = BigInt(10 ** 9);

// Extracted number formatting logic
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

// Memoized LaunchRow component
const LaunchRow = React.memo(({ 
    amm_launch, 
    onRowClick 
}: { 
    amm_launch: AMMLaunch; 
    onRowClick: (address: string) => void;
}) => {
    const { mint, listing, computedValues } = amm_launch;
    const { price, rewards, liquidityString } = computedValues;

    return (
        <TableRow 
            className="cursor-pointer border-b transition-colors hover:bg-white/10" 
            onClick={() => onRowClick(listing.mint.toString())}
        >
            <TableCell className="w-[150px]">
                <div className="flex items-center gap-3 px-4">
                    <div className="h-10 w-10 overflow-hidden rounded-lg">
                        <Image
                            alt={`${listing.symbol} icon`}
                            src={mint.icon}
                            width={48}
                            height={48}
                            className="object-cover"
                        />
                    </div>
                    <span className="font-semibold">{listing.symbol}</span>
                </div>
            </TableCell>
            <TableCell className="min-w-[120px]">
                <div className="flex items-center justify-center gap-2">
                    <span>
                        {price < 1e-3 ? price.toExponential(3) : price.toFixed(Math.min(mint.mint.decimals, 3))}
                    </span>
                    <Image src={Config.token_image} width={28} height={28} alt="SOL Icon" />
                </div>
            </TableCell>
            <TableCell className="min-w-[120px]">{liquidityString}</TableCell>
            <TableCell>
                <div className="flex items-center justify-center gap-2">
                    <span>{nFormatter(rewards, 2)}</span>
                    <Image src={listing.icon} width={28} height={28} alt="Token Icon" className="rounded" />
                </div>
            </TableCell>
            <TableCell className="min-w-[160px]">
                <Links socials={listing.socials} />
            </TableCell>
            <TableCell>
                <HypeVote
                    launch_type={0}
                    launch_id={listing.id}
                    page_name=""
                    positive_votes={listing.positive_votes}
                    negative_votes={listing.negative_votes}
                    isTradePage={false}
                    listing={listing}
                />
            </TableCell>
        </TableRow>
    );
});

LaunchRow.displayName = 'LaunchRow';

const MarketMakingTable = () => {
    const router = useRouter();
    const { ammData, SOLPrice, mintData, listingData, jupPrices, mmLaunchData } = useAppRoot();
    const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "liquidity", direction: 'desc' });
    const [searchTerm, setSearchTerm] = useState("");
    const [rows, setRows] = useState<AMMLaunch[]>([]);

    // Compute initial data
    useEffect(() => {
        if (!mintData || !listingData || !ammData) return;

        const computeInitialData = () => {
            const amm_launches: AMMLaunch[] = [];
            
            ammData.forEach((amm) => {
                if (bignum_to_num(amm.start_time) === 0) return;

                const listing_key = PublicKey.findProgramAddressSync(
                    [amm.base_mint.toBytes(), Buffer.from("Listing")], 
                    PROGRAM
                )[0];
                
                const listing = listingData.get(listing_key.toString());
                const mint = mintData.get(amm.base_mint.toString());

                if (!listing || !mint) return;

                const price = amm.provider === 0
                    ? Buffer.from(amm.last_price).readFloatLE(0)
                    : jupPrices.get(amm.base_mint.toString()) || 0;

                const scaled_quote_amount = (BigInt(amm.amm_quote_amount.toString()) * PRECISION) / 
                    BigInt(LAMPORTS_PER_SOL);
                
                const liquidity = Number(scaled_quote_amount) / Number(PRECISION) * SOLPrice;
                const total_supply = Number(mint.mint.supply) / Math.pow(10, mint.mint.decimals);
                const market_cap = total_supply * price * SOLPrice;
                
                const current_reward_date = reward_date(amm);
                const mm_data = mmLaunchData?.get(amm.pool.toString() + "_" + current_reward_date.toString());
                const rewards = mm_data
                    ? bignum_to_num(mm_data.token_rewards) / Math.pow(10, mint.mint.decimals)
                    : reward_schedule(0, amm, mint);

                amm_launches.push({
                    amm_data: amm,
                    mint,
                    listing,
                    computedValues: {
                        price,
                        liquidity,
                        liquidityString: "$" + nFormatter(Math.min(market_cap, 2 * liquidity), 2),
                        rewards,
                        hypeScore: listing.positive_votes - listing.negative_votes
                    }
                });
            });

            setRows(amm_launches);
        };

        computeInitialData();
    }, [mintData, listingData, ammData, SOLPrice, jupPrices, mmLaunchData]);

    const handleSort = useCallback((field: string) => {
        setSortConfig(prevConfig => ({
            field,
            direction: 
                prevConfig.field === field && prevConfig.direction === 'desc' 
                ? 'asc' 
                : 'desc'
        }));
    }, []);

    const sortedAndFilteredRows = useMemo(() => {
        return [...rows]
            .filter(row => 
                row.listing.symbol.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => {
                const multiplier = sortConfig.direction === 'desc' ? -1 : 1;
                
                switch (sortConfig.field) {
                    case "symbol":
                        return multiplier * a.listing.symbol.localeCompare(b.listing.symbol);
                    case "price":
                        return multiplier * (a.computedValues.price - b.computedValues.price);
                    case "liquidity":
                        return multiplier * (a.computedValues.liquidity - b.computedValues.liquidity);
                    case "rewards":
                        return multiplier * (a.computedValues.rewards - b.computedValues.rewards);
                    case "hype":
                        return multiplier * (a.computedValues.hypeScore - b.computedValues.hypeScore);
                    default:
                        return 0;
                }
            });
    }, [rows, searchTerm, sortConfig]);

    const handleRowClick = useCallback((mintAddress: string) => {
        const cook_amm_address = getAMMKeyFromMints(new PublicKey(mintAddress), 0);
        router.push("/trade/" + cook_amm_address);
    }, [router]);

    if (!mintData || !listingData || !ammData) {
        return <Loader />;
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex w-full justify-end px-2 lg:-mt-6">
                <Input
                    type="text"
                    placeholder="Search token"
                    className="w-full lg:w-[220px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        {tableHeaders.map((header) => (
                            <TableHead className="min-w-[140px] border-b" key={header.text}>
                                {header.field ? (
                                    <div
                                        onClick={() => header.field && handleSort(header.field)}
                                        className="flex cursor-pointer justify-center font-semibold"
                                    >
                                        {header.text}
                                        <FaSort className="ml-2 h-4 w-4" />
                                    </div>
                                ) : (
                                    header.text
                                )}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedAndFilteredRows.length > 0 ? (
                        sortedAndFilteredRows.map((launch) => (
                            <LaunchRow 
                                key={launch.listing.mint.toString()}
                                amm_launch={launch}
                                onRowClick={handleRowClick}
                            />
                        ))
                    ) : (
                        <TableRow className="h-[60px] border-b">
                            <TableCell 
                                style={{ minWidth: "160px" }} 
                                colSpan={100} 
                                className="opacity-50"
                            >
                                No Tokens yet
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default MarketMakingTable;