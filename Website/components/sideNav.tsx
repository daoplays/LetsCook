import { VStack, HStack, Text, Link, Spacer } from "@chakra-ui/react";
import { usePathname, useRouter, useSelectedLayoutSegment } from "next/navigation";
import { ReactNode, useState } from "react";
import { FaBook, FaCalendarDays, FaChartLine, FaCircleQuestion, FaClipboardList, FaGift } from "react-icons/fa6";
import useResponsive from "../hooks/useResponsive";
import { GiCook, GiToken } from "react-icons/gi";
import { MdLeaderboard } from "react-icons/md";
import { BsPersonSquare } from "react-icons/bs";
import { RiGalleryFill, RiGalleryLine } from "react-icons/ri";
import Image from "next/image";
import useAppRoot from "../context/useAppRoot";
import { FaFire, FaHome, FaList, FaChartBar } from "react-icons/fa";
import { useWallet } from "@solana/wallet-adapter-react";
import UseWalletConnection from "../hooks/useWallet";
import * as NProgress from "nprogress";
import { PiHamburgerFill } from "react-icons/pi";
import { FaParachuteBox } from "react-icons/fa";
import { Config } from "./Solana/constants";

const tabs = {
    create: [
        {
            icon: (size: number) => <GiToken size={size} />,
            tab: "New Token",
            url: "/launch",
        },
        {
            icon: (size: number) => <RiGalleryFill size={size} />,
            tab: "New Collection",
            url: "/collection",
        },
        {
            icon: (size: number) => <FaChartBar size={size} />,
            tab: "New Liquidity Pool",
            url: "/trade/create",
        },
    ],

    trade: [
        {
            icon: (size: number) => <BsPersonSquare size={size} />,
            tab: "Collections",
            url: "/collections",
        },
        {
            icon: (size: number) => <FaChartLine size={size} />,
            tab: "Tokens",
            url: "/trade",
        },
        {
            icon: (size: number) => <FaCalendarDays size={size} />,
            tab: "Token Launches",
            url: "/calendar",
        },
    ],

    profile: [
        {
            icon: (size: number) => <Image src="/images/moneybag-white.svg" width={24} height={24} alt={"Money Bag"} />,
            tab: "My Tickets",
            url: "/bags",
        },
        {
            icon: (size: number) => <GiCook size={size} />,
            tab: "Creator Dashboard",
            url: "/dashboard",
        },
        {
            icon: (size: number) => <MdLeaderboard size={size} />,
            tab: "Quest Board",
            url: "/achievements",
        },
    ],

    tools: [
        {
            icon: (size: number) => <FaParachuteBox size={size} />,
            tab: "Snapshot / Airdrop",
            url: "/airdrop",
        },
        {
            icon: (size: number) => (
                <Image
                    src={Config.token === "SOL" ? "/images/solana-trans.png" : "/images/eth-png.webp"}
                    width={24}
                    height={24}
                    alt={"Money Bag"}
                    className="opacity-100 brightness-0 invert filter"
                />
            ),
            tab: "Wrap / Unwrap",
            url: "/wrap",
        },
    ],

    tools: [
        {
            icon: (size: number) => <Image src={Config.token_image} width={24} height={24} alt={"Money Bag"} />,
            tab: "Wrap/Unwrap",
            url: "/wrap",
        },
        
    ],

    info: [
        {
            icon: (size: number) => <FaBook size={size} />,
            tab: "Documentation",
            url: "https://docs.letscook.wtf/",
        },
        {
            icon: (size: number) => <FaClipboardList size={size} />,
            tab: "Terms",
            url: "/terms",
        },
        {
            icon: (size: number) => <FaCircleQuestion size={size} />,
            tab: "FAQs",
            url: "/faq",
        },
    ],
};

export interface TabProps {
    icon?: ReactNode;
    tab: string;
    isActive?: boolean;
    url: string;
}

const SideNav = () => {
    const { sm } = useResponsive();
    const pathname = usePathname();
    const { sidePanelCollapsed, setSidePanelCollapsed } = useAppRoot();

    return (
        <VStack
            backgroundSize="cover"
            width={sidePanelCollapsed ? "260px" : "fit-content"}
            h="100%"
            position="sticky"
            top="0px"
            bottom="0px"
            overflowY="auto"
            hidden={sm}
            color="#fa771a"
            className="border-r border-gray-600/50 bg-[#161616] bg-clip-padding backdrop-blur-sm backdrop-filter"
        >
            <VStack h="100%" w="100%" px={sm ? 0 : "sm"}>
                <VStack align={!sidePanelCollapsed ? "center" : "start"} h="100%" w="100%" px={4} py={5}>
                    <Tab tab={"Home"} icon={<FaHome size={24} />} isActive={pathname === "/"} url={"/"} />
                    <Tab
                        tab={"Leaderboard"}
                        icon={<MdLeaderboard size={24} />}
                        isActive={pathname === "/leaderboard"}
                        url={"/leaderboard"}
                    />

                    <Text align="start" m={0} fontSize={"medium"} fontWeight={500} opacity={1}>
                        Create
                    </Text>
                    {tabs.create.map(({ tab, icon, url }, i) => (
                        <Tab key={tab} tab={tab} icon={icon(24)} isActive={pathname === url} url={url} />
                    ))}

                    <Text align="start" m={0} fontSize={"medium"} fontWeight={500} opacity={1}>
                        Trade
                    </Text>
                    {tabs.trade.map(({ tab, icon, url }, i) => (
                        <Tab key={tab} tab={tab} icon={icon(24)} isActive={pathname === url} url={url} />
                    ))}

                    <Text align="start" m={0} fontSize={"medium"} fontWeight={500} opacity={1}>
                        Profile
                    </Text>
                    {tabs.profile.map(({ tab, icon, url }, i) => (
                        <Tab key={tab} tab={tab} icon={icon(24)} isActive={pathname === url} url={url} />
                    ))}
                    <Text align="start" m={0} fontSize={"medium"} fontWeight={500} opacity={1}>
                        Tools
                    </Text>
                    {tabs.tools.map(({ tab, icon, url }, i) => (
                        <Tab key={tab} tab={tab} icon={icon(24)} isActive={pathname === url} url={url} />
                    ))}

                    <Text align="start" m={0} fontSize={"medium"} fontWeight={500} opacity={1}>
                        Tools
                    </Text>
                    {tabs.tools.map(({ tab, icon, url }, i) => (
                        <Tab key={tab} tab={tab} icon={icon(24)} isActive={pathname === url} url={url} />
                    ))}

                    <Text align="start" m={0} fontSize={"medium"} fontWeight={500} opacity={1}>
                        Info
                    </Text>
                    {tabs.info.map(({ tab, icon, url }, i) => (
                        <Tab key={tab} tab={tab} icon={icon(24)} isActive={pathname === url} url={url} />
                    ))}
                </VStack>
            </VStack>
        </VStack>
    );
};

const Tab = ({ isActive, icon, tab, url }: TabProps) => {
    const wallet = useWallet();
    const router = useRouter();
    const { handleConnectWallet } = UseWalletConnection();
    const { sidePanelCollapsed } = useAppRoot();

    return (
        <HStack
            justify={sidePanelCollapsed ? "start" : "center"}
            w="100%"
            boxShadow="0px 2px 6px 0px rgba(255, 255, 255, 0.2)inset"
            color={isActive ? "white" : "white"}
            className={isActive ? "bg-custom-gradient" : "none"}
            cursor={"pointer"}
            borderRadius={8}
            spacing={4}
            py={sidePanelCollapsed ? 2 : 2.5}
            px={sidePanelCollapsed ? 4 : 2}
            onClick={() => {
                if (
                    (tab === "New Token" ||
                        tab === "New Collection" ||
                        tab === "Creator Dashboard" ||
                        tab === "My Tickets" ||
                        tab === "Leaderboard") &&
                    !wallet.connected
                ) {
                    handleConnectWallet();
                } else {
                    if (tab === "Documentation") {
                        window.open("https://docs.letscook.wtf/", "_blank");
                    } else {
                        NProgress.start();
                        router.push(url);
                    }
                }
            }}
        >
            {tab === "My Tickets" && isActive ? <Image src="/images/moneybag-white.svg" width={24} height={24} alt={"Money Bag"} /> : icon}
            {sidePanelCollapsed && (
                <Text m={0} fontFamily="ReemKufiRegular" fontWeight="regular" fontSize={"large"} align="center">
                    {tab}
                </Text>
            )}
        </HStack>
    );
};

export default SideNav;
