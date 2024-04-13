import { Button, Flex, HStack, Link, Text } from "@chakra-ui/react";
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
import { LaunchKeys } from "../components/Solana/constants";
import Head from "next/head";
import CollectionDashboardTable from "../components/tables/collectionDashboardTable";
import { CollectionData } from "../components/collection/collectionState";

const DashboardPage = () => {
    const router = useRouter();
    const wallet = useWallet();
    const { sm, lg } = useResponsive();
    const { launchList, collectionList, selectedNetwork } = useAppRoot();
    const [creatorLaunches, setCreatorLaunches] = useState<LaunchData[] | null>(null);
    const [creatorCollections, setCreatorCollections] = useState<CollectionData[] | null>(null);
    const [selected, setSelected] = useState(selectedNetwork === "devnet" ? "Tokens" : "Collections");

    const { newLaunchData } = useAppRoot();

    useEffect(() => {
        if (!launchList || !wallet.connected) {
            return;
        }

        const filteredLaunches = launchList.filter((launch) => launch.keys[LaunchKeys.Seller].toString() === wallet.publicKey.toString());
        setCreatorLaunches(filteredLaunches);

        const filteredCollections = collectionList.filter(
            (launch) => launch.keys[LaunchKeys.Seller].toString() === wallet.publicKey.toString(),
        );
        setCreatorCollections(filteredCollections);
    }, [wallet, launchList, collectionList]);

    if (!creatorLaunches) return <Loader />;

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Dashboard</title>
            </Head>
            <main>
                <Flex
                    px={4}
                    py={18}
                    gap={4}
                    alignItems="center"
                    justifyContent={selectedNetwork === "devnet" ? "space-between" : "end"}
                    style={{ position: "relative", flexDirection: sm ? "column" : "row" }}
                >
                    <Text
                        fontSize={sm ? 25 : 35}
                        color="white"
                        className="font-face-kg"
                        style={{ position: sm ? "static" : "absolute", left: 0, right: 0, margin: "auto" }}
                        align={"center"}
                        hidden={!sm}
                    >
                        Creator Dashboard
                    </Text>

                    {selectedNetwork === "devnet" && (
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
                    )}
                    <Text
                        fontSize={sm ? 25 : 35}
                        color="white"
                        className="font-face-kg"
                        style={{ position: sm ? "static" : "absolute", left: 0, right: 0, margin: "auto" }}
                        align={"center"}
                        hidden={sm}
                    >
                        Creator Dashboard
                    </Text>
                    {/* <Link href="/launch" w={sm ? "100%" : "fit-content"}> */}
                    <HStack w={sm ? "100%" : ""}>
                        <Button
                            w={sm ? "100%" : "fit-content"}
                            onClick={() => {
                                newLaunchData.current = defaultUserInput;
                                router.push("/launch");
                            }}
                            hidden={selected === "Collections"}
                        >
                            New Token
                        </Button>
                        <Button
                            w={sm ? "100%" : "fit-content"}
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

                {selected === "Tokens" && selectedNetwork === "devnet" && <TokenDashboardTable creatorLaunches={creatorLaunches} />}

                {selected === "Collections" && <CollectionDashboardTable collectionList={creatorCollections} />}

                {creatorLaunches.length <= 0 && (
                    <HStack w="100%" align="center" justify="center" mt={25}>
                        <Text fontSize={lg ? "large" : "x-large"} m={0} color={"white"} style={{ cursor: "pointer" }}>
                            You don&apos;t have any launches yet
                        </Text>
                    </HStack>
                )}
            </main>
        </>
    );
};

export default DashboardPage;
