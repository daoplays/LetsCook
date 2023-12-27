import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useCallback } from "react";

const UseWalletConnection = () => {
    const wallet = useWallet();
    const { setVisible } = useWalletModal();

    const handleDisconnectWallet = useCallback(async () => {
        console.log("call wallet disconnect");
        await wallet.disconnect();
    }, [wallet]);

    const handleConnectWallet = useCallback(async () => {
        setVisible(true);
    }, [setVisible]);

    return { handleConnectWallet, handleDisconnectWallet };
};

export default UseWalletConnection;
