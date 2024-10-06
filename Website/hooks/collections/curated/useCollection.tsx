import { PublicKey } from "@solana/web3.js";
import { useRef } from "react";
import { CollectionKeys } from "../../../components/Solana/constants";


export const useCollection = (collectionList, check_initial_collection, collection_key, collection_name) => {

    let launch = collectionList.get(collection_name);

    if (launch === null) return;

    if (check_initial_collection.current) {
        console.log("check intitial cllection");
        collection_key.current = launch.keys[CollectionKeys.CollectionMint];
        check_initial_collection.current = false;
        return launch;
    } else {
        return null;
    }
};
