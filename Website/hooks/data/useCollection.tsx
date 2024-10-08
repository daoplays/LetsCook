import { useEffect, useState, useCallback, useRef } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { TokenAccount, bignum_to_num, request_token_amount } from "../../components/Solana/state";
import useAppRoot from "../../context/useAppRoot";
import { CollectionData } from "../../components/collection/collectionState";
import { PublicKey } from "@solana/web3.js";
import { PROGRAM } from "../../components/Solana/constants";

interface useCollectionProps {
    pageName: string | null;
}

const useCollection = (props: useCollectionProps | null) => {
    // State to store the token balance and any error messages
    const [collection, setCollection] = useState<CollectionData | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Get the Solana connection and wallet
    const { connection } = useConnection();

    // Get the collectionList from the app's root context
    const { collectionList } = useAppRoot();

    // Ref to store the subscription ID, persists across re-renders
    const subscriptionRef = useRef<number | null>(null);

    const pageName = props?.pageName || null;

    // Function to fetch the current collectiondata
    const fetchCollection = useCallback(async () => {
        let data = collectionList.get(pageName.toString());

        if (!data) return;

        setCollection(data);
    }, [collectionList]);

    // Callback function to handle account changes
    const handleAccountChange = useCallback((accountInfo: any) => {
        let account_data = Buffer.from(accountInfo.data, "base64");

        const [updated_data] = CollectionData.struct.deserialize(account_data);

        setCollection(updated_data);
    }, []);

    // Function to get the collection account address
    const getCollectionAccount = useCallback(() => {
        return PublicKey.findProgramAddressSync([Buffer.from(pageName), Buffer.from("Collection")], PROGRAM)[0];
    }, [pageName]);

    // Effect to set up the subscription and fetch initial balance
    useEffect(() => {
        if (!pageName || !collectionList) {
            setCollection(null);
            setError(null);
            return;
        }

        // Fetch the initial token balance
        fetchCollection();

        const collectionAccount = getCollectionAccount();

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
    }, [connection, fetchCollection, getCollectionAccount, handleAccountChange]);

    // Return the current token balance and any error message
    return { collection, error };
};

export default useCollection;
