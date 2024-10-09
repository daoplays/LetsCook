import { useEffect, useState, useCallback, useRef } from "react";
import useAppRoot from "../../context/useAppRoot";
import { CollectionData, CollectionPluginData, getCollectionPlugins } from "../../components/collection/collectionState";

interface useCollectionProps {
    pageName: string | null;
}

// Collections are already streamed via _contexts so we dont need to have a websocket here aswell
const useCollection = (props: useCollectionProps | null) => {
    // State to store the token balance and any error messages
    const [collection, setCollection] = useState<CollectionData | null>(null);
    const [collectionPlugins, setCollectionPlugins] = useState<CollectionPluginData | null>(null);
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
        setCollectionPlugins(getCollectionPlugins(data));

        setError(null);
    }, [collectionList, pageName]);

    useEffect(() => {
        fetchCollection();
    }, [fetchCollection]);

    // Return the current token balance and any error message
    return { collection, collectionPlugins, error };
};

export default useCollection;
