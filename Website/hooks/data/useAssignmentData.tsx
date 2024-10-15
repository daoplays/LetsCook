import { useEffect, useState, useCallback, useRef } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AccountSubscriptionConfig, PublicKey } from "@solana/web3.js";
import { request_raw_account_data } from "../../components/Solana/state";
import { AssignmentData, CollectionData, request_assignment_data } from "../../components/collection/collectionState";
import { CollectionKeys, Config, PROGRAM, SYSTEM_KEY } from "../../components/Solana/constants";
import { AssetV1, deserializeAssetV1 } from "@metaplex-foundation/mpl-core";
import type { RpcAccount, PublicKey as umiKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";

interface UseAssignmentDataProps {
    collection: CollectionData | null;
}

const useAssignmentData = (props: UseAssignmentDataProps | null) => {
    // State to store the token balance and any error messages
    const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(null);
    const [validRandoms, setValidRandoms] = useState<boolean>(false);
    const [asset, setAsset] = useState<AssetV1 | null>(null);
    const [assetMeta, setAssetMeta] = useState<string | null>(null);

    const randomsAccount = useRef<PublicKey | null>(null);

    const [error, setError] = useState<string | null>(null);

    const check_initial_assignment = useRef<boolean>(true);

    // Get the Solana connection and wallet
    const { connection } = useConnection();
    const wallet = useWallet();

    // Ref to store the subscription ID, persists across re-renders
    const subscriptionRef = useRef<number | null>(null);
    const randomsWSRef = useRef<number | null>(null);

    // we also set up a poll for the randoms account as a backup just in case the WS fails
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const collection = props?.collection || null;
    const collectionMint = collection?.keys[CollectionKeys.CollectionMint] || null;

    // Function to get the user's token account address
    const getAssignmentDataAccount = useCallback(() => {
        if (!wallet.publicKey) return null;

        if (!collectionMint) return null;

        return PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), collectionMint.toBytes(), Buffer.from("assignment")],
            PROGRAM,
        )[0];
    }, [wallet.publicKey, collectionMint]);

    // Function to fetch the current assignment data
    const fetchAssignmentData = useCallback(async () => {
        if (!check_initial_assignment.current) {
            return;
        }

        let nft_assignment_account = getAssignmentDataAccount();

        if (!nft_assignment_account) {
            return;
        }

        check_initial_assignment.current = false;

        let assignment_data = await request_assignment_data(nft_assignment_account);

        if (assignment_data === null) {
            return;
        }

        if (!assignment_data.random_address.equals(SYSTEM_KEY) && assignment_data.status == 0) {
            let orao_data = await request_raw_account_data("", assignment_data.random_address);
            let randomness: number[] = Array.from(orao_data.slice(8 + 32, 8 + 32 + 64));

            let valid = false;
            for (let i = 0; i < randomness.length; i++) {
                if (randomness[i] != 0) {
                    valid = true;
                    break;
                }
            }
            setValidRandoms(valid);
        }

        setAssignmentData(assignment_data);
    }, [wallet]);

    // Function to update asset information
    const updateAsset = useCallback(async () => {
        if (!collection || !assignmentData) {
            return;
        }

        console.log("update assignment", assignmentData);

        if (assignmentData.status < 2) {
            setAsset(null);
            setAssetMeta(null);
        } else {
            let nft_index = assignmentData.nft_index;
            let json_url = collection.nft_meta_url + nft_index + ".json";
            let asset = null;
            let metadata = await fetch(json_url).then((res) => res.json());
            console.log("json:", metadata);

            try {
                const umi = createUmi(Config.RPC_NODE, "confirmed");

                let asset_umiKey = publicKey(assignmentData.nft_address.toString());
                const myAccount = await umi.rpc.getAccount(asset_umiKey);

                if (myAccount.exists) {
                    asset = await deserializeAssetV1(myAccount as RpcAccount);
                    console.log("new asset", asset);

                    metadata = await fetch(asset.uri).then((res) => res.json());
                    console.log("json2:", metadata);
                } else {
                    asset = null;
                }
            } catch (error) {
                asset = null;
            }

            setAsset(asset);
            setAssetMeta(metadata);
        }
    }, [collection, assignmentData]);

    // Callback function to handle account changes
    const handleAccountChange = useCallback((accountInfo: any) => {
        let account_data = Buffer.from(accountInfo.data, "base64");

        if (account_data.length === 0) {
            setAssignmentData(null);
            return;
        }

        const [updated_data] = AssignmentData.struct.deserialize(account_data);

        setAssignmentData(updated_data);
    }, []);

    // Effect to set up the subscription and fetch initial data
    useEffect(() => {
        if (!collectionMint) {
            setAssignmentData(null);
            setError(null);
            return;
        }

        const userAccount = getAssignmentDataAccount();
        if (!userAccount) return;

        // Fetch the initial account data
        fetchAssignmentData();

        // Only set up a new subscription if one doesn't already exist
        if (subscriptionRef.current === null) {
            subscriptionRef.current = connection.onAccountChange(userAccount, handleAccountChange);
        }

        // Cleanup function to remove the subscription when the component unmounts
        // or when the dependencies change
        return () => {
            if (subscriptionRef.current !== null) {
                connection.removeAccountChangeListener(subscriptionRef.current);
                subscriptionRef.current = null;
            }
        };
    }, [connection, collectionMint, fetchAssignmentData, getAssignmentDataAccount, handleAccountChange]);

    // Callback function to handle randoms account changes
    const handleRandomsChange = useCallback((accountInfo: any) => {
        let account_data = Buffer.from(accountInfo.data, "base64");
        console.log("randoms account update", account_data);
        if (account_data.length === 0) {
            setValidRandoms(false);
            return;
        }

        let randomness: number[] = Array.from(account_data.slice(8 + 32, 8 + 32 + 64));

        let valid = false;
        for (let i = 0; i < randomness.length; i++) {
            if (randomness[i] != 0) {
                valid = true;
                break;
            }
        }

        setValidRandoms(valid);
    }, []);

    // poll the randoms account slowly as a fallback for the WS
    const pollRandomsAccount = useCallback(async () => {
        console.log("Poll randoms account");
        if (!randomsAccount.current) return;

        try {
            const accountInfo = await connection.getAccountInfo(randomsAccount.current);
            if (accountInfo) {
                handleRandomsChange(accountInfo);
            }
        } catch (error) {
            console.error("Error polling randoms account:", error);
        }
    }, [connection, handleRandomsChange]);

    // Effect to handle changes in assignment data and set up randoms account subscription
    useEffect(() => {
        if (!assignmentData) {
            return;
        }

        updateAsset();

        let random_address = assignmentData.random_address;

        if (random_address.equals(SYSTEM_KEY)) {
            randomsAccount.current = null;
            setValidRandoms(false);
            return;
        }

        if (randomsAccount.current && randomsAccount.current.equals(random_address)) {
            return;
        }

        randomsAccount.current = random_address;
        console.log("randoms account", randomsAccount.current.toString());

        // we now set up both a WS and a slow poll to monitor the randoms account

        // Clear previous interval if it exists
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }

        // Clear previous WebSocket subscription if it exists
        if (randomsWSRef.current !== null) {
            connection.removeAccountChangeListener(randomsWSRef.current);
            randomsWSRef.current = null;
        }

        let config: AccountSubscriptionConfig = {
            commitment: "confirmed",
            encoding: "base64",
        };

        // set up a new subscription
        randomsWSRef.current = connection.onAccountChange(randomsAccount.current, handleRandomsChange, config);

        // Set up new polling interval
        pollIntervalRef.current = setInterval(pollRandomsAccount, 10000);

        // Perform initial poll immediately
        pollRandomsAccount();

        // Cleanup function to remove the subscription when the component unmounts
        // or when the dependencies change
        return () => {
            if (randomsWSRef.current !== null) {
                connection.removeAccountChangeListener(randomsWSRef.current);
                randomsWSRef.current = null;
            }
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [assignmentData, connection, handleRandomsChange]);

    // Effect to stop polling when randoms become valid
    useEffect(() => {
        if (validRandoms && pollIntervalRef.current) {
            console.log("clear the poll");
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    }, [validRandoms]);

    // Return the current token balance and any error message
    return { assignmentData, validRandoms, asset, assetMeta, error };
};

export default useAssignmentData;
