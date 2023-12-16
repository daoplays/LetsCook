import {Dispatch, SetStateAction} from "react";
import Link from 'next/link';

import {  HStack, Text, Box } from '@chakra-ui/react';

import {ConnectWalletButton, DisconnectWalletButton} from './Solana/wallet'
import { useWallet } from "@solana/wallet-adapter-react";

import styles from './header.module.css'

function Navigation({showLaunch} : {showLaunch : Dispatch<SetStateAction<boolean>>}) {

  const LaunchTokenButton = ({showLaunch} : {showLaunch : Dispatch<SetStateAction<boolean>>}) => {

    return(
        <Box
          as="button"
          onClick={() => showLaunch(true)}
          borderWidth="1px"
          borderColor="white"
          width="200px"
          height="25px"
          fontSize={"16px"}
          mb="6px"
          
      >
          <div className="font-face-rk">
            <Text align="center" fontSize={14} color="white">
              LAUNCH TOKEN
            </Text>
          </div>
      </Box>
    );
  }

  const wallet = useWallet();


  return (
    <>
    <div className={styles.headerImage}>
      <HStack>
      <Link href="/">
        <div className="font-face-kg">
          <Text pl="10px" pt="10px" color={"brown"}>
            LET'S COOK
          </Text>
        </div>
        </Link>
        {wallet.publicKey && <DisconnectWalletButton />}
        {wallet.publicKey === null && <ConnectWalletButton />}
        <LaunchTokenButton showLaunch={showLaunch}/>
        </HStack>
      </div>
      </>
    );
}

export default Navigation;
