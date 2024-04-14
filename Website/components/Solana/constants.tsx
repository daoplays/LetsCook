import { isMobile } from "react-device-detect";
import { PublicKey } from "@solana/web3.js";

interface NetworkConfig {
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
}

const DevNetConfig: NetworkConfig = {
    PROD: false,
    NETWORK: "devnet",
    PYTH_BTC: new PublicKey("HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J"),
    PYTH_ETH: new PublicKey("EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw"),
    PYTH_SOL: new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"),
    FEES_KEY: new PublicKey("FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD"),
    RAYDIUM_FEES: new PublicKey("3XMrhbv989VxAMi3DErLV9eJht1pHppW5LbKxe9fkEFR"),
    RPC_NODE: "https://rough-blue-tab.solana-devnet.quiknode.pro/01715d3e60529cb4730ac38934bcc66e6318d8b2",
    WSS_NODE: "wss://rough-blue-tab.solana-devnet.quiknode.pro/01715d3e60529cb4730ac38934bcc66e6318d8b2/",
    IRYS_URL: "https://devnet.irys.xyz",
    IRYS_WALLET: "4a7s9iC5NwfUtf8fXpKWxYXcekfqiN6mRqipYXMtcrUS",
};

const MainNetConfig: NetworkConfig = {
    PROD: true,
    NETWORK: "mainnet",
    PYTH_BTC: new PublicKey("GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU"),
    PYTH_ETH: new PublicKey("JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB"),
    PYTH_SOL: new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"),
    FEES_KEY: new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG"),
    RAYDIUM_FEES: new PublicKey("7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5"),
    RPC_NODE: "https://patient-intensive-patron.solana-mainnet.quiknode.pro/6e8ea4bd576894779b92770fec0798b999c54198",
    WSS_NODE: "wss://patient-intensive-patron.solana-mainnet.quiknode.pro/6e8ea4bd576894779b92770fec0798b999c54198/",
    IRYS_URL: "https://node2.irys.xyz",
    IRYS_WALLET: "DHyDV2ZjN3rB6qNGXS48dP5onfbZd3fAEz6C5HJwSqRD",
};

const TestMainNetConfig: NetworkConfig = {
    PROD: true,
    NETWORK: "mainnet",
    PYTH_BTC: new PublicKey("GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU"),
    PYTH_ETH: new PublicKey("JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB"),
    PYTH_SOL: new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"),
    FEES_KEY: new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG"),
    RAYDIUM_FEES: new PublicKey("7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5"),
    RPC_NODE: "https://black-shy-flower.solana-mainnet.quiknode.pro/0e33f02ab684b325f78c2ed2b9a48d9366412ab8",
    WSS_NODE: "wss://black-shy-flower.solana-mainnet.quiknode.pro/0e33f02ab684b325f78c2ed2b9a48d9366412ab8/",
    IRYS_URL: "https://node2.irys.xyz",
    IRYS_WALLET: "DHyDV2ZjN3rB6qNGXS48dP5onfbZd3fAEz6C5HJwSqRD",
};

export const METAPLEX_META = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
export const PROGRAM = new PublicKey("Cook7kyoaKaiG57VBDUjE2KuPXrWdLEu7d3FdDgsijHU");
export const FEES_PROGRAM = new PublicKey("FEES7x83BdGUFsrJG6VmZywkquvBNiFgyBaAdAMcJfst");
export const SYSTEM_KEY = new PublicKey("11111111111111111111111111111111");

// account seeds
export const SOL_ACCOUNT_SEED = 59957379;
export const DATA_ACCOUNT_SEED = 7571427;

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

export let Config = DevNetConfig;

export const setConfig = (network: string) => {
    if (network === "devnet") {
        Config = DevNetConfig;
    } else if (network === "mainnet") {
        Config = TestMainNetConfig;
    }
};

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
