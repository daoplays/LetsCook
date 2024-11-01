import { useState } from "react";
import { LaunchData, UserData, bignum_to_num } from "../Solana/state";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { Box, Button, Center, HStack, Link, TableContainer, Text } from "@chakra-ui/react";
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
        { text: "TOKEN", field: null },
        { text: "SOCIALS", field: null },
        { text: "HYPE", field: "hype" },
        { text: "MIN. LIQUIDITY", field: "minimum_liquidity" },
        { text: "ENDS", field: "end_date" },
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
            if (
                (filters.start_date === null || (filters.start_date !== null && item.launch_date < filters.end_date)) &&
                (filters.end_date === null || (filters.end_date !== null && item.end_date >= filters.start_date))
            ) {
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

    return (
        <Table className="rounded-lg xl:w-[90%]">
            <TableHeader>
                <TableRow>
                    {tableHeaders.map((i) => (
                        <TableHead key={i.text} className="min-w-[140px] border-b">
                            {i.field ? (
                                <div
                                    onClick={i.field !== null ? () => handleHeaderClick(i.field) : () => {}}
                                    className="flex cursor-pointer justify-center font-semibold"
                                >
                                    {i.text}
                                    {i.text === "LOGO" || i.text === "SOCIALS" ? <></> : <FaSort />}
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
                {filtered.sort().map((item: LaunchData, index) => (
                    <LaunchCard key={index} launch={item} />
                ))}
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

    console.log("min liq", (launch.minimum_liquidity / LAMPORTS_PER_SOL).toString());

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
                    <div className="h-10 w-10 overflow-hidden rounded-lg">
                        <Image alt="Launch icon" src={listing.icon} width={48} height={48} className="object-cover" />
                    </div>
                    <span className="font-semibold">{listing.symbol}</span>
                </div>
            </TableCell>
            <TableCell style={{ minWidth: "180px" }}>{socialsExist ? <Links socials={listing.socials} /> : <>No Socials</>}</TableCell>
            <TableCell style={{ minWidth: "150px" }}>
                <HypeVote
                    launch_type={0}
                    launch_id={listing.id}
                    page_name={launch.page_name}
                    positive_votes={listing.positive_votes}
                    negative_votes={listing.negative_votes}
                    isTradePage={false}
                    listing={listing}
                />
            </TableCell>
            <TableCell style={{ minWidth: "170px" }}>
                {Number(launch.minimum_liquidity / LAMPORTS_PER_SOL)} {Config.token}
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
