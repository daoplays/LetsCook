import { Dispatch, SetStateAction, useState } from "react";
import { HStack, Text, Box, useDisclosure } from "@chakra-ui/react";

import twitter from "../public/images/Twitter.png";
import telegram from "../public/images/Telegram.png";

import styles from "./header.module.css";
import MainButton from "./Buttons/mainButton";
import Image from "next/image";

function Footer() {
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <HStack
            bg="url(/images/footer_fill.jpeg)"
            bgSize="cover"
            boxShadow="0px 3px 13px 13px rgba(0, 0, 0, 0.75)"
            py={2}
            px={4}
            justify="start"
            gap={3}
        >
            <MainButton action={onOpen} label="TERMS" />
            <Image
                src={twitter.src}
                width={30}
                height={30}
                alt={"Twitter"}
                style={{
                    backgroundColor: "#683309",
                    borderRadius: "50%",
                    padding: 5,
                    cursor: "not-allowed",
                }}
            />
            <Image
                src={telegram.src}
                width={30}
                height={30}
                alt={"Telegram"}
                style={{
                    backgroundColor: "#683309",
                    borderRadius: "50%",
                    padding: 5,
                    cursor: "not-allowed",
                }}
            />
        </HStack>
    );
}

export default Footer;
