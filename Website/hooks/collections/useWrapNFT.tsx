import {
    PublicKey,
} from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { CollectionKeys } from "../../components/Solana/constants";
import { toast } from "react-toastify";
import { getMintData } from "@/components/amm/launch";
import useSendTransaction from "../useSendTransaction";
import {GetWrapNFTInstruction} from "@letscook/sdk/dist/instructions/collections/WrapNFT"
import { CollectionData } from "@letscook/sdk/dist/state/collections";

const useWrapNFT = (launchData: CollectionData) => {
    const wallet = useWallet();
    const {connection} = useConnection();
    const { sendTransaction, isLoading } = useSendTransaction();

    const WrapNFT = async (asset_key: PublicKey | null) => {

        if (wallet.publicKey.toString() == launchData.keys[CollectionKeys.Seller].toString()) {
            toast.error("Launch creator cannot buy tickets");
            return;
        }

        if (launchData === null) {
            toast.error("launch is null");
            return;
        }

        let mint_account = await getMintData(launchData.keys[CollectionKeys.MintAddress].toString());

        let instructions = await GetWrapNFTInstruction(launchData, mint_account, wallet.publicKey, asset_key, connection);
        await sendTransaction({
            instructions : [instructions],
            onSuccess: () => {
                // Handle success
            },
            onError: (error) => {
                // Handle error
            }
        });

    };

    return { WrapNFT, isLoading };
};

export default useWrapNFT;
