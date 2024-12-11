import { JoinData, LaunchData } from "@letscook/sdk/dist/state/launch";
import { LaunchFlags } from "../components/Solana/constants";
import {bignum_to_num } from "../components/Solana/state";

export const enum CookState {
    PRE_LAUNCH,
    ACTIVE_NO_TICKETS,
    ACTIVE_TICKETS,
    MINT_FAILED_NOT_REFUNDED,
    MINT_FAILED_REFUNDED,
    MINT_SUCCEEDED_NO_TICKETS,
    MINT_SUCCEDED_TICKETS_TO_CHECK,
    MINT_SUCCEEDED_TICKETS_CHECKED_NO_LP,
    MINT_SUCCEEDED_TICKETS_CHECKED_LP,
    MINT_SUCCEEDED_TICKETS_CHECKED_LP_TIMEOUT,
}

interface Props {
    current_time: number;
    launchData: LaunchData | null;
    join_data?: JoinData;
}

const useDetermineCookState = ({ current_time, launchData, join_data }: Props) => {
    if (!launchData) return;

    let endDate = bignum_to_num(launchData.end_date);
    let launchDate = bignum_to_num(launchData.launch_date);
    let MINT_SUCEEDED = current_time >= endDate && launchData.tickets_sold >= launchData.num_mints;
    let TICKETS_CLAIMED = join_data !== null && join_data.num_claimed_tickets === join_data.num_tickets;
    let LP_CREATED = launchData.flags[LaunchFlags.LPState] === 2;

    if (current_time >= launchDate && current_time < endDate && join_data === null) {
        return CookState.ACTIVE_NO_TICKETS;
    }
    if (current_time >= launchDate && current_time < endDate && join_data !== null) {
        return CookState.ACTIVE_TICKETS;
    }
    if (current_time >= endDate && launchData.tickets_sold < launchData.num_mints && join_data === null) {
        return CookState.MINT_FAILED_REFUNDED;
    }
    if (current_time >= endDate && launchData.tickets_sold < launchData.num_mints && join_data !== null) {
        return CookState.MINT_FAILED_NOT_REFUNDED;
    }
    if (MINT_SUCEEDED && join_data === null) {
        return CookState.MINT_SUCCEEDED_NO_TICKETS;
    }
    if (MINT_SUCEEDED && join_data !== null && join_data.num_claimed_tickets < join_data.num_tickets) {
        return CookState.MINT_SUCCEDED_TICKETS_TO_CHECK;
    }
    if (MINT_SUCEEDED && TICKETS_CLAIMED && LP_CREATED) {
        return CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP;
    }
    if (MINT_SUCEEDED && TICKETS_CLAIMED && !LP_CREATED) {
        return CookState.MINT_SUCCEEDED_TICKETS_CHECKED_NO_LP;
    }
    if (MINT_SUCEEDED && TICKETS_CLAIMED && !LP_CREATED && current_time >= endDate + 14 * 24 * 60 * 60 * 1000) {
        return CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP_TIMEOUT;
    }
    return CookState.PRE_LAUNCH;
};

export default useDetermineCookState;
