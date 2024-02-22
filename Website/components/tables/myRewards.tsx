import { Box, Button, Center, HStack, TableContainer, Text } from "@chakra-ui/react";
import { TfiReload } from "react-icons/tfi";
import { FaSort } from "react-icons/fa";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";
import useAppRoot from "../../context/useAppRoot";
import { useRouter } from "next/router";
import { JoinedLaunch, LaunchData } from "../Solana/state";

interface Header {
    text: string;
    field: string | null;
}

const MyRewardsTable = ({ launch_data }: { launch_data: LaunchData | null }) => {
    const { sm } = useResponsive();
    const { checkLaunchData } = useAppRoot();

    const tableHeaders: Header[] = [
        { text: "LOGO", field: null },
        { text: "SYMBOL", field: "symbol" },
        { text: "MCAP", field: "mcap" },
        { text: "PRICE", field: "price" },
        { text: "VOL ($)", field: "vol" },
    ];

    return (
        <TableContainer w={"100%"}>
            <table
                width="100%"
                className="custom-centered-table font-face-rk"
                style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 120%)" }}
            >
                <thead>
                    <tr
                        style={{
                            height: "60px",
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
                                    {/* {i.text === "LOGO" || i.text === "ORDER" ? <></> : <FaSort />} */}
                                </HStack>
                            </th>
                        ))}

                        <th style={{ minWidth: sm ? "90px" : "120px" }}>
                            <HStack gap={sm ? 1 : 2} justify="center" style={{ cursor: "pointer" }}>
                                <Button onClick={(e) => e.stopPropagation()}>Claim All</Button>
                                {/* {i.text === "LOGO" || i.text === "ORDER" ? <></> : <FaSort />} */}
                            </HStack>
                        </th>
                    </tr>
                </thead>

                <tbody>
                    <LaunchCard />
                </tbody>
            </table>
        </TableContainer>
    );
};

const LaunchCard = () => {
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
        >
            <td style={{ minWidth: sm ? "90px" : "120px" }}>
                <Center>
                    <Box m={5} w={md ? 45 : 75} h={md ? 45 : 75} borderRadius={10}>
                        <Image
                            alt="Launch icon"
                            src={"https://snipboard.io/U1lnLF.jpg"}
                            width={md ? 45 : 75}
                            height={md ? 45 : 75}
                            style={{ borderRadius: "8px", backgroundSize: "cover" }}
                        />
                    </Box>
                </Center>
            </td>
            <td style={{ minWidth: "180px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    Dummy
                </Text>
            </td>
            <td style={{ minWidth: "120px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    100M
                </Text>
            </td>

            <td style={{ minWidth: "150px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    0.00053
                </Text>
            </td>

            <td style={{ minWidth: "150px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    220
                </Text>
            </td>

            <td style={{ minWidth: md ? "120px" : "" }}>
                <Button onClick={(e) => e.stopPropagation()}>Claim</Button>
            </td>
        </tr>
    );
};

export default MyRewardsTable;
