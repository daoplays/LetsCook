import { useEffect, useState, useCallback, useRef } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { AssetWithMetadata } from "../../pages/collection/[pageName]";
import { Key, getAssetV1GpaBuilder, updateAuthority, AssetV1, fetchAssetV1, deserializeAssetV1 } from "@metaplex-foundation/mpl-core";
import type { RpcAccount, PublicKey as umiKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import { Config } from "../../components/Solana/constants";

interface UseTokenBalanceProps {
    collectionAddress: PublicKey | null;
}

const useNFTBalance = (props: UseTokenBalanceProps | null) => {
    // State to store the token balance and any error messages
    const [nftBalance, setNFTBalance] = useState<number>(null);
    const [ownedAssets, setOwnedAssets] = useState<AssetWithMetadata[]>([]);
    const [error, setError] = useState<string | null>(null);

    const checkNFTBalance = useRef<boolean>(true);
    const checkInitialNFTBalance = useRef<boolean>(true);

    // Get the Solana connection and wallet
    const { connection } = useConnection();
    const wallet = useWallet();

    const collectionAddress = props?.collectionAddress || null;

    // Function to fetch the current nft balance
    const fetchNFTBalance = useCallback(async () => {
        if (!collectionAddress || wallet === null || wallet.publicKey === null) return;

        if (!checkNFTBalance.current) return;

        console.log("CHECKING NFT BALANCE");

        const umi = createUmi(Config.RPC_NODE, "confirmed");

        let collection_umiKey = publicKey(collectionAddress.toString());

        const assets = await getAssetV1GpaBuilder(umi)
            .whereField("key", Key.AssetV1)
            .whereField("updateAuthority", updateAuthority("Collection", [collection_umiKey]))
            .getDeserialized();

        let owned_assets: AssetWithMetadata[] = [];
        for (let i = 0; i < assets.length; i++) {
            if (assets[i].owner.toString() === wallet.publicKey.toString()) {
                let uri_json = await fetch(assets[i].uri).then((res) => res.json());
                let entry: AssetWithMetadata = { asset: assets[i], metadata: uri_json };
                owned_assets.push(entry);
            }
        }

        setOwnedAssets(owned_assets);
        setNFTBalance(owned_assets.length);

        checkNFTBalance.current = false;
    }, [collectionAddress, wallet]);

    // Effect to set up the subscription and fetch initial balance
    useEffect(() => {
        if (!collectionAddress || !wallet) {
            setNFTBalance(0);
            setOwnedAssets([]);
            setError(null);
            return;
        }

        // Fetch the initial token balance
        if (checkInitialNFTBalance.current) {
            fetchNFTBalance();
            checkInitialNFTBalance.current = false;
        }
    }, [connection, fetchNFTBalance]);

    // Return the current nfts and any error message
    return { nftBalance, ownedAssets, checkNFTBalance, fetchNFTBalance, error };
};

export default useNFTBalance;
