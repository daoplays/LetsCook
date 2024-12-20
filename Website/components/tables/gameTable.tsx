import { useEffect, useState } from "react";
import {  bignum_to_num } from "../Solana/state";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { Box, Button, Center, filter, Flex, HStack, Link, TableContainer, Text } from "@chakra-ui/react";
import { TfiReload } from "react-icons/tfi";
import { HypeVote } from "../hypeVote";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";
import useAppRoot from "../../context/useAppRoot";
import Links from "../Buttons/links";
import { FaSort } from "react-icons/fa";
import { useRouter } from "next/router";
import { ButtonString } from "../user_status";
import { Config, LaunchKeys } from "../Solana/constants";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LaunchData } from "@letscook/sdk/dist/state/launch";
export interface LaunchTableFilters {
    start_date: Date | null;
    end_date: Date | null;
}

export const defaultLaunchTableFilters: LaunchTableFilters = {
    start_date: null,
    end_date: null,
};

interface Header {
    text: string;
    field: string | null;
}

const GameTable = ({ launch_list, filters }: { launch_list: Map<string, LaunchData>; filters: LaunchTableFilters }) => {
    //console.log(filters?.start_date?.toString(), filters?.end_date?.toString());
    const { sm } = useResponsive();
    const tableHeaders: Header[] = [
        { text: "Token", field: null },
        { text: "Socials", field: null },
        { text: "Hype", field: "hype" },
        { text: "Minimum Liquidity", field: "minimum_liquidity" },
        { text: "End Date", field: "end_date" },
    ];

    const { checkProgramData, listingData } = useAppRoot();
    const [sortedField, setSortedField] = useState<string>("end_date");
    const [reverseSort, setReverseSort] = useState<boolean>(false);

    const handleHeaderClick = (e) => {
        if (e == sortedField) {
            setReverseSort(!reverseSort);
        } else {
            setSortedField(e);
            setReverseSort(false);
        }
    };

    function filterTable() {
        let filtered = [];
        launch_list.forEach((item) => {
            if (filters.start_date !== null && filters.end_date !== null) {
                if (
                    (filters.start_date === null ||
                        (filters.start_date !== null && bignum_to_num(item.launch_date) < filters.end_date.getTime())) &&
                    (filters.end_date === null ||
                        (filters.end_date !== null && bignum_to_num(item.end_date) >= filters.start_date.getTime()))
                ) {
                    filtered.push(item);
                }
            } else {
                filtered.push(item);
            }
        });

        return filtered;
    }

    let filtered = filterTable();

    filtered.sort((a, b) => {
        let a_listing = listingData.get(a.listing.toString());
        let b_listing = listingData.get(b.listing.toString());

        if (sortedField !== "hype" && sortedField !== "minimum_liquidity") {
            if (a[sortedField] < b[sortedField]) {
                return reverseSort ? 1 : -1;
            }
            if (a[sortedField] > b[sortedField]) {
                return reverseSort ? -1 : 1;
            }
            return 0;
        }

        if (sortedField === "minimum_liquidity") {
            if (a[sortedField].lt(b[sortedField])) {
                return reverseSort ? 1 : -1;
            }
            if (a[sortedField].gt(b[sortedField])) {
                return reverseSort ? -1 : 1;
            }
            return 0;
        }

        if (sortedField === "hype") {
            let hype_a = a_listing.positive_votes - a_listing.negative_votes;
            let hype_b = b_listing.positive_votes - b_listing.negative_votes;
            if (hype_a < hype_b) {
                return reverseSort ? 1 : -1;
            }
            if (hype_a > hype_b) {
                return reverseSort ? -1 : 1;
            }
            return 0;
        }

        return 0;
    });

    useEffect(() => {
        console.log("filterTable()", launch_list);
    });

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {tableHeaders.map((i) => (
                        <TableHead key={i.text} className={`${i.text === "Minimum Liquidity" ? "min-w-[180px]" : "min-w-[140px]"}`}>
                            {i.field ? (
                                <div
                                    onClick={i.field !== null ? () => handleHeaderClick(i.field) : () => {}}
                                    className="flex justify-center font-semibold cursor-pointer"
                                >
                                    {i.text}
                                    {i.text === "Logo" || i.text === "Socials" ? <></> : <FaSort className="w-4 h-4 ml-2" />}
                                </div>
                            ) : (
                                i.text
                            )}
                        </TableHead>
                    ))}
                    <TableHead>
                        <Box as="button">
                            <TfiReload size={20} onClick={checkProgramData} />
                        </Box>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filtered.length > 0 ? (
                    filtered.sort().map((item: LaunchData, index) => <LaunchCard key={index} launch={item} />)
                ) : (
                    <TableRow
                        style={{
                            cursor: "pointer",
                            height: "60px",
                            transition: "background-color 0.3s",
                        }}
                        className="border-b"
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = ""; // Reset to default background color
                        }}
                    >
                        <TableCell style={{ minWidth: "160px" }} colSpan={100} className="opacity-50">
                            No launches yet
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

const LaunchCard = ({ launch }: { launch: LaunchData }) => {
    const { sm, md, lg } = useResponsive();
    const { listingData } = useAppRoot();
    const router = useRouter();

    let listing = listingData.get(launch.listing.toString());

    if (!listing) {
        return <></>;
    }

    let name = listing.symbol;

    let splitDate = new Date(bignum_to_num(launch.end_date)).toUTCString().split(" ");
    let date = splitDate[0] + " " + splitDate[1] + " " + splitDate[2] + " " + splitDate[3];

    const socialsExist = listing.socials.some((social) => social !== "");
    const liquidityAmount = Number(BigInt(launch.minimum_liquidity.toString()))  / LAMPORTS_PER_SOL;
    return (
        <TableRow
            className="border-b"
            style={{
                cursor: "pointer",
                height: "60px",
                transition: "background-color 0.3s",
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = ""; // Reset to default background color
            }}
            onClick={() => router.push(`/launch/${launch.page_name}`)}
        >
            <TableCell style={{ minWidth: "160px" }}>
                <div className="flex items-center gap-3 px-4">
                    <div className="w-10 h-10 overflow-hidden rounded-lg">
                        <Image alt="Launch icon" src={listing.icon} width={48} height={48} className="object-cover" />
                    </div>
                    <span className="font-semibold">{listing.symbol}</span>
                </div>
            </TableCell>
            <TableCell style={{ minWidth: "180px" }}>{socialsExist ? <Links socials={listing.socials} /> : <>No Socials</>}</TableCell>
            <TableCell style={{ minWidth: "150px" }}>
                <HypeVote
                    launch_type={0}
                    launch_id={bignum_to_num(listing.id)}
                    page_name={launch.page_name}
                    positive_votes={listing.positive_votes}
                    negative_votes={listing.negative_votes}
                    isTradePage={false}
                    tokenMint={listing.mint.toString()}
                />
            </TableCell>
            <TableCell style={{ minWidth: "170px" }}>
                {liquidityAmount} {Config.token}
            </TableCell>
            <TableCell style={{ minWidth: "150px" }}>{date}</TableCell>
            <TableCell style={{ minWidth: "100px" }}>
                <Button onClick={() => router.push(`/launch/` + launch.page_name)} style={{ textDecoration: "none" }}>
                    View
                </Button>
            </TableCell>
        </TableRow>
    );
};

export default GameTable;
