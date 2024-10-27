import { useRef, useState } from "react";
import { Center, VStack, Text, HStack, Input, chakra, Spinner } from "@chakra-ui/react";
import { Keypair } from "@solana/web3.js";
import { defaultUserInput, getLaunchType, getLaunchTypeIndex, LaunchDataUserInput } from "../Solana/state";
import Image from "next/image";
import styles from "../../styles/Launch.module.css";
import useResponsive from "../../hooks/useResponsive";
import useAppRoot from "../../context/useAppRoot";
import { toast } from "react-toastify";
import getImageDimensions from "../../utils/getImageDimension";
import { Config } from "../Solana/constants";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import useInstantLaunch from "../../hooks/launch/useInstantLaunch";
import stylesDescription from "../../styles/LaunchDetails.module.css";

const LaunchPage = () => {
    const { sm, md, lg, xl } = useResponsive();
    const [isLoading, setIsLoading] = useState(false);

    const instantLaunchData = useRef<LaunchDataUserInput>({ ...defaultUserInput });
    const { newLaunchData } = useAppRoot();

    const [name, setName] = useState<string>(instantLaunchData.current.name);
    const [symbol, setSymbol] = useState<string>(instantLaunchData.current.symbol);
    const [displayImg, setDisplayImg] = useState<string>(instantLaunchData.current.displayImg);

    const [description, setDescription] = useState<string>(instantLaunchData.current.description);

    const [web, setWeb] = useState<string>(instantLaunchData.current.web_url);
    const [telegram, setTelegram] = useState<string>(instantLaunchData.current.tele_url);
    const [twitter, setTwitter] = useState(instantLaunchData.current.twt_url);
    const [discord, setDiscord] = useState(instantLaunchData.current.disc_url);

    const { CreateInstantLaunch } = useInstantLaunch();

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
                    instantLaunchData.current.icon_file = file;
                    setDisplayImg(URL.createObjectURL(e.target.files[0]));
                } else {
                    toast.error("Please upload an image with equal width and height.");
                }
            } else {
                toast.error("File size exceeds 1MB limit.");
            }
        }
    };

    async function setData(e): Promise<boolean> {
        e.preventDefault();

        if (instantLaunchData.current.icon_file === null) {
            toast.error("Please select an icon image.");
            return false;
        }

        if (symbol.length == 0) {
            toast.error("ymbol length must be > 0 characters");
            return false;
        }

        if (symbol.length > 10) {
            toast.error("Maximum symbol length is 10 characters");
            return false;
        }

        if (name.length == 0) {
            toast.error("Name must be > 0 characters");
            return false;
        }

        if (name.length > 25) {
            toast.error("Maximum name length is 25 characters");
            return false;
        }

        if (description.length > 250) {
            toast.error("Description should be less than 250 characters long");
            return false;
        }

        instantLaunchData.current.token_keypair = Keypair.generate();

        instantLaunchData.current.name = name;
        instantLaunchData.current.symbol = symbol;
        instantLaunchData.current.displayImg = displayImg;

        instantLaunchData.current.description = description;

        instantLaunchData.current.web_url = web;
        instantLaunchData.current.twt_url = twitter;
        instantLaunchData.current.disc_url = discord;
        instantLaunchData.current.tele_url = telegram;

        instantLaunchData.current.launch_type = 3;

        // we also set a bunch of other things
        instantLaunchData.current.amm_fee = 25;
        instantLaunchData.current.amm_provider = 0;
        instantLaunchData.current.team_wallet = Config.COOK_FEES.toString();

        instantLaunchData.current.token_program = TOKEN_2022_PROGRAM_ID;
        instantLaunchData.current.decimals = 6;
        instantLaunchData.current.total_supply = 1e9;

        instantLaunchData.current.transfer_fee = 0;
        instantLaunchData.current.max_transfer_fee = 0;

        instantLaunchData.current.permanent_delegate = null;
        instantLaunchData.current.transfer_hook_program = null;

        instantLaunchData.current.distribution = [50, 50, 0, 0, 0, 0, 0];

        newLaunchData.current = { ...instantLaunchData.current };

        return true;
    }

    async function submit(e) {
        console.log("in submit");
        let success = await setData(e);
        if (success) CreateInstantLaunch();
    }

    const Browse = () => (
        <HStack spacing={0} className={styles.eachField}>
            <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "132px" }}>
                IMAGE:
            </div>
            <div>
                <label className={styles.label}>
                    <input id="file" type="file" onChange={handleFileChange} />
                    <span
                        className={styles.browse}
                        style={{ cursor: instantLaunchData.current.edit_mode === true ? "not-allowed" : "pointer", padding: "5px 10px" }}
                    >
                        BROWSE
                    </span>
                </label>
            </div>
            <Text m={0} ml={5} className="font-face-rk" fontSize={lg ? "medium" : "lg"}>
                {instantLaunchData.current.icon_file !== null
                    ? instantLaunchData.current.icon_file.name
                    : "No File Selected (Size Limit: 1MB)"}
            </Text>
        </HStack>
    );

    return (
        <Center height="100%" width="100%">
            <VStack height="100%" w="100%" style={{ paddingBottom: md ? 35 : "75px" }}>
                <Text align="start" className="font-extrabold font-face-kg" color={"white"} fontSize="x-large">
                    QUICK LAUNCH
                </Text>
                <form style={{ width: xl ? "100%" : "1200px" }} className="mt-4 rounded-md bg-[#303030] pt-4">
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
                                            disabled={instantLaunchData.current.edit_mode === true}
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
                                        SYMBOL:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            bg="#494949"
                                            placeholder="Enter Token Ticker. (Ex. $SOL)"
                                            disabled={instantLaunchData.current.edit_mode === true}
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

                                {!lg && <Browse />}
                            </VStack>
                        </HStack>
                        <VStack w="100%" spacing={30} my={18}>
                            <div className={stylesDescription.launchBodyLowerVertical}>
                                <div className={`${stylesDescription.textLabel} font-face-kg`} style={{ minWidth: "175px" }}>
                                    DESCRIPTION:
                                </div>
                                <div>
                                    <textarea
                                        maxLength={250}
                                        required
                                        placeholder="Feel free to provide more details about your token, it will be displayed in your token metadata."
                                        style={{ minHeight: 200, fontSize: lg ? "medium" : "large" }}
                                        className={`${stylesDescription.inputBox} ${stylesDescription.inputTxtarea}`}
                                        value={description}
                                        onChange={(e) => {
                                            setDescription(e.target.value);
                                        }}
                                    />
                                </div>
                            </div>

                            <div className={styles.launchBodyLowerHorizontal}>
                                <div className={styles.eachField}>
                                    <Image width={40} height={40} src="/images/web.png" alt="Website Logo" />
                                    <div className={styles.textLabelInput}>
                                        <input
                                            placeholder="Enter your Website URL (optional)"
                                            className={styles.inputBox}
                                            style={{ fontSize: lg ? "medium" : "large" }}
                                            type="text"
                                            value={web}
                                            onChange={(e) => {
                                                setWeb(e.target.value);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.launchBodyLowerHorizontal}>
                                <div className={styles.eachField}>
                                    <Image width={40} height={40} src="/images/tele.png" alt="Telegram" />

                                    <div className={styles.textLabelInput}>
                                        <input
                                            className={styles.inputBox}
                                            placeholder="Enter your Telegram Invite URL (optional)"
                                            style={{ fontSize: lg ? "medium" : "large" }}
                                            type="text"
                                            value={telegram}
                                            onChange={(e) => {
                                                setTelegram(e.target.value);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className={styles.launchBodyLowerHorizontal}>
                                <div className={styles.eachField}>
                                    <Image width={40} height={40} src="/images/twt.png" alt="Twitter" />

                                    <div className={styles.textLabelInput}>
                                        <input
                                            required
                                            className={styles.inputBox}
                                            placeholder="Enter your Twitter URL (optional)"
                                            style={{ fontSize: lg ? "medium" : "large" }}
                                            type="text"
                                            value={twitter}
                                            onChange={(e) => {
                                                setTwitter(e.target.value);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.launchBodyLowerHorizontal}>
                                <div className={styles.eachField}>
                                    <Image width={40} height={40} src="/images/discord.png" alt="Discord" />

                                    <div className={styles.textLabelInput}>
                                        <input
                                            className={styles.inputBox}
                                            placeholder="Enter your Discord Invite URL (optional)"
                                            style={{ fontSize: lg ? "medium" : "large" }}
                                            type="text"
                                            value={discord}
                                            onChange={(e) => {
                                                setDiscord(e.target.value);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </VStack>

                        <HStack mb={30}>
                            <button
                                type="button"
                                onClick={(e) => {
                                    submit(e);
                                }}
                                className={`${styles.nextBtn} font-face-kg`}
                                style={{ cursor: isLoading ? "not-allowed" : "pointer", width: "175px" }}
                            >
                                {isLoading ? <Spinner /> : `LAUNCH`}
                            </button>
                        </HStack>
                    </VStack>
                </form>
            </VStack>
        </Center>
    );
};

export default LaunchPage;
