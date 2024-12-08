import {
    PublicKey,
} from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import useSendTransaction from "../useSendTransaction";
import {GetUnlistInstructions} from "@letscook/sdk/dist/instructions/collections/unlistNFT"
import { CollectionData } from "@letscook/sdk/dist/state/collections";
import { toast } from "react-toastify";

const useUnlistNFT = (launchData: CollectionData) => {
    const wallet = useWallet();
    const { sendTransaction, isLoading } = useSendTransaction();

    const UnlistNFT = async (asset_key: PublicKey, index: number) => {

        if (launchData === null) {
            toast.error("launch is null");
            return;
        }


        let instructions = await GetUnlistInstructions(launchData, wallet.publicKey, asset_key, index);
        await sendTransaction({
            instructions: [instructions],
            onSuccess: () => {
                // Handle success
            },
            onError: (error) => {
                // Handle error
            }
        });
        
    };

    return { UnlistNFT, isLoading };
};

export default useUnlistNFT;
