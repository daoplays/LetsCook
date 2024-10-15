import {useState} from "react";
import {
    Center,
    VStack,
    Text,
    HStack,
    Input,
    chakra,
    Spinner,
} from "@chakra-ui/react";
import { Keypair } from "@solana/web3.js";
import {
    getLaunchType,
    getLaunchTypeIndex,
} from "../../components/Solana/state";
import Image from "next/image";
import styles from "../../styles/Launch.module.css";
import useResponsive from "../../hooks/useResponsive";
import useAppRoot from "../../context/useAppRoot";
import { toast } from "react-toastify";
import getImageDimensions from "../../utils/getImageDimension";

const LaunchPage = () => {
    const { sm, md, lg, xl } = useResponsive();
    const { newLaunchData } = useAppRoot();
    const [isLoading, setIsLoading] = useState(false);

    const [name, setName] = useState<string>(newLaunchData.current.name);
    const [symbol, setSymbol] = useState<string>(newLaunchData.current.symbol);
    const [displayImg, setDisplayImg] = useState<string>(newLaunchData.current.displayImg);
    const [launch_type, setLaunchType] = useState<string>(getLaunchType(newLaunchData.current.launch_type));

    const [web, setWeb] = useState<string>(newLaunchData.current.web_url);
    const [telegram, setTelegram] = useState<string>(newLaunchData.current.tele_url);
    const [twitter, setTwitter] = useState(newLaunchData.current.twt_url);
    const [discord, setDiscord] = useState(newLaunchData.current.disc_url);


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



    async function setData(e): Promise<boolean> {
        e.preventDefault();

        if (newLaunchData.current.icon_file === null) {
            toast.error("Please select an icon image.");
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


        newLaunchData.current.token_keypair = Keypair.generate();

        newLaunchData.current.name = name;
        newLaunchData.current.symbol = symbol;
        newLaunchData.current.displayImg = displayImg;

        newLaunchData.current.web_url = web;
        newLaunchData.current.twt_url = twitter;
        newLaunchData.current.disc_url = discord;
        newLaunchData.current.tele_url = telegram;

        newLaunchData.current.launch_type = getLaunchTypeIndex(launch_type);
        return true;
    }


    async function nextPage(e) {
        console.log("in next page");
        await setData(e);
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
                    QUICK LAUNCH
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
                                        SYMBOL:
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


                                {!lg && <Browse />}
                            </VStack>
                        </HStack>
                        <VStack w="100%" spacing={30} mt={42} mb={25}>
                            <div className={styles.launchBodyLowerHorizontal}>
                                <div className={styles.eachField}>
                                    <Image width={40} height={40} src="/images/web.png" alt="Website Logo" />
                                    <div className={styles.textLabelInput}>
                                        <input
                                            placeholder="Enter your Website URL (optional)"
                                            className={styles.inputBox}
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

                        <HStack mt={md ? 0 : 30}>
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
