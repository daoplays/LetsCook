import {Dispatch, SetStateAction, useState} from "react";

import {  HStack, Text, Box, useStatStyles } from '@chakra-ui/react';

import {ConnectWalletButton, DisconnectWalletButton} from './Solana/wallet'
import { useWallet } from "@solana/wallet-adapter-react";

import {Screen} from "./Solana/constants"

import styles from './header.module.css'
import faq from "../public/images/FAQ.png";
import { useMediaQuery } from "react-responsive";


function Navigation({showLaunch, setScreen} : {showLaunch : Dispatch<SetStateAction<boolean>>, 
  setScreen : Dispatch<SetStateAction<Screen>>}) {

  const LaunchTokenButton = ({setScreen} : {setScreen : Dispatch<SetStateAction<Screen>>}) => {

    return(
        <Box
          as="button"
          onClick={() => setScreen(Screen.LAUNCH_SCREEN)}
          
          
      >
          <div className="font-face-rk">
            <Text align="center" 
            className={styles.connect}
            style={{backgroundColor:'#683309',borderRadius:20,padding:'5px 10px 2px 10px', color:'white',marginTop: 12,marginRight:10}}
            color="white">
              LAUNCH 
            </Text>
          </div>
      </Box>
    );
  }

  const wallet = useWallet();


  const isDesktopOrLaptop = useMediaQuery({
    query: '(max-width: 1000px)'
  })

  const [open,setOpen]=useState(0)
  return (
    <>
    <div className={styles.headerImage}>
      <HStack 
      className={styles.navBody}
      style={{
        display:'flex',justifyContent:'space-between',alignItems:'center',width:'100%'
      }}>
        <div style={{display:'flex', justifyContent:'center', alignItems:'center'}}>
        <div onClick={() => setScreen(Screen.HOME_SCREEN)}  className="font-face-kg" style={{fontSize: isDesktopOrLaptop ?14: 25, color:'#683309', marginTop: isDesktopOrLaptop ? 8:0}}>
          {/* <Text pl="5px" pt="7px" pb="0px" style={{fontSize: isDesktopOrLaptop ?14: 25}} color={"#683309"} onClick={() => setScreen(Screen.HOME_SCREEN)}> */}
            LET'S COOK
          {/* </Text> */}
        </div>
        </div>

        <div style={{display:'flex', justifyContent:'center', alignItems:'center', 
        gap: isDesktopOrLaptop ? 10: 20,marginBottom: isDesktopOrLaptop ? 0: 0
        }} >
          <div className={styles.sauce}  >
            <img src="./images/sauce 2.png" alt=""/>
            <div>1,400</div>
          </div>
        <img
                src='./images/Group 38.png'
                width="auto"
                alt={""}
                style={{ maxHeight: "35px", maxWidth: "35px" }}
                />
                        <img
                src='./images/Group 39.png'
                width="auto"
                alt={""}
                style={{ maxHeight: "35px", maxWidth: "35px" }}
                />

                {
                  isDesktopOrLaptop ?
                  <img
                  onClick={(e)=>{setOpen(!open)}}
                  src='./images/Group (6).png'
                  width="auto"
                  alt={""}
                  style={{ maxHeight: "40px", maxWidth: "40px", marginRight:5 }}
                  />  
                  :
                  <>
                             {wallet.publicKey && <DisconnectWalletButton />}
                  {wallet.publicKey === null && <ConnectWalletButton />}
                  <LaunchTokenButton setScreen={setScreen}/>       
                  </>

                }
 {
  open &&

  <div className={styles.menubar} >
  <div>
  {wallet.publicKey && <DisconnectWalletButton />}
  </div>
  <div>
  {wallet.publicKey === null && <ConnectWalletButton />}

  </div>
  <div>
  <LaunchTokenButton setScreen={setScreen}/>       

  </div>

</div>
 }



        </div>


        </HStack>
      </div>
      </>
    );
}

export default Navigation;
