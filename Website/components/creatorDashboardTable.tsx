import { useEffect, useState } from "react";
import { LaunchData, UserData, bignum_to_num, create_LaunchDataInput } from "./Solana/state";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Badge, Box, Button, Center, HStack, Link, TableContainer, Text, VStack } from "@chakra-ui/react";
import { TfiReload } from "react-icons/tfi";
import { FaSort } from "react-icons/fa";
import { useWallet } from "@solana/wallet-adapter-react";
import useResponsive from "../hooks/useResponsive";
import Image from "next/image";
import useAppRoot from "../context/useAppRoot";
import useDetermineCookState, { CookState } from "../hooks/useDetermineCookState";
import { useRouter } from "next/router";
import useCreateMarket from "../hooks/useCreateMarket";
import convertToBlob from "../utils/convertImageToBlob";
import convertImageURLToFile from "../utils/convertImageToBlob";
import { LaunchFlags } from "./Solana/constants";
import addDollarSignIfMissing from "../utils/addDollarSignIfMissing";
interface Header {
    text: string;
    field: string | null;
}

const CreatorDashboardTable = ({ creatorLaunches }: { creatorLaunches: LaunchData[] }) => {
    const { sm } = useResponsive();
    const { checkLaunchData } = useAppRoot();

    const [sortedField, setSortedField] = useState<string | null>("date");
    const [reverseSort, setReverseSort] = useState<boolean>(true);

    const tableHeaders: Header[] = [
        { text: "LOGO", field: null },
        { text: "SYMBOL", field: "symbol" },
        { text: "STATUS", field: null },
        { text: "LIQUIDITY", field: "liquidity" },
        { text: "DATE", field: "date" },
    ];

    const handleHeaderClick = (field: string | null) => {
        if (field === sortedField) {
            setReverseSort(!reverseSort);
        } else {
            setSortedField(field);
            setReverseSort(false);
        }
    };

    const sortedLaunches = [...creatorLaunches].sort((a, b) => {
        if (sortedField === "symbol") {
            return reverseSort ? b.symbol.localeCompare(a.symbol) : a.symbol.localeCompare(b.symbol);
        } else if (sortedField === "liquidity") {
            return reverseSort ? b.minimum_liquidity - a.minimum_liquidity : a.minimum_liquidity - b.minimum_liquidity;
        } else if (sortedField === "date") {
            return reverseSort ? b.launch_date - a.launch_date : a.launch_date - b.launch_date;
        }

        return 0;
    });

    return (
        <TableContainer>
            <table
                width="100%"
                className="custom-centered-table font-face-rk"
                style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)" }}
            >
                <thead>
                    <tr style={{ height: "50px", borderTop: "1px solid #868E96", borderBottom: "1px solid #868E96" }}>
                        {tableHeaders.map((i) => (
                            <th key={i.text} style={{ minWidth: sm ? "90px" : "120px" }}>
                                <HStack
                                    gap={sm ? 1 : 2}
                                    justify="center"
                                    style={{ cursor: i.text === "LOGO" ? "" : "pointer" }}
                                    onClick={() => handleHeaderClick(i.field)}
                                >
                                    <Text fontSize={sm ? "medium" : "large"} m={0}>
                                        {i.text}
                                    </Text>
                                    {i.text === "LOGO" ? <></> : <FaSort />}
                                </HStack>
                            </th>
                        ))}

                        <th>
                            <Box mt={1} as="button" onClick={checkLaunchData}>
                                <TfiReload size={sm ? 18 : 20} />
                            </Box>
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {sortedLaunches.map((launch) => (
                        <LaunchCard key={launch.page_name} launch={launch} />
                    ))}
                </tbody>
            </table>
        </TableContainer>
    );
};

const LaunchCard = ({ launch }: { launch: LaunchData }) => {
    const router = useRouter();
    const { sm, md, lg } = useResponsive();
    const { CreateMarket } = useCreateMarket(launch);
    const { newLaunchData } = useAppRoot();

    const [isEditing, setIsEditing] = useState(false);

    let launchData = launch;

    let splitDate = new Date(bignum_to_num(launch.launch_date)).toUTCString().split(" ");
    let date = splitDate[0] + " " + splitDate[1] + " " + splitDate[2] + " " + splitDate[3];

    let current_time = new Date().getTime();

    const timeDifference = launchData.launch_date - current_time;
    const isEditable = timeDifference > 48 * 60 * 60 * 1000; // 48 hours

    const cook_state = useDetermineCookState({ current_time, launchData, join_data: null });

    const ACTIVE = [CookState.ACTIVE_NO_TICKETS, CookState.ACTIVE_TICKETS].includes(cook_state);
    const MINTED_OUT = [
        CookState.MINT_SUCCEEDED_NO_TICKETS,
        CookState.MINT_SUCCEDED_TICKETS_TO_CHECK,
        CookState.MINT_SUCCEEDED_TICKETS_CHECKED_NO_LP,
        CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP,
        CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP_TIMEOUT,
    ].includes(cook_state);
    const MINT_FAILED = [CookState.MINT_FAILED_NOT_REFUNDED, CookState.MINT_FAILED_REFUNDED].includes(cook_state);

    //buttonClicked:
    const LaunchLPClicked = (e) => {
        e.stopPropagation();
        CreateMarket();
    };

    const EditClicked = async (e) => {
        e.stopPropagation();
        setIsEditing(true);
        newLaunchData.current = create_LaunchDataInput(launch, true);

        let bannerFile = await convertImageURLToFile(launch.banner, `${launch.name} banner image`);
        let iconFile = await convertImageURLToFile(launch.icon, `${launch.name} icon image`);

        newLaunchData.current.banner_file = bannerFile;
        newLaunchData.current.icon_file = iconFile;

        setIsEditing(false);

        router.push("/launch");
    };

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
                            style={{ borderRadius: "8px", backgroundSize: "cover" }}
                        />
                    </Box>
                </Center>
            </td>
            <td style={{ minWidth: sm ? "150px" : "200px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {addDollarSignIfMissing(launch.symbol)}
                </Text>
            </td>
            <td style={{ minWidth: "120px" }}>
                <Badge
                    borderRadius="12px"
                    px={3}
                    py={1}
                    colorScheme={
                        cook_state === CookState.PRE_LAUNCH
                            ? "yellow"
                            : ACTIVE
                              ? "whatsapp"
                              : MINTED_OUT
                                ? "linkedin"
                                : MINT_FAILED
                                  ? "red"
                                  : "none"
                    }
                >
                    {cook_state === CookState.PRE_LAUNCH
                        ? "Warming Up"
                        : ACTIVE
                          ? "Cooking"
                          : MINTED_OUT
                            ? "Cook Out"
                            : MINT_FAILED
                              ? "Cook Failed"
                              : "Unknown"}
                </Badge>
            </td>

            <td style={{ minWidth: sm ? "170px" : "200px" }}>
                <VStack>
                    <Text fontSize={lg ? "large" : "x-large"} m={0}>
                        {(Math.min(launch.tickets_sold, launch.num_mints) * launch.ticket_price) / LAMPORTS_PER_SOL}/
                        {(launch.num_mints * launch.ticket_price) / LAMPORTS_PER_SOL} SOL
                    </Text>
                </VStack>
            </td>
            <td style={{ minWidth: sm ? "150px" : "200px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {date}
                </Text>
            </td>
            <td style={{ minWidth: md ? "230px" : "" }}>
                <HStack justify="center" style={{ minWidth: "80px" }}>
                    {MINTED_OUT && launch.flags[LaunchFlags.LPState] < 2 && <Button onClick={(e) => LaunchLPClicked(e)}>Launch LP</Button>}

                    {/* editable only when it is less than 48hrs from launch date */}
                    {isEditable && (
                        <Button onClick={(e) => EditClicked(e)} isLoading={isEditing}>
                            Edit
                        </Button>
                    )}
                </HStack>
            </td>
        </tr>
    );
};

export default CreatorDashboardTable;
