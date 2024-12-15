import { useCallback } from "react";
import React from 'react';
import Image from "next/image";
import { useRouter } from "next/router";
import { PublicKey } from "@solana/web3.js";
import { FaSort } from "react-icons/fa";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "../ui/input";
import { Config } from "../Solana/constants";
import { getAMMKeyFromMints } from "../Solana/jupiter_state";
import Loader from "../loader";
import Links from "../Buttons/links";
import { HypeVote } from "../hypeVote";
import { MarketMakingRow, useMarketMakingData } from "@/hooks/tables/useMMTable";

const tableHeaders = [
    { text: "Token", field: "symbol" },
    { text: "Price", field: "price" },
    { text: "Liquidity", field: "liquidity" },
    { text: "Rewards (24h)", field: "rewards" },
    { text: "Socials", field: null },
    { text: "Hype", field: "hype" },
] as const;

// Simplified LaunchRow component that just displays pre-processed data
const LaunchRow = React.memo(({ 
    row, 
    onRowClick 
}: { 
    row: MarketMakingRow; 
    onRowClick: (address: string) => void;
}) => (
    <TableRow 
        className="cursor-pointer border-b transition-colors hover:bg-white/10" 
        onClick={() => onRowClick(row.id)}
    >
        <TableCell className="w-[150px]">
            <div className="flex items-center gap-3 px-4">
                <div className="h-10 w-10 overflow-hidden rounded-lg">
                    <Image
                        alt={`${row.symbol} icon`}
                        src={row.tokenIcon}
                        width={48}
                        height={48}
                        className="object-cover"
                    />
                </div>
                <span className="font-semibold">{row.symbol}</span>
            </div>
        </TableCell>
        <TableCell className="min-w-[120px]">
            <div className="flex items-center justify-center gap-2">
                <span>{row.price.display}</span>
                <Image src={Config.token_image} width={28} height={28} alt="SOL Icon" />
            </div>
        </TableCell>
        <TableCell className="min-w-[120px]">{row.liquidity.display}</TableCell>
        <TableCell>
            <div className="flex items-center justify-center gap-2">
                <span>{row.rewards.display}</span>
                <Image src={row.rewards.tokenIcon} width={28} height={28} alt="Token Icon" className="rounded" />
            </div>
        </TableCell>
        <TableCell className="min-w-[160px]">
            <Links socials={row.socials} />
        </TableCell>
        <TableCell>
            <HypeVote
                launch_type={0}
                launch_id={row.hype.launchId}
                page_name=""
                positive_votes={row.hype.positiveVotes}
                negative_votes={row.hype.negativeVotes}
                isTradePage={false}
                tokenMint={row.hype.tokenMint}
            />
        </TableCell>
    </TableRow>
));

LaunchRow.displayName = 'LaunchRow';

const MarketMakingTable = () => {
    const router = useRouter();
    const { 
        rows, 
        isLoading, 
        error, 
        setSortConfig,
        searchTerm,
        setSearchTerm
    } = useMarketMakingData();

    const handleSort = useCallback((field: string) => {
        setSortConfig(prevConfig => ({
            field,
            direction: 
                prevConfig.field === field && prevConfig.direction === 'desc' 
                ? 'asc' 
                : 'desc'
        }));
    }, [setSortConfig]);

    const handleRowClick = useCallback((mintAddress: string) => {
        const cook_amm_address = getAMMKeyFromMints(new PublicKey(mintAddress), 0);
        router.push("/trade/" + cook_amm_address);
    }, [router]);

    if (isLoading) {
        return <Loader />;
    }

    if (error) {
        return <div>Error loading market making data: {error.message}</div>;
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
                    {rows.length > 0 ? (
                        rows.map((row) => (
                            <LaunchRow 
                                key={row.id}
                                row={row}
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