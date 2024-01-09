import { JoinData, LaunchData } from "../components/Solana/state";

export const enum CookState {
    PRE_LAUNCH,
    ACTIVE_NO_TICKETS,
    ACTIVE_TICKETS,
    MINT_FAILED_NOT_REFUNDED,
    MINT_FAILED_REFUNDED,
    MINT_SUCCEEDED_NO_TICKETS,
    MINT_SUCCEDED_TICKETS_LEFT,
    MINT_SUCCEEDED_TICKETS_CHECKED,
}

interface Props {
    current_time: number;
    launchData: LaunchData | null;
    join_data?: JoinData;
}

const useDetermineCookState = ({ current_time, launchData, join_data }: Props) => {
    if (current_time >= launchData.launch_date && current_time < launchData.end_date && join_data === null) {
        return CookState.ACTIVE_NO_TICKETS;
    }
    if (current_time >= launchData.launch_date && current_time < launchData.end_date && join_data !== null) {
        return CookState.ACTIVE_TICKETS;
    }
    if (current_time >= launchData.end_date && launchData.tickets_sold < launchData.num_mints && join_data === null) {
        return CookState.MINT_FAILED_REFUNDED;
    }
    if (current_time >= launchData.end_date && launchData.tickets_sold < launchData.num_mints && join_data !== null) {
        return CookState.MINT_FAILED_NOT_REFUNDED;
    }
    if (current_time >= launchData.end_date && launchData.tickets_sold >= launchData.num_mints && join_data === null) {
        return CookState.MINT_SUCCEEDED_NO_TICKETS;
    }
    if (
        current_time >= launchData.end_date &&
        launchData.tickets_sold >= launchData.num_mints &&
        join_data !== null &&
        join_data.num_claimed_tickets < join_data.num_tickets
    ) {
        return CookState.MINT_SUCCEDED_TICKETS_LEFT;
    }
    if (
        current_time >= launchData.end_date &&
        launchData.tickets_sold >= launchData.num_mints &&
        join_data !== null &&
        join_data.num_claimed_tickets === join_data.num_tickets
    ) {
        return CookState.MINT_SUCCEEDED_TICKETS_CHECKED;
    }
    return CookState.PRE_LAUNCH;
};

export default useDetermineCookState;
