import { AMMData } from "../Solana/jupiter_state";
import { LaunchData, MintInfo } from "../Solana/state";
import { Mint } from "@solana/spl-token";

export interface PanelProps {
    base_mint?: Mint;
    quote_mint?: Mint;
    amm?: AMMData;
    user_base_balance?: number;
    user_quote_balance?: number;
    user_lp_balance?: number;
    sol_amount?: number;
    token_amount?: number;
    updateLiquidityLoading?: boolean;
    connected?: boolean;
    setSOLAmount?: any;
    setTokenAmount?: any;
    UpdateLiquidity?: any;
    handleConnectWallet?: any;
    placingOrder?: boolean;
    PlaceMarketOrder?: any;
    launch?: LaunchData;
    amm_base_balance?: number;
    amm_quote_balance?: number;
    amm_lp_balance?: number;
}
