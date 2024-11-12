import { useEffect, useState, useCallback, useRef } from "react";
import { CollectionData, CollectionPluginData, getCollectionPlugins } from "../../components/collection/collectionState";
import { CollectionKeys, PROGRAM } from "../../components/Solana/constants";
import { getTransferFeeConfig, calculateFee } from "@solana/spl-token";
import { ListingData, MintData, bignum_to_num, request_raw_account_data } from "../../components/Solana/state";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { getMintData } from "@/components/amm/launch";
import { AMMData, AMMPluginData, getAMMPlugins } from "@/components/Solana/jupiter_state";

interface useAMMProps {
    pageName: string | null;
}

// Collections are already streamed via _contexts so we dont need to have a websocket here aswell
const useAMM = (props: useAMMProps | null) => {
    // State to store the token balance and any error messages
    const [amm, setAMM] = useState<AMMData | null>(null);
    const [ammPlugins, setAMMPlugins] = useState<AMMPluginData | null>(null);
    const [listing, setListing] = useState<ListingData | null>(null);
    const [baseMint, setBaseMint] = useState<MintData | null>(null);
    const [quoteMint, setQuoteMint] = useState<MintData | null>(null);
    const [lpMint, setLPMint] = useState<MintData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const check_initial_data = useRef<boolean>(true);

    // Ref to store the subscription ID, persists across re-renders
    const ammSubscriptionRef = useRef<number | null>(null);

    const { connection } = useConnection();

    const pageName = props?.pageName || null;

    const getAMMDataAccount = useCallback(() => {
        if (!pageName) {
            setAMM(null);
            setError("No page name provided");
            return;
        }
        return new PublicKey(pageName)
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
        check_initial_data.current = false;

        let amm_data = await request_raw_account_data("", amm_account);

        if (amm_data === null) {
            return;
        }
        const [amm] = AMMData.struct.deserialize(amm_data);

        setAMM(amm);

        let plugins: AMMPluginData = getAMMPlugins(amm);
        setAMMPlugins(plugins);

        let listing_account = PublicKey.findProgramAddressSync([amm.base_mint.toBytes(), Buffer.from("Listing")], PROGRAM)[0];
        let listing_data = await request_raw_account_data("", listing_account);

        const [listing] = ListingData.struct.deserialize(listing_data);
        setListing(listing);

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

        // Cleanup function to remove the subscription when the component unmounts
        // or when the dependencies change
        return () => {
            if (ammSubscriptionRef.current !== null) {
                connection.removeAccountChangeListener(ammSubscriptionRef.current);
                ammSubscriptionRef.current = null;
            }
        };
    }, [connection, pageName, fetchInitialAMMData, getAMMDataAccount, handleAMMAccountChange]);

    // Return the current token balance and any error message
    return { amm, ammPlugins, listing, baseMint, quoteMint, lpMint, error };
};

export default useAMM;
