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
import { FaBook, FaWallet } from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa";
import twitter from "../public/images/Twitter.png";
import discord from "../public/images/discord.png";
import { TbLayoutSidebarLeftExpandFilled, TbLayoutSidebarRightExpandFilled } from "react-icons/tb";
import { PiHamburgerFill } from "react-icons/pi";
import { BsDiscord, BsTwitter } from "react-icons/bs";

function Navigation() {
    const router = useRouter();
    const wallet = useWallet();
    const { xs, sm, md } = useResponsive();
    const { isOpen, onToggle } = useDisclosure();
    const { handleDisconnectWallet, handleConnectWallet } = UseWalletConnection();
    const { currentUserData, selectedNetwork, sidePanelCollapsed, setSidePanelCollapsed } = useAppRoot();

    return (
        <>
            <HStack
                backgroundSize="cover"
                py={3}
                px={4}
                alignItems="center"
                justify="space-between"
                position="fixed"
                top={0}
                left={0}
                right={0}
                zIndex={1000}
                className="relative flex w-full items-center border-b border-b-gray-600/50 bg-[#161616] bg-opacity-75 bg-clip-padding backdrop-blur-md backdrop-filter"
            >
                <HStack>
                    <div style={{ cursor: "pointer" }} onClick={() => setSidePanelCollapsed(!sidePanelCollapsed)} hidden={sm}>
                        {sidePanelCollapsed ? <PiHamburgerFill size={35} color="#FE6A00" /> : <PiHamburgerFill size={35} color="#fff" />}
                    </div>
                    <Text
                        fontSize={md ? "medium" : "x-large"}
                        className="font-face-kg"
                        onClick={() => router.push("/")}
                        color="white"
                        style={{
                            fontFamily: "KGSummerSunshineBlackout",
                            cursor: "pointer",
                        }}
                    >
                        LET&apos;S COOK
                    </Text>

                    <Menu>
                        <MenuButton>
                            <Badge px={2} py={1} borderRadius={20}>
                                <HStack spacing={1} alignItems="center">
                                    <Text m={0}>
                                        {selectedNetwork === "mainnet"
                                            ? "Mainnet Beta"
                                            : selectedNetwork === "devnet"
                                              ? "Devnet"
                                              : "Eclipse"}
                                    </Text>
                                    <FaChevronDown size={12} />
                                </HStack>
                            </Badge>
                        </MenuButton>
                        <MenuList p={1} style={{ minWidth: "fit-content" }}>
                            <MenuItem
                                borderRadius={5}
                                onClick={async () => {
                                    await router.push("https://eclipse.letscook.wtf");
                                }}
                            >
                                <HStack alignItems="start">
                                    <Image src="/images/eclipse.png" alt="solana logo" width={20} height={20} />
                                    <Text m={0} fontFamily="ReemKufiRegular" fontSize={"large"} align="center">
                                        Eclipse Mainnet
                                    </Text>
                                </HStack>
                            </MenuItem>
                            <MenuItem borderRadius={5}>
                                <HStack
                                    alignItems="start"
                                    onClick={async () => {
                                        await router.push("https://www.letscook.wtf");
                                    }}
                                >
                                    <Image src="/images/solana-sol-logo.png" alt="solana logo" width={20} height={20} />
                                    <Text m={0} fontFamily="ReemKufiRegular" fontSize={"large"} align="center">
                                        Solana Mainnet
                                    </Text>
                                </HStack>
                            </MenuItem>
                            <MenuItem
                                borderRadius={5}
                                onClick={async () => {
                                    await router.push("https://devnet.letscook.wtf");
                                }}
                            >
                                <HStack alignItems="start">
                                    <Image src="/images/solana-sol-logo.png" alt="solana logo" width={20} height={20} />
                                    <Text m={0} fontFamily="ReemKufiRegular" fontSize={"large"} align="center">
                                        Solana Devnet
                                    </Text>
                                </HStack>
                            </MenuItem>
                        </MenuList>
                    </Menu>
                </HStack>

                <HStack gap={3}>
                    <Tooltip label="Sauce" hasArrow fontSize="large" offset={[0, 15]}>
                        <Link
                            href="https://docs.letscook.wtf/features/sauce#spending-sauce-wip"
                            target="_blank"
                            className="flex justify-center gap-2 rounded-full bg-white px-[10px] py-1"
                        >
                            <Image height={sm ? 15 : 20} width={sm ? 15 : 25} src="/images/sauce.png" alt="Sauce" />
                            <Text m={0} fontSize={sm ? "small" : "medium"}>
                                {currentUserData === null ? 0 : currentUserData.total_points}
                            </Text>
                        </Link>
                    </Tooltip>

                    <Show breakpoint="(min-width: 1024px)">
                        <HStack>
                            <Link href="https://twitter.com/letscook_sol" target="_blank">
                                <BsTwitter size={28} color="white" />
                            </Link>

                            <Link href="https://discord.com/invite/Q5PXHEjYRU" target="_blank">
                                <BsDiscord color="white" size={28} />
                            </Link>
                        </HStack>
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

                    <Link href={isHomePageOnly ? "#" : "/collections"} onClick={onToggle}>
                        <Text color="white" className="font-face-kg" fontSize={24} style={{ opacity: isHomePageOnly ? 0.5 : 1 }}>
                            Collections
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
