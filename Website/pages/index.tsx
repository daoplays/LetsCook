import {
  Center,
  VStack,
  Text,
  Box,
  HStack
} from "@chakra-ui/react";


import "react-datepicker/dist/react-datepicker.css";

import {Dispatch, SetStateAction, useCallback, useEffect, useState, useRef } from 'react';
import Table from 'react-bootstrap/Table';


import { Keypair, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

import { useWallet } from "@solana/wallet-adapter-react";

import { FaTwitter, FaTwitch } from 'react-icons/fa';
import { TfiReload } from "react-icons/tfi";

import bs58 from "bs58";

import { METAPLEX_META, DEBUG, SYSTEM_KEY, PROGRAM, Screen} from '../components/Solana/constants';
import {run_launch_data_GPA, LaunchData, LaunchDataUserInput, get_current_blockhash, send_transaction, uInt32ToLEBytes, serialise_CreateLaunch_instruction, bignum_to_num} from '../components/Solana/state';
import Navigation from "../components/Navigation"
import { FAQScreen } from "../components/faq";
import { TokenScreen } from "../components/token";
import { LaunchScreen } from "../components/launch_page";

import Footer from "../components/Footer"
import {NewGameModal, TermsModal} from "../components/Solana/modals"
import { arweave_json_upload, arweave_upload } from "../components/Solana/arweave";

import logo from "../public/images/sauce.png";
import styles from '../components/css/featured.module.css'
import { LaunchDetails } from "../components/launch_details";
import { LaunchBook } from "../components/launch_book";



const ArenaGameCard = ({ launch, setLaunchData, setScreen, index }: { launch: LaunchData; setLaunchData: Dispatch<SetStateAction<LaunchData>>, setScreen: Dispatch<SetStateAction<Screen>>, index: number }) => {

    let name = launch.name;
    let splitDate = new Date(bignum_to_num(launch.launch_date)).toUTCString().split(' ');
    let date = splitDate[0] + " " + splitDate[1] + " " + splitDate[2] + " " + splitDate[3]
    return (
        <tr onClick={() => {setLaunchData(launch); setScreen(Screen.TOKEN_SCREEN)}}>
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

const Listings = ({launch_list, setLaunchData, setScreen} : {launch_list : LaunchData[], setLaunchData : Dispatch<SetStateAction<LaunchData>>, setScreen: Dispatch<SetStateAction<Screen>>}) => {
    if (launch_list.length === 0) {
        return(<></>);
    }

  return(
      <>{
        launch_list.map((item: LaunchData, index) => 
            <ArenaGameCard key={index} launch={item} setLaunchData={setLaunchData} setScreen={setScreen} index={index} />
      )
      }
      </>
  );
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
     const [show_terms, setShowTerms] = useState<boolean>(false);

     const game_interval = useRef<number | null>(null);
     const [launch_data, setLaunchData] = useState<LaunchData[]>([]);
     const check_launch_data = useRef<boolean>(true);
    const [current_launch_data, setCurrentLaunchData] = useState<LaunchData | null>(null);

    const [screen, setScreen] = useState<Screen>(Screen.HOME_SCREEN);

    const newLaunchData = useRef<LaunchDataUserInput>(null);

     const CheckLaunchData = useCallback(async () => {
        
        if (!check_launch_data.current)
            return

        let list = await run_launch_data_GPA("");
        console.log(list)
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
                            <Listings launch_list={launch_data} setLaunchData={setCurrentLaunchData} setScreen={setScreen}/>
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

        //setProcessingTransaction(true);
        setTransactionFailed(false);
        
        console.log(newLaunchData.current);
        
        // first upload the png file to arweave and get the url
        let image_url = await arweave_upload(newLaunchData.current.icon);
        let meta_data_url = await arweave_json_upload(newLaunchData.current.name, "LC", newLaunchData.current.icon);
        console.log("list game with url", image_url, meta_data_url);

        newLaunchData.current.uri = meta_data_url;

        let arena_account = (PublicKey.findProgramAddressSync([Buffer.from("arena_account")], PROGRAM))[0];
        let game_data_account = (PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from(newLaunchData.current.name), Buffer.from("Game")], PROGRAM))[0];
        let sol_data_account = new PublicKey("FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD");

        const token_mint_keypair = Keypair.generate();
        var token_mint_pubkey = token_mint_keypair.publicKey;
        let token_meta_key = PublicKey.findProgramAddressSync(
            [Buffer.from("metadata"), METAPLEX_META.toBuffer(), token_mint_pubkey.toBuffer()],
            METAPLEX_META,
        )[0];

        let token_raffle_account_key = await getAssociatedTokenAddress(
            token_mint_pubkey, // mint
            arena_account, // owner
            true, // allow owner off curve
        );

        if(DEBUG) {
            console.log("arena: ", arena_account.toString());
            console.log("game_data_account: ", game_data_account.toString());
            console.log("sol_data_account: ", sol_data_account.toString());
        }


        const instruction_data = serialise_CreateLaunch_instruction(newLaunchData.current);

        var account_vector  = [
            {pubkey: wallet.publicKey, isSigner: true, isWritable: true},
            {pubkey: game_data_account, isSigner: false, isWritable: true},
            {pubkey: sol_data_account, isSigner: false, isWritable: true},

            {pubkey: arena_account, isSigner: false, isWritable: true},

            { pubkey: token_mint_pubkey, isSigner: true, isWritable: true },
            { pubkey: token_raffle_account_key, isSigner: false, isWritable: true },
            { pubkey: token_meta_key, isSigner: false, isWritable: true },
            
        ];

        account_vector.push({ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: true });
        account_vector.push({ pubkey: METAPLEX_META, isSigner: false, isWritable: false });


        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;


        transaction.add(list_instruction);

        transaction.partialSign(token_mint_keypair);


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

    },[wallet]);


    const HomeScreen = () => {
        return(
            <>
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
        
                <GameTable/>
        </Center>
        </>
        );
    }

  return (
    <>
        <Navigation showLaunch={setShowNewGame} setScreen={setScreen}/>
        <TermsModal show_value={show_terms} showFunction={setShowTerms}/>
        {screen === Screen.HOME_SCREEN && <HomeScreen />}
        {screen === Screen.FAQ_SCREEN && <FAQScreen />}
        {screen === Screen.LAUNCH_BOOK && <LaunchBook setScreen={setScreen} newLaunch={newLaunchData} ListGameOnArena={ListGameOnArena}/>}
        {screen === Screen.LAUNCH_DETAILS && <LaunchDetails setScreen={setScreen} newLaunch={newLaunchData} ListGameOnArena={ListGameOnArena}/>}
        {screen === Screen.LAUNCH_SCREEN && <LaunchScreen setScreen={setScreen} newLaunch={newLaunchData} ListGameOnArena={ListGameOnArena}/>}
        {screen === Screen.TOKEN_SCREEN && current_launch_data !== null && <TokenScreen launch_data={current_launch_data} />}

        <Footer showTerms={setShowTerms}/>

        </>
  );
}

export default function Home() {


    return(
        
        <LetsCook />
               
    );
}