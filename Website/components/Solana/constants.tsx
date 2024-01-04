import { isMobile } from "react-device-detect";
import { PublicKey } from "@solana/web3.js";

const DEV_RPC_NODE = "https://rough-blue-tab.solana-devnet.quiknode.pro/01715d3e60529cb4730ac38934bcc66e6318d8b2";
const DEV_WSS_NODE = "wss://rough-blue-tab.solana-devnet.quiknode.pro/01715d3e60529cb4730ac38934bcc66e6318d8b2";

const PROD_RPC_NODE = "https://practical-fragrant-wind.solana-mainnet.quiknode.pro/99ae430d9ebfdeba7c6dc64be19e93e2a5210e7a";
const PROD_WSS_NODE = "wss://practical-fragrant-wind.solana-mainnet.quiknode.pro/99ae430d9ebfdeba7c6dc64be19e93e2a5210e7a";

//pyth oracles
const PYTH_BTC_DEV = new PublicKey("HovQMDrbAgAYPCmHVSrezcSmkMtXSSUsLDFANExrZh2J");
const PYTH_ETH_DEV = new PublicKey("EdVCmQ9FSPcVe5YySXDPCRmc8aDQLKJ9xvYBMZPie1Vw");
const PYTH_SOL_DEV = new PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix");

const PYTH_BTC_PROD = new PublicKey("GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU");
const PYTH_ETH_PROD = new PublicKey("JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB");
const PYTH_SOL_PROD = new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG");

export const METAPLEX_META = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
export const PROGRAM = new PublicKey("9RMAeCgFVSDGbj8TCsQ2pqwhwtrjMbKr9DeonLgQe35p");
export const SYSTEM_KEY = new PublicKey("11111111111111111111111111111111");

// account seeds
export const MAIN_ACCOUNT_SEED = "house_account";

// set font size
export var DEFAULT_FONT_SIZE = "30px";
export var DUNGEON_FONT_SIZE = "20px";
export var EMOJI_SIZE = 24;

if (isMobile) {
    DEFAULT_FONT_SIZE = "30px";
    DUNGEON_FONT_SIZE = "10px";
    EMOJI_SIZE = 20;
}

export const PROD = false;
export const TEST = true;
export const DEBUG = true;

export const PYTH_BTC = PYTH_BTC_DEV;
export const PYTH_ETH = PYTH_ETH_DEV;
export const PYTH_SOL = PYTH_SOL_DEV;

export var network_string = "devnet";
export var RPC_NODE = DEV_RPC_NODE;
export var WSS_NODE = DEV_WSS_NODE;
if (PROD) {
    network_string = "mainnet";
    RPC_NODE = PROD_RPC_NODE;
    WSS_NODE = PROD_WSS_NODE;
}

export const enum Screen {
    HOME_SCREEN = 0,
    FAQ_SCREEN = 1,
    TOKEN_SCREEN = 2,
    LAUNCH_SCREEN = 3,
    LAUNCH_DETAILS = 4,
    LAUNCH_BOOK = 5,
    LEADERBOARD = 6,
}
