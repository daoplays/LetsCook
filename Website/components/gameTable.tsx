import { useState } from "react";
import { LaunchData, UserData, bignum_to_num } from "./Solana/state";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { Box, Button, Center, HStack, Link, TableContainer, Text } from "@chakra-ui/react";
import { TfiReload } from "react-icons/tfi";
import { HypeVote } from "./hypeVote";
import useResponsive from "../hooks/useResponsive";
import Image from "next/image";
import useAppRoot from "../context/useAppRoot";
import Links from "./Buttons/links";
import { FaSort } from "react-icons/fa";
import { useRouter } from "next/router";

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
    console.log(filters?.start_date?.toString(), filters?.end_date?.toString());
    const { sm } = useResponsive();
    const tableHeaders: Header[] = [
        { text: "LOGO", field: null },
        { text: "TICKER", field: "symbol" },
        { text: "SOCIALS", field: null },
        { text: "HYPE", field: "hype" },
        { text: "MIN. LIQUIDITY", field: "minimum_liquidity" },
        { text: "ENDS", field: "end_date" },
    ];

    const { currentUserData, checkLaunchData, isLaunchDataLoading } = useAppRoot();
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
            let hype_a = a.positive_votes - a.negative_votes;
            let hype_b = b.positive_votes - b.negative_votes;
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
            <table width="100%" className="custom-centered-table font-face-rk">
                <thead>
                    <tr style={{ height: "50px", borderTop: "1px solid #868E96", borderBottom: "1px solid #868E96" }}>
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
                                <TfiReload size={20} onClick={checkLaunchData} />
                            </Box>
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {filterTable()
                        .sort()
                        .map((item: LaunchData, index) => (
                            <LaunchCard key={index} launch={item} user_data={currentUserData} />
                        ))}
                </tbody>
            </table>
        </TableContainer>
    );
};

const LaunchCard = ({ launch, user_data }: { launch: LaunchData; user_data: UserData | null }) => {
    const { sm, md, lg } = useResponsive();
    const router = useRouter();
    let name = launch.symbol;

    let splitDate = new Date(bignum_to_num(launch.end_date)).toUTCString().split(" ");
    let date = splitDate[0] + " " + splitDate[1] + " " + splitDate[2] + " " + splitDate[3];

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
            <td style={{ minWidth: sm ? "90px" : "120px" }}>
                <Center>
                    <Box m={5} w={md ? 45 : 75} h={md ? 45 : 75} borderRadius={10}>
                        <Image
                            alt="Launch icon"
                            src={launch.icon}
                            width={md ? 45 : 75}
                            height={md ? 45 : 75}
                            style={{ borderRadius: "8px" }}
                        />
                    </Box>
                </Center>
            </td>
            <td style={{ minWidth: "175px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {name}
                </Text>
            </td>
            <td style={{ minWidth: "180px" }}>
                <Links featuredLaunch={launch} />
            </td>
            <td style={{ minWidth: "150px" }}>
                <HypeVote launch_data={launch} user_data={user_data} />
            </td>
            <td style={{ minWidth: "170px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {bignum_to_num(launch.minimum_liquidity / LAMPORTS_PER_SOL)} SOL
                </Text>
            </td>
            <td style={{ minWidth: "150px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {date}
                </Text>
            </td>
            {/* <td style={{ minWidth: "100px" }}>
                <Button>View</Button>
            </td> */}
            <td style={{ minWidth: "75px" }} />
        </tr>
    );
};

export default GameTable;
