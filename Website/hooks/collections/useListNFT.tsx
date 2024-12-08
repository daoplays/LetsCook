import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

import { useWallet } from "@solana/wallet-adapter-react";
import useSendTransaction from "../useSendTransaction";
import { GetListNFTInstruction } from "@letscook/sdk";
import { CollectionData } from "@letscook/sdk/dist/state/collections";
import { toast } from "react-toastify";

const useListNFT = (launchData: CollectionData) => {
    const wallet = useWallet();
    const { sendTransaction, isLoading } = useSendTransaction();

    const ListNFT = async (asset_key: PublicKey, price: number) => {
        if (launchData === null) {
            toast.error("launch is invalid");
            return;
        }

        let instruction = await GetListNFTInstruction(launchData, wallet.publicKey, asset_key, price * LAMPORTS_PER_SOL);

        await sendTransaction({
            instructions: [instruction],
            onSuccess: () => {
                // Handle success
            },
            onError: (error) => {
                // Handle error
            },
        });
    };

    return { ListNFT, isLoading };
};

export default useListNFT;
