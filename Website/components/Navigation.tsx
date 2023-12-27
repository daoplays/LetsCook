import { Dispatch, SetStateAction, useState } from "react";
import { HStack, Text, Box, Stack, Button, VStack, useDisclosure } from "@chakra-ui/react";
import { ConnectWalletButton, DisconnectWalletButton } from "./Solana/wallet";
import { useWallet } from "@solana/wallet-adapter-react";
import { Screen } from "./Solana/constants";
import styles from "./header.module.css";
import useResponsive from "../hooks/useResponsive";
import Image from "next/image";
import UseWalletConnection from "../hooks/useWallet";

function Navigation({ setScreen }: { setScreen: Dispatch<SetStateAction<Screen>> }) {
    const wallet = useWallet();
    const { md } = useResponsive();
    const { isOpen, onToggle } = useDisclosure();
    const { handleDisconnectWallet, handleConnectWallet } = UseWalletConnection();

    const LaunchTokenButton = () => (
        <Box
            as="button"
            onClick={() => {
                setScreen(Screen.LAUNCH_SCREEN);
            }}
        >
            <Text
                m="auto 0"
                align="center"
                className={styles.launch}
                style={{
                    backgroundColor: "#683309",
                    borderRadius: 20,
                    padding: "5px 10px 2px 10px",
                }}
                color="white"
            >
                LAUNCH
            </Text>
        </Box>
    );

    return (
        <>
            <div className={styles.headerImage}>
                <HStack px={4} h="100%" w="100%" alignItems="center" justify="space-between">
                    <Text
                        fontSize={md ? "large" : "x-large"}
                        color={"#683309"}
                        onClick={() => setScreen(Screen.HOME_SCREEN)}
                        className="font-face-kg"
                        style={{ cursor: "pointer", margin: "auto 0" }}
                    >
                        LET'S COOK
                    </Text>
                    <HStack gap={4}>
                        <div className={styles.sauce}>
                            <img src="./images/sauce 2.png" alt="" />
                            <div>1,400</div>
                        </div>

                        {!md && (
                            <img
                                src="./images/points.png"
                                width="auto"
                                alt={""}
                                style={{ maxHeight: "35px", maxWidth: "35px", cursor: "pointer" }}
                                onClick={() => setScreen(Screen.LEADERBOARD)}
                            />
                        )}

                        {!md && (
                            <img
                                src="./images/money-bag.png"
                                width="auto"
                                alt={""}
                                style={{ maxHeight: "35px", maxWidth: "35px", cursor: "not-allowed" }}
                            />
                        )}

                        {!md && (
                            <img
                                src="./images/question-mark.png"
                                width="auto"
                                alt={""}
                                style={{ maxHeight: "35px", maxWidth: "35px", cursor: "not-allowed" }}
                            />
                        )}

                        {md ? (
                            <img
                                onClick={onToggle}
                                src="./images/Group (6).png"
                                width="auto"
                                alt={""}
                                style={{ maxHeight: "40px", maxWidth: "40px", marginRight: 5 }}
                            />
                        ) : (
                            <>
                                {wallet.publicKey && <DisconnectWalletButton />}
                                {wallet.publicKey === null && <ConnectWalletButton />}
                                <LaunchTokenButton />
                            </>
                        )}
                    </HStack>
                </HStack>
            </div>

            {/* Mobile Menu */}
            <VStack
                position="absolute"
                top={50}
                justify="center"
                left={0}
                right={0}
                py={10}
                pb={6}
                bg="url(/images/mobile-menu-bg.png)"
                backgroundSize="cover"
                borderBottomRadius={12}
                spacing={6}
                hidden={!md || isOpen}
                boxShadow="0px 3px 13px 0px rgba(0,0,0,0.75) inset"
            >
                <VStack spacing={3} mb={6} className="font-face-kg">
                    {wallet.publicKey && (
                        <Text fontSize="x-large" color="#683309" className="font-face-kg" onClick={() => handleDisconnectWallet()}>
                            Disconnect Wallet
                        </Text>
                    )}
                    {wallet.publicKey === null && (
                        <Text fontSize="x-large" color="#683309" className="font-face-kg" onClick={() => handleConnectWallet()}>
                            Connect Wallet
                        </Text>
                    )}
                    <Image src="/images/divider.png" alt="Divider" width="320" height={20} />
                </VStack>

                <Text className={styles.connect}>LAUNCH</Text>

                <Text className={styles.connect}>LEADERBOARD</Text>

                <Text className={styles.connect}>MY BAGS</Text>

                <Text className={styles.connect}>HISTORY</Text>

                <Text className={styles.connect}>FAQS</Text>
            </VStack>
        </>
    );
}

export default Navigation;
