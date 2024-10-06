import { CollectionKeys } from "../../../components/Solana/constants";

export const useCollection = (collectionList, check_initial_collection, collection_key, collection_name) => {
    if (!collectionList || !collection_name) return null;

    const collectionData = collectionList.get(collection_name);
    if (!collectionData) return null;

    if (check_initial_collection.current) {
        console.log("Check initial collection");
        collection_key.current = collectionData.keys[CollectionKeys.CollectionMint];
        check_initial_collection.current = false;
    }

    return collectionData;
};
