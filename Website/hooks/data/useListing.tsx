import { useEffect, useState, useCallback, useRef } from "react";
import { PROGRAM } from "../../components/Solana/constants";
import { request_raw_account_data } from "../../components/Solana/state";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { ListingData } from "@letscook/sdk/dist/state/listing";

interface useListingProps {
    tokenMintAddress: PublicKey | null;
}

const useListing = (props: useListingProps | null) => {
    const [listing, setListing] = useState<ListingData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const check_initial_listing = useRef<boolean>(true);

    // Ref to store the subscription ID, persists across re-renders
    const subscriptionRef = useRef<number | null>(null);

    const { connection } = useConnection();

    const tokenMintAddress = props?.tokenMintAddress || null;

    const getListingDataAccount = useCallback(() => {
        if (!tokenMintAddress) {
            setListing(null);
            setError("No page name provided");
            return;
        }

        return PublicKey.findProgramAddressSync([tokenMintAddress.toBytes(), Buffer.from("Listing")], PROGRAM)[0];
    }, [tokenMintAddress]);

    // Function to fetch the current assignment data
    const fetchInitialListingData = useCallback(async () => {
        if (!check_initial_listing.current) {
            return;
        }

        let account_address = getListingDataAccount();

        if (!account_address) {
            return;
        }
        check_initial_listing.current = false;

        let account_data = await request_raw_account_data("", account_address);

        if (account_data === null) {
            return;
        }
        const [listing] = ListingData.struct.deserialize(account_data);

        setListing(listing);
    }, [getListingDataAccount]);

    // Callback function to handle account changes
    const handleAccountChange = useCallback((accountInfo: any) => {
        let account_data = Buffer.from(accountInfo.data, "base64");

        if (account_data.length === 0) {
            setListing(null);
            return;
        }

        const [updated_data] = ListingData.struct.deserialize(account_data);

        setListing(updated_data);
    }, []);

    // Effect to set up the subscription and fetch initial data
    useEffect(() => {
        if (!tokenMintAddress) {
            setListing(null);
            setError(null);
            return;
        }

        let accountAddress = getListingDataAccount();
        if (!accountAddress) return;

        // Fetch the initial account data
        fetchInitialListingData();

        // Only set up a new subscription if one doesn't already exist
        if (subscriptionRef.current === null) {
            subscriptionRef.current = connection.onAccountChange(accountAddress, handleAccountChange);
        }

        // Cleanup function to remove the subscription when the component unmounts
        // or when the dependencies change
        return () => {
            if (subscriptionRef.current !== null) {
                connection.removeAccountChangeListener(subscriptionRef.current);
                subscriptionRef.current = null;
            }
        };
    }, [connection, tokenMintAddress, fetchInitialListingData, getListingDataAccount, handleAccountChange]);

    // Return the current token balance and any error message
    return { listing, error };
};

export default useListing;
