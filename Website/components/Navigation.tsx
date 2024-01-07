import { HStack, Show, Text, Tooltip, VStack, useDisclosure } from "@chakra-ui/react";
import { ConnectWalletButton, DisconnectWalletButton } from "./Solana/wallet";
import { useWallet } from "@solana/wallet-adapter-react";
import styles from "./header.module.css";
import useResponsive from "../hooks/useResponsive";
import Image from "next/image";
import UseWalletConnection from "../hooks/useWallet";
import MainButton from "./Buttons/mainButton";
import Link from "next/link";

function Navigation() {
    const wallet = useWallet();
    const { md } = useResponsive();
    const { isOpen, onToggle } = useDisclosure();
    const { handleDisconnectWallet, handleConnectWallet } = UseWalletConnection();

    return (
        <>
            <HStack
                bg="url(/images/header_fill.jpeg)"
                backgroundSize="cover"
                height={50}
                px={4}
                w="100%"
                alignItems="center"
                justify="space-between"
            >
                <Link href="/">
                    <Text
                        fontSize={md ? "large" : "x-large"}
                        color={"#683309"}
                        className="font-face-kg"
                        style={{ cursor: "pointer", margin: "auto 0" }}
                    >
                        LET&apos;S COOK
                    </Text>
                </Link>
                <HStack gap={3}>
                    {/* <Tooltip label="Points" hasArrow fontSize="large" offset={[0, 15]}>
                        <div className={styles.sauce}>
                            <Image height={20} width={20} src="/images/sauce.png" alt="Sauce" />
                            <div>1,400</div>
                        </div>
                    </Tooltip> */}

                    <Show breakpoint="(min-width: 1024px)">
                        <Tooltip label="Mint Calendar" hasArrow fontSize="large" offset={[0, 15]}>
                            <Link href="/calendar">
                                <Image src="/images/calendar.png" width={35} height={35} alt={"Calendar"} />
                            </Link>
                        </Tooltip>
                    </Show>

                    {/* <Show breakpoint="(min-width: 1024px)">
                        <Tooltip label="Leaderboard" hasArrow fontSize="large" offset={[0, 15]}>
                            <Link href="/leaderboard">
                                <Image src="/images/points.png" width={35} height={35} alt={"Points"} />
                            </Link>
                        </Tooltip>
                    </Show> */}

                    <Show breakpoint="(min-width: 1024px)">
                        <Tooltip label="My Bag" hasArrow fontSize="large" offset={[0, 15]}>
                            <Image src="/images/money-bag.png" width={35} height={35} alt={"Money Bag"} style={{ cursor: "not-allowed" }} />
                        </Tooltip>
                    </Show>

                    <Show breakpoint="(min-width: 1024px)">
                        <Tooltip label="Launch" hasArrow fontSize="large" offset={[0, 15]}>
                            <Link href="/launch">
                                <Image src="/images/chef-hat.png" width={35} height={35} alt={"Question Mark"} />
                            </Link>
                        </Tooltip>
                    </Show>

                    <Show breakpoint="(min-width: 1024px)">
                        <Tooltip label="FAQs" hasArrow fontSize="large" offset={[0, 15]}>
                            <Link href="/faq">
                                <Image src="/images/question-mark.png" width={35} height={35} alt={"Question Mark"} />
                            </Link>
                        </Tooltip>
                    </Show>

                    <Show breakpoint="(max-width: 1024px)">
                        <Image
                            onClick={onToggle}
                            src="/images/burger.png"
                            width={35}
                            height={35}
                            alt={"Burger Icon"}
                            style={{ marginRight: 5 }}
                        />
                    </Show>

                    <Show breakpoint="(min-width: 1024px)">
                        <>
                            {wallet.publicKey && <DisconnectWalletButton />}
                            {wallet.publicKey === null && <ConnectWalletButton />}

                            {/* <Link href="/launch">
                                <MainButton label="LAUNCH" />
                            </Link> */}
                        </>
                    </Show>
                </HStack>
            </HStack>

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
                hidden={!md || !isOpen}
                boxShadow="0px 3px 13px 0px rgba(0,0,0,0.75) inset"
            >
                <VStack spacing={3} mb={4} className="font-face-kg">
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

                <Link href="/launch" onClick={onToggle}>
                    <Text fontFamily="Dealers" color="#683309" fontSize={35}>
                        LAUNCH
                    </Text>
                </Link>

                <Link href="/calendar" onClick={onToggle}>
                    <Text fontFamily="Dealers" color="#683309" fontSize={35}>
                        CALENDAR
                    </Text>
                </Link>

                {/* <Link href="/leaderboard" onClick={onToggle}>
                    <Text className={styles.connect}>LEADERBOARD</Text>
                </Link> */}

                <Text fontFamily="Dealers" color="#683309" fontSize={35} style={{ opacity: 0.5 }}>
                    MY BAGS
                </Text>

                {/* <Text className={styles.connect} style={{ opacity: 0.5 }}>
                    HISTORY
                </Text> */}

                <Link href="/faq" onClick={onToggle}>
                    <Text fontFamily="Dealers" color="#683309" fontSize={35}>
                        FAQS
                    </Text>
                </Link>
            </VStack>
        </>
    );
}

export default Navigation;
