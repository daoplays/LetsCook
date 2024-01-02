import { Dispatch, SetStateAction, MutableRefObject, useState, MouseEventHandler, useCallback, useRef } from "react";
import { Center, VStack, Text } from "@chakra-ui/react";
import { useMediaQuery } from "react-responsive";
import {
    LaunchDataUserInput,
    get_current_blockhash,
    send_transaction,
    serialise_CreateLaunch_instruction,
    serialise_EditLaunch_instruction
} from "../../components/Solana/state";
import { METAPLEX_META, DEBUG, SYSTEM_KEY, PROGRAM, Screen, DEFAULT_FONT_SIZE } from "../../components/Solana/constants";
import { useWallet } from "@solana/wallet-adapter-react";
import { arweave_json_upload, arweave_upload } from "../../components/Solana/arweave";
import { Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import Image from "next/image";
import DatePicker from "react-datepicker";
import styles from "../../styles/LaunchBook.module.css";
import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import "react-datepicker/dist/react-datepicker.css";
import bs58 from "bs58";

interface BookPageProps {
    newLaunchData: MutableRefObject<LaunchDataUserInput>;
    setScreen: Dispatch<SetStateAction<string>>;
}

const BookPage = ({ newLaunchData, setScreen }: BookPageProps) => {
    const wallet = useWallet();
    const [openDate, setOpenDate] = useState<Date>(newLaunchData.current.opendate);
    const [closeDate, setcloseDate] = useState<Date>(newLaunchData.current.closedate);

    const [teamWallet, setTeamWallet] = useState<string>(newLaunchData.current.team_wallet);

    // refs for checking signatures
    const signature_interval = useRef<number | null>(null);
    const current_signature = useRef<string | null>(null);
    const signature_check_count = useRef<number>(0);
    const [transaction_failed, setTransactionFailed] = useState<boolean>(false);

    const [processing_transaction, setProcessingTransaction] = useState<boolean>(false);

    const game_interval = useRef<number | null>(null);

    const check_launch_data = useRef<boolean>(true);

    const isDesktopOrLaptop = useMediaQuery({
        query: "(max-width: 1000px)",
    });

    function setLaunchData(e) {
        console.log(openDate.toString());
        console.log(closeDate.toString());
        newLaunchData.current.opendate = openDate;
        newLaunchData.current.closedate = closeDate;
        newLaunchData.current.team_wallet = teamWallet;
        setScreen("details");
    }


    const EditLaunch = useCallback(async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        //setProcessingTransaction(true);
        setTransactionFailed(false);

        let launch_data_account = PublicKey.findProgramAddressSync(
            [Buffer.from(newLaunchData.current.pagename), Buffer.from("Launch")],
            PROGRAM,
        )[0];

        const instruction_data = serialise_EditLaunch_instruction(newLaunchData.current);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },
            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: true }

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
        try {

            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());


            var transaction_response = await send_transaction("", encoded_transaction);

            if (transaction_response.result === "INVALID") {
                console.log(transaction_response);
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
        } catch (error) {
            console.log(error);
            setProcessingTransaction(false);
            return;
        }

    }, [wallet, newLaunchData]);

    const CreateLaunch = useCallback(async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        //setProcessingTransaction(true);
        setTransactionFailed(false);

        console.log(newLaunchData.current);

        // first upload the png file to arweave and get the url
        let image_url = await arweave_upload(newLaunchData.current.icon_data);
        let meta_data_url = await arweave_json_upload(newLaunchData.current.name, "LC", image_url);
        console.log("list game with url", image_url, meta_data_url);

        newLaunchData.current.uri = meta_data_url;
        newLaunchData.current.icon_url = image_url;

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

        try {

            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());


            var transaction_response = await send_transaction("", encoded_transaction);

            if (transaction_response.result === "INVALID") {
                console.log(transaction_response);
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
        } catch (error) {
            console.log(error);
            setProcessingTransaction(false);
            EditLaunch();
            return;
        }

        EditLaunch();

    }, [wallet, EditLaunch, newLaunchData]);


    function confirm(e) {
        e.preventDefault();
        if (closeDate && openDate && teamWallet) {
            CreateLaunch();
            
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
            </VStack>
        </Center>
    );
};

export default BookPage;
