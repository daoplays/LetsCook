
import { useCallback} from 'react';


import {
    Text,
    Box
  } from "@chakra-ui/react";
  import styles from '../header.module.css'

  import { useWalletModal } from "@solana/wallet-adapter-react-ui";
  import { useWallet } from "@solana/wallet-adapter-react";

require('@solana/wallet-adapter-react-ui/styles.css');

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
                    className={styles.connect}

                    style={{backgroundColor:'#683309',borderRadius:20,padding:'5px 10px 2px 10px', color:'white',marginTop:10,position:'relative',top:2}}

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
            <Box as="button" onClick={handleConnectWallet}>
                <div className="font-face-rk">
                    <Text
                    className={styles.connect}
                    style={{backgroundColor:'#683309',borderRadius:20,padding:'5px 10px 2px 10px', color:'white',marginTop:10,position:'relative',top:2}}

                    >
                        CONNECT WALLET
                    </Text>
                </div>
            </Box>
        </>
    );
}