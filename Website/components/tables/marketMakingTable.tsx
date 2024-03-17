import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Center, HStack, Link, TableContainer, Text } from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";
import { useRouter } from "next/router";
import { Distribution, JoinedLaunch, LaunchData, bignum_to_num } from "../Solana/state";
import { LaunchKeys, LaunchFlags, PROD } from "../Solana/constants";
import { MMLaunchData, MMUserData, reward_schedule } from "../Solana/jupiter_state";
import { useWallet } from "@solana/wallet-adapter-react";
import useGetMMTokens from "../../hooks/jupiter/useGetMMTokens";
import { TfiReload } from "react-icons/tfi";
import useAppRoot from "../../context/useAppRoot";

interface Header {
    text: string;
    field: string | null;
}


function filterTable(list: LaunchData[]) {
    if (list === null || list === undefined) return [];

    return list.filter(function (item) {
        //console.log(new Date(bignum_to_num(item.launch_date)), new Date(bignum_to_num(item.end_date)))
        return item.flags[LaunchFlags.LPState] == 2;
    });
}

const MarketMakingTable = ({ launchList }: { launchList: LaunchData[] }) => {
    const wallet = useWallet();
    const { sm } = useResponsive();

    const { mmLaunchData } = useAppRoot();

    const [mmUserData, setMMUserData] = useState<MMUserData[]>([]);

    const [sortedField, setSortedField] = useState<string>("end_date");
    const [reverseSort, setReverseSort] = useState<boolean>(false);

    let trade_list = filterTable(launchList);

    const handleHeaderClick = (e) => {
        if (e == sortedField) {
            setReverseSort(!reverseSort);
        } else {
            setSortedField(e);
            setReverseSort(false);
        }
    };

    const tableHeaders: Header[] = [
        { text: "TOKEN", field: null },
        { text: "FDMC", field: "fdmc" },
        { text: "VOL (24H)", field: "vol" },
        { text: "REWARDS (24H)", field: "rewards" },
    ];

    return (
        <TableContainer>
            <table
                width="100%"
                className="custom-centered-table font-face-rk"
                style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 120%)" }}
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
                            <th key={i.text} style={{ minWidth: sm ? "90px" : "120px" }}>
                                <HStack gap={sm ? 1 : 2} justify="center" style={{ cursor: i.text === "LOGO" ? "" : "pointer" }}>
                                    <Text fontSize={sm ? "medium" : "large"} m={0}>
                                        {i.text}
                                    </Text>
                                    {/* {i.text === "LOGO" || i.text === "END" ? <></> : <FaSort />} */}
                                </HStack>
                            </th>
                        ))}

                        <th>
                            <Box mt={1} as="button">
                                <TfiReload size={sm ? 18 : 20} />
                            </Box>
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {trade_list.map((launch, i) => (
                        <LaunchCard key={i} launch={launch} />
                    ))}
                </tbody>
            </table>
        </TableContainer>
    );
};

const LaunchCard = ({ launch }: { launch: LaunchData | any }) => {
    const router = useRouter();
    const { sm, md, lg } = useResponsive();

    let current_date = Math.floor((new Date().getTime() / 1000 - bignum_to_num(launch.last_interaction)) / 24 / 60 / 60);
    let mm_rewards = reward_schedule(current_date, launch);

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
            onClick={() => router.push(`/trade/` + launch.page_name)}
        >
            <td style={{ minWidth: sm ? "90px" : "120px" }}>
                <HStack px={3} spacing={3} justify="center">
                    <Box w={45} h={45} borderRadius={10}>
                        <Image
                            alt="Launch icon"
                            src={launch.icon}
                            width={45}
                            height={45}
                            style={{ borderRadius: "8px", backgroundSize: "cover" }}
                        />
                    </Box>
                    <Text fontSize={lg ? "large" : "x-large"} m={0}>
                        {launch.symbol}
                    </Text>
                </HStack>
            </td>

            <td style={{ minWidth: "120px" }}>
                <HStack justify="center">
                    <Text fontSize={lg ? "large" : "x-large"} m={0}>
                        --
                    </Text>
                    <Image src="/images/usdc.png" width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                </HStack>
            </td>

            <td style={{ minWidth: "150px" }}>
                <HStack justify="center">
                    <Text fontSize={lg ? "large" : "x-large"} m={0}>
                        --
                    </Text>
                    <Image src="/images/sol.png" width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                </HStack>
            </td>

            <td style={{ minWidth: "150px" }}>
                <HStack justify="center">
                    <Text fontSize={lg ? "large" : "x-large"} m={0}>
                        {mm_rewards}
                    </Text>
                    <Image src={launch.icon} width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                </HStack>
            </td>

            <td style={{ minWidth: md ? "150px" : "" }}>
                <HStack spacing={3} justify="center" style={{ minWidth: "65px" }}>
                    <Link href={`/trade/${launch.page_name}`} target="_blank">
                        <Button onClick={(e) => e.stopPropagation()}>Trade</Button>
                    </Link>
                </HStack>
            </td>
        </tr>
    );
};

export default MarketMakingTable;
