import { useEffect, useState, useCallback, useRef } from "react";
import { CollectionData, CollectionPluginData, getCollectionPlugins, MarketplaceSummary, NewNFTListingData, NFTListingData } from "../../components/collection/collectionState";
import { CollectionKeys, PROGRAM } from "../../components/Solana/constants";
import { getTransferFeeConfig, calculateFee } from "@solana/spl-token";
import { MintData, bignum_to_num, request_raw_account_data } from "../../components/Solana/state";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { getMintData } from "@/components/amm/launch";

interface useMarketplaceProps {
    collectionAddress: PublicKey | null;
}

// Collections are already streamed via _contexts so we dont need to have a websocket here aswell
const useMarketplace = (props: useMarketplaceProps | null) => {
    // State to store the token balance and any error messages
    const [error, setError] = useState<string | null>(null);
    const [marketplaceSummary, setMarketplaceSummary] = useState<MarketplaceSummary | null>(null);
    const [listedAssets, setListedAssets] = useState<NFTListingData[]>([]);

    const check_initial_collection = useRef<boolean>(true);

    // Ref to store the subscription ID, persists across re-renders
    const subscriptionRef = useRef<number | null>(null);

    const { connection } = useConnection();

    const collectionAddress = props?.collectionAddress || null;


    const getMarketplaceAccount = useCallback(() => {
        if (!collectionAddress) {
            setMarketplaceSummary(null);
            setError("No page name provided");
            return;
        }
        return PublicKey.findProgramAddressSync([collectionAddress.toBytes(), Buffer.from("Summary")], new PublicKey("288fPpF7XGk82Wth2XgyoF2A82YKryEyzL58txxt47kd"))[0];
    }, [collectionAddress]);

        // Function to fetch the current nft balance
        const fetchListings = useCallback(async () => {
            if (!collectionAddress) return;

            try{
            // get the marketplace 
            const listings = await connection.getProgramAccounts(
                new PublicKey("288fPpF7XGk82Wth2XgyoF2A82YKryEyzL58txxt47kd"),
                {
                  filters: [
                    {
                      dataSize: 104, // Filter exact account size
                    },
                    {
                      memcmp: {
                        offset: 0, // collection is first field
                        bytes: collectionAddress.toBase58() // Filter by collection address
                      }
                    }
                  ]
                }
            );
    
            let mp_listings = [];
            for (let listing_data of listings) {
                const [listing] = NewNFTListingData.struct.deserialize(listing_data.account.data);
                let old_listing = new NFTListingData(listing.asset, listing.seller, listing.price);
                mp_listings.push(old_listing);
                console.log("listing", listing);
            }
            setListedAssets(mp_listings);
    
        } catch (err) {
            setError(err.message);
        } finally {

        }
    
        }, [collectionAddress]);

    // Function to fetch the current assignment data
    const fetchInitialMarketData = useCallback(async () => {

        if (!check_initial_collection.current) {
            return;
        }

        let summary_account = getMarketplaceAccount();


        if (!summary_account) {
            return;
        }
        check_initial_collection.current = false;

        let marketplace_summary = await request_raw_account_data("", summary_account);

        if (marketplace_summary === null) {
            return;
        }
        const [summary] = MarketplaceSummary.struct.deserialize(marketplace_summary);

        setMarketplaceSummary(summary);

        fetchListings();

    }, [getMarketplaceAccount]);

    // Callback function to handle account changes
    const handleAccountChange = useCallback((accountInfo: any) => {
        let account_data = Buffer.from(accountInfo.data, "base64");

        if (account_data.length === 0) {
            setMarketplaceSummary(null);
            return;
        }

        const [updated_data] = MarketplaceSummary.struct.deserialize(account_data);
        console.log("Have marketplace update")
        setMarketplaceSummary(updated_data);
        fetchListings();
    }, []);

    // Effect to set up the subscription and fetch initial data
    useEffect(() => {

        if (!collectionAddress) {
            setMarketplaceSummary(null);
            setError(null);
            return;
        }

        const summaryAccount = getMarketplaceAccount();
        if (!summaryAccount) return;

        // Fetch the initial account data
        fetchInitialMarketData();

        // Only set up a new subscription if one doesn't already exist
        if (subscriptionRef.current === null) {
            subscriptionRef.current = connection.onAccountChange(summaryAccount, handleAccountChange);
        }

        // Cleanup function to remove the subscription when the component unmounts
        // or when the dependencies change
        return () => {
            if (subscriptionRef.current !== null) {
                connection.removeAccountChangeListener(subscriptionRef.current);
                subscriptionRef.current = null;
            }
        };
    }, [connection, collectionAddress, fetchInitialMarketData, getMarketplaceAccount, handleAccountChange]);

    // Return the current token balance and any error message
    return {marketplaceSummary, listedAssets, error };
};

export default useMarketplace;
