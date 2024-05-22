import { VStack, HStack, Text } from "@chakra-ui/react";
import { usePathname, useRouter, useSelectedLayoutSegment } from "next/navigation";
import { ReactNode, useState } from "react";
import { FaCalendarDays, FaChartLine, FaHouse } from "react-icons/fa6";
import useResponsive from "../hooks/useResponsive";
import { GiCook, GiToken } from "react-icons/gi";
import Image from "next/image";
import { MdLeaderboard } from "react-icons/md";
import { BsPersonSquare } from "react-icons/bs";
import { RiGalleryLine } from "react-icons/ri";

const tabs = {
    create: [
        {
            icon: (size: number) => <GiToken size={size} />,
            tab: "New Token",
            url: "/launch",
        },
        {
            icon: (size: number) => <RiGalleryLine size={size} />,
            tab: "New Hybrid",
            url: "/collection",
        },
    ],

    trade: [
        {
            icon: (size: number) => <FaChartLine size={size} />,
            tab: "Tokens",
            url: "/trade",
        },
        {
            icon: (size: number) => <BsPersonSquare size={size} />,
            tab: "Hybrids",
            url: "/hybrids",
        },
        {
            icon: (size: number) => <FaCalendarDays size={size} />,
            tab: "Calendar",
            url: "/calendar",
        },
    ],

    profile: [
        {
            icon: (size: number) => <GiCook size={size} />,
            tab: "Creator Dashboard",
            url: "/dashboard",
        },
        {
            icon: (size: number) => <Image src="/images/moneybag.svg" width={size} height={size} alt={"Money Bag"} />,
            tab: "My Bags",
            url: "/bags",
        },
        {
            icon: (size: number) => <MdLeaderboard size={size} />,
            tab: "Leaderboard",
            url: "/leaderboard",
        },
    ],

    info: [
        {
            icon: (size: number) => <MdLeaderboard size={size} />,
            tab: "Docs",
            url: "https://docs.letscook.wtf/",
        },
        {
            icon: (size: number) => <GiCook size={size} />,
            tab: "Terms",
            url: "/terms",
        },
        {
            icon: (size: number) => <Image src="/images/moneybag.svg" width={size} height={size} alt={"Money Bag"} />,
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

    return (
        <VStack
            bg="url(/images/rough-white.png)"
            backgroundSize="cover"
            width="290px"
            h="calc(100%)"
            position="sticky"
            top="0px"
            bottom="0px"
            pt={50}
            overflowY="auto"
        >
            <VStack h="100%" w="100%" px={sm ? 0 : "sm"}>
                <VStack align="start" h="100%" w="100%" p={4}>
                    <Text align="start" m={0} fontSize={"medium"} opacity={0.5}>
                        Create
                    </Text>
                    {tabs.create.map(({ tab, icon, url }, i) => (
                        <Tab key={tab} tab={tab} icon={icon(24)} isActive={pathname === url} url={url} />
                    ))}

                    <Text align="start" m={0} fontSize={"medium"} opacity={0.5}>
                        Trade
                    </Text>
                    {tabs.trade.map(({ tab, icon, url }, i) => (
                        <Tab key={tab} tab={tab} icon={icon(24)} isActive={pathname === url} url={url} />
                    ))}

                    <Text align="start" m={0} fontSize={"medium"} opacity={0.5}>
                        Profile
                    </Text>
                    {tabs.profile.map(({ tab, icon, url }, i) => (
                        <Tab key={tab} tab={tab} icon={icon(24)} isActive={pathname === url} url={url} />
                    ))}

                    <Text align="start" m={0} fontSize={"medium"} opacity={0.5}>
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
    const router = useRouter();
    return (
        <HStack
            w="100%"
            boxShadow="0px 8px 12px 5px rgba(0, 0, 0, 0.20)inset"
            bg={isActive ? "#683309" : "transparent"}
            color={isActive ? "white" : "#683309"}
            cursor={"pointer"}
            borderRadius={8}
            spacing={4}
            py={2}
            px={4}
            onClick={() => router.push(url)}
        >
            {tab === "My Bags" && isActive ? <Image src="/images/moneybag-white.svg" width={24} height={24} alt={"Money Bag"} /> : icon}
            <Text m={0} fontFamily="ReemKufiRegular" fontWeight="regular" fontSize={"large"} align="center">
                {tab}
            </Text>
        </HStack>
    );
};

export default SideNav;
