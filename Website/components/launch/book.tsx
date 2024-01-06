import { Dispatch, SetStateAction, MutableRefObject, useState, MouseEventHandler, useCallback, useRef } from "react";
import { Center, VStack, Text } from "@chakra-ui/react";
import { useMediaQuery } from "react-responsive";
import {
    LaunchDataUserInput,
    get_current_blockhash,
    send_transaction,
    serialise_CreateLaunch_instruction,
    serialise_EditLaunch_instruction,
    bignum_to_num
} from "../../components/Solana/state";
import { METAPLEX_META, DEBUG, SYSTEM_KEY, PROGRAM, Screen, DEFAULT_FONT_SIZE, RPC_NODE, WSS_NODE } from "../../components/Solana/constants";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, Transaction, TransactionInstruction, Connection, SystemProgram, sendAndConfirmTransaction } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import Image from "next/image";
import DatePicker from "react-datepicker";
import styles from "../../styles/LaunchBook.module.css";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import "react-datepicker/dist/react-datepicker.css";
import bs58 from "bs58";
import {WebIrys} from "@irys/sdk";
import Irys from "@irys/sdk";

// Define the Tag type
type Tag = {
	name: string;
	value: string;
};

interface BookPageProps {
    newLaunchData: MutableRefObject<LaunchDataUserInput>;
    setScreen: Dispatch<SetStateAction<string>>;
}

const BookPage = ({ newLaunchData, setScreen }: BookPageProps) => {
    const wallet = useWallet();
    const [openDate, setOpenDate] = useState<Date>(newLaunchData.current.opendate);
    const [closeDate, setcloseDate] = useState<Date>(newLaunchData.current.closedate);

    const [teamWallet, setTeamWallet] = useState<string>(newLaunchData.current.team_wallet);
    const [submitStatus, setSubmitStatus] = useState<string | null>(null);
    const signature_ws_id = useRef<number | null>(null);


    const isDesktopOrLaptop = useMediaQuery({
        query: "(max-width: 1000px)",
    });

    function setData(): boolean {
        console.log(openDate.toString());
        console.log(closeDate.toString());

        let balance = 1;
        try {
            let teamPubKey = new PublicKey(teamWallet);
            //balance = await request_current_balance("", teamPubKey);

            console.log("check balance", teamPubKey.toString(), balance);

            if (balance == 0) {
                alert("Team Wallet does not exist");
                return false;
            }
        } catch (error) {
            alert("Invalid Team Wallet");
            return false;
        }

        if (closeDate.getTime() < openDate.getTime()) {
            alert("Close date must be after launch date");
            return false;
        }

        newLaunchData.current.opendate = openDate;
        newLaunchData.current.closedate = closeDate;
        newLaunchData.current.team_wallet = teamWallet;

        return true;
    }

    function setLaunchData(e) {
        if (setData()) setScreen("details");
    }

    function Launch(e) {
        if (setData()) CreateLaunch();
    }

    const check_signature_update = useCallback(
        async (result: any) => {
            console.log(result);
            // if we have a subscription field check against ws_id
            if (result.err !== null) {
                alert("Transaction failed, please try again")
            }
            if (signature_ws_id.current === 1) {
                await EditLaunch();
            }
            signature_ws_id.current = null;
        },
        [],
    );

    const EditLaunch = useCallback(async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        if (signature_ws_id.current !== null) {
            alert("Transaction pending, please wait");
            return;
        }

        const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });

        let launch_data_account = PublicKey.findProgramAddressSync(
            [Buffer.from(newLaunchData.current.pagename), Buffer.from("Launch")],
            PROGRAM,
        )[0];

        const instruction_data = serialise_EditLaunch_instruction(newLaunchData.current);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },
            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: true },
        ];

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(list_instruction);
        setSubmitStatus("Set Launch Metadata")

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            if (transaction_response.result === "INVALID") {
                console.log(transaction_response);
                alert("Transaction error, please try again");
                return;
            }

            let signature = transaction_response.result;

            if (DEBUG) {
                console.log("list signature: ", signature);
            }
            signature_ws_id.current = 2;
            connection.onSignature(signature, check_signature_update, "confirmed");  
            setSubmitStatus(null)
        } catch (error) {
            console.log(error);
            setSubmitStatus(null)
            return;
        }
    }, [wallet, newLaunchData, check_signature_update]);



    

    const CreateLaunch = useCallback(async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });
    
        const irys_wallet = { name: "phantom", provider: wallet };
        const irys = new WebIrys({
            url: "https://devnet.irys.xyz",
            token: "solana",
            wallet : irys_wallet,
            config: {
              providerUrl: RPC_NODE,
            },
          });

        

        const price = await irys.getPrice(newLaunchData.current.icon_file.size);
        const balance_before = await irys.getLoadedBalance();
        console.log("balance_before", balance_before.toString());
        setSubmitStatus("Transfer balance for images on Arweave");
        if (balance_before.lt(price)) {
            await irys.fund(price);
        }
        const balance_after = await irys.getLoadedBalance();
        console.log("balance_after", balance_after.toString());
        const tags: Tag[] = [{ name: "Content-Type", value: newLaunchData.current.icon_file.type }];
        setSubmitStatus("Sign for image upload to Arweave");
        const receipt = await irys.uploadFile(newLaunchData.current.icon_file, {
			tags,
		});
		console.log("Uploaded successfully.", "https://gateway.irys.xyz/" +receipt.id);

        var metadata = {
            name: newLaunchData.current.name,
            symbol: newLaunchData.current.symbol,
            description: newLaunchData.current.description,
            image: "https://gateway.irys.xyz/" + receipt.id,
        };

        const jsn = JSON.stringify(metadata);
        const blob = new Blob([jsn], { type: 'application/json' });
        const json_file = new File([ blob ], 'metadata.json');

        const json_price = await irys.getPrice(json_file.size);
        setSubmitStatus("Transfer balance for nft metadata on Arweave");
        await irys.fund(json_price);
        const json_tags: Tag[] = [{ name: "Content-Type", value: "application/json" }];

        setSubmitStatus("Sign for metadata upload to Arweave");
        const json_receipt = await irys.uploadFile(json_file, {
			tags:json_tags,
		});
		console.log("Uploaded successfully.", "https://gateway.irys.xyz/" +json_receipt.id);
       
        newLaunchData.current.uri = "https://gateway.irys.xyz/" +json_receipt.id;
        newLaunchData.current.icon_url = "https://gateway.irys.xyz/" + receipt.id;

        let program_data_account = PublicKey.findProgramAddressSync([Buffer.from("arena_account")], PROGRAM)[0];
        let program_sol_account = PublicKey.findProgramAddressSync([Buffer.from("sol_account")], PROGRAM)[0];

        let launch_data_account = PublicKey.findProgramAddressSync(
            [Buffer.from(newLaunchData.current.pagename), Buffer.from("Launch")],
            PROGRAM,
        )[0];

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        let fees_account = new PublicKey("FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD");

        const token_mint_keypair = Keypair.generate();
        var token_mint_pubkey = token_mint_keypair.publicKey;
        let token_meta_key = PublicKey.findProgramAddressSync(
            [Buffer.from("metadata"), METAPLEX_META.toBuffer(), token_mint_pubkey.toBuffer()],
            METAPLEX_META,
        )[0];

        let token_raffle_account_key = await getAssociatedTokenAddress(
            token_mint_pubkey, // mint
            program_sol_account, // owner
            true, // allow owner off curve
        );

        let user_token_account_key = await getAssociatedTokenAddress(
            token_mint_pubkey, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );

        let wrapped_sol_seed = token_mint_pubkey.toBase58().slice(0, 32);
        let wrapped_sol_account = await PublicKey.createWithSeed(program_sol_account, wrapped_sol_seed, TOKEN_PROGRAM_ID);
        let wrapped_sol_mint = new PublicKey("So11111111111111111111111111111111111111112");

        if (DEBUG) {
            console.log("arena: ", program_data_account.toString());
            console.log("game_data_account: ", launch_data_account.toString());
            console.log("sol_data_account: ", fees_account.toString());
            console.log("wsol seed", wrapped_sol_seed);
            console.log("mint", token_mint_pubkey.toString());
        }

        const instruction_data = serialise_CreateLaunch_instruction(newLaunchData.current);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_data_account, isSigner: false, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },

            { pubkey: wrapped_sol_mint, isSigner: false, isWritable: true },
            { pubkey: wrapped_sol_account, isSigner: false, isWritable: true },

            { pubkey: fees_account, isSigner: false, isWritable: true },
            { pubkey: program_data_account, isSigner: false, isWritable: true },
            { pubkey: program_sol_account, isSigner: false, isWritable: true },

            { pubkey: token_mint_pubkey, isSigner: true, isWritable: true },
            { pubkey: user_token_account_key, isSigner: false, isWritable: true },
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
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(list_instruction);

        transaction.partialSign(token_mint_keypair);
        setSubmitStatus("Create Launch Accounts")
        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            if (transaction_response.result === "INVALID") {
                console.log(transaction_response);
                alert("Transaction error, please try again")
                return;
            }

            let signature = transaction_response.result;

            if (DEBUG) {
                console.log("list signature: ", signature);
            }
            signature_ws_id.current = 1;
            connection.onSignature(signature, check_signature_update, "confirmed");    

        } catch (error) {
            console.log(error);
            return;
        }

        
    }, [wallet, newLaunchData, check_signature_update]);

    function confirm(e) {
        e.preventDefault();
        if (closeDate && openDate && teamWallet) {
            Launch(e);
        } else {
            alert("Please fill all the details on this page.");
        }
    }
    return (
        <Center style={{ background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)" }} pt="20px" width="100%">
            <VStack>
                <Text color="white" className="font-face-kg" textAlign={"center"} fontSize={DEFAULT_FONT_SIZE}>
                    Launch - BOOK
                </Text>
                <form onSubmit={confirm} className={styles.launchBody}>
                    <div className={styles.launchBodyUpper}>
                        <div className={styles.launchBodyUpperFields}>
                            <div className={`${styles.textLabel} font-face-kg`}>TOKEN RAFFLE</div>
                            <div className={styles.launchBodyLowerHorizontal}>
                                <div className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`}>OPEN DATE:</div>

                                    <div className={`${styles.textLabelInputDate} font-face-kg`}>
                                        <DatePicker
                                            showTimeSelect
                                            timeFormat="HH:mm"
                                            timeIntervals={15}
                                            selected={openDate}
                                            onChange={(date) => setOpenDate(date)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.launchBodyLowerHorizontal}>
                                <div className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`}>CLOSE DATE:</div>

                                    <div className={`${styles.textLabelInputDate} font-face-kg`}>
                                        <DatePicker
                                            showTimeSelect
                                            timeFormat="HH:mm"
                                            timeIntervals={15}
                                            selected={closeDate}
                                            onChange={(date) => setcloseDate(date)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.launchBodyLowerHorizontal}>
                                <div className={styles.eachFieldLong}>
                                    <div
                                        style={{ width: isDesktopOrLaptop ? "100%" : "20%" }}
                                        className={`${styles.textLabel} font-face-kg`}
                                    >
                                        TEAM WALLET:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <input
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            value={teamWallet}
                                            onChange={(e) => {
                                                setTeamWallet(e.target.value);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <br></br>

                    <div>
                        <button className={`${styles.nextBtn} font-face-kg `}>PREVIEW</button>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: 20,
                        }}
                    >
                        <button onClick={setLaunchData} className={`${styles.nextBtn} font-face-kg `}>
                            PREVIOUS
                        </button>
                        <button type="submit" className={`${styles.nextBtn} font-face-kg `}>
                            CONFIRM
                        </button>
                    </div>
                </form>
                {submitStatus !== null &&
                <Text  className={`${styles.nextBtn} font-face-kg `}>{submitStatus}</Text>
                }
            </VStack>
        </Center>
    );
};

export default BookPage;
