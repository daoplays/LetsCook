
import { useCallback} from 'react';


import {
    Text,
    Box
  } from "@chakra-ui/react";

  import { useWalletModal } from "@solana/wallet-adapter-react-ui";
  import { useWallet } from "@solana/wallet-adapter-react";



export function DisconnectWalletButton() {

    const wallet = useWallet();

    const DisconnectWallet = useCallback(async () => {
        console.log("call wallet disconnect");
        await wallet.disconnect();
    }, [wallet]);

    return (
        <>
            <Box as="button" onClick={() => DisconnectWallet()}>
                <div className="font-face-rk">
                    <Text
                        borderColor="white"
                        borderWidth="1px"
                        width="200px"
                        height="25px"
                        fontSize={"16px"}
                        textAlign="center"
                        color="white"
                        mt="10px"
                    >
                        DISCONNECT WALLET
                    </Text>
                </div>
            </Box>
        </>
    );
}
  
export function ConnectWalletButton() {
    const { setVisible } = useWalletModal();

    const handleConnectWallet = useCallback(async () => {
        setVisible(true);
    }, [setVisible]);

    return (
        <>
            <Box mb="1rem" as="button" onClick={handleConnectWallet}>
                <div className="font-face-rk">
                    <Text
                        borderColor="white"
                        borderWidth="1px"
                        width="160px"
                        height="25px"
                        fontSize={"16px"}
                        textAlign="center"
                        color="white"
                        mb="0"
                    >
                        CONNECT WALLET
                    </Text>
                </div>
            </Box>
        </>
    );
}