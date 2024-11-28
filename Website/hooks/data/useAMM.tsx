import { useEffect, useState, useCallback, useRef } from "react";
import { MintData, bignum_to_num, request_raw_account_data, uInt32ToLEBytes } from "../../components/Solana/state";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { getMintData } from "@/components/amm/launch";
import { AMMData, AMMPluginData, TimeSeriesData, getAMMPlugins } from "@/components/Solana/jupiter_state";
import useTokenBalance from "./useTokenBalance";
import { PROGRAM } from "@/components/Solana/constants";
import { UTCTimestamp } from "lightweight-charts";

interface useAMMProps {
    pageName: string | null;
}

export interface MarketData {
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

// Collections are already streamed via _contexts so we dont need to have a websocket here aswell
const useAMM = (props: useAMMProps | null) => {
    // State to store the token balance and any error messages
    const [amm, setAMM] = useState<AMMData | null>(null);
    const [ammPlugins, setAMMPlugins] = useState<AMMPluginData | null>(null);
    const [ammAddress, setAMMAddress] = useState<PublicKey | null>(null);
    const [currentMarketDataAddress, setCurrentMarketDataAddress] = useState<PublicKey | null>(null);

    // the mint data
    const [baseMint, setBaseMint] = useState<MintData | null>(null);
    const [quoteMint, setQuoteMint] = useState<MintData | null>(null);
    const [lpMint, setLPMint] = useState<MintData | null>(null);

    // the token accounts
    const [baseTokenAccount, setBaseTokenAccount] = useState<PublicKey | null>(null);
    const [quoteTokenAccount, setQuoteTokenAccount] = useState<PublicKey | null>(null);

    // token balances
    const { tokenBalance: baseTokenBalance } = useTokenBalance({ mintData: baseMint, walletAddress: ammAddress });
    const { tokenBalance: quoteTokenBalance } = useTokenBalance({ mintData: quoteMint, walletAddress: ammAddress });
    const [lpAmount, setLPAmount] = useState<number | null>(null);

    // market data
    const [marketData, setMarketData] = useState<MarketData[] | null>(null);
    const [lastDayVolume, setLastDayVolume] = useState<number | null>(null);

    const [error, setError] = useState<string | null>(null);

    const check_initial_data = useRef<boolean>(true);

    // Ref to store the subscription ID, persists across re-renders
    const ammSubscriptionRef = useRef<number | null>(null);
    const marketDataSubscriptionRef = useRef<number | null>(null);

    // refs for last balances in case we are streaming the price from that method
    const lastBaseAmount = useRef<number>(0);
    const lastQuoteAmount = useRef<number>(0);

    const { connection } = useConnection();

    const pageName = props?.pageName || null;

    const getAMMDataAccount = useCallback(() => {
        if (!pageName) {
            setAMM(null);
            setError("No page name provided");
            return;
        }
        return new PublicKey(pageName);
    }, [pageName]);

    // Function to fetch the current assignment data
    const fetchInitialAMMData = useCallback(async () => {
        if (!check_initial_data.current) {
            return;
        }

        let amm_account = getAMMDataAccount();

        if (!amm_account) {
            return;
        }

        setAMMAddress(amm_account);

        check_initial_data.current = false;

        let amm_data = await request_raw_account_data("", amm_account);

        if (amm_data === null) {
            return;
        }
        const [amm] = AMMData.struct.deserialize(amm_data);

        setAMM(amm);

        let plugins: AMMPluginData = getAMMPlugins(amm);
        setAMMPlugins(plugins);

        setBaseTokenAccount(amm.base_key);
        setQuoteTokenAccount(amm.quote_key);

        let baseMint = await getMintData(amm.base_mint.toString());
        let quoteMint = await getMintData(amm.quote_mint.toString());
        let lpMint = await getMintData(amm.lp_mint.toString());

        if (!baseMint) {
            setError(`Collection or Mint for ${pageName} not found`);
            return;
        }

        setBaseMint(baseMint);

        if (!quoteMint) {
            setError(`Collection or Mint for ${pageName} not found`);
            return;
        }

        setQuoteMint(quoteMint);
        setLPMint(lpMint);

        if (amm.provider > 0) return;

        // get the market data
        setLPAmount(amm.lp_amount);

        let index_buffer = uInt32ToLEBytes(amm.num_data_accounts);
        let price_data_account = PublicKey.findProgramAddressSync(
            [amm_account.toBytes(), index_buffer, Buffer.from("TimeSeries")],
            PROGRAM,
        )[0];

        setCurrentMarketDataAddress(price_data_account);

        let price_data_buffer = await request_raw_account_data("", price_data_account);
        const [price_data] = TimeSeriesData.struct.deserialize(price_data_buffer);

        let data: MarketData[] = [];

        let now = new Date().getTime() / 1000;
        let last_volume = 0;

        for (let i = 0; i < price_data.data.length; i++) {
            let item = price_data.data[i];
            let time = bignum_to_num(item.timestamp) * 60;

            let open = Buffer.from(item.open).readFloatLE(0);
            let high = Buffer.from(item.high).readFloatLE(0);
            let low = Buffer.from(item.low).readFloatLE(0);
            let close = Buffer.from(item.close).readFloatLE(0);
            let volume = Buffer.from(item.volume).readFloatLE(0) * open;
            //console.log("price data", time, open, high, low, close, volume);
            if (now - time < 24 * 60 * 60) {
                last_volume += volume;
            }

            data.push({ time: time as UTCTimestamp, open: open, high: high, low: low, close: close, volume: volume });
        }
        setMarketData(data);
        setLastDayVolume(last_volume);

    }, [getAMMDataAccount]);

    // Callback function to handle account changes
    const handleAMMAccountChange = useCallback((accountInfo: any) => {
        let account_data = Buffer.from(accountInfo.data, "base64");

        if (account_data.length === 0) {
            setAMM(null);
            return;
        }

        const [updated_data] = AMMData.struct.deserialize(account_data);
        let updated_plugins: AMMPluginData = getAMMPlugins(updated_data);

        setAMM(updated_data);
        setAMMPlugins(updated_plugins);
    }, []);

    const handleMarketDataUpdate = useCallback(async (result: any) => {
        //console.log(result);
        // if we have a subscription field check against ws_id

        let event_data = result.data;
        const [price_data] = TimeSeriesData.struct.deserialize(event_data);
        //console.log("updated price data", price_data);

        let data: MarketData[] = [];

        for (let i = 0; i < price_data.data.length; i++) {
            let item = price_data.data[i];
            let time = bignum_to_num(item.timestamp) * 60;

            let open = Buffer.from(item.open).readFloatLE(0);
            let high = Buffer.from(item.high).readFloatLE(0);
            let low = Buffer.from(item.low).readFloatLE(0);
            let close = Buffer.from(item.close).readFloatLE(0);
            let volume = Buffer.from(item.volume).readFloatLE(0) * open;
            //console.log("price data", time, open, high, low, close, volume);

            data.push({ time: time as UTCTimestamp, open: open, high: high, low: low, close: close, volume: volume });
            //console.log("new data", data);
        }
        setMarketData(data);
    }, []);

    useEffect(() => {
        if (!amm || amm.provider === 0 || baseTokenBalance === 0 || quoteTokenBalance === 0) {
            return;
        }

        if (baseTokenBalance === lastBaseAmount.current && quoteTokenBalance === lastQuoteAmount.current) {
            return;
        }

        lastBaseAmount.current = baseTokenBalance;
        lastQuoteAmount.current = quoteTokenBalance;

        // update market data using bid/ask
        let price = quoteTokenBalance / baseTokenBalance;

        price = (price * Math.pow(10, baseMint.mint.decimals)) / Math.pow(10, 9);

        let now_minute = Math.floor(new Date().getTime() / 1000 / 15 / 60);
        let last_candle = marketData[marketData.length - 1];
        let last_minute = last_candle.time / 15 / 60;
        //console.log("update price", price, last_minute, now_minute)

        if (now_minute > last_minute) {
            let new_candle: MarketData = {
                time: (now_minute * 15 * 60) as UTCTimestamp,
                open: price,
                high: price,
                low: price,
                close: price,
                volume: 0,
            };
            //console.log("new candle", now_minute, last_minute, new_candle)

            marketData.push(new_candle);
            setMarketData([...marketData]);
        } else {
            last_candle.close = price;
            if (price > last_candle.high) {
                last_candle.high = price;
            }
            if (price < last_candle.low) {
                last_candle.low = price;
            }
            //console.log("update old candle", last_candle)
            marketData[marketData.length - 1] = last_candle;
            setMarketData([...marketData]);
        }
    }, [baseTokenBalance, quoteTokenBalance, amm, marketData, baseMint]);

    // Effect to set up the subscription and fetch initial data
    useEffect(() => {
        if (!pageName) {
            setAMM(null);
            setError(null);
            return;
        }

        const ammAccount = getAMMDataAccount();
        if (!ammAccount) return;

        // Fetch the initial account data
        fetchInitialAMMData();

        // Only set up a new subscription if one doesn't already exist
        if (ammSubscriptionRef.current === null) {
            ammSubscriptionRef.current = connection.onAccountChange(ammAccount, handleAMMAccountChange);
        }

        if (currentMarketDataAddress && marketDataSubscriptionRef.current === null) {
            marketDataSubscriptionRef.current = connection.onAccountChange(currentMarketDataAddress, handleMarketDataUpdate);
        }

        // Cleanup function to remove the subscription when the component unmounts
        // or when the dependencies change
        return () => {
            if (ammSubscriptionRef.current !== null) {
                connection.removeAccountChangeListener(ammSubscriptionRef.current);
                ammSubscriptionRef.current = null;
            }
            if (marketDataSubscriptionRef.current !== null) {
                connection.removeAccountChangeListener(marketDataSubscriptionRef.current);
                marketDataSubscriptionRef.current = null;
            }
        };
    }, [connection, pageName, currentMarketDataAddress, fetchInitialAMMData, getAMMDataAccount, handleAMMAccountChange, handleMarketDataUpdate]);

    // Return the current token balance and any error message
    return {
        amm,
        ammPlugins,
        baseMint,
        quoteMint,
        lpMint,
        baseTokenAccount,
        quoteTokenAccount,
        baseTokenBalance,
        quoteTokenBalance,
        lpAmount,
        marketData,
        lastDayVolume,
        error,
    };
};

export default useAMM;
