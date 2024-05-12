import React from "react";
import useResponsive from "../hooks/useResponsive";
import Head from "next/head";
import Image from "next/image";
import { Flex, VStack, Text } from "@chakra-ui/react";

const Pepemon = () => {
    const { sm, lg } = useResponsive();

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Pepemon</title>
            </Head>
            <main
                style={{
                    height: "100vh",
                    background: 'url("/curatedLaunches/pepemon/BG.png")',
                    backgroundSize: "cover",
                    position: "relative",
                }}
            >
                <Flex h="100%" p={8} alignItems={"center"} justify={sm ? "start" : "center"} flexDirection="column">
                    <Image src={"/curatedLaunches/pepemon/PageTitle.png"} alt="Pepemon Title" width={800} height={400} />

                    <VStack gap={0} mt={sm && 70}>
                        <Image
                            src={"/curatedLaunches/pepemon/Grass.png"}
                            alt="Pepemon Grass"
                            width={sm ? 280 : 450}
                            height={sm ? 280 : 450}
                        />
                        <Image
                            src={"/curatedLaunches/pepemon/Pepeball.png"}
                            alt="Pepemon Ball"
                            width={sm ? 150 : 200}
                            height={sm ? 150 : 200}
                            style={{ cursor: "pointer" }}
                        />
                        <Text fontSize={sm ? 18 : 22} fontWeight={500} mt={-4}>
                            Mint
                        </Text>
                    </VStack>
                </Flex>

                <Image
                    src={"/curatedLaunches/pepemon/PepeTrainer.png"}
                    alt="Pepemon Trainer"
                    width={sm ? 200 : 400}
                    height={sm ? 400 : 600}
                    style={{ position: "absolute", bottom: 0, left: sm ? 0 : 100 }}
                />
            </main>
        </>
    );
};

export default Pepemon;
