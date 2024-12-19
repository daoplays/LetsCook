import { useEffect, useState, useCallback, memo } from "react";
import { bignum_to_num, create_LaunchDataInput } from "../Solana/state";
import { Box, Button } from "@chakra-ui/react";
import { FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import { useWallet } from "@solana/wallet-adapter-react";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";
import useAppRoot from "../../context/useAppRoot";
import { useRouter } from "next/router";
import { create_CollectionDataInput, getCollectionPlugins, CollectionPluginData } from "../collection/collectionState";
import { CollectionKeys } from "../Solana/constants";
import { HypeVote } from "../hypeVote";
import convertImageURLToFile from "../../utils/convertImageToBlob";
import * as NProgress from "nprogress";
import formatPrice from "../../utils/formatPrice";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CollectionData } from "@letscook/sdk/dist/state/collections";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

// Type for sort direction
type SortDirection = 'asc' | 'desc' | null;

// Interface for sort state
interface SortState {
    field: string | null;
    direction: SortDirection;
}

interface Header {
    text: string;
    field: string | null;
    tooltip: string;
}

// Table headers configuration
const TABLE_HEADERS: Header[] = [
    { 
        text: "Collection", 
        field: null,
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
        tooltip: "Percentage fee charged when unwrapping NFTs (only relevant for hybrids)"
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

// Memoized sort icon component
const SortIcon = memo(({ field, sortState }: { field: string | null, sortState: SortState }) => {
    if (!field) return null;
    
    if (sortState.field === field) {
        return sortState.direction === 'asc' ? 
            <FaSortUp className="ml-2 h-4 w-4" /> : 
            <FaSortDown className="ml-2 h-4 w-4" />;
    }
    return <FaSort className="ml-2 h-4 w-4 opacity-40" />;
});

SortIcon.displayName = 'SortIcon';

// Memoized table header
const MemoizedTableHeader = memo(({ sortState, onSort }: { 
    sortState: SortState, 
    onSort: (field: string | null) => void 
}) => (
    <TableHeader>
        <TableRow>
            {TABLE_HEADERS.map((header) => (
                <TableHead 
                    key={header.text}
                    className="min-w-[140px] border-b"
                    onClick={() => header.field && onSort(header.field)}
                >
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className={`flex justify-center font-semibold ${header.field ? 'cursor-pointer' : 'cursor-help'}`}>
                                    {header.text}
                                    <SortIcon field={header.field} sortState={sortState} />
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
));

MemoizedTableHeader.displayName = 'MemoizedTableHeader';

// Memoized empty state row
const EmptyStateRow = memo(() => (
    <TableRow
        className="border-b hover:bg-white/10 transition-colors duration-300 h-[60px] cursor-pointer"
    >
        <TableCell style={{ minWidth: "160px" }} colSpan={100} className="opacity-50">
            There are no collections launched yet
        </TableCell>
    </TableRow>
));

EmptyStateRow.displayName = 'EmptyStateRow';

// Memoized Token Icon component
const TokenIcon = memo(({ icon, symbol }: { icon: string; symbol: string }) => (
    <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
                <Image 
                    alt="Token icon" 
                    src={icon} 
                    width={24} 
                    height={24} 
                    className="inline-block object-cover cursor-help" 
                />
            </TooltipTrigger>
            <TooltipContent>
                <p>{symbol}</p>
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
));

TokenIcon.displayName = 'TokenIcon';

// Memoized LaunchCard component
const LaunchCard = memo(({ launch, onEdit }: { 
    launch: CollectionData; 
    onEdit: (e: React.MouseEvent, launch: CollectionData) => void;
}) => {
    const router = useRouter();
    const { sm } = useResponsive();
    const { mintData } = useAppRoot();

    const handleRowClick = useCallback(() => {
        NProgress.start();
        router.push(`/collection/${launch.page_name}`);
    }, [router, launch.page_name]);

    const handleEditClick = useCallback((e: React.MouseEvent) => {
        onEdit(e, launch);
    }, [onEdit, launch]);

    if (!mintData) {
        return null;
    }

    const plugin_data: CollectionPluginData = getCollectionPlugins(launch);
    const token_mint = mintData.get(launch.keys[CollectionKeys.MintAddress].toString());

    let num_available = launch.num_available.toString();
    if (launch.collection_meta["__kind"] === "RandomUnlimited") {
        num_available = "Unlimited";
    }
    
    if (!token_mint) {
        return null;
    }

    return (
        <TableRow
            onClick={handleRowClick}
            className="border-b hover:bg-white/10 transition-colors duration-300 h-[60px] cursor-pointer"
        >
            <TableCell style={{ minWidth: "160px" }}>
                <div className="flex items-center gap-3 px-4">
                    <div className="h-10 w-10 overflow-hidden rounded-lg">
                        <Image 
                            alt="Collection icon"
                            src={launch.collection_icon_url}
                            width={48}
                            height={48}
                            className="object-cover"
                        />
                    </div>
                    <span className="font-semibold">{launch.collection_name}</span>
                </div>
            </TableCell>

            <TableCell style={{ minWidth: "150px" }}>
                <HypeVote
                    launch_type={1}
                    launch_id={bignum_to_num(launch.launch_id)}
                    page_name={launch.page_name}
                    positive_votes={launch.positive_votes}
                    negative_votes={launch.negative_votes}
                    isTradePage={false}
                    tokenMint={null}
                />
            </TableCell>

            <TableCell style={{ minWidth: "170px" }}>
                <div className="items-center gap-5">
                    {formatPrice(bignum_to_num(launch.swap_price) / Math.pow(10, launch.token_decimals), 3)}
                    <span className="ml-2">
                        <TokenIcon icon={token_mint.icon} symbol={token_mint.symbol} />
                    </span>
                </div>
            </TableCell>

            <TableCell style={{ minWidth: "150px" }}>
                {plugin_data.mintOnly ? "--" : launch.swap_fee / 100}
            </TableCell>

            <TableCell style={{ minWidth: "170px" }}>
                {launch.total_supply}
            </TableCell>

            <TableCell style={{ minWidth: "170px" }}>
                {num_available}
            </TableCell>

            <TableCell style={{ minWidth: "100px" }}>
                <Button 
                    onClick={launch.description !== "" ? handleRowClick : handleEditClick}
                    style={{ textDecoration: "none" }}
                >
                    {launch.description !== "" ? "View" : "Edit"}
                </Button>
            </TableCell>
        </TableRow>
    );
});

LaunchCard.displayName = 'LaunchCard';

// Main component
const CollectionDashboardTable = ({ collectionList }: { collectionList: CollectionData[] }) => {
    const router = useRouter();
    const { newCollectionData } = useAppRoot();
    const [sortState, setSortState] = useState<SortState>({
        field: null,
        direction: null
    });

    const handleSort = useCallback((field: string | null) => {
        if (!field) return;
        
        setSortState(prevState => ({
            field,
            direction: 
                prevState.field === field
                    ? prevState.direction === 'asc'
                        ? 'desc'
                        : prevState.direction === 'desc'
                            ? null
                            : 'asc'
                    : 'asc'
        }));
    }, []);

    const getSortedData = useCallback(() => {
        if (!sortState.field || !sortState.direction) {
            return collectionList;
        }

        return [...collectionList].sort((a, b) => {
            let aValue, bValue;

            switch(sortState.field) {
                case 'hype':
                    aValue = a.positive_votes - a.negative_votes;
                    bValue = b.positive_votes - b.negative_votes;
                    break;
                case 'tokensPerNft':
                    aValue = Number(a.swap_price) / Math.pow(10, a.token_decimals);
                    bValue = Number(b.swap_price) / Math.pow(10, b.token_decimals);
                    break;
                case 'unwrapFee':
                    aValue = a.swap_fee;
                    bValue = b.swap_fee;
                    break;
                case 'totalSupply':
                    aValue = Number(a.total_supply);
                    bValue = Number(b.total_supply);
                    break;
                case 'numAvailable':
                    aValue = a.collection_meta["__kind"] === "RandomUnlimited" 
                        ? Infinity 
                        : Number(a.num_available);
                    bValue = b.collection_meta["__kind"] === "RandomUnlimited" 
                        ? Infinity 
                        : Number(b.num_available);
                    break;
                default:
                    return 0;
            }

            return sortState.direction === 'asc' 
                ? aValue - bValue 
                : bValue - aValue;
        });
    }, [collectionList, sortState]);

    const handleEdit = useCallback(async (e: React.MouseEvent, launch: CollectionData) => {
        e.stopPropagation();
        newCollectionData.current = create_CollectionDataInput(launch, true);

        try {
            const [bannerFile, iconFile] = await Promise.all([
                convertImageURLToFile(launch.banner, `${launch.collection_name} banner image`),
                convertImageURLToFile(launch.collection_icon_url, `${launch.collection_name} icon image`)
            ]);

            newCollectionData.current.banner_file = bannerFile;
            newCollectionData.current.icon_file = iconFile;

            router.push("/collection");
        } catch (error) {
            console.error("Error preparing collection edit:", error);
        }
    }, [router, newCollectionData]);

    const sortedData = getSortedData();

    return (
        <Table>
            <MemoizedTableHeader sortState={sortState} onSort={handleSort} />
            <TableBody>
                {sortedData.length > 0 ? (
                    sortedData.map((launch) => (
                        <LaunchCard 
                            key={launch.page_name} 
                            launch={launch}
                            onEdit={handleEdit}
                        />
                    ))
                ) : (
                    <EmptyStateRow />
                )}
            </TableBody>
        </Table>
    );
};

export default memo(CollectionDashboardTable);