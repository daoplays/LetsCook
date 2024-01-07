import { LaunchData, UserData, bignum_to_num } from "./Solana/state";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { Box, Center, HStack, Link, TableContainer, Text } from "@chakra-ui/react";
import { TfiReload } from "react-icons/tfi";
import { HypeVote } from "./hypeVote";
import useResponsive from "../hooks/useResponsive";
import Image from "next/image";
import useAppRoot from "../context/useAppRoot";
import Links from "./Buttons/links";

export interface LaunchTableFilters {
    start_date: Date | null;
    end_date: Date | null;
}

export const defaultLaunchTableFilters: LaunchTableFilters = {
    start_date: null,
    end_date: null,
};

const GameTable = ({ filters }: { filters: LaunchTableFilters }) => {
    const { sm } = useResponsive();
    const tableHeaders = ["LOGO", "TICKER", "SOCIALS", "HYPE", "MIN. LIQUIDITY", "LAUNCH"];

    const { launchList, currentUserData } = useAppRoot();

    if (launchList.length === 0) {
        return (
            <HStack justify="center" align="center" h="15vh">
                <Text color="white" fontSize="xx-large">
                    Prepping on-chain ingredients...
                </Text>
            </HStack>
        );
    }

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
                            <th key={i}>
                                <Text fontSize={sm ? "medium" : "large"} m={0}>
                                    {i}
                                </Text>
                            </th>
                        ))}

                        <th>
                            <Box mr={sm ? 4 : 8} as="button">
                                <TfiReload size={20} />
                            </Box>
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {filterTable().map((item: LaunchData, index) => (
                        <ArenaGameCard key={index} launch={item} user_data={currentUserData} />
                    ))}
                </tbody>
            </table>
        </TableContainer>
    );
};

const ArenaGameCard = ({ launch, user_data }: { launch: LaunchData; user_data: UserData | null }) => {
    const { sm, md, lg } = useResponsive();
    let name = launch.name;
    let splitDate = new Date(bignum_to_num(launch.launch_date)).toUTCString().split(" ");
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
            onClick={() => (window.location.href = `/launch/${launch.page_name}`)}
        >
            <td style={{ minWidth: sm ? "90px" : "120px" }}>
                <Center>
                    <Box m={5} bg="#8EFF84" w={md ? 45 : 75} h={md ? 45 : 75} borderRadius={10}>
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
            <td style={{ minWidth: sm ? "150px" : "200px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {name}
                </Text>
            </td>
            <td style={{ minWidth: "200px" }}>
                <Links featuredLaunch={launch} />
            </td>
            <td style={{ minWidth: "120px" }}>
                <HypeVote launch_data={launch} user_data={user_data} />
            </td>
            <td style={{ minWidth: sm ? "170px" : "200px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {bignum_to_num(launch.minimum_liquidity / LAMPORTS_PER_SOL)} SOL
                </Text>
            </td>
            <td style={{ minWidth: sm ? "150px" : "200px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {date}
                </Text>
            </td>
            <td />
        </tr>
    );
};

export default GameTable;
