import { useEffect, useState, useCallback, useRef } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AccountSubscriptionConfig, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { TokenAccount, bignum_to_num, request_raw_account_data, request_token_amount } from "../../components/Solana/state";
import useAppRoot from "../../context/useAppRoot";
import { AssignmentData, CollectionData, request_assignment_data } from "../../components/collection/collectionState";
import { CollectionKeys, Config, PROGRAM, SYSTEM_KEY } from "../../components/Solana/constants";
import { Key, getAssetV1GpaBuilder, updateAuthority, AssetV1, fetchAssetV1, deserializeAssetV1 } from "@metaplex-foundation/mpl-core";
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
        let config: AccountSubscriptionConfig = {
            commitment: "confirmed",
            encoding: "base64",
        };

        // Only set up a new subscription if one doesn't already exist
        if (randomsWSRef.current === null) {
            randomsWSRef.current = connection.onAccountChange(randomsAccount.current, handleRandomsChange, config);
        }

        // Cleanup function to remove the subscription when the component unmounts
        // or when the dependencies change
        return () => {
            if (randomsWSRef.current !== null) {
                connection.removeAccountChangeListener(randomsWSRef.current);
                randomsWSRef.current = null;
            }
        };
    }, [assignmentData, connection, handleRandomsChange]);

    // Return the current token balance and any error message
    return { assignmentData, validRandoms, asset, assetMeta, error };
};

export default useAssignmentData;
