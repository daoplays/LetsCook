
import {MouseEventHandler, Dispatch, SetStateAction} from "react";

import {
    Center,
    VStack,
    Text,
    Box,
    HStack,
    FormControl,
    Input
  } from "@chakra-ui/react";
  
  import {
      Modal,
      ModalOverlay,
      ModalContent,
      ModalHeader,
      ModalFooter,
      ModalBody,
      ModalCloseButton,
} from '@chakra-ui/react'



export function TermsModal({show_value, showFunction} : {show_value: boolean, showFunction: Dispatch<SetStateAction<boolean>>}) {
    const handleClose = () => {
        showFunction(false);
    };

    return (
        <>
            <Modal isOpen={show_value} onClose={handleClose} motionPreset='none'>
                    <ModalOverlay />
                    <ModalContent>
                    <ModalHeader style={{ fontFamily: "KGSummerSunshineBlackout", backgroundColor: "black", fontSize: 14, color: "white", fontWeight: "semibold"}}>
                    <Center>
                            TERMS
                            </Center>
                    </ModalHeader>
                    <ModalCloseButton />

                    <ModalBody style={{ backgroundColor: "black", fontSize: 14, color: "white", fontWeight: "semibold" }}>
                        <Text>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sit amet semper purus. Proin lorem sapien, placerat vel urna quis, blandit pulvinar purus. Vestibulum lobortis risus ut egestas placerat. Donec lorem quam, tristique at nibh quis, facilisis rhoncus magna. Nam fermentum sodales lectus sit amet vehicula.
                        </Text>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}
