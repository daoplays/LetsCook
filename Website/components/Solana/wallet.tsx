import { useCallback } from "react";
import { Text, Box, HStack } from "@chakra-ui/react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import styles from "../header.module.css";
import UseWalletConnection from "../../hooks/useWallet";
import trimAddress from "../../utils/trimAddress";
import { FaSignOutAlt } from "react-icons/fa";

require("@solana/wallet-adapter-react-ui/styles.css");

export function DisconnectWalletButton() {
    const wallet = useWallet();
    const { handleDisconnectWallet } = UseWalletConnection();

    return (
        <>
            <Box
                as="button"
                onClick={() => {
                    handleDisconnectWallet();
                }}
            >
                <HStack align="center" color="white" className="bg-white text-black" style={{ borderRadius: 20 }} py={1} px={3}>
                    <FaSignOutAlt size={18} />
                    <Text m={0}>{trimAddress(wallet.publicKey.toString())}</Text>
                </HStack>
            </Box>
        </>
    );
}

export function ConnectWalletButton() {
    const { handleConnectWallet } = UseWalletConnection();

    return (
        <Box
            as="button"
            onClick={handleConnectWallet}
            style={{
                backgroundColor: "white",
                borderRadius: 20,
                padding: "5px 10px 2px 10px",
                color: "black",
                position: "relative",
            }}
        >
            <Text fontSize="large">Connect Wallet</Text>
        </Box>
    );
}
