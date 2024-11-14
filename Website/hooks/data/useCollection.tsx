import { useEffect, useState, useCallback, useRef } from "react";
import { CollectionData, CollectionPluginData, getCollectionPlugins } from "../../components/collection/collectionState";
import { CollectionKeys, PROGRAM } from "../../components/Solana/constants";
import { getTransferFeeConfig, calculateFee } from "@solana/spl-token";
import { MintData, bignum_to_num, request_raw_account_data } from "../../components/Solana/state";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { getMintData } from "@/components/amm/launch";
import useMarketplace from "./useMarketplace";

interface useCollectionProps {
    pageName: string | null;
}

// Collections are already streamed via _contexts so we dont need to have a websocket here aswell
const useCollection = (props: useCollectionProps | null) => {
    // State to store the token balance and any error messages
    const [collection, setCollection] = useState<CollectionData | null>(null);
    const [collectionPlugins, setCollectionPlugins] = useState<CollectionPluginData | null>(null);
    const [tokenMint, setTokenMint] = useState<MintData | null>(null);
    const [whitelistMint, setWhitelistMint] = useState<MintData | null>(null);
    const [outAmount, setOutAmount] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [collectionMint, setCollectionMint] = useState<PublicKey | null>(null);

    const check_initial_collection = useRef<boolean>(true);

    // Ref to store the subscription ID, persists across re-renders
    const subscriptionRef = useRef<number | null>(null);

    const { connection } = useConnection();


    const pageName = props?.pageName || null;

    const getCollectionDataAccount = useCallback(() => {
        if (!pageName) {
            setCollection(null);
            setError("No page name provided");
            return;
        }
        return PublicKey.findProgramAddressSync([Buffer.from(pageName), Buffer.from("Collection")], PROGRAM)[0];
    }, [pageName]);


    const {marketplaceSummary, listedAssets} = useMarketplace({collectionAddress: collectionMint});


    // Function to fetch the current assignment data
    const fetchInitialCollectionData = useCallback(async () => {
        if (!check_initial_collection.current) {
            return;
        }

        let collection_account = getCollectionDataAccount();

        if (!collection_account) {
            return;
        }
        check_initial_collection.current = false;

        let collection_data = await request_raw_account_data("", collection_account);

        if (collection_data === null) {
            return;
        }
        const [collection] = CollectionData.struct.deserialize(collection_data);

        setCollection(collection);
        setCollectionMint(collection.keys[CollectionKeys.CollectionMint]);

        let token = await getMintData(collection.keys[CollectionKeys.MintAddress].toString());

        if (!token) {
            setError(`Collection or Mint for ${pageName} not found`);
            return;
        }

        let plugins: CollectionPluginData = getCollectionPlugins(collection);
        //console.log("set plugins", plugins);
        setCollectionPlugins(plugins);
        setTokenMint(token);

        let whitelist = null;
        if (plugins.whitelistKey) {
            whitelist = await getMintData(plugins.whitelistKey.toString());
            setWhitelistMint(whitelist);
        }

        // if this isn't mint only we need to calculate the swap back amount
        if (!plugins.mintOnly) {
            let transfer_fee_config = getTransferFeeConfig(token.mint);
            let input_fee =
                transfer_fee_config === null
                    ? 0
                    : Number(calculateFee(transfer_fee_config.newerTransferFee, BigInt(collection.swap_price)));
            let swap_price = bignum_to_num(collection.swap_price);

            let input_amount = swap_price - input_fee;

            let swap_fee = Math.floor((input_amount * collection.swap_fee) / 100 / 100);

            let output = input_amount - swap_fee;

            let output_fee = transfer_fee_config === null ? 0 : Number(calculateFee(transfer_fee_config.newerTransferFee, BigInt(output)));

            let final_output = output - output_fee;

            //console.log("actual input amount was",  input_fee, input_amount,  "fee",  swap_fee,  "output", output, "output fee", output_fee, "final output", final_output);
            let out_amount = final_output / Math.pow(10, collection.token_decimals);
            setOutAmount(out_amount);
        }
    }, [getCollectionDataAccount]);

    // Callback function to handle account changes
    const handleAccountChange = useCallback((accountInfo: any) => {
        let account_data = Buffer.from(accountInfo.data, "base64");

        if (account_data.length === 0) {
            setCollection(null);
            return;
        }

        const [updated_data] = CollectionData.struct.deserialize(account_data);
        let updated_plugins: CollectionPluginData = getCollectionPlugins(updated_data);

        setCollection(updated_data);
        setCollectionPlugins(updated_plugins);
    }, []);

    // Effect to set up the subscription and fetch initial data
    useEffect(() => {
        if (!pageName) {
            setCollection(null);
            setError(null);
            return;
        }

        const collectionAccount = getCollectionDataAccount();
        if (!collectionAccount) return;

        // Fetch the initial account data
        fetchInitialCollectionData();

        // Only set up a new subscription if one doesn't already exist
        if (subscriptionRef.current === null) {
            subscriptionRef.current = connection.onAccountChange(collectionAccount, handleAccountChange);
        }

        // Cleanup function to remove the subscription when the component unmounts
        // or when the dependencies change
        return () => {
            if (subscriptionRef.current !== null) {
                connection.removeAccountChangeListener(subscriptionRef.current);
                subscriptionRef.current = null;
            }
        };
    }, [connection, pageName, fetchInitialCollectionData, getCollectionDataAccount, handleAccountChange]);

    // Return the current token balance and any error message
    return { collection, collectionPlugins, tokenMint, whitelistMint, outAmount, marketplaceSummary, listedAssets, error };
};

export default useCollection;
