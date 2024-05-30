import { isMobile } from "react-device-detect";
import { PublicKey } from "@solana/web3.js";

export interface NetworkConfig {
    PROD: boolean;
    NETWORK: string;
    PYTH_BTC: PublicKey;
    PYTH_ETH: PublicKey;
    PYTH_SOL: PublicKey;
    FEES_KEY: PublicKey;
    RAYDIUM_FEES: PublicKey;
    RPC_NODE: string;
    WSS_NODE: string;
    IRYS_URL: string;
    IRYS_WALLET: string;
    COOK_FEES: string;
}

const MainNetConfig: NetworkConfig = {
    PROD: true,
    NETWORK: "mainnet",
    PYTH_BTC: new PublicKey("GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU"),
    PYTH_ETH: new PublicKey("JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB"),
    PYTH_SOL: new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG"),
    FEES_KEY: new PublicKey("HtszJ5ntXnwUFc2anMzp5RgaPxtvTFojL2qb5kcFEytA"),
    RAYDIUM_FEES: new PublicKey("7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5"),
    RPC_NODE: "https://kimmie-wuj3pm-fast-mainnet.helius-rpc.com",
    WSS_NODE: "wss://mainnet.helius-rpc.com/?api-key=8c0a541e-cdf4-4c1e-8bf9-de66a1962d6f",
    IRYS_URL: "https://node2.irys.xyz",
    IRYS_WALLET: "DHyDV2ZjN3rB6qNGXS48dP5onfbZd3fAEz6C5HJwSqRD",
    COOK_FEES: "HtszJ5ntXnwUFc2anMzp5RgaPxtvTFojL2qb5kcFEytA"
};

export const METAPLEX_META = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
export const PROGRAM = new PublicKey("Cook7kyoaKaiG57VBDUjE2KuPXrWdLEu7d3FdDgsijHU");
export const FEES_PROGRAM = new PublicKey("FEES7x83BdGUFsrJG6VmZywkquvBNiFgyBaAdAMcJfst");
export const SYSTEM_KEY = new PublicKey("11111111111111111111111111111111");
export const CORE = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
// account seeds
export const SOL_ACCOUNT_SEED = 59957379;
export const DATA_ACCOUNT_SEED = 7571427;

//timeout for transactions to be considered failed
export const TIMEOUT = 30000;

// set font size
export var DEFAULT_FONT_SIZE = "30px";
export var DUNGEON_FONT_SIZE = "20px";
export var EMOJI_SIZE = 24;

if (isMobile) {
    DEFAULT_FONT_SIZE = "30px";
    DUNGEON_FONT_SIZE = "10px";
    EMOJI_SIZE = 20;
}

export const DEBUG = true;

export let Config = MainNetConfig;


export const enum Screen {
    HOME_SCREEN = 0,
    FAQ_SCREEN = 1,
    TOKEN_SCREEN = 2,
    LAUNCH_SCREEN = 3,
    LAUNCH_DETAILS = 4,
    LAUNCH_BOOK = 5,
    LEADERBOARD = 6,
}

export const enum Socials {
    Website = 0,
    Twitter = 1,
    Telegram = 2,
    Discord = 3,
}

export const enum CollectionKeys {
    Seller = 0,
    TeamWallet = 1,
    MintAddress = 2,
    CollectionMint = 3,
}

export const enum LaunchKeys {
    Seller = 0,
    TeamWallet = 1,
    MintAddress = 2,
    WSOLAddress = 3,
}

export enum LaunchFlags {
    MintedToUser = 0,
    LaunchFailed = 1,
    LPState = 2,
    TokenProgramVersion = 3,
    BookProvider = 4,
    AMMProvider = 5,
    Extensions = 6,
}

export const Extensions = {
    None: 0,
    TransferFee: 1,
    PermanentDelegate: 2,
    TransferHook: 4,
};
