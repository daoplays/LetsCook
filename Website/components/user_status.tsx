import { LaunchData, UserData, JoinData, bignum_to_num } from "./Solana/state";
import { Box, Button, Center, HStack, Link, TableContainer, Text } from "@chakra-ui/react";
import useResponsive from "../hooks/useResponsive";
import { CookState } from "../hooks/useDetermineCookState";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export function WinLoss({ join_data }: { join_data: JoinData }) {
    const { sm, md, lg } = useResponsive();

    let to_check: string = "(" + (join_data.num_tickets - join_data.num_claimed_tickets) + " to check)";

    if (join_data.num_claimed_tickets == 0) {
        return (
            <>
                <Text fontSize={lg ? "large" : "x-large"} color="white" m={0} align="center">
                    {to_check}
                </Text>
            </>
        );
    }

    let w: number = join_data.num_winning_tickets;
    let l: number = join_data.num_claimed_tickets - join_data.num_winning_tickets;

    return (
        <>
            <Text fontSize={lg ? "large" : "x-large"} m={0} align="center">
                <span style={{ color: "#83FF81" }}>{w}</span>
                <span style={{ color: "white" }}> / </span>
                <span style={{ color: "#FF6E6E" }}>{l}</span>
                {join_data.num_claimed_tickets !== join_data.num_tickets && (
                    <span style={{ color: "white" }}>
                        {" "}
                        <br />
                        {to_check}{" "}
                    </span>
                )}
            </Text>
        </>
    );
}

export function ButtonString(cook_state: CookState, join_data: JoinData, launch_data: LaunchData): string {
    console.log(cook_state, join_data, launch_data);
    if (cook_state === CookState.MINT_SUCCEDED_TICKETS_TO_CHECK) return "Check Tickets";

    if (cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP && join_data.ticket_status === 1) return "Claim Tokens";

    if (cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP && join_data.ticket_status === 0) return "Claim Tokens and Refund";

    if (cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_NO_LP && join_data.ticket_status === 0) {
        let refund_amount =
            ((join_data.num_tickets - join_data.num_winning_tickets) * bignum_to_num(launch_data.ticket_price)) / LAMPORTS_PER_SOL;
        return "Refund Losing Tickets " + refund_amount.toFixed(2) + " SOL";
    }

    if (cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_NO_LP && join_data.ticket_status === 1) return "Waiting for LP";

    if (cook_state === CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP_TIMEOUT) return "LP Timeout, Refund remaining tickets";

    if (cook_state === CookState.MINT_FAILED_NOT_REFUNDED) {
        let refund_amount = (join_data.num_tickets * bignum_to_num(launch_data.ticket_price)) / LAMPORTS_PER_SOL;
        return "Refund Tickets " + refund_amount.toFixed(2) + " SOL";
    }

    return "";
}
