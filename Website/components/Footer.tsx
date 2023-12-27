import { Dispatch, SetStateAction, useState } from "react";
import { HStack, Text, Box, useDisclosure } from "@chakra-ui/react";

import twitter from "../public/images/Twitter.png";
import telegram from "../public/images/Telegram.png";

import styles from "./header.module.css";
import { TermsModal } from "./Solana/modals";

function Footer() {
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <>
            <div className={styles.footerImage}>
                <HStack py={2} px={4} justify="start" gap={3}>
                    <Box
                        as="button"
                        onClick={onOpen}
                        style={{ backgroundColor: "#683309", borderRadius: "20px", padding: "5px 10px", height: 30 }}
                    >
                        <div className="font-face-rk">
                            <Text align="center" fontSize={14} color="white">
                                TERMS
                            </Text>
                        </div>
                    </Box>
                    <img
                        src={twitter.src}
                        width="auto"
                        alt={""}
                        style={{
                            maxHeight: "30px",
                            maxWidth: "30px",
                            backgroundColor: "#683309",
                            borderRadius: "50%",
                            padding: 5,
                            cursor: "not-allowed",
                        }}
                    />
                    <img
                        src={telegram.src}
                        width="auto"
                        alt={""}
                        style={{
                            maxHeight: "30px",
                            maxWidth: "30px",
                            backgroundColor: "#683309",
                            borderRadius: "50%",
                            padding: 5,
                            cursor: "not-allowed",
                        }}
                    />
                </HStack>
            </div>
            <TermsModal show_value={isOpen} showFunction={onClose} />
        </>
    );
}

export default Footer;
