import { Dispatch, SetStateAction } from "react";
import { Center, Text, VStack } from "@chakra-ui/react";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton } from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";

export function TermsModal({ show_value, showFunction }: { show_value: boolean; showFunction: Dispatch<SetStateAction<boolean>> }) {
    const { sm } = useResponsive();

    const handleClose = () => {
        showFunction(false);
    };

    return (
        <>
            <Modal size="md" isCentered isOpen={show_value} onClose={handleClose} motionPreset="slideInBottom">
                <ModalOverlay />

                <ModalContent mx={6} p={0} h={585} style={{ background: "transparent" }}>
                    <ModalBody bg="url(/images/terms-container.png)" bgSize="contain" bgRepeat="no-repeat" p={sm ? 10 : 14}>
                        <VStack spacing={0}>
                            <Text
                                align="center"
                                fontSize={"xx-large"}
                                style={{
                                    fontFamily: "KGSummerSunshineBlackout",
                                    color: "white",
                                    fontWeight: "semibold",
                                }}
                            >
                                TERMS
                            </Text>
                            <Text fontSize={sm ? "md" : "xl"} color="white" m={0} align="center">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sit amet semper purus. Proin lorem sapien,
                                placerat vel urna quis, blandit pulvinar purus. Vestibulum lobortis risus ut egestas placerat. Donec lorem
                                quam, tristique at nibh quis, facilisis rhoncus magna. Nam fermentum sodales lectus sit amet vehicula.
                            </Text>
                            <Text
                                mt={sm ? 5 : 8}
                                align="end"
                                fontSize={sm ? "medium" : "large"}
                                style={{
                                    fontFamily: "KGSummerSunshineBlackout",
                                    color: "red",
                                    fontWeight: "semibold",
                                    cursor: "pointer",
                                }}
                                onClick={handleClose}
                            >
                                Exit
                            </Text>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}
