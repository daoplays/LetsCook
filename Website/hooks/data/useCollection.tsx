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

// Collections are already streamed via _contexts so we dont need to have a websocket here aswell
const useCollection = (props: useCollectionProps | null) => {
    // State to store the token balance and any error messages
    const [collection, setCollection] = useState<CollectionData | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Get the collectionList from the app's root context
    const { collectionList } = useAppRoot();

    const pageName = props?.pageName || null;

    // Function to fetch the current collectiondata
    const fetchCollection = useCallback(() => {
        if (!pageName) {
            setCollection(null);
            setError("No page name provided");
            return;
        }

        if (!collectionList) {
            setCollection(null);
            setError("Collection list is not available");
            return;
        }

        const data = collectionList.get(pageName.toString());

        if (!data) {
            setCollection(null);
            setError(`Collection for ${pageName} not found`);
            return;
        }

        setCollection(data);
        setError(null);
    }, [collectionList, pageName]);

    useEffect(() => {
        fetchCollection();
    }, [fetchCollection]);

    // Return the current token balance and any error message
    return { collection, error };
};

export default useCollection;
