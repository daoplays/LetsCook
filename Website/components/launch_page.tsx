import {Dispatch, SetStateAction, MutableRefObject, useState, MouseEventHandler} from "react";

import {
    Center,
    VStack,
    Text,
    Box,
    HStack,
    FormControl,
    Input,
    NumberInput,
    NumberInputField
  } from "@chakra-ui/react";
  
import DatePicker from "react-datepicker";

import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE } from "./Solana/constants";
import { LaunchDataUserInput } from "./Solana/state";


export function LaunchScreen({newLaunch, ListGameOnArena} : {newLaunch : MutableRefObject<LaunchDataUserInput>, ListGameOnArena: MouseEventHandler<HTMLParagraphElement>}) {

    const [name, setName] = useState<string>("")
    const [symbol, setSymbol] = useState<string>("")
    const [launch_date, setLaunchDate] = useState<Date | null>(null)
    const [icon, setIcon] = useState<string>(null)

    const handleNameChange = (e) => {setName(e.target.value);}
    const handleSymbolChange = (e) => {setSymbol(e.target.value);}

    const handleLaunchDateChange = (e) => {setLaunchDate(e);}

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const reader = new FileReader()
    
            reader.readAsDataURL(e.target.files[0])
        
            reader.onload = () => {
            console.log('called: ', reader)
            setIcon(reader.result.toString().replace('data:', '').replace(/^.+,/, ''))
        }
        }
      };


    function setLaunchData(e) {
        
        console.log(name, symbol, launch_date, icon)
        const new_input : LaunchDataUserInput = {
            name : name,
            symbol : symbol,
            launch_date : launch_date.getTime() / 1000,
            icon : icon,
            uri : ""
        }
        console.log(new_input)
        newLaunch.current = new_input
        console.log(e)
        ListGameOnArena(e)
    }

    return(
        <Center mt="20px" width="90%">
           
   <VStack>
            <Text color="white" className="font-face-kg" textAlign={"center"} fontSize={DEFAULT_FONT_SIZE}>
            Token Launch Details
            </Text>
            <VStack align="center" spacing="10px">
                <HStack width="80%" align={"center"}>
                    <Box width="50%">
                        <Text align={"left"} fontSize={14} color="white">
                            Name:
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
                            Symbol:
                        </Text>
                    </Box>
                    <Box width="50%">
                    <FormControl id="desired_team_name" maxWidth={"350px"} >
                        <Input
                            type="text"
                            value={symbol}
                            onChange={handleSymbolChange}
                        />
                    </FormControl>
                    </Box>
                </HStack>

                <HStack width="80%" align={"center"}>
                    <Box width="50%">
                        <Text align={"left"} fontSize={14} color="white">
                            Date:
                        </Text>
                    </Box>
                <DatePicker selected={launch_date} onChange={(launch_date) => handleLaunchDateChange(launch_date)} />
                </HStack>
                <HStack width="80%" align={"center"}>
                    <Box width="50%">
                        <Text align={"left"} fontSize={14} color="white">
                            Icon:
                        </Text>
                    </Box>
                    <input id="file" type="file" onChange={handleFileChange} />
                </HStack>
                
            </VStack>

            <Box as="button" borderWidth="2px" borderColor="white" width="120px">
                <Text
                    align="center"
                    onClick={setLaunchData}
                    fontSize={14}
                    color="white"
                >
                    CREATE
                </Text>
            </Box>

            </VStack>
        </Center>
    );

}