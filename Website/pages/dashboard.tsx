import { Flex, HStack, Link, Text, VStack } from "@chakra-ui/react";
import React, { useEffect, useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import useResponsive from "../hooks/useResponsive";
import TokenDashboardTable from "../components/tables/tokenDashboardTable";
import "react-datepicker/dist/react-datepicker.css";
import useAppRoot from "../context/useAppRoot";
import { LaunchData, LaunchDataUserInput, defaultUserInput, create_LaunchDataInput } from "../components/Solana/state";
import EmptyLaunch from "../components/emptyLaunch";
import Loader from "../components/loader";
import { CollectionKeys, LaunchKeys } from "../components/Solana/constants";
import Head from "next/head";
import CollectionDashboardTable from "../components/tables/collectionDashboardTable";
import { CollectionData } from "../components/collection/collectionState";
import { Button } from "@/components/ui/button";

const DashboardPage = () => {
    const router = useRouter();
    const wallet = useWallet();
    const { sm, xs, lg } = useResponsive();
    const { launchList, collectionList } = useAppRoot();
    const [creatorLaunches, setCreatorLaunches] = useState<LaunchData[] | null>(null);
    const [creatorCollections, setCreatorCollections] = useState<CollectionData[] | null>(null);
    const [selected, setSelected] = useState("Tokens");

    const { newLaunchData } = useAppRoot();

    useEffect(() => {
        if (!launchList || !wallet.connected) {
            return;
        }

        const filteredLaunches: LaunchData[] = [];
        launchList.forEach((launch) => {
            if (launch.keys[LaunchKeys.Seller].toString() === wallet.publicKey.toString()) {
                filteredLaunches.push(launch);
            }
        });
        setCreatorLaunches(filteredLaunches);

        const filteredCollections: CollectionData[] = [];

        collectionList.forEach((launch) => {
            if (launch.keys[CollectionKeys.Seller].toString() === wallet.publicKey.toString()) {
                filteredCollections.push(launch);
            }
        });
        setCreatorCollections(filteredCollections);
    }, [wallet, launchList, collectionList]);

    if (!creatorLaunches) return <Loader />;

    return (
        <VStack className="md:p-8">
            <Flex
                gap={4}
                alignItems="center"
                justifyContent={!sm ? "space-between" : "end"}
                style={{ position: "relative", flexDirection: sm ? "column" : "row" }}
                className="mb-2 w-full px-2"
            >
                <Text
                    className="mt-3 block text-center text-3xl font-semibold text-white md:hidden lg:text-4xl"
                    style={{ position: sm ? "static" : "absolute", left: 0, bottom: 5, right: 0, margin: "auto" }}
                    align={"center"}
                >
                    Dashboard
                </Text>

                <Text
                    className="mt-4 hidden text-center text-3xl font-semibold text-white lg:block lg:text-4xl"
                    style={{ position: sm ? "static" : "absolute", left: 0, bottom: 5, right: 0, margin: "auto" }}
                    align={"center"}
                >
                    Dashboard
                </Text>

                <HStack spacing={3} zIndex={99}>
                    {["Tokens", "Collections"].map((name, i) => {
                        const isActive = selected === name;

                        const baseStyle = {
                            display: "flex",
                            alignItems: "center",
                            cursor: "pointer",
                        };

                        const activeStyle = {
                            color: "white",
                            borderBottom: isActive ? "2px solid white" : "",
                            opacity: isActive ? 1 : 0.5,
                        };

                        return (
                            <HStack
                                key={i}
                                style={{
                                    ...baseStyle,
                                    ...activeStyle,
                                }}
                                onClick={() => {
                                    setSelected(name);
                                }}
                                px={4}
                                py={2}
                                mt={-2}
                                w={"fit-content"}
                                justify="center"
                            >
                                <Text m={"0 auto"} fontSize="medium" fontWeight="semibold">
                                    {name}
                                </Text>
                            </HStack>
                        );
                    })}
                </HStack>

                {/* <Link href="/launch" w={sm ? "100%" : "fit-content"}> */}
                <HStack w={sm ? "100%" : ""}>
                    <Button
                        type="button"
                        size="lg"
                        className="w-full text-xl"
                        onClick={() => {
                            newLaunchData.current = defaultUserInput;
                            router.push("/launch");
                        }}
                        hidden={selected === "Collections"}
                    >
                        New Token
                    </Button>
                    <Button
                        type="button"
                        size="lg"
                        className="w-full text-xl"
                        onClick={() => {
                            router.push("/collection");
                        }}
                        hidden={selected === "Tokens"}
                    >
                        New Collection
                    </Button>
                </HStack>
                {/* </Link> */}
            </Flex>

            {selected === "Tokens" && <TokenDashboardTable creatorLaunches={creatorLaunches} />}

            {selected === "Collections" && <CollectionDashboardTable collectionList={creatorCollections} />}

            {creatorLaunches.length <= 0 && (
                <HStack w="100%" align="center" justify="center" mt={25}>
                    <Text fontSize={lg ? "large" : "x-large"} m={0} color={"white"} style={{ cursor: "pointer" }}>
                        You don&apos;t have any launches yet
                    </Text>
                </HStack>
            )}
        </VStack>
    );
};

export default DashboardPage;
