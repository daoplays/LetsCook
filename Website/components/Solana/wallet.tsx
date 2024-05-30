import { useCallback } from "react";
import { Text, Box, HStack, Modal, ModalContent, ModalOverlay, ModalBody, useDisclosure, Center } from "@chakra-ui/react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import styles from "../header.module.css";
import UseWalletConnection from "../../hooks/useWallet";
import trimAddress from "../../utils/trimAddress";
import { FaSignOutAlt } from "react-icons/fa";
import useResponsive from "../../hooks/useResponsive";

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
                <HStack
                    align="center"
                    color="white"
                    className="font-face-rk"
                    style={{ backgroundColor: "#683309", borderRadius: 20 }}
                    py={1}
                    px={3}
                >
                    <FaSignOutAlt size={18} />
                    <Text m={0} className={styles.connect} style={{}}>
                        {trimAddress(wallet.publicKey.toString())}
                    </Text>
                </HStack>
            </Box>
        </>
    );
}

export function ConnectWalletButton() {
    const { handleConnectWallet } = UseWalletConnection();
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <>
            <Box as="button" onClick={onOpen}>
                <div className="font-face-rk">
                    <Text
                        className={styles.connect}
                        style={{
                            backgroundColor: "#683309",
                            borderRadius: 20,
                            padding: "5px 10px 2px 10px",
                            color: "white",
                            marginTop: 10,
                            position: "relative",
                            top: 2,
                        }}
                    >
                        CONNECT WALLET
                    </Text>
                </div>
            </Box>
            <EclipseWallets isOpen={isOpen} onClose={onClose}/>
        </>
    );
}

export const EclipseWallets = ({isOpen, onClose} : {isOpen : boolean, onClose : () => void}) => {
    const { select, wallets, publicKey, disconnect } = useWallet();
    const { sm } = useResponsive();

    const supportedWalletNames = ["Salmon", "Connect by Drift"];
  
    const supportedWallets = wallets.filter(
      (wallet) =>
        supportedWalletNames.includes(wallet.adapter.name) &&
      (wallet.readyState === "Installed" ||
        wallet.adapter.name === "Connect by Drift"),
    )

    if (supportedWallets.length === 0) {
        return( 
            <Modal size="md" isCentered isOpen={isOpen} onClose={onClose} motionPreset="slideInBottom">
            <ModalOverlay />
    
            <ModalContent
                h={sm ? 570 :  620}
                w={sm ? 420 :  620}
                style={{ background: "black" }}
            >
                <ModalBody>
                    <Center>
                    
                        <Text m="0" color="white">
                            No Eclipse supported wallets found
                            </Text>
                       
                    </Center>
                </ModalBody>
              </ModalContent>
            </Modal>
        );
    }

    return( 
        <Modal size="md" isCentered isOpen={isOpen} onClose={onClose} motionPreset="slideInBottom">
        <ModalOverlay />

        <ModalContent
            h={sm ? 570 :  620}
            w={sm ? 420 :  620}
            style={{ background: "black" }}
        >
            <ModalBody>
                <Center>
                {supportedWallets.map((wallet) => (
                <div key={wallet.adapter.name}>
                    <HStack>
                    <button
                    className="btn btn-outline btn-accent"
                    key={wallet.adapter.name}
                    onClick={() => select(wallet.adapter.name)}
                    >
                    <img
                        src={wallet.adapter.icon}
                        alt={wallet.adapter.name}
                        width="24px"
                        height="24px"
                    ></img>
                    
                        
                    </button>
                    <Text m="0" color="white">
                            {wallet.adapter.name === "Connect by Drift"
                        ? "MetaMask"
                        : wallet.adapter.name}
                        </Text>
                    </HStack>
                    <div className="divider"></div>
                </div>
                ))
                }
                </Center>
            </ModalBody>
          </ModalContent>
        </Modal>
    );
    
}