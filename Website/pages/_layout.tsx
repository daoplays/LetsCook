import { HStack, VStack } from "@chakra-ui/react";
import { PropsWithChildren } from "react";
import Navigation from "../components/Navigation";
import SideNav from "../components/sideNav";

const AppRootPage = ({ children }: PropsWithChildren) => {
    return (
        <VStack h="100vh" gap={0} className="bg-background-image pt-14">
            <Navigation />

            <HStack gap={0} h="100%" w="100%" style={{ overflow: "hidden" }}>
                <SideNav />
                <VStack className="h-full flex-1 gap-0 overflow-y-auto bg-background-index">
                    <div className="w-full overflow-y-scroll">{children}</div>
                </VStack>
            </HStack>
        </VStack>
    );
};

export default AppRootPage;
