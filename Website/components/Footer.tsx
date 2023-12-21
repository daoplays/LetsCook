import {Dispatch, SetStateAction} from "react";
import {  HStack, Text, Box } from '@chakra-ui/react';

import twitter from "../public/images/Twitter.png";
import telegram from "../public/images/Telegram.png";

import styles from './header.module.css'


function Footer({showTerms} : {showTerms : Dispatch<SetStateAction<boolean>>}) {

    const ShowTermsButton = ({showTerms} : {showTerms : Dispatch<SetStateAction<boolean>>}) => {

        return(
            <Box
              as="button"
              onClick={() => showTerms(true)}

              
              style={{backgroundColor:'#683309', borderRadius:'20px', padding:'5px 10px', height:30}}
              
          > 
              <div  className="font-face-rk">
                <Text align="center" fontSize={14} color="white">
                  TERMS
                </Text>
              </div>
          </Box>
        );
      }

    return (
        <div className={styles.footerImage}>
            <HStack style={{display:'flex',justifyContent:'flex-start',alignItems:'flex-start',width:'100%'}} mt="5px" mb="5px" ml="50px">
                <ShowTermsButton showTerms={showTerms}/>
                <img
                src={twitter.src}
                width="auto"
                alt={""}
                
                style={{ maxHeight: "30px", maxWidth: "30px", backgroundColor:'#683309', borderRadius:'50%', padding:5 }}
                />
                <img
                src={telegram.src}
                width="auto"
                alt={""}
                style={{ maxHeight: "30px", maxWidth: "30px", backgroundColor:'#683309', borderRadius:'50%', padding:5 }}
                />
            </HStack>
        </div>
    );
}
export default Footer;