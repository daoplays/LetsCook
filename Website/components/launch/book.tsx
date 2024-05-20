import {
    DEBUG,
    SYSTEM_KEY,
    PROGRAM,
    DEFAULT_FONT_SIZE,
    LaunchKeys,
    Config,
    SOL_ACCOUNT_SEED,
    DATA_ACCOUNT_SEED,
    FEES_PROGRAM,
    METAPLEX_META,
} from "../../components/Solana/constants";
import {
    LaunchDataUserInput,
    get_current_blockhash,
    send_transaction,
    serialise_CreateLaunch_instruction,
    create_LaunchData,
    LaunchData,
    bignum_to_num,
    request_current_balance,
    uInt32ToLEBytes,
} from "../../components/Solana/state";
import { Dispatch, SetStateAction, MutableRefObject, useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
    Center,
    VStack,
    Text,
    useDisclosure,
    Input,
    HStack,
    Popover,
    Button,
    PopoverTrigger,
    PopoverContent,
    PopoverArrow,
    PopoverCloseButton,
    PopoverHeader,
    PopoverBody,
    IconButton,
    Spinner,
    RadioGroup,
    Stack,
    Radio,
    Tooltip,
} from "@chakra-ui/react";
import { useMediaQuery } from "react-responsive";
import { WebIrys } from "@irys/sdk";
import { useWallet } from "@solana/wallet-adapter-react";
import {
    Keypair,
    PublicKey,
    Transaction,
    TransactionInstruction,
    Connection,
    ComputeBudgetProgram,
    SYSVAR_RENT_PUBKEY,
    SystemProgram,
    LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import DatePicker from "react-datepicker";
import styles from "../../styles/LaunchBook.module.css";
import bs58 from "bs58";
import useEditLaunch from "../../hooks/useEditLaunch";
import useResponsive from "../../hooks/useResponsive";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import "react-datepicker/dist/react-datepicker.css";
import LaunchPreviewModal from "../launchPreview/modal";
import useAppRoot from "../../context/useAppRoot";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import React from "react";
import { FaCalendarAlt } from "react-icons/fa";

// Define the Tag type
type Tag = {
    name: string;
    value: string;
};

interface BookPageProps {
    setScreen: Dispatch<SetStateAction<string>>;
}

const BookPage = ({ setScreen }: BookPageProps) => {
    const router = useRouter();
    const wallet = useWallet();
    const { sm, md, lg } = useResponsive();
    const { newLaunchData } = useAppRoot();

    const [isLoading, setIsLoading] = useState(false);

    const [localOpenDate, setLocalOpenDate] = useState<Date>(newLaunchData.current.opendate);
    const [localCloseDate, setLocalCloseDate] = useState<Date>(newLaunchData.current.closedate);

    const [teamWallet, setTeamWallet] = useState<string>(newLaunchData.current.team_wallet);
    const [amm_fee, setAMMFee] = useState<string>(newLaunchData.current.amm_fee.toString());
    const [AMMProvider, setAMMProvider] = useState<string>("cook");

    const signature_ws_id = useRef<number | null>(null);

    const [launchDateAndTime, setLaunchDateAndTime] = useState("-- --");
    const [closeDateAndTime, setCloseDateAndTime] = useState("-- --");
    const { EditLaunch } = useEditLaunch();

    const local_date = useMemo(() => new Date(), []);
    var zone = new Date().toLocaleTimeString("en-us", { timeZoneName: "short" }).split(" ")[2];
    //console.log(zone);

    useEffect(() => {
        let splitLaunchDate = localOpenDate.toString().split(" ");
        let launchDateString = splitLaunchDate[0] + " " + splitLaunchDate[1] + " " + splitLaunchDate[2] + " " + splitLaunchDate[3];
        let splitLaunchTime = splitLaunchDate[4].split(":");
        let launchTimeString = splitLaunchTime[0] + ":" + splitLaunchTime[1] + " " + zone;
        setLaunchDateAndTime(`${launchDateString} ${launchTimeString}`);
    }, [localOpenDate, local_date, zone]);

    useEffect(() => {
        let splitEndDate = localCloseDate.toString().split(" ");
        let endDateString = splitEndDate[0] + " " + splitEndDate[1] + " " + splitEndDate[2] + " " + splitEndDate[3];
        let splitEndTime = splitEndDate[4].split(":");
        let endTimeString = splitEndTime[0] + ":" + splitEndTime[1] + " " + zone;

        setCloseDateAndTime(`${endDateString} ${endTimeString}`);
    }, [localCloseDate, local_date, zone]);

    const check_signature_update = useCallback(
        async (result: any) => {
            console.log(result);
            // if we have a subscription field check against ws_id

            setIsLoading(false);

            if (result.err !== null) {
                toast.error("Transaction failed, please try again");
                return;
            }

            toast.success("Launch (1/2) Complete", {
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });

            if (signature_ws_id.current === 1) {
                await EditLaunch();
            }
            signature_ws_id.current = null;
        },
        [EditLaunch],
    );

    const transaction_failed = useCallback(async () => {
        if (signature_ws_id.current == null) return;

        signature_ws_id.current = null;
        setIsLoading(false);

        toast.error("Transaction not processed, please try again", {
            type: "error",
            isLoading: false,
            autoClose: 3000,
        });
    }, []);

    const isDesktopOrLaptop = useMediaQuery({
        query: "(max-width: 1000px)",
    });

    async function setData(e): Promise<boolean> {
        console.log("in set data");
        let balance = 1;
        try {
            let teamPubKey = new PublicKey(teamWallet);
            balance = await request_current_balance("", teamPubKey);

            //console.log("check balance", teamPubKey.toString(), balance);

            if (balance == 0) {
                toast.error("Team wallet does not exist");
                return false;
            }
        } catch (error) {
            toast.error("Invalid team wallet");
            return false;
        }

        if (!newLaunchData.current.edit_mode && localCloseDate.getTime() <= localOpenDate.getTime()) {
            toast.error("Close date must be set after launch date");
            return false;
        }

        if (!newLaunchData.current.edit_mode && localOpenDate.getTime() < new Date().getTime()) {
            toast.error("Open date must be set after now");
            return false;
        }

        newLaunchData.current.opendate = localOpenDate;
        newLaunchData.current.closedate = localCloseDate;
        newLaunchData.current.team_wallet = teamWallet;
        newLaunchData.current.amm_fee = AMMProvider === "raydium" ? 25 : parseInt(amm_fee);

        if (AMMProvider === "cook") {
            newLaunchData.current.amm_provider = 0;
        }
        if (AMMProvider === "raydium") {
            newLaunchData.current.amm_provider = 1;
        }

        return true;
    }

    async function prevPage(e) {
        console.log("check previous");
        if (await setData(e)) setScreen("details");
    }

    async function Launch(e) {
        if (await setData(e)) CreateLaunch();
    }

    const CreateLaunch = useCallback(async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        console.log(newLaunchData.current.icon_url);
        console.log(newLaunchData.current.banner_url);
        // if this is in edit mode then just call that function
        if (newLaunchData.current.edit_mode === true) {
            await EditLaunch();
            return;
        }

        // check if the launch account already exists, if so just skip all this
        let test_launch_data_account = PublicKey.findProgramAddressSync(
            [Buffer.from(newLaunchData.current.pagename), Buffer.from("Launch")],
            PROGRAM,
        )[0];

        let account_balance = await request_current_balance("", test_launch_data_account);
        if (account_balance > 0) {
            await EditLaunch();
            return;
        }
        setIsLoading(true);

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        const irys_wallet = { name: "phantom", provider: wallet };
        const irys = new WebIrys({
            url: Config.IRYS_URL,
            token: "solana",
            wallet: irys_wallet,
            config: {
                providerUrl: Config.RPC_NODE,
            },
        });

        if (newLaunchData.current.icon_url == "" || newLaunchData.current.icon_url == "") {
            const uploadImageToArweave = toast.info("(1/4) Preparing to upload images - transferring balance to Arweave.");

            let price = await irys.getPrice(newLaunchData.current.icon_file.size + newLaunchData.current.banner_file.size);

            console.log("price", Number(price));

            try {
                //await irys.fund(price);

                let txArgs = await get_current_blockhash("");

                var tx = new Transaction(txArgs).add(
                    SystemProgram.transfer({
                        fromPubkey: wallet.publicKey,
                        toPubkey: new PublicKey(Config.IRYS_WALLET),
                        lamports: Number(price),
                    }),
                );
                tx.feePayer = wallet.publicKey;
                let signed_transaction = await wallet.signTransaction(tx);
                const encoded_transaction = bs58.encode(signed_transaction.serialize());

                var transaction_response = await send_transaction("", encoded_transaction);
                console.log(transaction_response);

                let signature = transaction_response.result;

                let fund_check = await irys.funder.submitFundTransaction(signature);

                console.log(fund_check, fund_check.data["confirmed"]);

                toast.update(uploadImageToArweave, {
                    render: "Your account has been successfully funded.",
                    type: "success",
                    isLoading: false,
                    autoClose: 2000,
                });
            } catch (error) {
                setIsLoading(false);

                toast.update(uploadImageToArweave, {
                    render: "Oops! Something went wrong during funding. Please try again later. ",
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                });
                return;
            }

            const tags: Tag[] = [
                { name: "Content-Type", value: newLaunchData.current.icon_file.type },
                { name: "Content-Type", value: newLaunchData.current.banner_file.type },
            ];

            const uploadToArweave = toast.info("Sign to upload images on Arweave.");

            let receipt;

            try {
                receipt = await irys.uploadFolder([newLaunchData.current.icon_file, newLaunchData.current.banner_file], {
                    //@ts-ignore
                    tags,
                });
                toast.update(uploadToArweave, {
                    render: `Images have been uploaded successfully!
                    View: https://gateway.irys.xyz/${receipt.id}`,
                    type: "success",
                    isLoading: false,
                    autoClose: 2000,
                });
            } catch (error) {
                setIsLoading(false);

                toast.update(uploadToArweave, {
                    render: `Failed to upload images, please try again later.`,
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                });

                return;
            }

            console.log(receipt);

            let icon_url = "https://gateway.irys.xyz/" + receipt.manifest.paths[newLaunchData.current.icon_file.name].id;
            let banner_url = "https://gateway.irys.xyz/" + receipt.manifest.paths[newLaunchData.current.banner_file.name].id;

            newLaunchData.current.icon_url = icon_url;
            newLaunchData.current.banner_url = banner_url;
        }

        if (newLaunchData.current.uri == "") {
            // console.log(icon_url, banner_url);
            var metadata = {
                name: newLaunchData.current.name,
                symbol: newLaunchData.current.symbol,
                description: newLaunchData.current.description,
                image: newLaunchData.current.icon_url,
            };

            const jsn = JSON.stringify(metadata);
            const blob = new Blob([jsn], { type: "application/json" });
            const json_file = new File([blob], "metadata.json");

            const json_price = await irys.getPrice(json_file.size);

            const fundMetadata = toast.info("(2/4) Preparing to upload token metadata - transferring balance to Arweave.");

            try {
                let txArgs = await get_current_blockhash("");

                var tx = new Transaction(txArgs).add(
                    SystemProgram.transfer({
                        fromPubkey: wallet.publicKey,
                        toPubkey: new PublicKey(Config.IRYS_WALLET),
                        lamports: Number(json_price),
                    }),
                );
                tx.feePayer = wallet.publicKey;
                let signed_transaction = await wallet.signTransaction(tx);
                const encoded_transaction = bs58.encode(signed_transaction.serialize());

                var transaction_response = await send_transaction("", encoded_transaction);
                console.log(transaction_response);

                let signature = transaction_response.result;

                let fund_check = await irys.funder.submitFundTransaction(signature);

                console.log(fund_check, fund_check.data["confirmed"]);

                //await irys.fund(json_price);
                toast.update(fundMetadata, {
                    render: "Your account has been successfully funded.",
                    type: "success",
                    isLoading: false,
                    autoClose: 2000,
                });
            } catch (error) {
                setIsLoading(false);

                toast.update(fundMetadata, {
                    render: "Something went wrong. Please try again later. ",
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                });
                return;
            }

            const json_tags: Tag[] = [{ name: "Content-Type", value: "application/json" }];

            const uploadMetadata = toast.info("Sign to upload token metadata on Arweave");

            let json_receipt;

            try {
                json_receipt = await irys.uploadFile(json_file, {
                    tags: json_tags,
                });

                toast.update(uploadMetadata, {
                    render: `Token metadata has been uploaded successfully!
                    View: https://gateway.irys.xyz/${json_receipt.id}`,
                    type: "success",
                    isLoading: false,
                    pauseOnFocusLoss: false,
                    autoClose: 2000,
                });
            } catch (error) {
                setIsLoading(false);

                toast.update(uploadMetadata, {
                    render: `Failed to upload token metadata, please try again later.`,
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                });

                return;
            }

            newLaunchData.current.uri = "https://gateway.irys.xyz/" + json_receipt.id;
        }

        let program_data_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(DATA_ACCOUNT_SEED)], PROGRAM)[0];
        let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

        let launch_data_account = PublicKey.findProgramAddressSync(
            [Buffer.from(newLaunchData.current.pagename), Buffer.from("Launch")],
            PROGRAM,
        )[0];

        let wrapped_sol_mint = new PublicKey("So11111111111111111111111111111111111111112");
        var token_mint_pubkey = newLaunchData.current.token_keypair.publicKey;

        let token_raffle_account_key = await getAssociatedTokenAddress(
            token_mint_pubkey, // mint
            program_sol_account, // owner
            true, // allow owner off curve
            newLaunchData.current.token_program,
        );

        let token_meta_key = PublicKey.findProgramAddressSync(
            [Buffer.from("metadata"), METAPLEX_META.toBuffer(), token_mint_pubkey.toBuffer()],
            METAPLEX_META,
        )[0];

        let wrapped_sol_seed = token_mint_pubkey.toBase58().slice(0, 32);
        let wrapped_sol_account = await PublicKey.createWithSeed(program_sol_account, wrapped_sol_seed, TOKEN_PROGRAM_ID);

        if (DEBUG) {
            console.log("arena: ", program_data_account.toString());
            console.log("game_data_account: ", launch_data_account.toString());
            console.log("wsol seed", wrapped_sol_seed);
            console.log("mint", token_mint_pubkey.toString());
        }

        let team_wallet = new PublicKey(newLaunchData.current.team_wallet);

        const instruction_data = serialise_CreateLaunch_instruction(newLaunchData.current);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },

            { pubkey: wrapped_sol_mint, isSigner: false, isWritable: true },
            { pubkey: wrapped_sol_account, isSigner: false, isWritable: true },

            { pubkey: program_data_account, isSigner: false, isWritable: true },
            { pubkey: program_sol_account, isSigner: false, isWritable: true },

            { pubkey: token_mint_pubkey, isSigner: true, isWritable: true },
            { pubkey: token_raffle_account_key, isSigner: false, isWritable: true },

            { pubkey: team_wallet, isSigner: false, isWritable: true },

            { pubkey: token_meta_key, isSigner: false, isWritable: true },
            { pubkey: METAPLEX_META, isSigner: false, isWritable: false },
            { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        ];

        account_vector.push({ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: newLaunchData.current.token_program, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: true });

        if (newLaunchData.current.permanent_delegate !== null) {
            console.log("add PD");
            account_vector.push({ pubkey: newLaunchData.current.permanent_delegate, isSigner: false, isWritable: false });
        }
        if (newLaunchData.current.transfer_hook_program !== null) {
            console.log("add hook", newLaunchData.current.transfer_hook_program.toString());
            account_vector.push({ pubkey: newLaunchData.current.transfer_hook_program, isSigner: false, isWritable: false });

            if (newLaunchData.current.transfer_hook_program.equals(FEES_PROGRAM)) {
                console.log("add hook extra");
                let transfer_hook_validation_account = PublicKey.findProgramAddressSync(
                    [Buffer.from("extra-account-metas"), token_mint_pubkey.toBuffer()],
                    FEES_PROGRAM,
                )[0];
                account_vector.push({ pubkey: transfer_hook_validation_account, isSigner: false, isWritable: true });
            }
        }

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000000 }));
        transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));
        transaction.add(list_instruction);

        transaction.partialSign(newLaunchData.current.token_keypair);

        const createLaunch = toast.info("(3/4) Setting up your launch accounts");

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var signature = await connection.sendRawTransaction(signed_transaction.serialize(), { skipPreflight: true });

            console.log(signature);
            //var transaction_response = await send_transaction("", encoded_transaction);

            if (signature === undefined) {
                console.log(signature);
                toast.error("Transaction failed, please try again");
                return;
            }

            //let signature = transaction_response.result;

            if (DEBUG) {
                console.log("list signature: ", signature);
            }
            signature_ws_id.current = 1;

            connection.onSignature(signature, check_signature_update, "confirmed");
            setTimeout(transaction_failed, 20000);
        } catch (error) {
            console.log(error);
            setIsLoading(false);
            toast.update(createLaunch, {
                render: "We couldn't create your launch accounts. Please try again.",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }
    }, [wallet, newLaunchData, EditLaunch, check_signature_update, transaction_failed]);

    const { isOpen, onOpen, onClose } = useDisclosure();

    const { isOpen: isStartOpen, onToggle: onToggleStart, onClose: onCloseStart } = useDisclosure();
    const { isOpen: isEndOpen, onToggle: onToggleEnd, onClose: OnCloseEnd } = useDisclosure();

    return (
        <Center style={{ background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)" }} width="100%">
            <VStack pb={150} w="100%">
                <Text mb={8} align="start" className="font-face-kg" color={"white"} fontSize="x-large">
                    Book Token Raffle
                </Text>
                <form style={{ width: lg ? "100%" : "1200px" }}>
                    <VStack px={lg ? 4 : 12} spacing={sm ? 42 : 50} align="start" pt={5}>
                        <HStack spacing={15}>
                            <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: sm ? "120px" : "180px" }}>
                                OPEN DATE:
                            </div>

                            <div className={`${styles.textLabelInputDate} font-face-kg`}>
                                <HStack spacing={5}>
                                    <Popover isOpen={isStartOpen} onClose={onCloseStart} placement="bottom" closeOnBlur={false}>
                                        <PopoverTrigger>
                                            <IconButton
                                                onClick={onToggleStart}
                                                aria-label="FaCalendarAlt"
                                                icon={<FaCalendarAlt size={22} />}
                                            />
                                        </PopoverTrigger>
                                        <PopoverContent width="fit-content">
                                            <PopoverArrow />
                                            <PopoverCloseButton />
                                            <PopoverHeader h={34} />
                                            <PopoverBody>
                                                <DatePicker
                                                    disabled={newLaunchData.current.edit_mode === true}
                                                    showTimeSelect
                                                    timeFormat="HH:mm"
                                                    timeIntervals={15}
                                                    selected={localOpenDate}
                                                    onChange={(date) => {
                                                        setLocalOpenDate(date);
                                                        //onCloseStart();
                                                    }}
                                                    onClickOutside={() => onCloseStart()}
                                                    inline
                                                />
                                            </PopoverBody>
                                        </PopoverContent>
                                    </Popover>

                                    <Text m="0" color="white" className="font-face-kg" fontSize={sm ? "small" : "large"}>
                                        {launchDateAndTime}
                                    </Text>
                                </HStack>
                            </div>
                        </HStack>

                        <HStack spacing={15}>
                            <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: sm ? "120px" : "180px" }}>
                                CLOSE DATE:
                            </div>
                            <div className={`${styles.textLabelInputDate} font-face-kg`}>
                                <HStack spacing={5}>
                                    <Popover isOpen={isEndOpen} onClose={OnCloseEnd} placement="bottom" closeOnBlur={false}>
                                        <PopoverTrigger>
                                            <IconButton
                                                onClick={onToggleEnd}
                                                aria-label="FaCalendarAlt"
                                                icon={<FaCalendarAlt size={22} />}
                                            />
                                        </PopoverTrigger>
                                        <PopoverContent width="fit-content">
                                            <PopoverArrow />
                                            <PopoverCloseButton />
                                            <PopoverHeader h={34} />
                                            <PopoverBody>
                                                <DatePicker
                                                    disabled={newLaunchData.current.edit_mode === true}
                                                    showTimeSelect
                                                    keepOpen
                                                    timeFormat="HH:mm"
                                                    timeIntervals={15}
                                                    selected={localCloseDate}
                                                    onChange={(date) => {
                                                        setLocalCloseDate(date);
                                                        //OnCloseEnd();
                                                    }}
                                                    onClickOutside={() => OnCloseEnd()}
                                                    inline
                                                />
                                            </PopoverBody>
                                        </PopoverContent>
                                    </Popover>

                                    <Text m="0" color="white" className="font-face-kg" fontSize={sm ? "small" : "large"}>
                                        {closeDateAndTime}
                                    </Text>
                                </HStack>
                            </div>
                        </HStack>

                        <HStack spacing={0} className={styles.eachField}>
                            <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "130px" }}>
                                AMM Provider:
                            </div>
                            <RadioGroup ml={5} onChange={setAMMProvider} value={AMMProvider}>
                                <Stack direction="row" gap={5}>
                                    <Radio value="cook" color="white">
                                        <Text color="white" m={0} className="font-face-rk" fontSize={lg ? "medium" : "lg"}>
                                            Lets Cook
                                        </Text>
                                    </Radio>
                                    {newLaunchData.current.token_program.equals(TOKEN_PROGRAM_ID) && (
                                        <Radio value="raydium">
                                            <Text color="white" m={0} className="font-face-rk" fontSize={lg ? "medium" : "lg"}>
                                                Raydium
                                            </Text>
                                        </Radio>
                                    )}
                                </Stack>
                            </RadioGroup>
                        </HStack>

                        <HStack spacing={15} w="100%">
                            <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: sm ? "120px" : "180px" }}>
                                AMM Fee:
                            </div>
                            <div className={styles.textLabelInput}>
                                <Input
                                    disabled={AMMProvider === "raydium"}
                                    size={sm ? "medium" : "lg"}
                                    required
                                    placeholder="Enter AMM Fee in bps (Ex. 100 = 1%)"
                                    className={styles.inputBox}
                                    type="text"
                                    value={AMMProvider === "raydium" ? 25 : parseInt(amm_fee) > 0 ? amm_fee : ""}
                                    onChange={(e) => {
                                        setAMMFee(e.target.value);
                                    }}
                                />
                            </div>
                        </HStack>

                        <HStack spacing={15} w="100%">
                            <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: sm ? "120px" : "180px" }}>
                                TEAM WALLET:
                            </div>
                            <div className={styles.textLabelInput}>
                                <Input
                                    disabled={newLaunchData.current.edit_mode === true}
                                    size={sm ? "medium" : "lg"}
                                    required
                                    placeholder="Enter Solana Wallet Address"
                                    className={styles.inputBox}
                                    type="text"
                                    value={teamWallet}
                                    onChange={(e) => {
                                        setTeamWallet(e.target.value);
                                    }}
                                />
                            </div>
                        </HStack>

                        <VStack spacing={3} align="center" justify="center" w="100%">
                            <HStack>
                                <button type="button" className={`${styles.nextBtn} font-face-kg `} onClick={onOpen}>
                                    PREVIEW
                                </button>
                            </HStack>
                            <HStack spacing={3}>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        prevPage(e);
                                    }}
                                    className={`${styles.nextBtn} font-face-kg `}
                                >
                                    Go Back
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        if (!isLoading) {
                                            Launch(e);
                                        }
                                    }}
                                    className={`${styles.nextBtn} font-face-kg `}
                                >
                                    {isLoading ? <Spinner /> : "CONFIRM"}
                                </button>
                            </HStack>
                        </VStack>
                    </VStack>
                </form>
            </VStack>

            <LaunchPreviewModal isOpen={isOpen} onClose={onClose} launchData={create_LaunchData(newLaunchData.current)} />
        </Center>
    );
};

export default BookPage;
