import { Flex, Text, VStack } from "@chakra-ui/react";
import EmptyLaunches from "../public/images/healthy-food-rafiki-empty.svg";
import Image from "next/image";
import useResponsive from "../hooks/useResponsive";
import WoodenButton from "./Buttons/woodenButton";
import Link from "next/link";

const EmptyLaunch = () => {
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
            gap={sm ? 3 : 24}
        >
            <Image
                src={EmptyLaunches}
                width={md ? 300 : 600}
                height={md ? 300 : 600}
                alt="404 Error with a cute animal-cute"
                style={{ marginLeft: "12px", marginTop: "-40px" }}
            />

            <VStack w={md ? "100%" : "800px"} spacing={15} align={md ? "center" : "start"}>
                <Text m={0} fontSize={lg ? 30 : 55} color="white" className="font-face-kg" style={{ wordBreak: "break-word" }}>
                    No Launches Yet
                </Text>

                <Text
                    fontFamily="ReemKufiRegular"
                    fontSize={md ? "large" : "x-large"}
                    color="white"
                    maxW={sm ? "100%" : md ? "600px" : "850px"}
                    mr={md ? 0 : 25}
                    align={sm ? "center" : "start"}
                >
                    We're currently working hard behind the scenes to bring you exciting meals. Stay tuned for updates! In the meantime,
                    feel free to cook your own.
                </Text>
                <Link href="/launch">
                    <WoodenButton label="Cook Something" size={22} width={"fit-content"} />
                </Link>
            </VStack>
        </Flex>
    );
};

export default EmptyLaunch;
