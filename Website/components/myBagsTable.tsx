import { useEffect, useState } from "react";
import { LaunchData, UserData, bignum_to_num, JoinData, JoinedLaunch } from "./Solana/state";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Badge, Box, Button, Center, HStack, Link, TableContainer, Text, VStack } from "@chakra-ui/react";
import { TfiReload } from "react-icons/tfi";
import { FaSort } from "react-icons/fa";
import useResponsive from "../hooks/useResponsive";
import Image from "next/image";
import useAppRoot from "../context/useAppRoot";
import useDetermineCookState, { CookState } from "../hooks/useDetermineCookState";
import { useRouter } from "next/router";
import useCheckTickets from "../hooks/useCheckTickets";
import useRefundTickets from "../hooks/useRefundTickets";
import useClaimTokens from "../hooks/useClaimTokens";
import { LaunchFlags } from "./Solana/constants";

interface Header {
    text: string;
    field: string | null;
}

const MyBagsTable = ({ bags }: { bags: JoinedLaunch[] }) => {
    const { sm } = useResponsive();
    const { checkLaunchData } = useAppRoot();

    const [sortedField, setSortedField] = useState<string | null>("date");
    const [reverseSort, setReverseSort] = useState<boolean>(false);

    const tableHeaders: Header[] = [
        { text: "ICON", field: null },
        { text: "SYMBOL", field: "symbol" },
        { text: "STATUS", field: null },
        { text: "TICKETS", field: "tickets" },
        { text: "LIQUIDITY", field: "liquidity" },
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
        if (sortedField === "symbol") {
            return reverseSort
                ? b.launch_data.symbol.localeCompare(a.launch_data.symbol)
                : a.launch_data.symbol.localeCompare(b.launch_data.symbol);
        } else if (sortedField === "liquidity") {
            return reverseSort
                ? b.launch_data.minimum_liquidity - a.launch_data.minimum_liquidity
                : a.launch_data.minimum_liquidity - b.launch_data.minimum_liquidity;
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
        <TableContainer>
            <table width="100%" className="custom-centered-table font-face-rk">
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
                        <LaunchCard key={launch.launch_data.name} launch={launch} />
                    ))}
                </tbody>
            </table>
        </TableContainer>
    );
};

const LaunchCard = ({ launch }: { launch: JoinedLaunch }) => {
    const router = useRouter();
    const { sm, md, lg } = useResponsive();

    const { CheckTickets, isLoading: CheckingTickets } = useCheckTickets(launch.launch_data, true);
    const { ClaimTokens, isLoading: ClaimingTokens } = useClaimTokens(launch.launch_data, true);
    const { RefundTickets, isLoading: RefundingTickets } = useRefundTickets(launch.launch_data, true);

    let name = launch.launch_data.symbol;

    let current_time = new Date().getTime();

    let splitDate = new Date(bignum_to_num(launch.launch_data.end_date)).toUTCString().split(" ");
    let date = splitDate[0] + " " + splitDate[1] + " " + splitDate[2] + " " + splitDate[3];

    const cook_state = useDetermineCookState({ current_time, launchData: launch.launch_data, join_data: launch.join_data });

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

    //console.log("cook state", cook_state);
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
            onClick={() => router.push(`/launch/${launch.launch_data.page_name}`)}
        >
            <td style={{ minWidth: sm ? "90px" : "120px" }}>
                <Center>
                    <Box m={5} w={md ? 45 : 75} h={md ? 45 : 75} borderRadius={10}>
                        <Image
                            alt="Launch icon"
                            src={launch.launch_data.icon}
                            width={md ? 45 : 75}
                            height={md ? 45 : 75}
                            style={{ borderRadius: "8px" }}
                        />
                    </Box>
                </Center>
            </td>
            <td style={{ minWidth: "150px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {name}
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
                        ? "Waiting to Cook"
                        : ACTIVE
                          ? "Cooking"
                          : MINTED_OUT
                            ? "Cooked Out"
                            : MINT_FAILED
                              ? "Cook Failed"
                              : "Unknown"}
                </Badge>
            </td>

            <td style={{ minWidth: "150px" }}>
                {MINT_FAILED && (
                    <Text fontSize={lg ? "large" : "x-large"} m={0}>
                        {launch.join_data.num_tickets}
                    </Text>
                )}
                {!MINT_FAILED && launch.join_data.num_tickets > launch.join_data.num_claimed_tickets && (
                    <Text fontSize={lg ? "large" : "x-large"} m={0}>
                        {launch.join_data.num_tickets} <br /> ({launch.join_data.num_tickets - launch.join_data.num_claimed_tickets} to
                        check)
                    </Text>
                )}
                {!MINT_FAILED && launch.join_data.num_tickets === launch.join_data.num_claimed_tickets && (
                    <Text fontSize={lg ? "large" : "x-large"} m={0}>
                        {launch.join_data.num_winning_tickets} / {launch.join_data.num_tickets - launch.join_data.num_winning_tickets}
                    </Text>
                )}
            </td>

            <td style={{ minWidth: "170px" }}>
                <VStack>
                    <Text fontSize={lg ? "large" : "x-large"} m={0}>
                        {(Math.min(launch.launch_data.tickets_sold, launch.launch_data.num_mints) * launch.launch_data.ticket_price) /
                            LAMPORTS_PER_SOL}
                        /{(launch.launch_data.num_mints * launch.launch_data.ticket_price) / LAMPORTS_PER_SOL} SOL
                    </Text>
                </VStack>
            </td>
            <td style={{ minWidth: "150px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {date}
                </Text>
            </td>
            <td style={{ minWidth: md ? "150px" : "" }}>
                <HStack justify="center" style={{ minWidth: "65px" }}>
                    {(MINTED_OUT || MINT_FAILED) && (
                        <Button onClick={(e) => handleButtonClick(e)} isLoading={CheckingTickets || ClaimingTokens || RefundingTickets}>
                            {cook_state === CookState.MINT_SUCCEDED_TICKETS_TO_CHECK ? (
                                "Check Tickets"
                            ) : cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP && launch.join_data.ticket_status === 1 ? (
                                "Claim Tokens"
                            ) : cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP && launch.join_data.ticket_status === 0 ? (
                                "Claim Tokens and Refund"
                            ) : cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_NO_LP && launch.join_data.ticket_status === 0 ? (
                                <Text m="0">
                                    Refund Losing Tickets <br />
                                    {((launch.join_data.num_tickets - launch.join_data.num_winning_tickets) *
                                        bignum_to_num(launch.launch_data.ticket_price)) /
                                        LAMPORTS_PER_SOL}{" "}
                                    SOL
                                </Text>
                            ) : cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_NO_LP && launch.join_data.ticket_status === 1 ? (
                                "Waiting for LP"
                            ) : cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP_TIMEOUT ? (
                                "LP Timeout, Refund remaining tickets"
                            ) : cook_state === CookState.MINT_FAILED_NOT_REFUNDED ? (
                                <Text m="0">
                                    Refund Tickets <br />
                                    {(launch.join_data.num_tickets * bignum_to_num(launch.launch_data.ticket_price)) / LAMPORTS_PER_SOL} SOL
                                </Text>
                            ) : (
                                ""
                            )}
                        </Button>
                    )}
                </HStack>
            </td>
        </tr>
    );
};

export default MyBagsTable;
