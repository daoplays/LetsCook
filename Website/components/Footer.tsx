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
              borderWidth="1px"
              borderColor="white"
              width="100px"
              height="20px"
              fontSize={"16px"}
              
          >
              <div className="font-face-rk">
                <Text align="center" fontSize={14} color="white">
                  TERMS
                </Text>
              </div>
          </Box>
        );
      }

    return (
        <div className={styles.footerImage}>
            <HStack mt="7px" ml="50px">
                <ShowTermsButton showTerms={showTerms}/>
                <img
                src={twitter.src}
                width="auto"
                alt={""}
                style={{ maxHeight: "20px", maxWidth: "20px" }}
                />
                <img
                src={telegram.src}
                width="auto"
                alt={""}
                style={{ maxHeight: "20px", maxWidth: "20px" }}
                />
            </HStack>
        </div>
    );
}
export default Footer;