import { Flex, Text, VStack } from "@chakra-ui/react";
import pageNotFoundGraphics from "../public/images/pageNotFoundGraphics.svg";
import Image from "next/image";
import useResponsive from "../hooks/useResponsive";
import WoodenButton from "../components/Buttons/woodenButton";
import Link from "next/link";

const PageNotFound = () => {
    const { sm, md, lg } = useResponsive();

    return (
        <Flex
            style={{
                background: "linear-gradient(180deg, #292929 50%, #0B0B0B 100%)",
                height: "90vh",
                flexDirection: md ? "column" : "row",
            }}
            align="center"
            justify="center"
            gap={lg ? 12 : 24}
        >
            <Image
                src={pageNotFoundGraphics}
                width={md ? 300 : 600}
                height={md ? 300 : 600}
                alt="404 Error with a cute animal-cute"
                style={{ marginLeft: "12px" }}
            />

            <VStack w={md ? "100%" : "800px"} spacing={15} align={md ? "center" : "start"}>
                <Text m={0} fontSize={lg ? 30 : 55} color="white" className="font-face-kg" style={{ wordBreak: "break-word" }}>
                    Page Not Found
                </Text>

                <Text
                    fontFamily="ReemKufiRegular"
                    fontSize={md ? "large" : "x-large"}
                    color="white"
                    maxW={sm ? "100%" : md ? "600px" : "850px"}
                    mr={md ? 0 : 25}
                    align={sm ? "center" : "start"}
                >
                    Page you are trying to open does not exist. You may have mistyped the url address, or you don&apos;t have permission to
                    access this page.
                </Text>
                <Link href="/">
                    <WoodenButton label="Return to Homepage" size={22} width={320} />
                </Link>
            </VStack>
        </Flex>
    );
};

export default PageNotFound;
