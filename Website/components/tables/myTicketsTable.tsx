import { useEffect, useState } from "react";
import { LaunchData, UserData, bignum_to_num, JoinData, JoinedLaunch } from "../Solana/state";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Badge, Box, Button, Center, HStack, Link, TableContainer, Text, VStack } from "@chakra-ui/react";
import { TfiReload } from "react-icons/tfi";
import { FaSort } from "react-icons/fa";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";
import useAppRoot from "../../context/useAppRoot";
import useDetermineCookState, { CookState } from "../../hooks/useDetermineCookState";
import { useRouter } from "next/router";
import useCheckTickets from "../../hooks/launch/useCheckTickets";
import useRefundTickets from "../../hooks/launch/useRefundTickets";
import useClaimTokens from "../../hooks/launch/useClaimTokens";
import { LaunchFlags, LaunchKeys } from "../Solana/constants";
import { WinLoss, ButtonString } from "../user_status";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
interface Header {
    text: string;
    field: string | null;
}

const MyTicketsTable = ({ bags }: { bags: JoinedLaunch[] }) => {
    const { sm } = useResponsive();
    const { checkProgramData, listingData } = useAppRoot();

    const [sortedField, setSortedField] = useState<string | null>("date");
    const [reverseSort, setReverseSort] = useState<boolean>(false);

    const tableHeaders: Header[] = [
        { text: "TOKEN", field: null },
        { text: "STATUS", field: null },
        { text: "TICKETS", field: "tickets" },
        { text: "WIN RATE", field: "winRate" },
        { text: "ENDS", field: "date" },
    ];

    const handleHeaderClick = (field: string | null) => {
        if (field === sortedField) {
            setReverseSort(!reverseSort);
        } else {
            setSortedField(field);
            setReverseSort(false);
        }
    };

    const sortedLaunches = [...bags].sort((a, b) => {
        if (a.launch_data === undefined || b.launch_data === undefined) {
            return 0;
        }
        let a_listing = listingData.get(a.launch_data.listing.toString());
        let b_listing = listingData.get(b.launch_data.listing.toString());
        if (sortedField === "symbol") {
            return reverseSort ? b_listing.symbol.localeCompare(a_listing.symbol) : a_listing.symbol.localeCompare(b_listing.symbol);
        } else if (sortedField === "date") {
            return reverseSort
                ? b.launch_data.launch_date - a.launch_data.launch_date
                : a.launch_data.launch_date - b.launch_data.launch_date;
        } else if (sortedField === "tickets") {
            return reverseSort ? b.join_data.num_tickets - a.join_data.num_tickets : a.join_data.num_tickets - b.join_data.num_tickets;
        }

        return 0;
    });

    return (
        <Table className="rounded-lg xl:w-[90%]">
            <TableHeader>
                <TableRow>
                    {tableHeaders.map((i) => (
                        <TableHead className="min-w-[140px] border-b" key={i.text}>
                            {i.field ? (
                                <div
                                    onClick={() => handleHeaderClick(i.field)}
                                    className="flex cursor-pointer justify-center font-semibold"
                                >
                                    {i.text}
                                    {i.text === "TOKEN" || i.text === "WIN RATE" ? <></> : <FaSort className="ml-2 h-4 w-4" />}
                                </div>
                            ) : (
                                i.text
                            )}
                        </TableHead>
                    ))}

                    <TableHead>
                        <Box mt={1} as="button" onClick={checkProgramData}>
                            <TfiReload size={sm ? 18 : 20} />
                        </Box>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedLaunches.map((launch, i) => (
                    <LaunchCard key={i} launch={launch} />
                ))}
            </TableBody>
        </Table>
    );
};

const LaunchCard = ({ launch }: { launch: JoinedLaunch }) => {
    const router = useRouter();
    const { sm, md, lg } = useResponsive();
    const { listingData } = useAppRoot();

    let listing = listingData.get(launch.launch_data.listing.toString());

    const { CheckTickets, isLoading: CheckingTickets } = useCheckTickets(launch.launch_data, true);
    const { ClaimTokens, isLoading: ClaimingTokens } = useClaimTokens(launch.launch_data, true);
    const { RefundTickets, isLoading: RefundingTickets } = useRefundTickets(listing, launch.launch_data, true);

    let current_time = new Date().getTime();

    let splitDate = new Date(bignum_to_num(launch.launch_data.end_date)).toUTCString().split(" ");
    let date = splitDate[0] + " " + splitDate[1] + " " + splitDate[2] + " " + splitDate[3];

    const cook_state = useDetermineCookState({ current_time, launchData: launch.launch_data, join_data: launch.join_data });

    console.log("cook state", cook_state);
    const ACTIVE = [CookState.ACTIVE_NO_TICKETS, CookState.ACTIVE_TICKETS].includes(cook_state);
    const MINTED_OUT = [
        CookState.MINT_SUCCEEDED_NO_TICKETS,
        CookState.MINT_SUCCEDED_TICKETS_TO_CHECK,
        CookState.MINT_SUCCEEDED_TICKETS_CHECKED_NO_LP,
        CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP,
        CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP_TIMEOUT,
    ].includes(cook_state);
    const MINT_FAILED = [CookState.MINT_FAILED_NOT_REFUNDED, CookState.MINT_FAILED_REFUNDED].includes(cook_state);

    const handleButtonClick = (e) => {
        e.stopPropagation();

        if (cook_state === CookState.MINT_SUCCEDED_TICKETS_TO_CHECK) {
            CheckTickets();
        } else if (
            (cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_NO_LP && launch.join_data.ticket_status === 0) ||
            cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP
        ) {
            ClaimTokens();
        } else if (cook_state === CookState.MINT_FAILED_NOT_REFUNDED || CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP_TIMEOUT) {
            RefundTickets();
        }
    };

    let w: number = launch.join_data.num_winning_tickets;
    let l: number = launch.join_data.num_tickets - launch.join_data.num_winning_tickets;

    // Calculate win rate
    const winRate = (w / (w + l)) * 100;

    // Round to two decimal places and remove trailing zeros
    const formattedWinRate = parseFloat(winRate.toFixed(2));

    return (
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
            onClick={() => router.push(`/launch/${launch.launch_data.page_name}`)}
        >
            <TableCell style={{ minWidth: "160px" }}>
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
            </TableCell>
            <TableCell style={{ minWidth: "120px" }}>
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
            </TableCell>

            <TableCell style={{ minWidth: "150px" }}>
                {MINT_FAILED && (
                    <Text fontSize={"large"} m={0}>
                        {launch.join_data.num_tickets}
                    </Text>
                )}
                {!MINT_FAILED && launch.join_data.num_tickets > launch.join_data.num_claimed_tickets && (
                    <WinLoss join_data={launch.join_data} />
                )}
                {!MINT_FAILED && launch.join_data.num_tickets === launch.join_data.num_claimed_tickets && (
                    <WinLoss join_data={launch.join_data} />
                )}
            </TableCell>

            <TableCell style={{ minWidth: "50px" }}>
                <VStack>
                    <Text fontSize={"large"} m={0}>
                        {ACTIVE || MINT_FAILED || cook_state === CookState.MINT_SUCCEDED_TICKETS_TO_CHECK ? "--" : `${formattedWinRate}%`}
                    </Text>
                </VStack>
            </TableCell>
            <TableCell style={{ minWidth: "150px" }}>
                <Text fontSize={"large"} m={0}>
                    {date}
                </Text>
            </TableCell>
            <TableCell style={{ minWidth: md ? "150px" : "" }}>
                <HStack spacing={3} justify="center" style={{ minWidth: "65px" }}>
                    {MINTED_OUT || MINT_FAILED ? (
                        <Button
                            onClick={(e) => handleButtonClick(e)}
                            isLoading={CheckingTickets || ClaimingTokens || RefundingTickets}
                            isDisabled={
                                cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_NO_LP && launch.join_data.ticket_status === 1
                            }
                        >
                            {ButtonString(cook_state, launch.join_data, launch.launch_data)}
                        </Button>
                    ) : (
                        <Button>View</Button>
                    )}
                </HStack>
            </TableCell>
        </TableRow>
    );
};

export default MyTicketsTable;
