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
import { LaunchKeys } from "../Solana/constants";

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

const GameTable = ({ launchList, filters }: { launchList: LaunchData[]; filters: LaunchTableFilters }) => {
    //console.log(filters?.start_date?.toString(), filters?.end_date?.toString());
    const { sm } = useResponsive();
    const tableHeaders: Header[] = [
        { text: "TOKEN", field: null },
        { text: "SOCIALS", field: null },
        { text: "HYPE", field: "hype" },
        { text: "MIN. LIQUIDITY", field: "minimum_liquidity" },
        { text: "ENDS", field: "end_date" },
    ];

    const { currentUserData, checkProgramData, listingData } = useAppRoot();
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

    launchList.sort((a, b) => {
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

    function filterTable() {
        return launchList.filter(function (item) {
            return (
                (filters.start_date === null || (filters.start_date !== null && item.launch_date >= filters.start_date)) &&
                (filters.end_date === null || (filters.end_date !== null && item.launch_date < filters.end_date))
            );
        });
    }

    return (
        <TableContainer>
            <table
                width="100%"
                className="custom-centered-table font-face-rk"
                style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)" }}
            >
                <thead>
                    <tr
                        style={{
                            height: "50px",
                            borderTop: "1px solid rgba(134, 142, 150, 0.5)",
                            borderBottom: "1px solid rgba(134, 142, 150, 0.5)",
                        }}
                    >
                        {tableHeaders.map((i) => (
                            <th key={i.text}>
                                <HStack justify="center" style={{ cursor: i.text === "LOGO" || i.text === "SOCIALS" ? "" : "pointer" }}>
                                    <Text
                                        fontSize={sm ? "medium" : "large"}
                                        m={0}
                                        onClick={i.field !== null ? () => handleHeaderClick(i.field) : () => {}}
                                    >
                                        {i.text}
                                    </Text>
                                    {i.text === "LOGO" || i.text === "SOCIALS" ? <></> : <FaSort />}
                                </HStack>
                            </th>
                        ))}

                        <th>
                            <Box as="button">
                                <TfiReload size={20} onClick={checkProgramData} />
                            </Box>
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {filterTable()
                        .sort()
                        .map((item: LaunchData, index) => (
                            <LaunchCard key={index} launch={item} />
                        ))}
                </tbody>
            </table>
        </TableContainer>
    );
};

const LaunchCard = ({ launch }: { launch: LaunchData }) => {
    const { sm, md, lg } = useResponsive();
    const { listingData } = useAppRoot();

    let listing = listingData.get(launch.listing.toString());
    const router = useRouter();
    let name = listing.symbol;

    let splitDate = new Date(bignum_to_num(launch.end_date)).toUTCString().split(" ");
    let date = splitDate[0] + " " + splitDate[1] + " " + splitDate[2] + " " + splitDate[3];

    const socialsExist = listing.socials.some((social) => social !== "");

    return (
        <tr
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
            <td style={{ minWidth: "160px" }}>
                <HStack m="0 auto" w={160} px={3} spacing={3} justify="start">
                    <Box w={45} h={45} borderRadius={10}>
                        <Image
                            alt="Launch icon"
                            src={listing.icon}
                            width={45}
                            height={45}
                            style={{ borderRadius: "8px", backgroundSize: "cover" }}
                        />
                    </Box>
                    <Text fontSize={"large"} m={0}>
                        {listing.symbol}
                    </Text>
                </HStack>
            </td>
            <td style={{ minWidth: "180px" }}>
                {socialsExist ? (
                    <Links socials={listing.socials} />
                ) : (
                    <Text fontSize={"large"} m={0}>
                        No Socials
                    </Text>
                )}
            </td>
            <td style={{ minWidth: "150px" }}>
                <HypeVote
                    launch_type={0}
                    launch_id={listing.id}
                    page_name={launch.page_name}
                    positive_votes={listing.positive_votes}
                    negative_votes={listing.negative_votes}
                    isTradePage={false}
                    listing={listing}
                />
            </td>
            <td style={{ minWidth: "170px" }}>
                <Text fontSize={"large"} m={0}>
                    {bignum_to_num(launch.minimum_liquidity) / LAMPORTS_PER_SOL} SOL
                </Text>
            </td>
            <td style={{ minWidth: "150px" }}>
                <Text fontSize={"large"} m={0}>
                    {date}
                </Text>
            </td>
            <td style={{ minWidth: "100px" }}>
                <Button onClick={() => router.push(`/launch/` + launch.page_name)} style={{ textDecoration: "none" }}>
                    View
                </Button>
            </td>
        </tr>
    );
};

export default GameTable;
