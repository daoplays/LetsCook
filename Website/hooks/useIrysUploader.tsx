import React, { useCallback } from "react";
import { WebUploader } from "@irys/web-upload";
import { WebEclipseEth, WebSolana } from "@irys/web-upload-solana";
import { Config } from "../components/Solana/constants";

const useIrysUploader = (wallet) => {
    const getEclipseIrysUploader = useCallback(async () => {
        if (Config.PROD) {
            return await WebUploader(WebEclipseEth).withProvider(wallet).withRpc(Config.RPC_NODE).mainnet();
        }
        return await WebUploader(WebEclipseEth).withProvider(wallet).withRpc(Config.RPC_NODE).devnet();
    }, [wallet]);

    const getSolanaIrysUploader = useCallback(async () => {
        if (Config.PROD) {
            return await WebUploader(WebSolana).withProvider(wallet).withRpc(Config.RPC_NODE).mainnet();
        }
        return await WebUploader(WebSolana).withProvider(wallet).withRpc(Config.RPC_NODE).devnet();
    }, [wallet]);

    const getIrysUploader = useCallback(async () => {
        if (Config.NETWORK === "eclipse") {
            return getEclipseIrysUploader();
        }
        return getSolanaIrysUploader();
    }, [getEclipseIrysUploader, getSolanaIrysUploader]);

    return { getIrysUploader };
};

export default useIrysUploader;
