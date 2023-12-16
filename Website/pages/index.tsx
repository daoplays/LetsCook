import dynamic from 'next/dynamic';

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

import "react-datepicker/dist/react-datepicker.css";

import { NumberInput, NumberInputField } from "@chakra-ui/react";

import { MouseEventHandler, Dispatch, SetStateAction, ChangeEventHandler, useCallback, useEffect, useState, useRef, useMemo } from 'react';
import Table from 'react-bootstrap/Table';


import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';

import { useWallet } from "@solana/wallet-adapter-react";

import { FaTwitter, FaTwitch } from 'react-icons/fa';
import { TfiReload } from "react-icons/tfi";

import bs58 from "bs58";

import { DEBUG, SYSTEM_KEY, PROGRAM} from '../components/Solana/constants';
import {run_launch_data_GPA, LaunchData, get_current_blockhash, send_transaction, uInt32ToLEBytes, serialise_CreateLaunch_instruction} from '../components/Solana/state';
import Navigation from "../components/Navigation"


import logo from "../public/images/sauce.png";
import styles from '../components/css/featured.module.css'


function NewGameModal({show_value, showFunction, name, setName, liquidity, setLiquidity, processing_transaction, ListGameOnArena, launchDate, setLaunchDate} : {show_value: boolean, showFunction: Dispatch<SetStateAction<boolean>>, name: string, setName: Dispatch<SetStateAction<string>>, liquidity: string, setLiquidity: Dispatch<SetStateAction<string>>, processing_transaction: boolean, ListGameOnArena: MouseEventHandler<HTMLParagraphElement>, launchDate : Date, setLaunchDate: Dispatch<SetStateAction<Date>>}) {
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
                        
                            Token Launch Details
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

                            <DatePicker selected={launchDate} onChange={(date) => setLaunchDate(date)} />
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

/*
  function NewGameModal() {
    const handleClose = () => {
        setShowNewGame(false);
    };

    return (
        <>
            <Modal isOpen={show_new_game} onClose={handleClose} motionPreset='none'>
                    <ModalOverlay />
                    <ModalContent>
                    <ModalHeader style={{ backgroundColor: "black", fontSize: 14, color: "white", fontWeight: "semibold"}}>
                        
                            Token Launch Details
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
                                        value={desired_team_name}
                                        onChange={handleDesiredTeamNameChange}
                                        ref={modalRef}
                                    />
                                </FormControl>
                                </Box>
                            </HStack>
                            <HStack width="80%" align={"center"}>
                                <Box width="50%">
                                    <Text align={"left"} fontSize={14} color="white">
                                        Field:
                                    </Text>
                                </Box>
                                <Box width="50%">
                                    <NumberInput
                                        id="desired_betsize"
                                        ref={BetSizeRef}
                                        fontSize={14}
                                        color="white"
                                        size="lg"
                                        onChange={(valueString) => {
                                            setBetSizeString(valueString);
                                        }}
                                        value={bet_size_string}
                                        borderColor="white"
                                        min={0.05}
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
                                        Min. Liquidity:
                                    </Text>
                                </Box>

                                <VStack width="30%" align="left">
                                    <HStack width="100%">
                                        <Box
                                            as="button"
                                            borderWidth="2px"
                                            borderColor={chosen_speed === GameSpeed.slow ? "white" : "black"}
                                            width="50px"
                                            height={35}
                                            onClick={() => setChosenSpeed(GameSpeed.slow)}
                                        >
                                            <Text align="center" fontSize={14} color="white">
                                                A
                                            </Text>
                                        </Box>

                                        <Box
                                            as="button"
                                            borderWidth="2px"
                                            borderColor={chosen_speed === GameSpeed.fast ? "white" : "black"}
                                            width="50px"
                                            height={35}
                                            onClick={() => setChosenSpeed(GameSpeed.fast)}
                                        >
                                            <Text align="center" fontSize={14} color="white">
                                                B
                                            </Text>
                                        </Box>
                                    </HStack>
                                </VStack>
                            </HStack>
                            <Box width="80%">
                                <Text align={"left"} fontSize={14} color="white">
                                    Launch Date:
                                </Text>
                            </Box>
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
*/

const enum LaunchInstruction {
    init = 0,
    create_game = 1,
    join_game = 2,
    cancel_game = 3,
    take_move = 4,
    reveal_move = 5,
    claim_reward = 6,
    forfeit = 7,
}


const ArenaGameCard = ({ launch, index }: { launch: LaunchData; index: number }) => {

    let name = new TextDecoder().decode(new Uint8Array(launch.name)); 
    let splitDate = new Date(launch.launch_date * 24 * 60 * 60 * 1000).toUTCString().split(' ');
    let date = splitDate[0] + " " + splitDate[1] + " " + splitDate[2] + " " + splitDate[3]
    return (
        <tr>
            <td >
                <Center>
                <img
                src={logo.src}
                width="auto"
                alt={""}
                style={{ maxHeight: "30px", maxWidth: "30px" }}
                />
                </Center>
            </td>
            <td >{name}</td>
            <td><Center><HStack><FaTwitter/><FaTwitch/></HStack></Center></td>
            <td>
            100%
            </td>
            <td >100 SOL</td>
            <td>
            {date}
            </td>
            <td>
            </td>
        </tr>
      
    );
}

const Listings = ({launch_list} : {launch_list : LaunchData[]}) => {
    if (launch_list.length === 0) {
        return(<></>);
    }

  return(
      <>{
        launch_list.map((item: LaunchData, index) => 
              <ArenaGameCard key={index} launch={item} index={index} />
      )
      }
      </>
  );
}


const enum GameSpeed {
    fast = 0,
    slow = 1,
}

function LetsCook() {

    const wallet = useWallet();

     // refs for checking signatures
     const signature_interval = useRef<number | null>(null);
     const current_signature = useRef<string | null>(null);
     const signature_check_count = useRef<number>(0);
     const [transaction_failed, setTransactionFailed] = useState<boolean>(false);

     const [processing_transaction, setProcessingTransaction] = useState<boolean>(false);
     const [show_new_game, setShowNewGame] = useState<boolean>(false);

     const game_interval = useRef<number | null>(null);
     const [launch_data, setLaunchData] = useState<LaunchData[]>([]);
     const check_launch_data = useRef<boolean>(true);
    const [bet_size_string, setBetSizeString] = useState<string>("0.05");

    const [desired_team_name, setDesiredTeamName] = useState<string>("")

    const [launchDate, setLaunchDate] = useState<Date>(new Date());



     const CheckLaunchData = useCallback(async () => {
        
        if (!check_launch_data.current)
            return

        let list = await run_launch_data_GPA("");
        console.log(list)
        let str = new TextDecoder().decode(new Uint8Array(list[0].name)); 
        console.log(str)
        setLaunchData(list)
        check_launch_data.current = false


    }, []);

    // interval for checking state
    useEffect(() => {
        if (game_interval.current === null) {
            game_interval.current = window.setInterval(CheckLaunchData, 5000);
        } else {
            window.clearInterval(game_interval.current);
            game_interval.current = null;
        }
        // here's the cleanup function
        return () => {
            if (game_interval.current !== null) {
                window.clearInterval(game_interval.current);
                game_interval.current = null;
            }
        };
    }, [CheckLaunchData]);


    const GameTable = () => {

        return(
            <Box width = "100%">
                <div className="font-face-rk" style={{color: "white", fontSize: 14}}>
                    <Table className="custom-centered-table">
                        <thead>
                        <tr>
                        <th>LOGO</th>
                        <th>TICKER</th>
                        <th>SOCIALS</th>
                        <th>HYPE</th>
                        <th>MIN.LIQUIDITY</th>
                        <th>LAUNCH</th>
                        <th>
                        <Box
                            as="button"
                            onClick={() => {
                                check_launch_data.current = true;
                                CheckLaunchData();
                            }}
                        >
                            <TfiReload/>
                        </Box>
                    
                        </th>
                        </tr>
                        </thead>
                        <tbody style={{
                            backgroundColor: 'black'
                        }}>
                            <Listings launch_list={launch_data}/>
                        </tbody>
                    </Table>
                </div>
            </Box>
        );
    }
  


    const ListGameOnArena = useCallback( async () => 
    {
       
        if (wallet.publicKey === null || wallet.signTransaction === undefined)
            return;

        setProcessingTransaction(true);
        setTransactionFailed(false);

        let seed = (Math.random()*1e9);
        let seed_bytes = uInt32ToLEBytes(seed);
        let arena_account = (PublicKey.findProgramAddressSync([Buffer.from("arena_account")], PROGRAM))[0];
        let game_data_account = (PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), seed_bytes, Buffer.from("Game")], PROGRAM))[0];
        let sol_data_account = new PublicKey("FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD");

        if(DEBUG) {
            console.log("arena: ", arena_account.toString());
            console.log("game_data_account: ", game_data_account.toString());
            console.log("sol_data_account: ", sol_data_account.toString());
        }


        let utf8Encode = new TextEncoder();
        let name_bytes = Array.from(utf8Encode.encode(desired_team_name.toString()));
        let name_array : number[] = Array(256)

        for (let i = 0; i < name_bytes.length; i++) {
            name_array[i] = name_bytes[i]
        }


        console.log("have launch date", launchDate, launchDate.getDate(), launchDate.getTime())
        let date : number = launchDate.getTime()/1000/24/60/60.0;
        const instruction_data = serialise_CreateLaunch_instruction(LaunchInstruction.create_game, name_array, seed, date);

        var account_vector  = [
            {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
            {pubkey: game_data_account, isSigner: false, isWritable: true},
            {pubkey: sol_data_account, isSigner: false, isWritable: true},

            {pubkey: arena_account, isSigner: false, isWritable: true},
            {pubkey: SYSTEM_KEY, isSigner: false, isWritable: false}
        ];


        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;


        transaction.add(list_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);
            
            if (transaction_response.result === "INVALID") {
                console.log(transaction_response)
                setProcessingTransaction(false);
                setTransactionFailed(true);
                return;
            }

            let signature = transaction_response.result;

            if (DEBUG) {
                console.log("list signature: ", signature);
            }

            current_signature.current = signature;
            signature_check_count.current = 0;

        } catch(error) {
            console.log(error);
            setProcessingTransaction(false);
            return;
        }

        setShowNewGame(false);

    },[wallet, desired_team_name, launchDate]);

  return (
    <>
        <Navigation showLaunch={setShowNewGame}/>

        <div className={styles.featuredImage}>
            <Center className={styles.featuredBox}>
                <HStack marginLeft={"50px"}>
                <img
                src={logo.src}
                width="auto"
                alt={""}
                style={{ maxHeight: "200px", maxWidth: "200px" }}
                />
                <VStack alignItems="left">
                <HStack>
                <Text className={styles.featuredTitle}>
                    $SAUCE
                </Text>
                <FaTwitter size="50"/><FaTwitch size="50"/>
                </HStack>
                <Text className={styles.featuredText}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. In sit amet semper purus. Proin lorem sapien, placerat vel urna quis, blandit pulvinar purus. Vestibulum lobortis risus ut egestas placerat. Donec lorem quam, tristique at nibh quis, facilisis rhoncus magna. Nam fermentum sodales lectus sit amet vehicula.
                </Text>
                </VStack>
                <Box borderColor="brown" borderWidth="5px" borderRadius="1px" backgroundColor={'white'} aspectRatio={1} height="100px" style={{ maxHeight: "200px", maxWidth: "200px" }}>
                    <Text mt="5px" textAlign="center" className={styles.featuredDate}>
                        20 Jan <br/>2024
                    </Text>
                </Box>
                </HStack>

            </Center>
        </div>
         <Center width="100%" marginBottom="5rem">
             <NewGameModal show_value={show_new_game} showFunction={setShowNewGame} name={desired_team_name} setName={setDesiredTeamName}
                liquidity={bet_size_string} setLiquidity={setBetSizeString} processing_transaction={processing_transaction} ListGameOnArena={ListGameOnArena}
                launchDate={launchDate} setLaunchDate={setLaunchDate}/>
              

                <GameTable/>
        </Center>
        </>
  );
}

export default function Home() {


    return(
            <>
                      <LetsCook />

</>
               
    );
}