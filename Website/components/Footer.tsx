import { Dispatch, SetStateAction, useState } from "react";
import { HStack, Text, Box, useDisclosure } from "@chakra-ui/react";

import twitter from "../public/images/Twitter.png";
import discord from "../public/images/discord.png";
import { FaBook } from "react-icons/fa";

import styles from "./header.module.css";
import MainButton from "./Buttons/mainButton";
import Image from "next/image";
import { useRouter } from "next/router";
import Link from "next/link";

function Footer() {
    const router = useRouter();
    const { isOpen, onOpen, onClose } = useDisclosure();

    return (
        <HStack
            bg="url(/images/footer_fill.jpeg)"
            bgSize="cover"
            boxShadow="0px 3px 13px 13px rgba(0, 0, 0, 0.55)"
            py={2}
            px={4}
            justify="start"
            gap={2}
        >
            <Link href="/terms">
                <MainButton label="TERMS" />
            </Link>

            <Link href="faq">
                <MainButton label="FAQs" />
            </Link>

            <Link href="https://twitter.com/letscook_sol" target="_blank">
                <Image
                    src={twitter.src}
                    width={30}
                    height={30}
                    alt={"Twitter"}
                    style={{
                        backgroundColor: "#683309",
                        borderRadius: "50%",
                        padding: 5,
                    }}
                />
            </Link>

            <Link href="https://discord.gg/fZQd5yGWEr" target="_blank">
                <Image
                    src={discord}
                    width={30}
                    height={30}
                    alt={"Discord"}
                    style={{
                        backgroundColor: "#683309",
                        borderRadius: "50%",
                        padding: 5,
                    }}
                />
            </Link>

            <Link href="https://docs.letscook.wtf" target="_blank">
                <div
                    style={{
                        cursor: "pointer",
                        backgroundColor: "#683309",
                        borderRadius: "50%",
                        padding: 7,
                        color: "white",
                    }}
                >
                    <FaBook size={16} />
                </div>
            </Link>

            {/* <Image
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
            /> */}
        </HStack>
    );
}

export default Footer;
