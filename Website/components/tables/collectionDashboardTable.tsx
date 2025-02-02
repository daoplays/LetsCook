import React, { memo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Box, Button } from "@chakra-ui/react";
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HypeVote } from '../hypeVote';
import { CollectionData } from '@letscook/sdk/dist/state/collections';
import { useCollectionTable, CollectionRow } from '@/hooks/tables/useCollectionTable';
import * as NProgress from 'nprogress';

interface Header {
    text: string;
    field: string | null;
    tooltip: string;
}

const TABLE_HEADERS: Header[] = [
    { 
        text: "Collection", 
        field: "name",
        tooltip: "NFT collection name and icon"
    },
    { 
        text: "Hype", 
        field: "hype",
        tooltip: "Community hype score"
    },
    { 
        text: "Cost Per NFT", 
        field: "tokensPerNft",
        tooltip: "Price to purchase one NFT in the collection"
    },
    { 
        text: "Unwrap Fee (%)", 
        field: "unwrapFee",
        tooltip: "Percentage fee charged when unwrapping NFTs"
    },
    { 
        text: "Collection Size", 
        field: "totalSupply",
        tooltip: "Total number of NFTs in the collection"
    },
    { 
        text: "NFTs Available", 
        field: "numAvailable",
        tooltip: "Number of NFTs currently available for purchase"
    },
];

// Memoized row component
const CollectionRowComponent = memo(({ row, onEdit }: { 
    row: CollectionRow;
    onEdit: (id: string) => void;
}) => {
    const router = useRouter();

    const handleRowClick = useCallback(() => {
        NProgress.start();
        router.push(`/collection/${row.id}`);
    }, [router, row.id]);

    const handleEditClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(row.id);
    }, [onEdit, row.id]);

    return (
        <TableRow
            className="border-b hover:bg-white/10 transition-colors duration-300 h-[60px] cursor-pointer"
            onClick={handleRowClick}
        >
            <TableCell style={{ minWidth: "160px" }}>
                <div className="flex items-center gap-3 px-4">
                    <div className="h-10 w-10 overflow-hidden rounded-lg">
                        <Image 
                            alt={row.name}
                            src={row.iconUrl}
                            width={48}
                            height={48}
                            className="object-cover"
                        />
                    </div>
                    <span className="font-semibold">{row.name}</span>
                </div>
            </TableCell>

            <TableCell style={{ minWidth: "150px" }}>
                <HypeVote
                    launch_type={1}
                    launch_id={row.hype.launchId}
                    page_name={row.id}
                    positive_votes={row.hype.positiveVotes}
                    negative_votes={row.hype.negativeVotes}
                    isTradePage={false}
                    tokenMint={null}
                />
            </TableCell>

            <TableCell style={{ minWidth: "170px" }}>
                <div className="items-center gap-5">
                    {row.price.display}
                    <span className="ml-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Image 
                                        src={row.price.tokenIcon}
                                        alt={row.price.tokenSymbol}
                                        width={24}
                                        height={24}
                                        className="inline-block object-cover cursor-help"
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{row.price.tokenSymbol}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </span>
                </div>
            </TableCell>

            <TableCell style={{ minWidth: "150px" }}>
                {row.unwrapFee.display}
            </TableCell>

            <TableCell style={{ minWidth: "170px" }}>
                {row.supply.total}
            </TableCell>

            <TableCell style={{ minWidth: "170px" }}>
                {row.supply.available}
            </TableCell>

            <TableCell style={{ minWidth: "100px" }}>
                <Button 
                    onClick={row.hasDescription ? handleRowClick : handleEditClick}
                    style={{ textDecoration: "none" }}
                >
                    {row.hasDescription ? "View" : "Edit"}
                </Button>
            </TableCell>
        </TableRow>
    );
});

CollectionRowComponent.displayName = 'CollectionRowComponent';

// Main component
const CollectionTable = ({ collectionList }: { collectionList: CollectionData[] }) => {
    const router = useRouter();
    const { rows, sortConfig, handleSort } = useCollectionTable(collectionList);

    const handleEdit = useCallback((pageId: string) => {
        // Handle edit logic here
        router.push(`/collection?edit=${pageId}`);
    }, [router]);

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {TABLE_HEADERS.map((header) => (
                        <TableHead 
                            key={header.text}
                            className="min-w-[140px] border-b"
                        >
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div 
                                            className={`flex justify-center font-semibold ${header.field ? 'cursor-pointer' : 'cursor-help'}`}
                                            onClick={() => header.field && handleSort(header.field)}
                                        >
                                            {header.text}
                                            {header.field && (
                                                sortConfig.field === header.field ? (
                                                    sortConfig.direction === 'asc' ? 
                                                        <FaSortUp className="ml-2 h-4 w-4" /> : 
                                                        <FaSortDown className="ml-2 h-4 w-4" />
                                                ) : (
                                                    <FaSort className="ml-2 h-4 w-4 opacity-40" />
                                                )
                                            )}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{header.tooltip}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.length > 0 ? (
                    rows.map((row) => (
                        <CollectionRowComponent 
                            key={row.id} 
                            row={row}
                            onEdit={handleEdit}
                        />
                    ))
                ) : (
                    <TableRow className="h-[60px] border-b">
                        <TableCell 
                            style={{ minWidth: "160px" }} 
                            colSpan={100} 
                            className="opacity-50"
                        >
                            There are no collections launched yet
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export default memo(CollectionTable);