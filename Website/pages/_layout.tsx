import { HStack, VStack } from "@chakra-ui/react";
import { PropsWithChildren } from "react";
import Navigation from "../components/Navigation";
import SideNav from "../components/sideNav";

const AppRootPage = ({ children }: PropsWithChildren) => {
    return (
        <VStack h="100vh" gap={0} className="bg-background-image">
            <Navigation />

            <HStack className="h-full w-full gap-0 overflow-hidden pt-14">
                <SideNav />
                <div className="h-full w-full flex-1 overflow-y-scroll bg-background-index">{children}</div>
            </HStack>
        </VStack>
    );
};

export default AppRootPage;
