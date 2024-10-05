import React, { useRef, useState } from "react";
import Head from "next/head";
import { Card, CardBody, Flex, Heading, Stack, Text, Box, Button, Image } from "@chakra-ui/react";
import { IoCopyOutline, IoSettingsSharp, IoVolumeHigh, IoVolumeMute } from "react-icons/io5";
import Links from "../../components/Buttons/links";

const badgers = () => {
    const [isMuted, setIsMuted] = useState(true); // State to manage mute/unmute
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [showControls, setShowControls] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlayPause = () => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
            setIsMuted(!isMuted);
            setIsMusicPlaying(!isMusicPlaying);
        }
    };

    const toggleControls = () => {
        setShowControls(!showControls);
    };

    const handleVolumeChange = (event: any) => {
        if (audioRef.current) {
            const volume = parseFloat(event.target.value);
            audioRef.current.volume = event.target.value;
            setIsMuted(volume === 0);
            setIsMusicPlaying(volume !== 0);
        }
    };

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Pepemon</title>
            </Head>
            <audio ref={audioRef} src="/curatedLaunches/badgers/badger_loop.mp3" autoPlay loop muted={isMuted} />
            <Flex
                position="fixed"
                bottom={{ base: 1, md: 5 }}
                left={{ base: 1, lg: 260, xl: 280 }}
                zIndex={50}
                py={2}
                px={3}
                w="fit-content"
                bg="black"
                opacity={0.5}
                borderRadius="2xl"
                alignItems="center"
                justify="center"
            >
                <Flex alignItems="center" gap={3}>
                    <Box
                        onClick={toggleControls}
                        className="cursor-pointer"
                        fontSize={{ base: "20px", lg: "30px" }}
                        color="white"
                        _hover={{ color: "teal.500", transform: "scale(1.1)" }} // Hover effect
                        transition="all 0.2s"
                        cursor="pointer"
                    >
                        <IoSettingsSharp />
                    </Box>
                    {isMusicPlaying ? (
                        <Flex
                            gap={1}
                            onClick={() => {
                                togglePlayPause();
                                setShowControls(false);
                            }}
                        >
                            <Box
                                onClick={toggleControls}
                                className="cursor-pointer"
                                fontSize={{ base: "20px", lg: "30px" }}
                                color="white"
                                _hover={{ color: "teal.500", transform: "scale(1.1)" }} // Hover effect
                                transition="all 0.2s"
                                cursor="pointer"
                            >
                                <IoVolumeHigh />
                            </Box>
                            {/* <Lottie options={defaultOptions} height={35} width={35} /> */}
                        </Flex>
                    ) : (
                        <Box
                            onClick={togglePlayPause}
                            className="cursor-pointer"
                            fontSize={{ base: "20px", lg: "30px" }}
                            color="white"
                            _hover={{ color: "teal.500", transform: "scale(1.1)" }} // Hover effect
                            transition="all 0.2s"
                            cursor="pointer"
                        >
                            <IoVolumeMute />
                        </Box>
                    )}
                </Flex>

                {showControls && (
                    <Flex direction="column">
                        <input type="range" min="0" max="1" step="0.01" onChange={handleVolumeChange} className="volume-slider" />
                    </Flex>
                )}
            </Flex>
            <Box
                bgImage="url('/curatedLaunches/badgers/badgerBackground.png')"
                bgSize="cover"
                bgPosition="center"
                bgRepeat="no-repeat"
                h={["auto", "100%", "calc(100vh - 50px)", "calc(100vh - 50px)", "calc(100vh - 50px)"]}
                w="100%"
                display="flex"
                justifyContent="center"
                alignItems="center"
            >
                <Flex
                    gap={10}
                    style={{ width: "auto" }}
                    justifyContent={"center"}
                    alignItems={["center", "center", "center", "stretch", "stretch"]}
                    padding={5}
                    fontFamily={"singlanguagefont"}
                    letterSpacing="2px"
                    direction={["column", "column", "column", "row", "row"]}
                >
                    <Flex width={["100%", "100%", "100%", "auto", "auto"]}>
                        <Card
                            maxH="2xl"
                            sx={{
                                background: "linear-gradient(150deg, rgba(70,69,80,.90) 0%, rgba(6,29,34,.90) 86%)",
                                borderRadius: "10px", // Make sure to apply rounded corners as well
                                padding: "10px",
                            }}
                            textAlign="center"
                            height="100%"
                            width="100%"
                        >
                            <CardBody>
                                <Flex direction="column" alignItems="center" justifyContent="center" height="100%">
                                    <Image
                                        src="/curatedLaunches/badgers/badger.gif"
                                        alt="Green double couch with wooden legs"
                                        maxWidth={["2xs", "2xs", "3xs", "2xs", "xs"]}
                                        style={{ borderRadius: 10 }}
                                    />
                                    <Stack mt="1.25rem" spacing="3" align="center">
                                        <Button
                                            variant="outline"
                                            colorScheme="teal"
                                            borderRadius="full"
                                            padding="0"
                                            onClick={() => alert("Button Clicked!")}
                                            _hover={{ boxShadow: "lg", transform: "scale(1.05)", opacity: ".90" }}
                                            height="auto"
                                            position="relative"
                                            border={0}
                                        >
                                            <Image
                                                src="/curatedLaunches/badgers/shroombutton.png"
                                                alt="Mashroom Button"
                                                width={["100px", "", "", "", "150px"]}
                                            />
                                            <Text
                                                fontSize={["xl", "xl", "xl", "2xl", "4xl"]}
                                                color="black"
                                                position="absolute"
                                                top="40%"
                                                fontWeight="bold"
                                                className="text-stroke"
                                            >
                                                MINT
                                            </Text>
                                        </Button>
                                    </Stack>
                                </Flex>
                            </CardBody>
                        </Card>
                    </Flex>
                    <Flex>
                        <Card
                            maxH="2xl"
                            color={"white"}
                            sx={{
                                background: "linear-gradient(150deg, rgba(70,69,80,.90) 0%, rgba(6,29,34,.90) 86%)",
                                borderRadius: "10px", // Make sure to apply rounded corners as well
                                padding: "20px",
                            }}
                            textAlign="center"
                            fontFamily={"singlanguagefont"}
                        >
                            <CardBody>
                                <Flex direction="column" alignItems="center" justifyContent="center" height="100%">
                                    <Stack spacing="3">
                                        <Text fontSize={["2xl", "2xl", "3xl", "4xl", "6xl"]} color="white" mb={0} lineHeight="3.125rem">
                                            BADGER BAGERS
                                        </Text>
                                        <Links socials={[]} />
                                        <Stack spacing={2} textAlign={["center", "center", "center", "left", "left"]}>
                                            <Text fontSize={["xl", "xl", "2xl", "3xl", "4xl"]} mb={0} lineHeight="50px">
                                                Whitelist Phase
                                            </Text>
                                            <Stack
                                                spacing={[5, 5, "20px", "20px", "20px"]}
                                                ml={0}
                                                justifyContent={["center", "center", "center", "left", "left"]}
                                                direction="row"
                                            >
                                                <Text
                                                    fontFamily="ComicNeue"
                                                    mb={[0, 0, 0, "", ""]}
                                                    whiteSpace="nowrap"
                                                    fontSize={["sm", "sm", "md", "lg", "3xl"]}
                                                    border={"1px solid white"}
                                                    letterSpacing="1px"
                                                    sx={{
                                                        borderRadius: "10px",
                                                        padding: "0px 15px",
                                                        background: "linear-gradient(320deg, rgba(0,0,0,1) 0%, rgba(58,104,73,1) 100%)",
                                                    }}
                                                >
                                                    07 OCT 2024
                                                </Text>
                                                <Text
                                                    fontFamily="ComicNeue"
                                                    mb={[0, 0, 0, "", ""]}
                                                    whiteSpace="nowrap"
                                                    fontSize={["sm", "sm", "md", "lg", "3xl"]}
                                                    border={"1px solid white"}
                                                    letterSpacing="1px"
                                                    sx={{
                                                        borderRadius: "10px",
                                                        padding: "0px 15px",
                                                        background: "linear-gradient(320deg, rgba(0,0,0,1) 0%, rgba(58,104,73,1) 100%)",
                                                    }}
                                                >
                                                    18:00 UTC
                                                </Text>
                                            </Stack>
                                        </Stack>
                                        <Stack spacing={2} textAlign={["center", "center", "center", "left", "left"]}>
                                            <Text fontSize={["xl", "xl", "2xl", "3xl", "4xl"]} mb={0} lineHeight="50px">
                                                Public Phase
                                            </Text>
                                            <Stack
                                                justifyContent={["center", "center", "center", "left", "left"]}
                                                direction="row"
                                                spacing={[5, 5, "20px", "20px", "20px"]}
                                                ml={0}
                                            >
                                                <Text
                                                    fontFamily="ComicNeue"
                                                    mb={[0, 0, 0, "", ""]}
                                                    whiteSpace="nowrap"
                                                    fontSize={["sm", "sm", "md", "lg", "3xl"]}
                                                    border={"1px solid white"}
                                                    letterSpacing="1px"
                                                    sx={{
                                                        borderRadius: "10px",
                                                        padding: "0px 15px",
                                                        background: "linear-gradient(320deg, rgba(0,0,0,1) 0%, rgba(58,104,73,1) 100%)",
                                                    }}
                                                >
                                                    07 OCT 2024
                                                </Text>
                                                <Text
                                                    fontFamily="ComicNeue"
                                                    mb={[0, 0, 0, "", ""]}
                                                    whiteSpace="nowrap"
                                                    fontSize={["sm", "sm", "md", "lg", "3xl"]}
                                                    border={"1px solid white"}
                                                    letterSpacing="1px"
                                                    sx={{
                                                        borderRadius: "10px",
                                                        padding: "0px 15px",
                                                        background: "linear-gradient(320deg, rgba(0,0,0,1) 0%, rgba(58,104,73,1) 100%)",
                                                    }}
                                                >
                                                    20:00 UTC
                                                </Text>
                                            </Stack>
                                        </Stack>
                                        <Stack spacing={2} textAlign={["center", "center", "center", "left", "left"]}>
                                            <Text fontSize={["xl", "xl", "2xl", "3xl", "4xl"]} mb={0} lineHeight="50px">
                                                Price
                                            </Text>
                                            <Stack
                                                justifyContent={["center", "center", "center", "left", "left"]}
                                                direction="row"
                                                spacing={[5, 5, "20px", "20px", "20px"]}
                                                ml={0}
                                            >
                                                <span
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        gap: 4,
                                                        border: "1px solid white",
                                                        borderRadius: "10px",
                                                        padding: "0px 15px",
                                                        background: "linear-gradient(320deg, rgba(0,0,0,1) 0%, rgba(58,104,73,1) 100%)",
                                                    }}
                                                >
                                                    <Text
                                                        fontFamily="ComicNeue"
                                                        whiteSpace="nowrap"
                                                        fontSize={["sm", "sm", "md", "lg", "3xl"]}
                                                        letterSpacing="1px"
                                                        mb="0px"
                                                    >
                                                        1000
                                                    </Text>
                                                </span>
                                                <span
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        gap: 4,
                                                        border: "1px solid white",
                                                        borderRadius: "10px",
                                                        padding: "0px 15px",
                                                        background: "linear-gradient(320deg, rgba(0,0,0,1) 0%, rgba(58,104,73,1) 100%)",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    <Text
                                                        fontFamily="ComicNeue"
                                                        whiteSpace="nowrap"
                                                        fontSize={["sm", "sm", "md", "lg", "3xl"]}
                                                        letterSpacing="1px"
                                                        mb="0px"
                                                    >
                                                        $BADGER
                                                    </Text>{" "}
                                                    <Box fontSize={[10, 10, 25, 25, 25]}>
                                                        <IoCopyOutline />
                                                    </Box>
                                                </span>
                                            </Stack>
                                        </Stack>
                                    </Stack>
                                </Flex>
                            </CardBody>
                        </Card>
                    </Flex>
                </Flex>
            </Box>
        </>
    );
};

export default badgers;
