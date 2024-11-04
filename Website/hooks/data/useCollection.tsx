import { useEffect, useState, useCallback, useRef } from "react";
import useAppRoot from "../../context/useAppRoot";
import { CollectionData, CollectionPluginData, getCollectionPlugins } from "../../components/collection/collectionState";
import { CollectionKeys } from "../../components/Solana/constants";
import { getTransferFeeConfig, calculateFee } from "@solana/spl-token";
import { MintData, bignum_to_num } from "../../components/Solana/state";

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

    // Get the collectionList from the app's root context
    const { collectionList, mintData } = useAppRoot();

    const pageName = props?.pageName || null;

    // Function to fetch the current collectiondata
    const fetchCollection = useCallback(() => {
        if (!pageName) {
            setCollection(null);
            setError("No page name provided");
            return;
        }

        if (!collectionList || !mintData) {
            setCollection(null);
            setError("Data is not available");
            return;
        }

        console.log("get collection", pageName.toString());
        const data = collectionList.get(pageName.toString());

        if (!data) {
            setCollection(null);
            setError("Collection is not available");
            return;
        }

        // get the mints
        let token_mint = mintData.get(data.keys[CollectionKeys.MintAddress].toString());

        if (!data || !token_mint) {
            setCollection(null);
            setError(`Collection or Mint for ${pageName} not found`);
            return;
        }

        setCollection(data);

        let plugins: CollectionPluginData = getCollectionPlugins(data);
        setCollectionPlugins(plugins);

        setTokenMint(token_mint);

        let whitelist_mint = null;
        if (plugins.whitelistKey) {
            whitelist_mint = mintData.get(plugins.whitelistKey.toString());
            setWhitelistMint(whitelist_mint);
        }

        // if this isn't mint only we need to calculate the swap back amount
        if (!plugins.mintOnly) {
            let transfer_fee_config = getTransferFeeConfig(token_mint.mint);
            let input_fee =
                transfer_fee_config === null ? 0 : Number(calculateFee(transfer_fee_config.newerTransferFee, BigInt(data.swap_price)));
            let swap_price = bignum_to_num(data.swap_price);

            let input_amount = swap_price - input_fee;

            let swap_fee = Math.floor((input_amount * data.swap_fee) / 100 / 100);

            let output = input_amount - swap_fee;

            let output_fee = transfer_fee_config === null ? 0 : Number(calculateFee(transfer_fee_config.newerTransferFee, BigInt(output)));

            let final_output = output - output_fee;

            //console.log("actual input amount was",  input_fee, input_amount,  "fee",  swap_fee,  "output", output, "output fee", output_fee, "final output", final_output);
            let out_amount = final_output / Math.pow(10, data.token_decimals);
            setOutAmount(out_amount);
        }
        setError(null);
    }, [collectionList, mintData, pageName]);

    useEffect(() => {
        fetchCollection();
    }, [fetchCollection]);

    // Return the current token balance and any error message
    return { collection, collectionPlugins, tokenMint, whitelistMint, outAmount, error };
};

export default useCollection;
