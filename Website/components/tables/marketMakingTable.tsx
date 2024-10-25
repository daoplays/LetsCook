import { useCallback, useEffect, useRef, useState } from "react";
import { Box, HStack, Link, TableContainer, Text, Tooltip } from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";
import { useRouter } from "next/router";
import { Distribution, JoinedLaunch, LaunchData, ListingData, MintData, bignum_to_num } from "../Solana/state";
import { LaunchKeys, LaunchFlags, Extensions, PROGRAM, Config } from "../Solana/constants";
import { AMMData, MMLaunchData, MMUserData, getAMMKey, getAMMKeyFromMints, reward_schedule } from "../Solana/jupiter_state";
import { useWallet } from "@solana/wallet-adapter-react";
import useGetMMTokens from "../../hooks/jupiter/useGetMMTokens";
import { TfiReload } from "react-icons/tfi";
import useAppRoot from "../../context/useAppRoot";
import Launch from "../../pages/launch";
import { Mint } from "@solana/spl-token";
import ShowExtensions, { getExtensions } from "../Solana/extensions";
import { PublicKey } from "@solana/web3.js";
import { HypeVote } from "../hypeVote";
import Links from "../Buttons/links";
import formatPrice from "../../utils/formatPrice";
import { FaSort } from "react-icons/fa";
import Loader from "../loader";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AMMLaunch {
    amm_data: AMMData;
    mint: MintData;
    listing: ListingData;
}

function nFormatter(num: number, digits: number) {
    if (num < 1) {
        return formatPrice(num, digits);
    }
    const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "k" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "B" },
        { value: 1e12, symbol: "T" },
        { value: 1e15, symbol: "P" },
        { value: 1e18, symbol: "E" },
    ];
    const regexp = /\.0+$|(?<=\.[0-9]*[1-9])0+$/;
    const item = lookup.findLast((item) => num >= item.value);
    return item ? (num / item.value).toFixed(digits).replace(regexp, "").concat(item.symbol) : "0";
}

const MarketMakingTable = () => {
    const wallet = useWallet();
    const { ammData, SOLPrice, mintData, listingData, jupPrices } = useAppRoot();
    const [sortedField, setSortedField] = useState<string>("liquidity");
    const [reverseSort, setReverseSort] = useState<boolean>(true);
    const [rows, setRows] = useState<AMMLaunch[]>([]);

    const tableHeaders = [
        { text: "Token", field: "symbol" },
        { text: "Price", field: "price" },
        { text: "Liquidity", field: "liquidity" },
        { text: "Market Cap", field: "fdmc" },
        { text: "Rewards (24h)", field: "rewards" },
        { text: "Socials", field: null },
        { text: "Hype", field: "hype" },
    ];

    const handleSort = (field: string) => {
        if (field === sortedField) {
            setReverseSort(!reverseSort);
        } else {
            setSortedField(field);
            setReverseSort(false);
        }
    };

    useEffect(() => {
        if (!mintData || !listingData || !ammData) return;

        const amm_launches: AMMLaunch[] = [];
        ammData.forEach((amm) => {
            if (bignum_to_num(amm.start_time) === 0) return;

            const listing_key = PublicKey.findProgramAddressSync([amm.base_mint.toBytes(), Buffer.from("Listing")], PROGRAM)[0];
            const listing = listingData.get(listing_key.toString());
            const mint = mintData.get(amm.base_mint.toString());

            if (listing && mint) {
                amm_launches.push({ amm_data: amm, mint, listing });
            }
        });

        setRows([...amm_launches]);
    }, [mintData, listingData, ammData]);

    const sortedRows = [...rows].sort((a, b) => {
        const sortValue = (row: AMMLaunch): string | number => {
            switch (sortedField) {
                case "symbol":
                    return row.listing.symbol;
                case "price":
                    return row.amm_data.provider === 0
                        ? Buffer.from(row.amm_data.last_price).readFloatLE(0)
                        : jupPrices.get(row.amm_data.base_mint.toString()) || 0;
                case "liquidity":
                    return row.amm_data.amm_quote_amount / Math.pow(10, 9);
                case "fdmc": {
                    const supply = Number(row.mint.mint.supply) / Math.pow(10, row.mint.mint.decimals);
                    const price =
                        row.amm_data.provider === 0
                            ? Buffer.from(row.amm_data.last_price).readFloatLE(0)
                            : jupPrices.get(row.amm_data.base_mint.toString()) || 0;
                    return supply * price;
                }
                case "rewards": {
                    const current_date = Math.floor((new Date().getTime() / 1000 - bignum_to_num(row.amm_data.start_time)) / 24 / 60 / 60);
                    return reward_schedule(current_date, row.amm_data, row.mint);
                }
                case "hype":
                    return row.listing.positive_votes - row.listing.negative_votes;
                default:
                    return 0;
            }
        };

        const aVal = sortValue(a);
        const bVal = sortValue(b);

        // Type guard to check if both values are strings
        function isString(value: string | number): value is string {
            return typeof value === "string";
        }

        // If both values are strings, use string comparison
        if (isString(aVal) && isString(bVal)) {
            return reverseSort ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
        }

        // If both values are numbers or can be converted to numbers, use numeric comparison
        const numA = Number(aVal);
        const numB = Number(bVal);

        if (!isNaN(numA) && !isNaN(numB)) {
            return reverseSort ? numB - numA : numA - numB;
        }

        // Fallback comparison if types don't match or conversion fails
        return 0;
    });

    if (!mintData || !listingData || !ammData) {
        return <div className="flex items-center justify-center p-8">Loading...</div>;
    }

    return (
        <Table>
            <TableHeader>
                {tableHeaders.map((header) => (
                    <TableHead className="min-w-[140px] border-b" key={header.text}>
                        {header.field ? (
                            <div
                                onClick={() => header.field && handleSort(header.field)}
                                className="cursor-pointer flex justify-center font-semibold"
                            >
                                {header.text}
                                <FaSort className="ml-2 h-4 w-4" />
                            </div>
                        ) : (
                            header.text
                        )}
                    </TableHead>
                ))}
            </TableHeader>
            <TableBody>
                {sortedRows.map((launch, i) => (
                    <LaunchRow key={i} amm_launch={launch} SOLPrice={SOLPrice} />
                ))}
            </TableBody>
        </Table>
    );
};

const LaunchRow = ({ amm_launch, SOLPrice }: { amm_launch: AMMLaunch; SOLPrice: number }) => {
    const router = useRouter();
    const { ammData, jupPrices } = useAppRoot();

    const current_date = Math.floor((new Date().getTime() / 1000 - bignum_to_num(amm_launch.amm_data.start_time)) / 24 / 60 / 60);
    const mm_rewards = reward_schedule(current_date, amm_launch.amm_data, amm_launch.mint);

    const last_price =
        amm_launch.amm_data.provider === 0
            ? Buffer.from(amm_launch.amm_data.last_price).readFloatLE(0)
            : jupPrices.get(amm_launch.amm_data.base_mint.toString());

    const total_supply = amm_launch.mint ? Number(amm_launch.mint.mint.supply) / Math.pow(10, amm_launch.mint.mint.decimals) : 0;
    const market_cap = total_supply * last_price * SOLPrice;
    const market_cap_string = "$" + nFormatter(market_cap, 2);

    const liquidity = Number(amm_launch.amm_data.amm_quote_amount / Math.pow(10, 9)) * SOLPrice;
    const liquidity_string = "$" + nFormatter(Math.min(market_cap, 2 * liquidity), 2);

    const cook_amm_address = getAMMKeyFromMints(amm_launch.listing.mint, 0);
    const cook_amm = ammData.get(cook_amm_address.toString());
    const have_cook_amm = cook_amm && bignum_to_num(cook_amm.start_time) > 0;

    if (!have_cook_amm) return null;

    return (
        <TableRow className="cursor-pointer border-b transition-colors" onClick={() => router.push("/trade/" + cook_amm_address)}>
            <TableCell className="w-[150px]">
                <div className="flex items-center gap-3 px-4">
                    <div className="h-10 w-10 rounded-lg overflow-hidden">
                        <Image
                            alt={`${amm_launch.listing.symbol} icon`}
                            src={amm_launch.mint.icon}
                            width={48}
                            height={48}
                            className="object-cover"
                        />
                    </div>
                    <span className="font-semibold">${amm_launch.listing.symbol}</span>
                </div>
            </TableCell>
            <TableCell className="min-w-[120px]">
                <div className="flex items-center justify-center gap-2">
                    <span>
                        {last_price < 1e-3 ? last_price.toExponential(3) : last_price.toFixed(Math.min(amm_launch.mint.mint.decimals, 3))}
                    </span>
                    <Image src={Config.token_image} width={28} height={28} alt="SOL Icon" />
                </div>
            </TableCell>
            <TableCell className="min-w-[120px]">{SOLPrice === 0 ? "--" : liquidity_string}</TableCell>
            <TableCell className="min-w-[120px]">{SOLPrice === 0 ? "--" : market_cap_string}</TableCell>
            <TableCell>
                <div className="flex items-center justify-center gap-2">
                    <span>{nFormatter(mm_rewards, 2)}</span>
                    <Image src={amm_launch.listing.icon} width={28} height={28} alt="Token Icon" className="rounded" />
                </div>
            </TableCell>
            <TableCell className="min-w-[160px]">
                <Links socials={amm_launch.listing.socials} />
            </TableCell>
            <TableCell>
                <HypeVote
                    launch_type={0}
                    launch_id={amm_launch.listing.id}
                    page_name=""
                    positive_votes={amm_launch.listing.positive_votes}
                    negative_votes={amm_launch.listing.negative_votes}
                    isTradePage={false}
                    listing={amm_launch.listing}
                />
            </TableCell>
        </TableRow>
    );
};

export default MarketMakingTable;
