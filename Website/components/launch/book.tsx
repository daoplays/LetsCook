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
    getRecentPrioritizationFees,
    getLaunchType,
    getLaunchTypeIndex,
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
import useCreateLaunch from "../../hooks/launch/useCreateLaunch";
import { Config } from "../Solana/constants";

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
    const { sm, md, lg, xl } = useResponsive();
    const { newLaunchData } = useAppRoot();

    const [isLoading, setIsLoading] = useState(false);

    const [localOpenDate, setLocalOpenDate] = useState<Date>(newLaunchData.current.opendate);
    const [localCloseDate, setLocalCloseDate] = useState<Date>(newLaunchData.current.closedate);

    const [teamWallet, setTeamWallet] = useState<string>(newLaunchData.current.team_wallet);
    const [whitelist_key, setWhitelistKey] = useState<string>(newLaunchData.current.whitelist_key);
    const [whitelist_amount, setWhitelistAmount] = useState<number>(newLaunchData.current.whitelist_amount);

    const [amm_fee, setAMMFee] = useState<string>(newLaunchData.current.amm_fee.toString());
    const [AMMProvider, setAMMProvider] = useState<string>("cook");
    const [launch_type, setLaunchType] = useState<string>(getLaunchType(newLaunchData.current.launch_type));

    const signature_ws_id = useRef<number | null>(null);

    const [launchDateAndTime, setLaunchDateAndTime] = useState("-- --");
    const [closeDateAndTime, setCloseDateAndTime] = useState("-- --");
    const { CreateLaunch } = useCreateLaunch();

    const local_date = useMemo(() => new Date(), []);
    var zone = new Date().toLocaleTimeString("en-us", { timeZoneName: "short" }).split(" ")[2];
    //console.log(zone);

    useEffect(() => {
        let splitLaunchDate = localOpenDate.getTime() > 0 ? localOpenDate.toString().split(" ") : new Date().toString().split(" ");
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

        if (whitelist_key !== "") {
            try {
                let whitelist = new PublicKey(whitelist_key);
                balance = await request_current_balance("", whitelist);

                //console.log("check balance", teamPubKey.toString(), balance);

                if (balance == 0) {
                    toast.error("Whitelist token does not exist");
                    return false;
                }
            } catch (error) {
                toast.error("Invalid Whitelist token");
                return false;
            }

            newLaunchData.current.whitelist_key = whitelist_key;
            newLaunchData.current.whitelist_amount = 1;
        }
        if (!newLaunchData.current.edit_mode && localCloseDate.getTime() <= localOpenDate.getTime()) {
            toast.error("Close date must be set after launch date");
            return false;
        }

        if (!newLaunchData.current.edit_mode && localOpenDate.getTime() > 0 && localOpenDate.getTime() < new Date().getTime()) {
            toast.error("Open date must be set after now");
            return false;
        }

        newLaunchData.current.opendate = localOpenDate;
        newLaunchData.current.closedate = localCloseDate;
        newLaunchData.current.team_wallet = teamWallet;
        newLaunchData.current.amm_fee = AMMProvider === "raydium" ? 25 : parseInt(amm_fee);
        newLaunchData.current.launch_type = getLaunchTypeIndex(launch_type);

        if (AMMProvider === "cook") {
            newLaunchData.current.amm_provider = 0;
        }
        if (AMMProvider === "raydium") {
            if (newLaunchData.current.transfer_hook_program !== null) {
                toast.error("Raydium doesn't support transfer hook");
                return false;
            }
            if (newLaunchData.current.permanent_delegate !== null) {
                toast.error("Raydium doesn't support permanent delegate");
                return false;
            }
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

    const { isOpen, onOpen, onClose } = useDisclosure();

    const { isOpen: isStartOpen, onToggle: onToggleStart, onClose: onCloseStart } = useDisclosure();
    const { isOpen: isEndOpen, onToggle: onToggleEnd, onClose: OnCloseEnd } = useDisclosure();

    return (
        <Center style={{ background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)" }} width="100%">
            <VStack pb={150} w="100%">
                <Text mb={8} align="start" className="font-face-kg" color={"white"} fontSize="x-large">
                    Book Token Raffle
                </Text>
                <form style={{ width: xl ? "100%" : "1200px" }}>
                    <VStack px={lg ? 4 : 12} spacing={sm ? 42 : 50} align="start" pt={5}>
                        <HStack spacing={0} className={styles.eachField}>
                            <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "130px" }}>
                                Launch Mode:
                            </div>
                            <RadioGroup ml="5" onChange={setLaunchType} value={launch_type}>
                                <Stack direction="row" gap={5}>
                                    <Radio value="FCFS" color="white">
                                        <Tooltip
                                            label="Launch ends as soon as it is funded, first come first serve."
                                            hasArrow
                                            fontSize="large"
                                            offset={[0, 10]}
                                        >
                                            <Text color="white" m={0} className="font-face-rk" fontSize={lg ? "medium" : "lg"}>
                                                FCFS
                                            </Text>
                                        </Tooltip>
                                    </Radio>
                                    <Radio value="Raffle">
                                        <Tooltip
                                            label="Launch Runs for a set period of time (default 24hrs), users can buy tickets to enter the raffle."
                                            hasArrow
                                            fontSize="large"
                                            offset={[0, 10]}
                                        >
                                            <Text color="white" m={0} className="font-face-rk" fontSize={lg ? "medium" : "lg"}>
                                                Raffle
                                            </Text>
                                        </Tooltip>
                                    </Radio>
                                    <Radio value="IDO">
                                        <Tooltip
                                            label="Launch Runs for a set period of time (default 24hrs).  If funded, tokens are distributed pro rata between all ticket holders."
                                            hasArrow
                                            fontSize="large"
                                            offset={[0, 10]}
                                        >
                                            <Text color="white" m={0} className="font-face-rk" fontSize={lg ? "medium" : "lg"}>
                                                IDO
                                            </Text>
                                        </Tooltip>
                                    </Radio>
                                </Stack>
                            </RadioGroup>
                        </HStack>
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
                                            Let&apos;s Cook
                                        </Text>
                                    </Radio>
                                    {Config.NETWORK !== "eclipse" && (
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

                        <HStack spacing={15} w="100%">
                            <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: sm ? "120px" : "180px" }}>
                                WHITELIST TOKEN:
                            </div>
                            <div className={styles.textLabelInput}>
                                <Input
                                    disabled={newLaunchData.current.edit_mode === true}
                                    size={sm ? "medium" : "lg"}
                                    required
                                    placeholder="Enter Whitelist Token Address - Optional"
                                    className={styles.inputBox}
                                    type="text"
                                    value={whitelist_key}
                                    onChange={(e) => {
                                        setWhitelistKey(e.target.value);
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
