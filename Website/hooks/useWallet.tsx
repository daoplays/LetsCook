import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useRouter } from "next/router";
import { useCallback } from "react";

const UseWalletConnection = () => {
    const router = useRouter();
    const wallet = useWallet();
    const { setVisible } = useWalletModal();

    const handleDisconnectWallet = useCallback(async () => {
        console.log("call wallet disconnect");
        await wallet.disconnect();
        router.push("/");
    }, [wallet]);

    const handleConnectWallet = useCallback(async () => {
        console.log("call connect wallet");
        setVisible(true);
    }, [setVisible]);

    return { handleConnectWallet, handleDisconnectWallet };
};

export default UseWalletConnection;
