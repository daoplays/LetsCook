import {Dispatch, SetStateAction} from "react";

import {  HStack, Text, Box } from '@chakra-ui/react';

import {ConnectWalletButton, DisconnectWalletButton} from './Solana/wallet'
import { useWallet } from "@solana/wallet-adapter-react";

import {Screen} from "./Solana/constants"

import styles from './header.module.css'
import faq from "../public/images/FAQ.png";


function Navigation({showLaunch, setScreen} : {showLaunch : Dispatch<SetStateAction<boolean>>, 
  setScreen : Dispatch<SetStateAction<Screen>>}) {

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
        <div className="font-face-kg">
          <Text pl="10px" pt="10px" color={"brown"} onClick={() => setScreen(Screen.HOME_SCREEN)}>
            LET'S COOK
          </Text>
        </div>
        {wallet.publicKey && <DisconnectWalletButton />}
        {wallet.publicKey === null && <ConnectWalletButton />}
        <LaunchTokenButton showLaunch={showLaunch}/>
        <img
                src={faq.src}
                width="auto"
                alt={""}
                style={{ maxHeight: "30px", maxWidth: "30px" }}
                onClick={() => setScreen(Screen.FAQ_SCREEN)}
                />
        </HStack>
      </div>
      </>
    );
}

export default Navigation;
