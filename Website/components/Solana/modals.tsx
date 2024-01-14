import { Dispatch, SetStateAction } from "react";
import { Box, Button, Center, HStack, Link, Text, VStack } from "@chakra-ui/react";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton } from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";
import { LaunchData } from "./state";
import useBuyTickets from "../../hooks/useBuyTickets";

interface WarningModalProps {
    isWarningOpened?: boolean;
    closeWarning?: () => void;
    setApprove?: Dispatch<SetStateAction<boolean>>;
    BuyTickets: () => void;
    launchData: LaunchData;
    value: number;
}

export function WarningModal({ isWarningOpened, closeWarning, setApprove, BuyTickets }: WarningModalProps) {
    const { sm } = useResponsive();

    return (
        <>
            <Modal size="md" isCentered isOpen={isWarningOpened} onClose={closeWarning} motionPreset="slideInBottom">
                <ModalOverlay />

                <ModalContent mx={6} p={0} h={585} style={{ background: "transparent" }}>
                    <ModalBody bg="url(/images/terms-container.png)" bgSize="contain" bgRepeat="no-repeat" p={sm ? 10 : 14}>
                        <VStack spacing={sm ? 6 : 10}>
                            <Text
                                align="center"
                                fontSize={"large"}
                                style={{
                                    fontFamily: "KGSummerSunshineBlackout",
                                    color: "white",
                                    fontWeight: "semibold",
                                }}
                            >
                                If you can’t handle the heat, get out of the Kitchen!
                            </Text>

                            <VStack mt={-8} align="center" fontFamily="ReemKufiRegular">
                                <Text fontSize={sm ? "md" : "xl"} color="white" m={0} align="center">
                                    Memecoins are not investments.
                                </Text>
                                <Text fontSize={sm ? "md" : "xl"} color="white" m={0} align="center">
                                    You are not trading.
                                </Text>
                                <Text fontSize={sm ? "md" : "xl"} color="white" m={0} align="center">
                                    You are collecting memes and PvP gambling on social media.
                                </Text>
                            </VStack>

                            <Link href="/terms" target="_blank" style={{ textDecoration: "none" }}>
                                <Text
                                    px={2}
                                    borderRadius="12px"
                                    w="fit-content"
                                    backgroundColor="white"
                                    align="center"
                                    fontSize={"medium"}
                                    style={{
                                        fontFamily: "ReemKufiRegular",
                                        fontWeight: "semibold",
                                        margin: "0 auto",
                                        cursor: "pointer",
                                    }}
                                >
                                    See full Terms & Conditions
                                </Text>
                            </Link>

                            <VStack spacing={5}>
                                <HStack
                                    bg="#B80303"
                                    borderRadius="20px"
                                    p={3}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => {
                                        setApprove(true);
                                        BuyTickets();
                                    }}
                                >
                                    <Text
                                        mb={0}
                                        align="end"
                                        fontSize={sm ? "medium" : "large"}
                                        style={{
                                            fontFamily: "KGSummerSunshineBlackout",
                                            fontWeight: "semibold",
                                            cursor: "pointer",
                                            color: "white",
                                        }}
                                    >
                                        I GET IT, LET ME COOK
                                    </Text>
                                </HStack>
                                <Text
                                    align="end"
                                    fontSize={sm ? "medium" : "medium"}
                                    style={{
                                        fontFamily: "KGSummerSunshineBlackout",
                                        color: "red",
                                        cursor: "pointer",
                                    }}
                                    onClick={closeWarning}
                                >
                                    Take me back
                                </Text>
                            </VStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}
