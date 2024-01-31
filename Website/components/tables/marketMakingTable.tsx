import { Box, Center, HStack, TableContainer, Text } from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";
import { useRouter } from "next/router";
import { JoinedLaunch } from "../Solana/state";

interface Header {
    text: string;
    field: string | null;
}

const MarketMakingTable = () => {
    const { sm } = useResponsive();

    const tableHeaders: Header[] = [
        { text: "LOGO", field: null },
        { text: "SYMBOL", field: "symbol" },
        { text: "FDMC", field: "fdmc" },
        { text: "VOL (24H)", field: "vol" },
        { text: "REWARDS (24H)", field: "rewards" },
        { text: "START", field: "start" },
        { text: "END", field: "end" },
    ];

    const sampleData = [
        {
            logo: "https://snipboard.io/HZ789p.jpg",
            symbol: "$Dummy",
            fdmc: "252.14K",
            vol: "46,582",
            rewards: "10",
            start: "13 Jan 2024",
            end: "13 Feb 2024",
        },
        {
            logo: "https://snipboard.io/HZ789p.jpg",
            symbol: "$Dummy",
            fdmc: "252.14K",
            vol: "46,582",
            rewards: "10",
            start: "13 Jan 2024",
            end: "13 Feb 2024",
        },
        {
            logo: "https://snipboard.io/HZ789p.jpg",
            symbol: "$Dummy",
            fdmc: "252.14K",
            vol: "46,582",
            rewards: "10",
            start: "13 Jan 2024",
            end: "13 Feb 2024",
        },
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
                    </tr>
                </thead>

                <tbody>
                    {sampleData.map((launch, i) => (
                        <LaunchCard key={i} launch={launch} />
                    ))}
                </tbody>
            </table>
        </TableContainer>
    );
};

const LaunchCard = ({ launch }: { launch: JoinedLaunch | any }) => {
    const router = useRouter();
    const { sm, md, lg } = useResponsive();

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
            onClick={() => router.push(`/marketmake/test`)}
        >
            <td style={{ minWidth: sm ? "90px" : "120px" }}>
                <Center>
                    <Box m={5} w={md ? 45 : 75} h={md ? 45 : 75} borderRadius={10}>
                        <Image
                            alt="Launch icon"
                            src={launch.logo}
                            width={md ? 45 : 75}
                            height={md ? 45 : 75}
                            style={{ borderRadius: "8px", backgroundSize: "cover" }}
                        />
                    </Box>
                </Center>
            </td>
            <td style={{ minWidth: "180px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {launch.symbol}
                </Text>
            </td>
            <td style={{ minWidth: "120px" }}>
                <HStack justify="center">
                    <Text fontSize={lg ? "large" : "x-large"} m={0}>
                        {launch.fdmc}
                    </Text>
                    <Image src="/images/usdc.png" width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                </HStack>
            </td>

            <td style={{ minWidth: "150px" }}>
                <HStack justify="center">
                    <Text fontSize={lg ? "large" : "x-large"} m={0}>
                        {launch.vol}
                    </Text>
                    <Image src="/images/usdc.png" width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                </HStack>
            </td>

            <td style={{ minWidth: "150px" }}>
                <HStack justify="center">
                    <Text fontSize={lg ? "large" : "x-large"} m={0}>
                        {launch.rewards} {launch.symbol}
                    </Text>
                    /
                    <Image src="/images/usdc.png" width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                </HStack>
            </td>

            <td style={{ minWidth: "150px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {launch.start}
                </Text>
            </td>

            <td style={{ minWidth: "150px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {launch.end}
                </Text>
            </td>
        </tr>
    );
};

export default MarketMakingTable;
