import {
    LaunchData,
    LaunchInstruction,
    get_current_blockhash,
    myU64,
    send_transaction,
    serialise_basic_instruction,
    request_current_balance,
    uInt32ToLEBytes,
} from "../../components/Solana/state";
import { PublicKey, Transaction, TransactionInstruction, Connection } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, Config, SYSTEM_KEY, SOL_ACCOUNT_SEED } from "../../components/Solana/constants";
import { useCallback, useRef, useState } from "react";
import bs58 from "bs58";
import BN from "bn.js";
import { toast } from "react-toastify";

import {
    Token,
    DEVNET_PROGRAM_ID,
    MAINNET_PROGRAM_ID,
    Liquidity,
    SYSTEM_PROGRAM_ID,
    RENT_PROGRAM_ID,
    LOOKUP_TABLE_CACHE,
    LiquidityPoolKeys,
    TokenAmount,
    Percent,
    jsonInfo2PoolKeys,
    LiquidityPoolJsonInfo,
} from "@raydium-io/raydium-sdk";

import { ComputeBudgetProgram } from "@solana/web3.js";

import { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { LaunchKeys, LaunchFlags } from "../../components/Solana/constants";
import { make_tweet } from "../../components/launch/twitter";

const PROGRAMIDS = Config.PROD ? MAINNET_PROGRAM_ID : DEVNET_PROGRAM_ID;

const ZERO = new BN(0);
type BN = typeof ZERO;

const DEFAULT_TOKEN = {
    WSOL: new Token(TOKEN_PROGRAM_ID, new PublicKey("So11111111111111111111111111111111111111112"), 9, "WSOL", "WSOL"),
};

async function generatePubKey({
    fromPublicKey,
    seed,
    programId = TOKEN_PROGRAM_ID,
}: {
    fromPublicKey: PublicKey;
    seed: string;
    programId: PublicKey;
}) {
    const publicKey = await PublicKey.createWithSeed(fromPublicKey, seed, programId);
    return { publicKey, seed };
}

/**
 * swapInDirection: used to determine the direction of the swap
 * Eg: RAY_SOL_LP_V4_POOL_KEY is using SOL as quote token, RAY as base token
 * If the swapInDirection is true, currencyIn is RAY and currencyOut is SOL
 * vice versa
 */
export async function calcAmountOut(launchData : LaunchData, connection: Connection, poolKeys: LiquidityPoolKeys, rawAmountIn: number, swapInDirection: boolean) {

    const quoteToken = DEFAULT_TOKEN.WSOL; // RAY

        const seed_base = launchData.keys[LaunchKeys.MintAddress].toBase58().slice(0, 31);
        const targetMargetId = await generatePubKey({
            fromPublicKey: launchData.keys[LaunchKeys.Seller],
            seed: seed_base + "1",
            programId: PROGRAMIDS.OPENBOOK_MARKET,
        });
        
    const associatedPoolKeys = Liquidity.getAssociatedPoolKeys({
        version: 4,
        marketVersion: 3,
        marketId: targetMargetId.publicKey,
        baseMint: launchData.keys[LaunchKeys.MintAddress],
        quoteMint: quoteToken.mint,
        baseDecimals: launchData.decimals,
        quoteDecimals: quoteToken.decimals,
        programId: PROGRAMIDS.AmmV4,
        marketProgramId: PROGRAMIDS.OPENBOOK_MARKET,
    });

    const poolInfo = await Liquidity.fetchInfo({ connection, poolKeys });

    console.log("associated: ", associatedPoolKeys);
    console.log("poolInfo:", poolInfo);

    let currencyInMint = poolKeys.baseMint;
    let currencyInDecimals = poolInfo.baseDecimals;
    let currencyOutMint = poolKeys.quoteMint;
    let currencyOutDecimals = poolInfo.quoteDecimals;
  
    if (!swapInDirection) {
      currencyInMint = poolKeys.quoteMint;
      currencyInDecimals = poolInfo.quoteDecimals;
      currencyOutMint = poolKeys.baseMint;
      currencyOutDecimals = poolInfo.baseDecimals;
    }
  
    const currencyIn = new Token(TOKEN_PROGRAM_ID, currencyInMint, currencyInDecimals);
    const amountIn = new TokenAmount(currencyIn, rawAmountIn, false);
    const currencyOut = new Token(TOKEN_PROGRAM_ID, currencyOutMint, currencyOutDecimals);
    const slippage = new Percent(5, 100); // 5% slippage
  
    const {
        amountOut,
        minAmountOut,
        currentPrice,
        executionPrice,
        priceImpact,
        fee,
    } = Liquidity.computeAmountOut({ poolKeys, poolInfo, amountIn, currencyOut, slippage, });
  
    return {
        amountIn,
        amountOut,
        minAmountOut,
        currentPrice,
        executionPrice,
        priceImpact,
        fee,
    };
  }

const useSwapRaydium = (launchData: LaunchData) => {
    const wallet = useWallet();

    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        signature_ws_id.current = null;
        setIsLoading(false)
        // if we have a subscription field check against ws_id
        if (result.err !== null) {
            alert("Transaction failed, please try again");
            return;
        }

        if (Config.PROD) {

            let response = await make_tweet(launchData.page_name);
            console.log(response);
        }
    }, []);



    const SwapRaydium = async () => {
        // if we have already done this then just skip this step
        console.log(launchData);
        if (launchData.flags[LaunchFlags.LPState] == 2) {
            console.log("AMM already exists");
            return;
        }

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        const createAMMToast = toast.loading("(4/4) Creating the AMM");

        const quoteToken = DEFAULT_TOKEN.WSOL; // RAY

        const seed_base = launchData.keys[LaunchKeys.MintAddress].toBase58().slice(0, 31);
        const targetMargetId = await generatePubKey({
            fromPublicKey: wallet.publicKey,
            seed: seed_base + "1",
            programId: PROGRAMIDS.OPENBOOK_MARKET,
        });

        const poolInfo = Liquidity.getAssociatedPoolKeys({
            version: 4,
            marketVersion: 3,
            marketId: targetMargetId.publicKey,
            baseMint: launchData.keys[LaunchKeys.MintAddress],
            quoteMint: quoteToken.mint,
            baseDecimals: launchData.decimals,
            quoteDecimals: quoteToken.decimals,
            programId: PROGRAMIDS.AmmV4,
            marketProgramId: PROGRAMIDS.OPENBOOK_MARKET,
        });

        //console.log(poolInfo);
        let sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launchData.page_name), Buffer.from("Launch")], PROGRAM)[0];

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        let team_base_account = await getAssociatedTokenAddress(
            launchData.keys[LaunchKeys.MintAddress], // mint
            launchData.keys[LaunchKeys.TeamWallet], // owner
            true, // allow owner off curve
        );

        let program_base_account = await getAssociatedTokenAddress(
            launchData.keys[LaunchKeys.MintAddress], // mint
            sol_account, // owner
            true, // allow owner off curve
        );

        let program_quote_account = await getAssociatedTokenAddress(
            quoteToken.mint, // mint
            sol_account, // owner
            true, // allow owner off curve
        );

        let program_lp_account = await getAssociatedTokenAddress(
            poolInfo.lpMint, // mint
            sol_account, // owner
            true, // allow owner off curve
        );

        let user_base_account = await getAssociatedTokenAddress(
            launchData.keys[LaunchKeys.MintAddress], // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );

        let user_quote_account = await getAssociatedTokenAddress(
            quoteToken.mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );

        let user_lp_account = await getAssociatedTokenAddress(
            poolInfo.lpMint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );

        console.log(user_base_account.toString());
        console.log(user_quote_account.toString());
        console.log(user_lp_account.toString());
        console.log(program_quote_account.toString());
        console.log(program_base_account.toString());

        const liquidityJsonResp = await fetch("https://api.raydium.io/v2/sdk/liquidity/mainnet.json");
        if (!(await liquidityJsonResp).ok) return []
        const liquidityJson = await liquidityJsonResp.json();
        const allPoolKeysJson = [...(liquidityJson?.official ?? []), ...(liquidityJson?.unOfficial ?? [])]
        const poolKeysRaySolJson: LiquidityPoolJsonInfo = allPoolKeysJson.filter((item) => item.lpMint === "89ZKE4aoyfLBe2RuV6jM3JGNhaV18Nxh8eNtjRcndBip")?.[0] || null;
        const raySolPk = jsonInfo2PoolKeys(poolKeysRaySolJson);

        console.log(raySolPk)
        //let amountOut = await calcAmountOut(launchData, connection, 1, true)
    };

    return { SwapRaydium, isLoading };
};

export default useSwapRaydium;
