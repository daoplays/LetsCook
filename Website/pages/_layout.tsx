import { HStack, VStack, Text } from "@chakra-ui/react";
import { PropsWithChildren, useState } from "react";
import Navigation from "../components/Navigation";
import { usePathname } from "next/navigation";
import SideNav from "../components/sideNav";

const AppRootPage = ({ children }: PropsWithChildren) => {
    const pathname = usePathname();

    const hide = ["/curated/pepemon"];
    return (
        <VStack h="100vh">
            {!hide.includes(pathname) && <Navigation />}
            <HStack gap={0} h="100%" w="100%">
                <SideNav />
                <VStack pt={50} h="100%" w="100%" sx={{ flex: 1, overflowY: "auto" }}>
                    <div style={{ width: "100%", height: "100%" }}>{children}</div>
                </VStack>
            </HStack>
        </VStack>
    );
};

export default AppRootPage;
