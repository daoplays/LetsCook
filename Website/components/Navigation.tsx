import {
    Badge,
    Box,
    Button,
    Divider,
    HStack,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Show,
    Text,
    Tooltip,
    VStack,
    useDisclosure,
} from "@chakra-ui/react";
import { ConnectWalletButton, DisconnectWalletButton } from "./Solana/wallet";
import { useWallet } from "@solana/wallet-adapter-react";
import styles from "./header.module.css";
import useResponsive from "../hooks/useResponsive";
import Image from "next/image";
import UseWalletConnection from "../hooks/useWallet";
import MainButton from "./Buttons/mainButton";
import Link from "next/link";
import { useRouter } from "next/router";
import useAppRoot from "../context/useAppRoot";
import { isHomePageOnly } from "../constant/root";
import trimAddress from "../utils/trimAddress";
import { FaWallet } from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa";
import { useEffect, useState } from "react";

function Navigation() {
    const router = useRouter();
    const wallet = useWallet();
    const { xs, md } = useResponsive();
    const { isOpen, onToggle } = useDisclosure();
    const { handleDisconnectWallet, handleConnectWallet } = UseWalletConnection();
    const { currentUserData, setSelectedNetwork, selectedNetwork } = useAppRoot();

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
                position={"fixed"}
                top={0}
                zIndex={1000}
            >
                <HStack>
                    <Text
                        fontSize={md ? "large" : "x-large"}
                        color={"#683309"}
                        className="font-face-kg"
                        style={{ cursor: "pointer", margin: "auto 0" }}
                        onClick={() => router.push("/")}
                        hidden={xs}
                    >
                        LET&apos;S COOK
                    </Text>

                    <Menu>
                        <MenuButton>
                            <Badge px={2} py={1} borderRadius={20} bg="rgb(104,51,10, .95)" color="white">
                                <HStack spacing={1} alignItems="center">
                                    <Text m={0}>{selectedNetwork === "mainnet" ? "Mainnet Beta" : "Devnet"}</Text>
                                    <FaChevronDown size={12} />
                                </HStack>
                            </Badge>
                        </MenuButton>
                        <MenuList p={1} style={{ minWidth: "fit-content" }}>
                            <MenuItem borderRadius={5}>
                                <HStack
                                    alignItems="start"
                                    onClick={async () => {
                                        setSelectedNetwork("mainnet");
                                        await router.replace("/");
                                        router.reload();
                                    }}
                                >
                                    <Image src="/images/solana-sol-logo.png" alt="solana logo" width={20} height={20} />
                                    <Text m={0} fontFamily="ReemKufiRegular" fontSize={"medium"} align="center">
                                        Mainnet Beta
                                    </Text>
                                </HStack>
                            </MenuItem>
                            <MenuItem
                                borderRadius={5}
                                onClick={async () => {
                                    setSelectedNetwork("devnet");
                                    await router.replace("/");
                                    router.reload();
                                }}
                            >
                                <HStack alignItems="start">
                                    <Image src="/images/solana-sol-logo.png" alt="solana logo" width={20} height={20} />
                                    <Text m={0} fontFamily="ReemKufiRegular" fontSize={"medium"} align="center">
                                        Devnet
                                    </Text>
                                </HStack>
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </HStack>
                <HStack gap={3}>
                    <Tooltip label="Sauce" hasArrow fontSize="large" offset={[0, 15]}>
                        <div className={styles.sauce}>
                            <Image height={20} width={20} src="/images/sauce.png" alt="Sauce" />
                            <div>{currentUserData === null ? 0 : currentUserData.total_points}</div>
                        </div>
                    </Tooltip>

                    <Show breakpoint="(min-width: 1024px)">
                        <Tooltip label="Hybrids" hasArrow fontSize="large" offset={[0, 15]}>
                            <Link href={isHomePageOnly ? "#" : "/hybrids"}>
                                <Image
                                    src="/images/hybrids.png"
                                    width={35}
                                    height={35}
                                    alt={"Hybrids"}
                                    style={{ cursor: isHomePageOnly ? "not-allowed" : "pointer" }}
                                />
                            </Link>
                        </Tooltip>
                    </Show>

                        <Show breakpoint="(min-width: 1024px)">
                            <Tooltip label="Trade" hasArrow fontSize="large" offset={[0, 15]}>
                                <Link href={isHomePageOnly ? "#" : "/trade"}>
                                    <Image
                                        src="/images/market.png"
                                        width={35}
                                        height={35}
                                        alt={"Trade"}
                                        style={{ cursor: isHomePageOnly ? "not-allowed" : "pointer" }}
                                    />
                                </Link>
                            </Tooltip>
                        </Show>
                    

                        <Show breakpoint="(min-width: 1024px)">
                            <Tooltip label="Calendar" hasArrow fontSize="large" offset={[0, 15]}>
                                <Link href={isHomePageOnly ? "#" : "/calendar"}>
                                    <Image
                                        src="/images/calendar.png"
                                        width={35}
                                        height={35}
                                        alt={"Calendar"}
                                        style={{ cursor: isHomePageOnly ? "not-allowed" : "pointer" }}
                                    />
                                </Link>
                            </Tooltip>
                        </Show>
                    

                    <Show breakpoint="(min-width: 1024px)">
                        <Tooltip label="Leaderboard" hasArrow fontSize="large" offset={[0, 15]}>
                            <Link href="/leaderboard">
                                <Image src="/images/points.png" width={35} height={35} alt={"Points"} />
                            </Link>
                        </Tooltip>
                    </Show>

                        <Show breakpoint="(min-width: 1024px)">
                            <Tooltip label="My Bag" hasArrow fontSize="large" offset={[0, 15]}>
                                <Image
                                    src="/images/money-bag.png"
                                    width={35}
                                    height={35}
                                    alt={"Money Bag"}
                                    onClick={() => {
                                        if (!wallet.connected) {
                                            alert("Please connect your wallet to access your bags");
                                        } else {
                                            !isHomePageOnly && router.push(`/bags`);
                                        }
                                    }}
                                    style={{ cursor: isHomePageOnly ? "not-allowed" : "pointer" }}
                                />
                            </Tooltip>
                        </Show>
                    

                    <Show breakpoint="(min-width: 1024px)">
                        <Tooltip label="Creator Dashboard" hasArrow fontSize="large" offset={[0, 15]}>
                            <Image
                                src="/images/chef-hat.png"
                                width={35}
                                height={35}
                                alt={"Question Mark"}
                                onClick={() => {
                                    if (!wallet.connected) {
                                        alert("Please connect your wallet to access creator dashboard");
                                    } else {
                                        !isHomePageOnly && router.push(`/dashboard`);
                                    }
                                }}
                                style={{ cursor: isHomePageOnly ? "not-allowed" : "pointer" }}
                            />
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
                position="fixed"
                top={!isOpen || !md ? 0 : 50}
                justify="center"
                h="95vh"
                w="100dvw"
                bg="url(/images/drawer.jpg)"
                backgroundSize="cover"
                borderBottomRadius={12}
                // hidden={!md || !isOpen}
                boxShadow="0px 3px 13px 0px rgba(0,0,0,0.75) inset"
                zIndex={999}
                justifyContent="start"
                style={{
                    transition: "transform 0.3s ease",
                    transform: isOpen ? "translateY(0)" : "translateY(-100%)",
                }}
            >
                <VStack spacing={6} pb={6} py={10} bg="rgba(0,0,0,0.25) " w="100%" h="100%" overflow="scroll">
                    <VStack className="font-face-kg">
                        {wallet.publicKey && (
                            <Text mb={0} fontSize={26} color="white" className="font-face-kg" align="center">
                                {trimAddress(wallet.publicKey.toString())}
                            </Text>
                        )}

                        {wallet.publicKey === null && (
                            <Text mb={0} fontSize={26} color="white" className="font-face-kg" onClick={() => handleConnectWallet()}>
                                Connect Wallet
                            </Text>
                        )}

                        {wallet.connected && (
                            <Text mb={0} fontSize={26} color="white" className="font-face-kg" onClick={() => handleDisconnectWallet()}>
                                Disconnect Wallet
                            </Text>
                        )}

                        <Divider w={345} border="1px solid #FFFFFF" outline="1px solid black" />
                        <Divider mt={-3} w={280} border="1px solid #FFFFFF" outline="1px solid black" />
                    </VStack>

                    <div>
                        <Text
                            color="white"
                            className="font-face-kg"
                            fontSize={24}
                            onClick={() => {
                                if (!wallet.connected) {
                                    alert("Please connect your wallet to access creator dashboard");
                                } else {
                                    onToggle();
                                    !isHomePageOnly && router.push(`/dashboard`);
                                }
                            }}
                            style={{ opacity: isHomePageOnly ? 0.5 : 1 }}
                        >
                            Creator Dashboard
                        </Text>
                    </div>

                    <Link href={isHomePageOnly ? "#" : "/hybrids"} onClick={onToggle}>
                        <Text color="white" className="font-face-kg" fontSize={24} style={{ opacity: isHomePageOnly ? 0.5 : 1 }}>
                            Hybrids
                        </Text>
                    </Link>

                        <Link href={isHomePageOnly ? "#" : "/trade"} onClick={onToggle}>
                            <Text color="white" className="font-face-kg" fontSize={24} style={{ opacity: isHomePageOnly ? 0.5 : 1 }}>
                                Trade
                            </Text>
                        </Link>
                    

                        <Link href={isHomePageOnly ? "#" : "/calendar"} onClick={onToggle}>
                            <Text color="white" className="font-face-kg" fontSize={24} style={{ opacity: isHomePageOnly ? 0.5 : 1 }}>
                                Calendar
                            </Text>
                        </Link>
                    

                    <Link href={isHomePageOnly ? "#" : "/leaderboard"} onClick={onToggle}>
                        <Text color="white" className="font-face-kg" fontSize={24} style={{ opacity: isHomePageOnly ? 0.5 : 1 }}>
                            Leaderboard
                        </Text>
                    </Link>

                        <Text
                            color="white"
                            className="font-face-kg"
                            fontSize={24}
                            onClick={() => {
                                if (!wallet.connected) {
                                    alert("Please connect your wallet to access creator dashboard");
                                } else {
                                    onToggle();
                                    !isHomePageOnly && router.push(`/bags`);
                                }
                            }}
                            style={{ opacity: isHomePageOnly ? 0.5 : 1 }}
                        >
                            My Bags
                        </Text>
                    

                    <Link href="/faq" onClick={onToggle}>
                        <Text color="white" className="font-face-kg" fontSize={24}>
                            FAQs
                        </Text>
                    </Link>
                </VStack>
            </VStack>
        </>
    );
}

export default Navigation;
