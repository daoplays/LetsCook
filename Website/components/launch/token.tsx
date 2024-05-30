import { Dispatch, SetStateAction, MutableRefObject, useState, MouseEventHandler, useRef, useEffect } from "react";
import { PieChart } from "react-minimal-pie-chart";
import { useMediaQuery } from "react-responsive";
import {
    Center,
    VStack,
    Text,
    HStack,
    Input,
    InputRightElement,
    InputGroup,
    InputLeftElement,
    Spacer,
    Box,
    Checkbox,
    Tooltip,
    Divider,
    chakra,
    FormControl,
    FormLabel,
    Spinner,
    RadioGroup,
    Stack,
    Radio,
    useDisclosure,
    Modal,
    ModalBody,
    ModalContent,
    ModalOverlay,
} from "@chakra-ui/react";
import { Keypair, PublicKey } from "@solana/web3.js";
import { LaunchData, LaunchDataUserInput, bignum_to_num, Distribution, uInt32ToLEBytes } from "../../components/Solana/state";
import { DEFAULT_FONT_SIZE, FEES_PROGRAM } from "../../components/Solana/constants";
import Image from "next/image";
import styles from "../../styles/Launch.module.css";
import WoodenButton from "../Buttons/woodenButton";
import useResponsive from "../../hooks/useResponsive";
import { useRouter } from "next/router";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import useAppRoot from "../../context/useAppRoot";
import { toast } from "react-toastify";
import { FaDollarSign } from "react-icons/fa";
import getImageDimensions from "../../utils/getImageDimension";
import { distributionLabels } from "../../constant/root";
import trimAddress from "../../utils/trimAddress";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
interface TokenPageProps {
    setScreen: Dispatch<SetStateAction<string>>;
    simpleLaunch: boolean;
}

const TokenPage = ({ setScreen, simpleLaunch }: TokenPageProps) => {
    //console.log(newLaunchData.current)
    const router = useRouter();
    const { sm, md, lg, xl } = useResponsive();
    const { newLaunchData } = useAppRoot();
    const [isLoading, setIsLoading] = useState(false);
    const [grindComplete, setGrindComplete] = useState(false);

    const [name, setName] = useState<string>(newLaunchData.current.name);
    const [symbol, setSymbol] = useState<string>(newLaunchData.current.symbol);
    const [displayImg, setDisplayImg] = useState<string>(newLaunchData.current.displayImg);
    const [tokenStart, setTokenStart] = useState<string>("");
    const [totalSupply, setTotalSupply] = useState<string>(newLaunchData.current.total_supply.toString());
    const [decimal, setDecimal] = useState<string>(newLaunchData.current.decimals.toString());
    const [mints, setMints] = useState<string>(newLaunchData.current.num_mints.toString());
    const [ticketPrice, setTotalPrice] = useState<string>(newLaunchData.current.ticket_price.toString());
    const [distribution, setDistribution] = useState<number[]>(newLaunchData.current.distribution);
    const [tokenProgram, setTokenProgram] = useState<string>((newLaunchData.current.token_program === null || newLaunchData.current.token_program.equals(TOKEN_2022_PROGRAM_ID)) ? "2022" : "classic");

    const [rewardsSupply, setRewardsSupply] = useState<string>("none");

    const [isCustomProgramId, setIsCustomProgramId] = useState(false);

    // token extensions
    const [transferFee, setTransferFee] = useState<string>(
        newLaunchData.current.transfer_fee > 0 ? newLaunchData.current.transfer_fee.toString() : "",
    );
    const [maxTransferFee, setMaxTransferFee] = useState<string>(
        newLaunchData.current.max_transfer_fee > 0 ? newLaunchData.current.max_transfer_fee.toString() : "",
    );
    const [permanentDelegate, setPermanentDelegate] = useState<string>("");
    const [transferHookID, setTransferHookID] = useState<string>("");

    const grind_attempts = useRef<number>(0);
    const grind_toast = useRef<any | null>(null);

    const { isOpen: isTooltipOpened, onOpen: openTooltip, onClose: closeTooltip } = useDisclosure();

    const handleNameChange = (e) => {
        setName(e.target.value);
    };
    const handleSymbolChange = (e) => {
        setSymbol(e.target.value);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];

        if (!file.type.startsWith("image")) {
            toast.error("Please upload an image file.");
            return;
        }

        if (file) {
            if (file.size <= 1048576) {
                const dimensions = await getImageDimensions(file);

                if (dimensions.width === dimensions.height) {
                    newLaunchData.current.icon_file = file;
                    setDisplayImg(URL.createObjectURL(e.target.files[0]));
                } else {
                    toast.error("Please upload an image with equal width and height.");
                }
            } else {
                toast.error("File size exceeds 1MB limit.");
            }
        }
    };

    const handleDistributionChange = (e, idx) => {
        let new_dist = [...distribution];
        new_dist[idx] = isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value);
        console.log(new_dist);
        setDistribution(new_dist);
    };

    function getTotalPercentage(distribution: number[]) {
        let total = 0;
        for (let i = 0; i < distribution.length; i++) {
            total += distribution[i];
        }
        return total;
    }
    // Calculate the total sum of all percentages
    const totalPercentage = getTotalPercentage(distribution);

    const tokenGrind = async () => {
        setIsLoading(true);
        if (grind_attempts.current === 0) {
            let est_time = "1s";
            if (tokenStart.length == 2) est_time = "5s";
            if (tokenStart.length === 3) est_time = "5-20min";
            grind_toast.current = toast.loading("Performing token prefix grind.. Est. time:  " + est_time);
            await new Promise((resolve) => setTimeout(resolve, 500));
        } else {
            toast.update(grind_toast.current, {
                render: "Grind Attempts: " + grind_attempts.current.toString(),
                type: "info",
            });
            await new Promise((resolve) => setTimeout(resolve, 500));
        }

        let success: boolean = false;
        for (let i = 0; i < 50000; i++) {
            grind_attempts.current++;
            /*let seed_buffer = [];

            for (let i = 0; i < 32; i++) {
                seed_buffer.push(Math.floor(Math.random() * 255));
            }
            
            let seed = new Uint8Array(seed_buffer);
*/
            newLaunchData.current.token_keypair = new Keypair(); //.fromSeed(seed);
            //console.log(newLaunchData.current.token_keypair.publicKey.toString(), tokenStart);
            if (newLaunchData.current.token_keypair.publicKey.toString().startsWith(tokenStart)) {
                success = true;
                console.log("have found key", newLaunchData.current.token_keypair.publicKey.toString());
                break;
            }
        }

        if (success) {
            let key_str = trimAddress(newLaunchData.current.token_keypair.publicKey.toString());

            //console.log("Took ", attempts, "to get pubkey", newLaunchData.current.token_keypair.publicKey.toString());
            toast.update(grind_toast.current, {
                render: "Token " + key_str + " found after " + grind_attempts.current.toString() + " attempts!",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });
            grind_attempts.current = 0;
            grind_toast.current = null;
            setIsLoading(false);
            setGrindComplete(true);

            console.log("returning true");
            return true;
        } else {
            // give the CPU a small break to do other things
            process.nextTick(function () {
                // continue working
                tokenGrind();
            });
            return false;
        }
    };

    function containsNone(str: string, set: string[]) {
        return str.split("").every(function (ch) {
            return set.indexOf(ch) === -1;
        });
    }

    let invalid_prefix_chars = [
        ":",
        "/",
        "?",
        "#",
        "[",
        "]",
        "@",
        "&",
        "=",
        "+",
        "$",
        ",",
        "{",
        "}",
        "|",
        "\\",
        "^",
        "~",
        "`",
        "<",
        ">",
        "%",
        " ",
        '"',
        "I",
        "l",
        "0",
        "O",
    ];

    async function setData(e): Promise<boolean> {
        e.preventDefault();

        if (totalPercentage !== 100 && !simpleLaunch) {
            toast.error("The total percentage must add up to 100%.");
            return false;
        }

        if (newLaunchData.current.icon_file === null) {
            toast.error("Please select an icon image.");
            return false;
        }

        if (parseFloat(ticketPrice) < 0.00001 && !simpleLaunch) {
            toast.error("Minimum ticket price is 0.00001 SOL");
            return false;
        }

        if (symbol.length > 10) {
            toast.error("Maximum symbol length is 10 characters");
            return false;
        }

        if (name.length > 25) {
            toast.error("Maximum name length is 25 characters");
            return false;
        }

        if (distribution[Distribution.LP] === 0 && !simpleLaunch) {
            toast.error("Liquidity pool allocation must be greater than zero");
            return false;
        }

        if (distribution[Distribution.Raffle] === 0 && !simpleLaunch) {
            toast.error("Raffle allocation must be greater than zero");
            return false;
        }

        if (Math.pow(10, parseInt(decimal)) * parseInt(totalSupply) * (distribution[Distribution.Raffle] / 100) < parseInt(mints)) {
            toast.error("Not enough tokens to support the raffle");
            return false;
        }

        if (parseInt(totalSupply) < 10) {
            toast.error("Total supply of tokens must be over 10");
            return false;
        }

        if (!containsNone(tokenStart, invalid_prefix_chars)) {
            toast.error("Prefix contains invalid characters for token");
            return false;
        }

        let decimals = parseInt(decimal);
         if (isNaN(decimals) || decimals <= 0 || decimals > 9) {
             toast.error("Invalid decimal places (must be between 1 and 9)");
             return false;
        }

        newLaunchData.current.token_keypair = Keypair.generate();

        newLaunchData.current.name = name;
        newLaunchData.current.symbol = symbol;
        newLaunchData.current.displayImg = displayImg;
        newLaunchData.current.total_supply = parseInt(totalSupply);

        if (!simpleLaunch) { 
            newLaunchData.current.decimals = decimals;
            newLaunchData.current.num_mints = parseInt(mints);
            newLaunchData.current.ticket_price = parseFloat(ticketPrice);
            newLaunchData.current.minimum_liquidity = Math.round(parseFloat(mints) * parseFloat(ticketPrice));
            newLaunchData.current.distribution = distribution;

            newLaunchData.current.transfer_fee = parseFloat(transferFee);
            newLaunchData.current.max_transfer_fee = parseInt(maxTransferFee) * Math.pow(10, newLaunchData.current.decimals);

            if (permanentDelegate !== "") {
                newLaunchData.current.permanent_delegate = new PublicKey(permanentDelegate);
            }

            if (transferHookID !== "") {
                newLaunchData.current.transfer_hook_program = new PublicKey(transferHookID);
            }

            newLaunchData.current.token_program = tokenProgram === "2022" ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;

            if (tokenStart !== "") {
                // Call tokenGrind() and wait for it to finish
                await tokenGrind();
            } else {
                setGrindComplete(true);
            }
        }
        else {
            newLaunchData.current.decimals = 9;
            newLaunchData.current.num_mints = 1000;
            newLaunchData.current.ticket_price = 0.05;
            newLaunchData.current.minimum_liquidity = Math.round(newLaunchData.current.num_mints * newLaunchData.current.ticket_price);

            console.log("rewards suuply", rewardsSupply)
            if (rewardsSupply === "0") {
                newLaunchData.current.distribution = [50,50,0,0,0,0,0];
            }
            else if (rewardsSupply === "5") {
                newLaunchData.current.distribution = [47.5,47.5,5,0,0,0,0];
            }
            else if (rewardsSupply === "10") {
                newLaunchData.current.distribution = [45,45,10,0,0,0,0];
            }

            newLaunchData.current.transfer_fee = 0;
            newLaunchData.current.max_transfer_fee = 0;

            newLaunchData.current.permanent_delegate = null;
            newLaunchData.current.transfer_hook_program = null;
            
            newLaunchData.current.token_program = TOKEN_PROGRAM_ID;

            setGrindComplete(true);
        }

        console.log("returning true");
        return true;
    }

    useEffect(() => {
        if (!grindComplete) {
            return;
        }

        setScreen("details");
    }, [grindComplete, setScreen]);

    async function nextPage(e) {
        console.log("in next page");
        await setData(e);
    }

    const Browse = () => (
        <HStack spacing={0} className={styles.eachField}>
            <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "132px" }}>
                Icon:
            </div>
            <div>
                <label className={styles.label}>
                    <input id="file" type="file" onChange={handleFileChange} />
                    <span
                        className={styles.browse}
                        style={{ cursor: newLaunchData.current.edit_mode === true ? "not-allowed" : "pointer", padding: "5px 10px" }}
                    >
                        BROWSE
                    </span>
                </label>
            </div>
            <Text m={0} ml={5} className="font-face-rk" fontSize={lg ? "medium" : "lg"}>
                {newLaunchData.current.icon_file !== null ? newLaunchData.current.icon_file.name : "No File Selected (Size Limit: 1MB)"}
            </Text>
        </HStack>
    );

    return (
        <Center style={{ background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)" }} height="100%" width="100%">
            <VStack height="100%" w="100%" style={{ paddingBottom: md ? 35 : "75px" }}>
                <Text align="start" className="font-face-kg" color={"white"} fontSize="x-large">
                    Token Information
                </Text>
                <form style={{ width: xl ? "100%" : "1200px" }}>
                    <VStack px={lg ? 4 : 12} spacing={25} mt={4}>
                        <HStack w="100%" spacing={lg ? 10 : 12} style={{ flexDirection: lg ? "column" : "row" }}>
                            {displayImg ? (
                                <Image
                                    src={displayImg}
                                    width={lg ? 180 : 235}
                                    height={lg ? 180 : 235}
                                    alt="Image Frame"
                                    style={{ backgroundSize: "cover", borderRadius: 12 }}
                                />
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

                                    <chakra.input
                                        required
                                        style={{ display: "none" }}
                                        type="file"
                                        id="file"
                                        name="file"
                                        onChange={handleFileChange}
                                    />
                                </VStack>
                            )}

                            <VStack spacing={8} flexGrow={1} align="start" width="100%">
                                {lg && <Browse />}

                                <HStack spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "132px" }}>
                                        Name:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            placeholder="Enter Token Name. (Ex. Solana)"
                                            disabled={newLaunchData.current.edit_mode === true}
                                            size={lg ? "md" : "lg"}
                                            maxLength={25}
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            value={name}
                                            onChange={handleNameChange}
                                        />
                                    </div>
                                </HStack>

                                <HStack spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "132px" }}>
                                        Ticker:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            bg="#494949"
                                            placeholder="Enter Token Ticker. (Ex. $SOL)"
                                            disabled={newLaunchData.current.edit_mode === true}
                                            size={lg ? "md" : "lg"}
                                            maxLength={8}
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            value={symbol}
                                            onChange={handleSymbolChange}
                                        />
                                    </div>
                                </HStack>

                                {!simpleLaunch && (
                                    <HStack spacing={0} className={styles.eachField}>
                                        <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "120px" }}>
                                            Token Prefix:
                                        </div>

                                        <div className={styles.textLabelInput}>
                                            <Input
                                                maxLength={3}
                                                disabled={newLaunchData.current.edit_mode === true}
                                                size={lg ? "md" : "lg"}
                                                className={styles.inputBox}
                                                placeholder="Enter Token Prefix Grind (Max 3 Characters) - Optional"
                                                value={tokenStart}
                                                onChange={(e) => {
                                                    setTokenStart(e.target.value);
                                                }}
                                            />
                                        </div>
                                    </HStack>
                                )}

                                {!lg && <Browse />}
                            </VStack>
                        </HStack>

                        <HStack spacing={8} w="100%" style={{ flexDirection: lg ? "column" : "row" }}>
                            <HStack spacing={0} className={styles.eachField}>
                                <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "185px" }}>
                                    Total Supply:
                                </div>

                                <div className={styles.textLabelInput}>
                                    <Input
                                        disabled={newLaunchData.current.edit_mode === true}
                                        size={lg ? "md" : "lg"}
                                        required
                                        className={styles.inputBox}
                                        placeholder="Enter Token Total Supply"
                                        value={totalSupply}
                                        onChange={(e) => {
                                            setTotalSupply(e.target.value);
                                        }}
                                    />
                                </div>
                            </HStack>

                            {!simpleLaunch && (
                                <HStack spacing={lg ? 0 : 30} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "135px" }}>
                                        Decimals:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            disabled={newLaunchData.current.edit_mode === true}
                                            size={lg ? "md" : "lg"}
                                            required
                                            className={styles.inputBox}
                                            placeholder="1-9"
                                            value={decimal}
                                            onChange={(e) => {
                                                setDecimal(e.target.value);
                                            }}
                                        />
                                    </div>
                                </HStack>
                            )}
                        </HStack>

                        {simpleLaunch ? (
                            <HStack spacing={6} className={styles.eachField} mt={3}>
                                <HStack>
                                    <div className={`${styles.textLabel} font-face-kg`}>Rewards Supply</div>
                                    <Image
                                        width={30}
                                        height={30}
                                        src="/images/help.png"
                                        alt="Help"
                                        onClick={openTooltip}
                                        style={{ cursor: "pointer" }}
                                    />
                                    <div className={`${styles.textLabel} font-face-kg`}>:</div>
                                </HStack>
                                <RadioGroup onChange={setRewardsSupply} value={rewardsSupply}>
                                    <Stack direction="row" gap={8}>
                                        <Radio value="none" color="white">
                                            <Text color="white" m={0} className="font-face-rk" fontSize={lg ? "large" : "x-large"}>
                                                None
                                            </Text>
                                        </Radio>

                                        <Radio value="5">
                                            <Tooltip
                                                label="Allocate 5% of the supply to Let's Cook users trading your token."
                                                hasArrow
                                                fontSize="large"
                                                offset={[0, 10]}
                                            >
                                                <Text color="white" m={0} className="font-face-rk" fontSize={lg ? "large" : "x-large"}>
                                                    5%
                                                </Text>
                                            </Tooltip>
                                        </Radio>
                                        <Radio value="10">
                                            <Tooltip
                                                label="Allocate 10% of the supply to Let's Cook users trading your token."
                                                hasArrow
                                                fontSize="large"
                                                offset={[0, 10]}
                                            >
                                                <Text
                                                    align="center"
                                                    color="white"
                                                    m={0}
                                                    className="font-face-rk"
                                                    fontSize={lg ? "large" : "x-large"}
                                                >
                                                    10%
                                                </Text>
                                            </Tooltip>
                                        </Radio>
                                    </Stack>
                                </RadioGroup>
                            </HStack>
                        ) : (
                            <VStack w="100%">
                                <Divider />
                                <VStack spacing={lg ? 8 : 10} w="100%">
                                    <Text className="font-face-kg" color={"white"} fontSize="x-large" mb={0}>
                                        Token Extensions:
                                    </Text>
                                    <HStack spacing={0} className={styles.eachField}>
                                        <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "130px" }}>
                                            Token Program:
                                        </div>
                                        <RadioGroup ml="5" onChange={setTokenProgram} value={tokenProgram}>
                                            <Stack direction="row" gap={5}>
                                                <Radio value="2022" color="white">
                                                    <Tooltip
                                                        label="Uses the new token 2022 program (supports extensions)"
                                                        hasArrow
                                                        fontSize="large"
                                                        offset={[0, 10]}
                                                    >
                                                        <Text color="white" m={0} className="font-face-rk" fontSize={lg ? "medium" : "lg"}>
                                                            Token 2022
                                                        </Text>
                                                    </Tooltip>
                                                </Radio>
                                                <Radio value="classic">
                                                    <Tooltip
                                                        label="Uses the original spl token program (no extension support)."
                                                        hasArrow
                                                        fontSize="large"
                                                        offset={[0, 10]}
                                                    >
                                                        <Text color="white" m={0} className="font-face-rk" fontSize={lg ? "medium" : "lg"}>
                                                            Classic
                                                        </Text>
                                                    </Tooltip>
                                                </Radio>
                                            </Stack>
                                        </RadioGroup>
                                    </HStack>
                                    <HStack spacing={8} w="100%" style={{ flexDirection: lg ? "column" : "row" }}>
                                        <HStack spacing={0} className={styles.eachField}>
                                            <div
                                                className={`${styles.textLabel} font-face-kg`}
                                                style={{ minWidth: lg ? "115px" : "185px" }}
                                            >
                                                Transfer Fee:
                                            </div>

                                            <div className={styles.textLabelInput}>
                                                <Input
                                                    disabled={newLaunchData.current.edit_mode === true || tokenProgram == "classic"}
                                                    size={lg ? "md" : "lg"}
                                                    className={styles.inputBox}
                                                    placeholder="Enter Transfer Fee in bps (Ex. 100 = 1%)"
                                                    value={transferFee}
                                                    onChange={(e) => {
                                                        setTransferFee(e.target.value);
                                                    }}
                                                />
                                            </div>
                                        </HStack>

                                        <HStack spacing={lg ? 0 : 30} className={styles.eachField}>
                                            <div
                                                className={`${styles.textLabel} font-face-kg`}
                                                style={{ minWidth: lg ? "115px" : "135px" }}
                                            >
                                                Max Fee:
                                            </div>

                                            <div className={styles.textLabelInput}>
                                                <Input
                                                    disabled={newLaunchData.current.edit_mode === true || tokenProgram == "classic"}
                                                    size={lg ? "md" : "lg"}
                                                    className={styles.inputBox}
                                                    placeholder="Max number of tokens taxed in a single transaction"
                                                    value={maxTransferFee}
                                                    onChange={(e) => {
                                                        setMaxTransferFee(e.target.value);
                                                    }}
                                                />
                                            </div>
                                        </HStack>
                                    </HStack>
                                    <HStack w="100%" spacing={8} style={{ flexDirection: lg ? "column" : "row" }}>
                                        <HStack spacing={15} className={styles.eachField}>
                                            <div className={`${styles.textLabel} font-face-kg`} style={{ width: lg ? "100px" : "172px" }}>
                                                Permanent Delegate:
                                            </div>

                                            <HStack spacing={0} style={{ flexGrow: 1 }}>
                                                <div className={styles.textLabelInput} style={{ width: "95%", marginRight: "12px" }}>
                                                    <Input
                                                        disabled={
                                                            newLaunchData.current.edit_mode === true ||
                                                            isCustomProgramId ||
                                                            tokenProgram == "classic"
                                                        }
                                                        size={lg ? "md" : "lg"}
                                                        className={styles.inputBox}
                                                        placeholder="Enter Permanent Delegate ID"
                                                        value={permanentDelegate}
                                                        onChange={(e) => {
                                                            setPermanentDelegate(e.target.value);
                                                            setTransferHookID(FEES_PROGRAM.toString());
                                                        }}
                                                    />
                                                </div>
                                                <Tooltip
                                                    label="Will enforce transfer hook to stop delegate transfers from lets cook AMM"
                                                    hasArrow
                                                    fontSize="large"
                                                    offset={[0, 10]}
                                                >
                                                    <Image width={30} height={30} src="/images/help.png" alt="Help" />
                                                </Tooltip>
                                            </HStack>
                                        </HStack>
                                    </HStack>
                                    <HStack w="100%" spacing={8} style={{ flexDirection: lg ? "column" : "row" }}>
                                        <HStack spacing={15} className={styles.eachField}>
                                            <div className={`${styles.textLabel} font-face-kg`} style={{ width: lg ? "135px" : "174px" }}>
                                                Transfer Hook Program ID:
                                            </div>

                                            <HStack spacing={0} style={{ flexGrow: 1 }}>
                                                <div className={styles.textLabelInput} style={{ width: "95%", marginRight: "12px" }}>
                                                    <Input
                                                        disabled={
                                                            newLaunchData.current.edit_mode === true ||
                                                            isCustomProgramId ||
                                                            permanentDelegate !== "" ||
                                                            tokenProgram == "classic"
                                                        }
                                                        size={lg ? "md" : "lg"}
                                                        className={styles.inputBox}
                                                        placeholder="Enter Transfer Hook Program ID"
                                                        value={transferHookID}
                                                        onChange={(e) => {
                                                            setTransferHookID(e.target.value);
                                                            setPermanentDelegate("");
                                                        }}
                                                    />
                                                </div>
                                                <Tooltip
                                                    label="Users must initialize the extra account metadata for the mint themselves"
                                                    hasArrow
                                                    fontSize="large"
                                                    offset={[0, 10]}
                                                >
                                                    <Image width={30} height={30} src="/images/help.png" alt="Help" />
                                                </Tooltip>
                                            </HStack>
                                        </HStack>
                                    </HStack>

                                    <Divider />

                                    <Text mt={-3} className="font-face-kg" color={"white"} fontSize="x-large" mb={0}>
                                        Distribution:
                                    </Text>

                                    <HStack spacing={8} w="100%" justify="space-between" style={{ flexDirection: lg ? "column" : "row" }}>
                                        <HStack spacing={0} className={styles.eachField}>
                                            <div
                                                className={`${styles.textLabel} font-face-kg`}
                                                style={{ minWidth: lg ? "100px" : "185px" }}
                                            >
                                                WINNING TICKETS:
                                            </div>

                                            <div className={styles.textLabelInput}>
                                                <Input
                                                    placeholder={"Enter Total Number of Winning Tickets"}
                                                    disabled={newLaunchData.current.edit_mode === true}
                                                    size={lg ? "md" : "lg"}
                                                    required
                                                    className={styles.inputBox}
                                                    value={mints}
                                                    onChange={(e) => {
                                                        setMints(e.target.value);
                                                    }}
                                                />
                                            </div>
                                        </HStack>

                                        <HStack spacing={lg ? 0 : 8} className={styles.eachField}>
                                            <div
                                                className={`${styles.textLabel} font-face-kg`}
                                                style={{ minWidth: lg ? "100px" : "150px" }}
                                            >
                                                Ticket Price:
                                            </div>

                                            <div style={{ width: "100%" }} className={styles.textLabelInput}>
                                                <Input
                                                    placeholder={"Enter Price Per Ticket"}
                                                    disabled={newLaunchData.current.edit_mode === true}
                                                    size={lg ? "md" : "lg"}
                                                    required
                                                    className={styles.inputBox}
                                                    value={ticketPrice}
                                                    onChange={(e) => {
                                                        setTotalPrice(e.target.value);
                                                    }}
                                                />
                                                <Image className={styles.sol} src="/images/sol.png" height={30} width={30} alt="SOL" />
                                            </div>
                                        </HStack>
                                    </HStack>

                                    <HStack spacing={lg ? 0 : 1} className={styles.eachField}>
                                        <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "120px" }}>
                                            Minimum Liquidity:
                                        </div>

                                        <div className={styles.textLabelInput}>
                                            <Input
                                                size={lg ? "md" : "lg"}
                                                required
                                                className={styles.inputBox}
                                                value={
                                                    !isNaN(parseFloat(mints) * parseFloat(ticketPrice))
                                                        ? parseFloat(mints) * parseFloat(ticketPrice)
                                                        : 0
                                                }
                                                disabled
                                                style={{ cursor: "not-allowed" }}
                                                readOnly
                                            />
                                            <Image className={styles.sol} src="/images/sol.png" height={30} width={30} alt="SOL" />
                                        </div>
                                    </HStack>
                                </VStack>
                                <VStack mt={lg ? 2 : 5} spacing={5} w="100%" align="start">
                                    <HStack
                                        justify="space-between"
                                        align={"center"}
                                        w="100%"
                                        style={{ flexDirection: md ? "column" : "row" }}
                                        spacing={5}
                                    >
                                        <VStack
                                            spacing={5}
                                            align="start"
                                            w={md ? "100%" : "fit-content"}
                                            className={styles.distributionBoxFields}
                                        >
                                            <HStack spacing={5} mt={md ? 0 : 5}>
                                                <Box w={35} h={30} bg={distributionLabels.headers[0].color} />
                                                <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                                                    {distributionLabels.headers[0].title}
                                                </div>
                                            </HStack>

                                            <VStack
                                                pl={md ? 0 : 55}
                                                spacing={5}
                                                align="start"
                                                w={md ? "100%" : "530px"}
                                                className={styles.distributionBoxFields}
                                            >
                                                <HStack spacing={5} align="center" justify="space-between" w="100%">
                                                    <HStack spacing={5}>
                                                        <Box w={35} h={30} bg={distributionLabels.fields[Distribution.Raffle].color} />
                                                        <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                                                            {distributionLabels.fields[Distribution.Raffle].title}
                                                        </div>
                                                    </HStack>
                                                    <div className={styles.distributionField}>
                                                        <Input
                                                            size={"lg"}
                                                            required
                                                            value={distribution[Distribution.Raffle].toFixed(0)}
                                                            onChange={(e) => {
                                                                handleDistributionChange(e, Distribution.Raffle);
                                                            }}
                                                            disabled={
                                                                totalPercentage === 100 && distribution[Distribution.Raffle] === 0
                                                                    ? true
                                                                    : false
                                                            }
                                                        />
                                                        <Image
                                                            className={styles.percentage}
                                                            width={lg ? 15 : 20}
                                                            height={lg ? 15 : 20}
                                                            src="/images/perc.png"
                                                            alt="Percentage"
                                                        />
                                                    </div>
                                                </HStack>

                                                <HStack spacing={5} align="center" justify="space-between" w="100%">
                                                    <HStack spacing={5}>
                                                        <Box w={35} h={30} bg={distributionLabels.fields[Distribution.LP].color} />
                                                        <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                                                            {distributionLabels.fields[Distribution.LP].title}
                                                        </div>
                                                    </HStack>
                                                    <div className={styles.distributionField}>
                                                        <Input
                                                            size="lg"
                                                            required
                                                            value={distribution[Distribution.LP].toFixed(0)}
                                                            onChange={(e) => {
                                                                handleDistributionChange(e, Distribution.LP);
                                                            }}
                                                            disabled={
                                                                totalPercentage === 100 && distribution[Distribution.LP] === 0
                                                                    ? true
                                                                    : false
                                                            }
                                                        />
                                                        <Image
                                                            className={styles.percentage}
                                                            width={lg ? 15 : 20}
                                                            height={lg ? 15 : 20}
                                                            src="/images/perc.png"
                                                            alt="Percentage"
                                                        />
                                                    </div>
                                                </HStack>
                                            </VStack>

                                            <HStack spacing={5} mt={md ? 0 : 5}>
                                                <Box w={35} h={30} bg={distributionLabels.headers[1].color} />
                                                <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                                                    {distributionLabels.headers[1].title}
                                                </div>
                                            </HStack>

                                            <VStack
                                                pl={md ? 0 : 55}
                                                spacing={5}
                                                align="start"
                                                w={md ? "100%" : "530px"}
                                                className={styles.distributionBoxFields}
                                            >
                                                <HStack spacing={5} align="center" justify="space-between" w="100%">
                                                    <HStack spacing={5}>
                                                        <Box w={35} h={30} bg={distributionLabels.fields[Distribution.MMRewards].color} />
                                                        <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                                                            {distributionLabels.fields[Distribution.MMRewards].title}
                                                        </div>
                                                    </HStack>
                                                    <div className={styles.distributionField}>
                                                        <Input
                                                            size="lg"
                                                            required
                                                            value={distribution[Distribution.MMRewards].toFixed(0)}
                                                            onChange={(e) => {
                                                                handleDistributionChange(e, Distribution.MMRewards);
                                                            }}
                                                            disabled={
                                                                totalPercentage === 100 && distribution[Distribution.MMRewards] === 0
                                                                    ? true
                                                                    : false
                                                            }
                                                        />
                                                        <Image
                                                            className={styles.percentage}
                                                            width={lg ? 15 : 20}
                                                            height={lg ? 15 : 20}
                                                            src="/images/perc.png"
                                                            alt="Percentage"
                                                        />
                                                    </div>
                                                </HStack>
                                            </VStack>

                                            <HStack spacing={5} mt={md ? 0 : 5}>
                                                <Box w={35} h={30} bg={distributionLabels.headers[2].color} />
                                                <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                                                    {distributionLabels.headers[2].title}
                                                </div>
                                            </HStack>

                                            <VStack
                                                pl={md ? 0 : 55}
                                                spacing={5}
                                                align="start"
                                                w={md ? "100%" : "530px"}
                                                className={styles.distributionBoxFields}
                                            >
                                                <HStack spacing={5} align="center" justify="space-between" w="100%">
                                                    <HStack spacing={5}>
                                                        <Box w={35} h={30} bg={distributionLabels.fields[Distribution.LPRewards].color} />
                                                        <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                                                            {distributionLabels.fields[Distribution.LPRewards].title}
                                                        </div>
                                                    </HStack>
                                                    <div className={styles.distributionField}>
                                                        <Input
                                                            size="lg"
                                                            value={distribution[Distribution.LPRewards].toFixed(0)}
                                                            onChange={(e) => {
                                                                handleDistributionChange(e, Distribution.LPRewards);
                                                            }}
                                                            disabled={
                                                                totalPercentage === 100 && distribution[Distribution.LPRewards] === 0
                                                                    ? true
                                                                    : false
                                                            }
                                                        />
                                                        <Image
                                                            className={styles.percentage}
                                                            width={lg ? 15 : 20}
                                                            height={lg ? 15 : 20}
                                                            src="/images/perc.png"
                                                            alt="Percentage"
                                                        />
                                                    </div>
                                                </HStack>

                                                <HStack spacing={5} align="center" justify="space-between" w="100%">
                                                    <HStack spacing={5}>
                                                        <Box w={35} h={30} bg={distributionLabels.fields[Distribution.Team].color} />
                                                        <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                                                            {distributionLabels.fields[Distribution.Team].title}
                                                        </div>
                                                    </HStack>
                                                    <div className={styles.distributionField}>
                                                        <Input
                                                            size="lg"
                                                            value={distribution[Distribution.Team].toFixed(0)}
                                                            onChange={(e) => {
                                                                handleDistributionChange(e, Distribution.Team);
                                                            }}
                                                            disabled={
                                                                totalPercentage === 100 && distribution[Distribution.Team] === 0
                                                                    ? true
                                                                    : false
                                                            }
                                                        />
                                                        <Image
                                                            className={styles.percentage}
                                                            width={lg ? 15 : 20}
                                                            height={lg ? 15 : 20}
                                                            src="/images/perc.png"
                                                            alt="Percentage"
                                                        />
                                                    </div>
                                                </HStack>

                                                <HStack spacing={5} align="center" justify="space-between" w="100%">
                                                    <HStack spacing={5}>
                                                        <Box w={35} h={30} bg={distributionLabels.fields[Distribution.Airdrops].color} />
                                                        <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                                                            {distributionLabels.fields[Distribution.Airdrops].title}
                                                        </div>
                                                    </HStack>
                                                    <div className={styles.distributionField}>
                                                        <Input
                                                            size="lg"
                                                            value={distribution[Distribution.Airdrops].toFixed(0)}
                                                            onChange={(e) => {
                                                                handleDistributionChange(e, Distribution.Airdrops);
                                                            }}
                                                            disabled={
                                                                totalPercentage === 100 && distribution[Distribution.Airdrops] === 0
                                                                    ? true
                                                                    : false
                                                            }
                                                        />
                                                        <Image
                                                            className={styles.percentage}
                                                            width={lg ? 15 : 20}
                                                            height={lg ? 15 : 20}
                                                            src="/images/perc.png"
                                                            alt="Percentage"
                                                        />
                                                    </div>
                                                </HStack>

                                                <HStack spacing={5} align="center" justify="space-between" w="100%">
                                                    <HStack spacing={5}>
                                                        <Box w={35} h={30} bg={distributionLabels.fields[6].color} />
                                                        <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                                                            {distributionLabels.fields[6].title}
                                                        </div>
                                                    </HStack>

                                                    <div className={styles.distributionField} style={{ marginLeft: "15px" }}>
                                                        <Input
                                                            size="lg"
                                                            value={distribution[Distribution.Other].toFixed(0)}
                                                            onChange={(e) => {
                                                                handleDistributionChange(e, Distribution.Other);
                                                            }}
                                                            disabled={
                                                                totalPercentage === 100 && distribution[Distribution.Other] === 0
                                                                    ? true
                                                                    : false
                                                            }
                                                        />
                                                        <Image
                                                            className={styles.percentage}
                                                            width={lg ? 15 : 20}
                                                            height={lg ? 15 : 20}
                                                            src="/images/perc.png"
                                                            alt="Percentage"
                                                        />
                                                    </div>
                                                </HStack>
                                            </VStack>
                                        </VStack>

                                        <VStack
                                            spacing={6}
                                            flexGrow={1}
                                            justify="center"
                                            align="center"
                                            py={8}
                                            h="fit-content"
                                            style={{ position: "relative" }}
                                        >
                                            <PieChart
                                                animate={true}
                                                totalValue={100}
                                                data={[
                                                    {
                                                        title: "Raffle (SOL)",
                                                        value: distribution[Distribution.Raffle],
                                                        color: "#FF6651",
                                                    },
                                                    { title: "$TOKEN", value: distribution[Distribution.LP], color: "#FF9548" },

                                                    {
                                                        title: "Market Maker Rewards",
                                                        value: distribution[Distribution.MMRewards],
                                                        color: "#66FFB6",
                                                    }, // integrate MM Rewards
                                                    {
                                                        title: "Liquidity Provider Rewards",
                                                        value: distribution[Distribution.LPRewards],
                                                        color: "#61efff",
                                                    },
                                                    {
                                                        title: "Airdrops / Marketing",
                                                        value: distribution[Distribution.Airdrops],
                                                        color: "#988FFF",
                                                    },
                                                    { title: "Team", value: distribution[Distribution.Team], color: "#8CB3FF" },
                                                    { title: "Others", value: distribution[Distribution.Other], color: "#FD98FE" },
                                                    { title: "Blank", value: 100 - totalPercentage, color: "transparent" },
                                                ]}
                                                style={{ width: md ? "100%" : "380px", position: "relative", zIndex: 2 }}
                                            />

                                            <PieChart
                                                animate={true}
                                                totalValue={100}
                                                data={[
                                                    {
                                                        title: distributionLabels.headers[0].title,
                                                        value: distribution[Distribution.Raffle] + distribution[Distribution.LP],
                                                        color: distributionLabels.headers[0].color,
                                                    },
                                                    {
                                                        title: distributionLabels.headers[1].title,
                                                        // integrate MM Rewards here
                                                        value: distribution[Distribution.MMRewards],
                                                        color: distributionLabels.headers[1].color,
                                                    },
                                                    {
                                                        title: distributionLabels.headers[2].title,
                                                        value:
                                                            distribution[Distribution.LPRewards] +
                                                            distribution[Distribution.Team] +
                                                            distribution[Distribution.Airdrops] +
                                                            distribution[Distribution.Other],
                                                        color: distributionLabels.headers[2].color,
                                                    },
                                                ]}
                                                style={{ width: md ? "120%" : "440px", position: "absolute", zIndex: 1 }}
                                            />
                                        </VStack>
                                    </HStack>
                                </VStack>
                            </VStack>
                        )}

                        <HStack mt={md ? 0 : 30}>
                            <button type="button" className={`${styles.nextBtn} font-face-kg `} onClick={() => router.push("/dashboard")}>
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={(e) => {
                                    if (!isLoading) {
                                        nextPage(e);
                                    }
                                }}
                                className={`${styles.nextBtn} font-face-kg`}
                                style={{ cursor: isLoading ? "not-allowed" : "pointer", width: "175px" }}
                            >
                                {isLoading ? <Spinner /> : `NEXT (1/${simpleLaunch ? "2" : "3"})`}
                            </button>
                        </HStack>
                    </VStack>
                </form>
            </VStack>

            <TooltipModal isTooltipOpened={isTooltipOpened} closeTooltip={closeTooltip} />
        </Center>
    );
};

interface TooltipProps {
    isTooltipOpened?: boolean;
    closeTooltip?: () => void;
}

export function TooltipModal({ isTooltipOpened, closeTooltip }: TooltipProps) {
    const { sm } = useResponsive();

    return (
        <>
            <Modal size="md" isCentered isOpen={isTooltipOpened} onClose={closeTooltip} motionPreset="slideInBottom">
                <ModalOverlay />

                <ModalContent h={585} w={450} style={{ background: "transparent" }}>
                    <ModalBody bg="url(/images/terms-container.png)" bgSize={"contain"} bgRepeat={"no-repeat"} p={sm ? 10 : 14}>
                        <VStack gap={4} h="100%" position="relative" align="start" fontFamily="ReemKufiRegular">
                            <Text
                                m="0 auto"
                                align="center"
                                fontSize={"large"}
                                style={{
                                    fontFamily: "KGSummerSunshineBlackout",
                                    color: "white",
                                    fontWeight: "semibold",
                                }}
                            >
                                Market Rewards System
                            </Text>
                            <Text fontSize={sm ? "md" : "lg"} color="white" m={0}>
                                Support post-launch volume by allocating 5% or 10% of the supply to Let’s Cook users trading your token.
                            </Text>
                            <VStack m="0 auto">
                                <Image
                                    src="/images/rewards-chart.png"
                                    width={250}
                                    height={250}
                                    alt="Rewards Chart"
                                    style={{ backgroundColor: "white", borderRadius: "8px", padding: "12px" }}
                                />
                            </VStack>
                            <Text fontSize={sm ? "md" : "lg"} color="white" m={0}>
                                Rewards are calculated and distributed at the end of each day based on users’ trading volumes.
                            </Text>
                            <Text fontSize={sm ? "md" : "lg"} color="white" m={0} align="start">
                                Reward pools last for a period of 30 days.
                            </Text>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}

export default TokenPage;
