import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import {
    Center,
    VStack,
    Text,
    HStack,
    Input,
    chakra,
    Flex,
    Box,
    Checkbox,
    PopoverTrigger,
    PopoverContent,
    PopoverArrow,
    PopoverCloseButton,
    PopoverHeader,
    PopoverBody,
    Popover,
    IconButton,
    useDisclosure,
    FormControl,
    FormLabel,
    Switch,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "../../styles/Launch.module.css";
import useResponsive from "../../hooks/useResponsive";
import styles2 from "../../styles/LaunchDetails.module.css";
import { Keypair, PublicKey, Connection } from "@solana/web3.js";
import useAppRoot from "../../context/useAppRoot";
import { toast } from "react-toastify";
import { Config, PROGRAM, LaunchFlags, SYSTEM_KEY, LaunchKeys, METAPLEX_META, Extensions } from "../Solana/constants";
import {
    unpackMint,
    Mint,
    TOKEN_2022_PROGRAM_ID,
    getTransferHook,
    getTransferFeeConfig,
    getPermanentDelegate,
    getMetadataPointerState,
    getTokenMetadata,
    TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { MintData, request_current_balance, request_raw_account_data } from "../Solana/state";
import ShowExtensions from "../Solana/extensions";
import DatePicker from "react-datepicker";
import { FaCalendarAlt } from "react-icons/fa";
import { getMintData } from "../amm/launch";

interface HybridInfoProps {
    setScreen: Dispatch<SetStateAction<string>>;
}

const HybridInfo = ({ setScreen }: HybridInfoProps) => {
    const router = useRouter();
    const { newCollectionData } = useAppRoot();

    const { sm, md, lg, xl } = useResponsive();
    const [token_mint, setTokenMint] = useState<string>(
        newCollectionData.current.token_mint !== null ? newCollectionData.current.token_mint?.toString() : "",
    );
    const [token_name, setTokenName] = useState<string>(newCollectionData.current.token_symbol);
    const [token_icon_url, setTokenIconURL] = useState<string>(newCollectionData.current.token_image_url);
    const [token_symbol, setTokenSymbol] = useState<string>(newCollectionData.current.token_symbol);
    const [token_decimals, setTokenDecimals] = useState<number>(newCollectionData.current.token_decimals);
    const [token_extensions, setTokenExtensions] = useState<number>(newCollectionData.current.token_extensions);

    const [team_wallet, setTeamWallet] = useState<string>(newCollectionData.current.team_wallet);
    const [swap_fee, setSwapFee] = useState<string>(
        newCollectionData.current.swap_fee > 0 ? newCollectionData.current.swap_fee.toString() : "",
    );
    const [mint_prob, setMintProb] = useState<string>(
        newCollectionData.current.mint_prob < 100 ? newCollectionData.current.mint_prob.toString() : "",
    );
    const [swap_rate, setSwapRate] = useState<string>(
        newCollectionData.current.swap_rate > 0 ? newCollectionData.current.swap_rate.toString() : "",
    );

    const [whitelist_key, setWhitelistKey] = useState<string>(newCollectionData.current.whitelist_key);
    const [whitelist_amount, setWhitelistAmount] = useState<number>(newCollectionData.current.whitelist_amount);
    const [inc_whitelist_phase_end, setIncWhiteListPhaseEnd] = useState<boolean>(false);
    const [whitelist_phase_end, setWhiteListPhaseEnd] = useState<Date>(newCollectionData.current.whitelist_phase_end);
    const [whitelist_end_date_and_time, setWhiteListEndDateAndTime] = useState("-- --");

    const { isOpen: isWLEndOpen, onToggle: onToggleWLEnd, onClose: OnCloseWLEnd } = useDisclosure();

    const local_date = useMemo(() => new Date(), []);
    var zone = new Date().toLocaleTimeString("en-us", { timeZoneName: "short" }).split(" ")[2];
    //console.log(zone);

    useEffect(() => {
        let splitLaunchDate =
            whitelist_phase_end.getTime() > 0 ? whitelist_phase_end.toString().split(" ") : new Date().toString().split(" ");
        let launchDateString = splitLaunchDate[0] + " " + splitLaunchDate[1] + " " + splitLaunchDate[2] + " " + splitLaunchDate[3];
        let splitLaunchTime = splitLaunchDate[4].split(":");
        let launchTimeString = splitLaunchTime[0] + ":" + splitLaunchTime[1] + " " + zone;
        setWhiteListEndDateAndTime(`${launchDateString} ${launchTimeString}`);
    }, [whitelist_phase_end, local_date, zone]);

    const handleSetIncWhiteListPhaseEnd = (e: React.ChangeEvent<HTMLInputElement>) => {
        // if we are going from include -> not include, set the date to zero
        if (inc_whitelist_phase_end) {
            let zero_date = new Date(0);
            console.log("set date to zero, ", zero_date, zero_date.getTime());
            setWhiteListPhaseEnd(zero_date);
        }
        // otherwise set the date to the current date
        else {
            setWhiteListPhaseEnd(new Date(new Date().setHours(0, 0, 0, 0)));
        }
        setIncWhiteListPhaseEnd(!inc_whitelist_phase_end);
    };

    async function setMintData(e): Promise<void> {
        e.preventDefault();

        if (token_mint === "" || !token_mint) {
            toast.error("Please enter token address");
            return;
        }

        let token_key;

        try {
            // Attempt to create a PublicKey instance
            token_key = new PublicKey(token_mint);
            // If no error is thrown, input is a valid public key
        } catch (error) {
            toast.error("Invalid token address");
            return;
        }

        const searchToken = toast.loading("Searching Token...");

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });
        let result = await connection.getAccountInfo(token_key, "confirmed");

        let mint: Mint;
        if (result.owner.equals(TOKEN_PROGRAM_ID)) {
            try {
                mint = unpackMint(token_key, result, TOKEN_PROGRAM_ID);
                console.log(mint);
            } catch (error) {
                toast.update(searchToken, {
                    render: `Error loading token`,
                    type: "error",
                    isLoading: false,
                    autoClose: 2000,
                });
                return;
            }
        } else {
            try {
                mint = unpackMint(token_key, result, TOKEN_2022_PROGRAM_ID);
                console.log(mint);
            } catch (error) {
                toast.update(searchToken, {
                    render: `Token is not using Token2022 program`,
                    type: "error",
                    isLoading: false,
                    autoClose: 2000,
                });
                return;
            }
        }

        let mint_data: MintData = await getMintData(connection, mint, result.owner);
        console.log("getting mint data", mint, result.owner, mint_data);

        setTokenName(mint_data.name);
        setTokenSymbol(mint_data.symbol);

        // check the extensions we care about
        let transfer_hook = getTransferHook(mint);
        let transfer_fee_config = getTransferFeeConfig(mint);
        let permanent_delegate = getPermanentDelegate(mint);

        let extensions =
            (Extensions.TransferFee * Number(transfer_fee_config !== null)) |
            (Extensions.PermanentDelegate * Number(permanent_delegate !== null)) |
            (Extensions.TransferHook * Number(transfer_hook !== null));
        console.log("extensions", extensions);

        //console.log("deserialize meta data");

        setTokenIconURL(mint_data.icon);
        setTokenDecimals(mint.decimals);
        setTokenExtensions(extensions);

        toast.update(searchToken, {
            render: `Successfully found and retrieved token metadata`,
            type: "success",
            isLoading: false,
            autoClose: 2000,
        });
        return;
    }

    async function setData(e): Promise<boolean> {
        e.preventDefault();

        if (token_name === "") {
            toast.error("Token name not set, please search for valid Token 2022 token");
            return;
        }

        newCollectionData.current.team_wallet = team_wallet;
        newCollectionData.current.token_image_url = token_icon_url;
        newCollectionData.current.token_name = token_name;
        newCollectionData.current.token_symbol = token_symbol;
        newCollectionData.current.token_mint = new PublicKey(token_mint);
        newCollectionData.current.swap_rate = parseFloat(swap_rate);
        newCollectionData.current.swap_fee = parseInt(swap_fee);
        newCollectionData.current.token_decimals = token_decimals;
        newCollectionData.current.token_extensions = token_extensions;

        if (mint_prob !== "") {
            let prob = parseInt(mint_prob);
            if (!isNaN(prob) && prob > 0 && prob <= 100) {
                newCollectionData.current.mint_prob = prob;
            } else {
                toast.error("Invalid Mint Chance");
                return;
            }
        }

        if (whitelist_key !== "") {
            try {
                let whitelist = new PublicKey(whitelist_key);
                let balance = await request_current_balance("", whitelist);

                //console.log("check balance", teamPubKey.toString(), balance);

                if (balance == 0) {
                    toast.error("Whitelist token does not exist");
                    return false;
                }
            } catch (error) {
                toast.error("Invalid Whitelist token");
                return false;
            }

            newCollectionData.current.whitelist_key = whitelist_key;
            newCollectionData.current.whitelist_amount = 1;
            newCollectionData.current.whitelist_phase_end = whitelist_phase_end;
        }

        return true;
    }

    async function setLaunchData(e) {
        if (await setData(e)) setScreen("step 4");
    }

    return (
        <Center width="100%">
            <VStack w="100%" style={{ paddingBottom: md ? 35 : "200px" }}>
                <Text align="start" className="font-face-kg font-extrabold" color={"white"} fontSize="x-large">
                    Collection Info:
                </Text>
                <form onSubmit={setLaunchData} style={{ width: xl ? "100%" : "1200px" }} className="mt-4 rounded-md bg-[#303030] py-4 pt-5">
                    <VStack px={lg ? 4 : 12} spacing={25}>
                        <HStack w="100%" spacing={lg ? 10 : 12} style={{ flexDirection: lg ? "column" : "row" }}>
                            <VStack spacing={8} flexGrow={1} align="start" width="100%">
                                <HStack w="100%" spacing={lg ? 10 : 12} style={{ flexDirection: lg ? "column" : "row" }}>
                                    {token_icon_url ? (
                                        <VStack spacing={3}>
                                            <Image
                                                src={token_icon_url}
                                                width={lg ? 180 : 235}
                                                height={lg ? 180 : 235}
                                                alt="Image Frame"
                                                style={{ backgroundSize: "cover", borderRadius: 12 }}
                                            />
                                            <ShowExtensions extension_flag={token_extensions} />
                                        </VStack>
                                    ) : (
                                        <VStack
                                            justify="center"
                                            align="center"
                                            style={{ minWidth: lg ? 180 : 235, minHeight: lg ? 180 : 235, cursor: "pointer" }}
                                            borderRadius={12}
                                            border="2px dashed rgba(134, 142, 150, 0.5)"
                                            as={chakra.label}
                                            htmlFor="file"
                                        >
                                            <Text mb={0} fontSize="x-large" color="white" opacity={0.25}>
                                                Icon Preview
                                            </Text>
                                        </VStack>
                                    )}

                                    <VStack spacing={8} flexGrow={1} align="start" width="100%">
                                        <HStack spacing={0} className={styles.eachField}>
                                            <div
                                                className={`${styles.textLabel} font-face-kg`}
                                                style={{ minWidth: lg ? "100px" : "132px" }}
                                            >
                                                Token:
                                            </div>

                                            <div className={styles.textLabelInput}>
                                                <Input
                                                    placeholder="Search Token"
                                                    size={lg ? "md" : "lg"}
                                                    required
                                                    className={styles.inputBox}
                                                    type="text"
                                                    value={token_mint}
                                                    onChange={(e) => {
                                                        setTokenMint(e.target.value);
                                                    }}
                                                />
                                            </div>

                                            <div style={{ marginLeft: "12px" }}>
                                                <label className={styles.label}>
                                                    <button
                                                        onClick={(e) => setMintData(e)}
                                                        className={styles.browse}
                                                        style={{ cursor: "pointer", padding: "5px 10px" }}
                                                    >
                                                        Search
                                                    </button>
                                                </label>
                                            </div>
                                        </HStack>
                                        <HStack spacing={0} className={styles.eachField}>
                                            <div
                                                className={`${styles.textLabel} font-face-kg`}
                                                style={{ minWidth: lg ? "100px" : "132px" }}
                                            >
                                                Name:
                                            </div>

                                            <div className={styles.textLabelInput}>
                                                <Input
                                                    placeholder="Token Name"
                                                    readOnly={true}
                                                    disabled
                                                    size={lg ? "md" : "lg"}
                                                    className={styles.inputBox}
                                                    type="text"
                                                    value={token_name}
                                                />
                                            </div>
                                        </HStack>

                                        <Flex gap={sm ? 8 : 5} w="100%" flexDirection={sm ? "column" : "row"}>
                                            <HStack spacing={0} className={styles.eachField}>
                                                <div
                                                    className={`${styles.textLabel} font-face-kg`}
                                                    style={{ minWidth: lg ? "100px" : "132px" }}
                                                >
                                                    Symbol:
                                                </div>
                                                <div className={styles.textLabelInput}>
                                                    <Input
                                                        // pl={9}
                                                        bg="#494949"
                                                        placeholder="Token Symbol"
                                                        readOnly={true}
                                                        disabled
                                                        size={lg ? "md" : "lg"}
                                                        className={styles.inputBox}
                                                        type="text"
                                                        value={token_symbol}
                                                    />
                                                </div>
                                            </HStack>
                                        </Flex>
                                    </VStack>
                                </HStack>

                                <HStack w={"100%"} spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "160px" }}>
                                        Swap Rate:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            bg="#494949"
                                            placeholder="Enter Swap Rate (Tokens per NFT)"
                                            size={lg ? "md" : "lg"}
                                            maxLength={8}
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            value={swap_rate}
                                            onChange={(e) => {
                                                setSwapRate(e.target.value);
                                            }}
                                        />
                                    </div>
                                </HStack>

                                <HStack spacing={0} w="100%" className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "160px" }}>
                                        Swap Fee:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            bg="#494949"
                                            placeholder="Enter Swap Fee (Bps - 100 = 1%)"
                                            size={lg ? "md" : "lg"}
                                            maxLength={8}
                                            className={styles.inputBox}
                                            type="text"
                                            value={swap_fee}
                                            onChange={(e) => {
                                                setSwapFee(e.target.value);
                                            }}
                                        />
                                    </div>
                                </HStack>

                                <HStack spacing={0} w="100%" className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "160px" }}>
                                        Mint Chance:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            bg="#494949"
                                            placeholder="Chance of getting nft on swap (default = 100%) - Optional"
                                            size={lg ? "md" : "lg"}
                                            maxLength={8}
                                            className={styles.inputBox}
                                            type="text"
                                            value={mint_prob}
                                            onChange={(e) => {
                                                setMintProb(e.target.value);
                                            }}
                                        />
                                    </div>
                                </HStack>

                                <HStack w={"100%"} spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "160px" }}>
                                        Fee Wallet:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            bg="#494949"
                                            placeholder="Enter Solana Wallet Address"
                                            size={lg ? "md" : "lg"}
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            value={team_wallet}
                                            onChange={(e) => {
                                                setTeamWallet(e.target.value);
                                            }}
                                        />
                                    </div>
                                </HStack>

                                <HStack w={"100%"} spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "160px" }}>
                                        Whitelist Token:
                                    </div>
                                    <div className={styles.textLabelInput}>
                                        <Input
                                            size={sm ? "medium" : "lg"}
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
                                <HStack spacing={15} w="100%" className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: sm ? "120px" : "180px" }}>
                                        WHITELIST END DATE:
                                    </div>
                                    <Switch
                                        ml={2}
                                        py={2}
                                        size={lg ? "md" : "lg"}
                                        isChecked={inc_whitelist_phase_end}
                                        onChange={(e) => handleSetIncWhiteListPhaseEnd(e)}
                                    />

                                    <div className={`${styles.textLabelInputDate} font-face-kg`} hidden={!inc_whitelist_phase_end}>
                                        <HStack spacing={5} ml={2}>
                                            <Popover isOpen={isWLEndOpen} onClose={OnCloseWLEnd} placement="bottom" closeOnBlur={false}>
                                                <PopoverTrigger>
                                                    <IconButton
                                                        onClick={onToggleWLEnd}
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
                                                            disabled={inc_whitelist_phase_end === false}
                                                            showTimeSelect
                                                            keepOpen
                                                            timeFormat="HH:mm"
                                                            timeIntervals={15}
                                                            selected={whitelist_phase_end}
                                                            onChange={(date) => {
                                                                setWhiteListPhaseEnd(date);
                                                                //OnCloseEnd();
                                                            }}
                                                            onClickOutside={() => OnCloseWLEnd()}
                                                            inline
                                                        />
                                                    </PopoverBody>
                                                </PopoverContent>
                                            </Popover>

                                            <Text m="0" color="white" className="font-face-kg" fontSize={sm ? "small" : "large"}>
                                                {whitelist_end_date_and_time}
                                            </Text>
                                        </HStack>
                                    </div>
                                </HStack>
                            </VStack>
                        </HStack>

                        <HStack mt={md ? 0 : 30}>
                            <button
                                type="button"
                                className={`${styles.nextBtn} font-face-kg`}
                                onClick={() => {
                                    setScreen("step 2");
                                }}
                            >
                                GO BACK
                            </button>
                            <button type="submit" className={`${styles.nextBtn} font-face-kg`}>
                                NEXT (3/4)
                            </button>
                        </HStack>
                    </VStack>
                </form>
            </VStack>
        </Center>
    );
};

export default HybridInfo;
