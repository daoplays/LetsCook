import { AMMData } from "../Solana/jupiter_state";
import { MintData } from "../Solana/state";

export interface PanelProps {
    base_mint?: MintData;
    quote_mint?: MintData;
    amm?: AMMData;
    amm_provider?: number;
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
    amm_base_balance?: number;
    amm_quote_balance?: number;
    amm_lp_balance?: number;
}
