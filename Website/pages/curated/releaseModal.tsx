import { VStack, Text, Grid, GridItem, Button, Box } from "@chakra-ui/react";
import { Modal, ModalOverlay, ModalContent, ModalBody } from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";
import { CSSProperties, useState } from "react";

interface RecievedAssetModalProps {
    isOpened: boolean;
    onClose: () => void;
}

export function ReleaseModal({ isOpened, onClose }: RecievedAssetModalProps) {
    const { xs, sm } = useResponsive();
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const userHasPepemon = true;

    return (
        <>
            <Modal size="md" isCentered isOpen={isOpened} onClose={onClose} motionPreset="slideInBottom">
                <ModalOverlay />

                <ModalContent h={xs ? 520 : 615} w={xs ? 380 : 450} style={{ background: "transparent" }}>
                    <ModalBody
                        bg="url(/curatedLaunches/pepemon/vertical.png)"
                        bgSize={"cover"}
                        overflowY="auto"
                        style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
                        py={9}
                    >
                        <VStack
                            h="100%"
                            position="relative"
                            overflowY="auto"
                            // style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
                        >
                            <Text
                                m={0}
                                mt={-3}
                                align="center"
                                fontSize={40}
                                style={{
                                    fontFamily: "pokemon",
                                    color: "black",
                                    fontWeight: "semibold",
                                }}
                            >
                                Your Pepemons
                            </Text>
                            {userHasPepemon ? (
                                <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                                    {/* map to actual pepemons own by the user  */}
                                    {[...Array(20)].map((_, index) => (
                                        <GridItem key={index}>
                                            <VStack>
                                                <Box
                                                    key={index}
                                                    style={gridItemStyle}
                                                    onMouseEnter={() => setHoveredIndex(index)}
                                                    onMouseLeave={() => setHoveredIndex(null)}
                                                >
                                                    <Image
                                                        src="/images/pepemander.jpg"
                                                        width={110}
                                                        height={110}
                                                        style={{ borderRadius: "8px" }}
                                                        alt="Pepemander"
                                                    />
                                                    <VStack style={hoveredIndex === index ? overlayVisibleStyle : overlayStyle}>
                                                        <Text
                                                            m={0}
                                                            lineHeight={0.75}
                                                            align="center"
                                                            fontSize="x-large"
                                                            style={{
                                                                fontFamily: "pokemon",
                                                                color: "white",
                                                                fontWeight: "semibold",
                                                            }}
                                                        >
                                                            LV: 14
                                                        </Text>
                                                        <Text
                                                            m={0}
                                                            lineHeight={0.75}
                                                            align="center"
                                                            fontSize="x-large"
                                                            style={{
                                                                fontFamily: "pokemon",
                                                                color: "white",
                                                                fontWeight: "semibold",
                                                            }}
                                                        >
                                                            EV: 510
                                                        </Text>
                                                        <Text
                                                            m={0}
                                                            lineHeight={0.75}
                                                            align="center"
                                                            fontSize="x-large"
                                                            style={{
                                                                fontFamily: "pokemon",
                                                                color: "white",
                                                                fontWeight: "semibold",
                                                            }}
                                                        >
                                                            IV: 29
                                                        </Text>
                                                    </VStack>
                                                </Box>

                                                <Button colorScheme="gray" variant="outline" size="sm" w="100%">
                                                    Release
                                                </Button>
                                            </VStack>
                                        </GridItem>
                                    ))}
                                </Grid>
                            ) : (
                                <Text
                                    m={0}
                                    mt={-3}
                                    align="center"
                                    fontSize={40}
                                    style={{
                                        fontFamily: "pokemon",
                                        color: "black",
                                        fontWeight: "semibold",
                                    }}
                                >
                                    0
                                </Text>
                            )}
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}

const gridItemStyle: CSSProperties = {
    position: "relative",
    backgroundColor: "lightgray",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    fontWeight: "bold",
    borderRadius: "8px",
    cursor: "pointer",
};

const overlayStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    opacity: 0,
    transition: "opacity 0.3s ease",
};

const overlayVisibleStyle = {
    ...overlayStyle,
    opacity: 1,
};

export default ReleaseModal;
