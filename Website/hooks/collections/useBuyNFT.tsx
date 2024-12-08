import { PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import useSendTransaction from "../useSendTransaction";
import { GetBuyNFTInstructions } from "@letscook/sdk/dist/instructions/collections/BuyNFT";
import { CollectionData } from "@letscook/sdk/dist/state/collections";
import { toast } from "react-toastify";

const useBuyNFT = (launchData: CollectionData) => {
    const wallet = useWallet();
    const { connection } = useConnection();

    const { sendTransaction, isLoading } = useSendTransaction();

    const BuyNFT = async (asset_key: PublicKey, index: number) => {
        if (wallet.signTransaction === undefined) {
            console.log(wallet, "invalid wallet");
            return;
        }

        if (isLoading) {
            console.log("signature not null");
            toast.error("Transaction pending, please wait");
            return;
        }

        if (launchData === null) {
            toast.error("launch is null");
            return;
        }

        let instruction = await GetBuyNFTInstructions(connection, launchData, wallet.publicKey, asset_key, index);

        if (!instruction) {
            toast.error("Failed to get buy NFT instruction");
            return;
        }

        await sendTransaction({
            instructions: [instruction],
            onSuccess: () => {
                // Handle success
            },
            onError: (error) => {
                console.error("Failed to buy NFT:", error);
            },
        });
    };

    return { BuyNFT, isLoading };
};

export default useBuyNFT;
