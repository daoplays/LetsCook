
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

import DatePicker from "react-datepicker";

import { NumberInput, NumberInputField } from "@chakra-ui/react";

export function NewGameModal({show_value, showFunction, name, setName, liquidity, setLiquidity, processing_transaction, ListGameOnArena, launchDate, setLaunchDate} : {show_value: boolean, showFunction: Dispatch<SetStateAction<boolean>>, name: string, setName: Dispatch<SetStateAction<string>>, liquidity: string, setLiquidity: Dispatch<SetStateAction<string>>, processing_transaction: boolean, ListGameOnArena: MouseEventHandler<HTMLParagraphElement>, launchDate : Date, setLaunchDate: Dispatch<SetStateAction<Date>>}) {
    const handleClose = () => {
        showFunction(false);
    };

    const handleNameChange = (e) => {setName(e.target.value)}
    const handleLiquidityChange = (e) => { setLiquidity(e); }
    return (
        <>
            <Modal isOpen={show_value} onClose={handleClose} motionPreset='none'>
                    <ModalOverlay />
                    <ModalContent>
                    <ModalHeader style={{ backgroundColor: "black", fontSize: 14, color: "white", fontWeight: "semibold"}}>
                        <Center>
                            Token Launch Details
                            </Center>
                    </ModalHeader>
                    <ModalCloseButton />

                    <ModalBody style={{ backgroundColor: "black", fontSize: 14, color: "white", fontWeight: "semibold" }}>
                        <VStack align="center" spacing="10px">
                            <HStack width="80%" align={"center"}>
                                <Box width="50%">
                                    <Text align={"left"} fontSize={14} color="white">
                                        Ticker:
                                    </Text>
                                </Box>
                                <Box width="50%">
                                <FormControl id="desired_team_name" maxWidth={"350px"} >
                                    <Input
                                        type="text"
                                        value={name}
                                        onChange={handleNameChange}
                                    />
                                </FormControl>
                                </Box>
                            </HStack>

                            <HStack width="80%" align={"center"}>
                                <Box width="50%">
                                    <Text align={"left"} fontSize={14} color="white">
                                        Min. Liquidity:
                                    </Text>
                                </Box>
                                <Box width="50%">
                                    <NumberInput
                                        id="desired_betsize"
                                        fontSize={14}
                                        color="white"
                                        size="lg"
                                        onChange={handleLiquidityChange}
                                        value={liquidity}
                                        borderColor="white"
                                        min={1}
                                    >
                                        <NumberInputField
                                            height={14}
                                            paddingTop="1rem"
                                            paddingBottom="1rem"
                                            borderColor="white"
                                        />
                                    </NumberInput>
                                </Box>
                            </HStack>
                            <HStack width="80%" align={"center"}>
                                <Box width="50%">
                                    <Text align={"left"} fontSize={14} color="white">
                                        Date:
                                    </Text>
                                </Box>
                            <DatePicker selected={launchDate} onChange={(date) => setLaunchDate(date)} />
                            </HStack>

                        </VStack>
                    </ModalBody>

                    <ModalFooter style={{ alignItems: "center", justifyContent: "center", backgroundColor: "black" }}>
                    <div className="font-face-sfpb">
                        <VStack>
                            <Box as="button" borderWidth="2px" borderColor="white" width="120px">
                                <Text
                                    align="center"
                                    onClick={
                                        processing_transaction
                                            ? () => {
                                                  console.log("already clicked");
                                              }
                                            : ListGameOnArena
                                    }
                                    fontSize={14}
                                    color="white"
                                >
                                    CREATE
                                </Text>
                            </Box>
                            <Text color="grey" fontSize="10px">
                                Account costs will be returned in the event of a failed launch
                            </Text>
                        </VStack>
                    </div>
                </ModalFooter>

                    
                </ModalContent>
            </Modal>
        </>
    );
}



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
