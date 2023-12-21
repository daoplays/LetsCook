import { Dispatch, SetStateAction, MutableRefObject, useState, MouseEventHandler } from "react";
import { PieChart } from "react-minimal-pie-chart";
import styles from "../styles/LaunchBook.module.css";
import ImageUploading from "react-images-uploading";
import { Center, VStack, Text, Box, HStack, FormControl, Input, NumberInput, NumberInputField } from "@chakra-ui/react";

import DatePicker from "react-datepicker";

import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE, Screen } from "./Solana/constants";
import { LaunchDataUserInput } from "./Solana/state";

export function LaunchBook({
    newLaunch,
    ListGameOnArena,
    setScreen,
}: {
    newLaunch: MutableRefObject<LaunchDataUserInput>;
    ListGameOnArena: MouseEventHandler<HTMLParagraphElement>;
    setScreen: Dispatch<SetStateAction<Screen>>;
}) {
    const [openDate, setOpenDate] = useState<string>("");
    const [openTime, setOpenTime] = useState<string>("");
    const [closeDate, setcloseDate] = useState<string>("");
    const [closeTime, setcloseTime] = useState<string>("");
    const [openDateLP, setOpenDateLP] = useState<string>("");
    const [openTimeLP, setOpenTimeLP] = useState<string>("");

    const [launch_date, setLaunchDate] = useState<Date | null>(null);
    const [icon, setIcon] = useState<string>(null);
    const [totalSupply, setTotalSupply] = useState("");
    const [decimal, setDecimal] = useState("");
    const [mints, setMints] = useState("");
    const [totalPrice, setTotalPrice] = useState("");
    const [liquidity, setLiquidity] = useState("");

    const handleNameChange = (e) => {
        setName(e.target.value);
    };
    const handleSymbolChange = (e) => {
        setSymbol(e.target.value);
    };

    const handleLaunchDateChange = (e) => {
        setLaunchDate(e);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const reader = new FileReader();

            reader.readAsDataURL(e.target.files[0]);

            reader.onload = () => {
                console.log("called: ", reader);
                setIcon(reader.result.toString().replace("data:", "").replace(/^.+,/, ""));
            };
        }
    };

    const [images, setImages] = useState([]);
    const maxNumber = 1000;

    const onChange = (imageList, addUpdateIndex) => {
        // data for submit
        console.log(imageList, addUpdateIndex);
        setImages(imageList);
    };

    return (
        <Center style={{ background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)" }} pt="20px" width="100%">
            <img onClick={() => setScreen(Screen.FAQ_SCREEN)} className={styles.help} src="./images/help.png" alt="" />

            <VStack>
                <Text color="white" className="font-face-kg" textAlign={"center"} fontSize={DEFAULT_FONT_SIZE}>
                    Launch - BOOK
                </Text>
                <div className={styles.launchBody}>
                    <div className={styles.launchBodyUpper}>
                        <div className={styles.launchBodyUpperFields}>
                            <div className={`${styles.textLabel} font-face-kg`}>TOKEN RAFFLE</div>
                            <div className={styles.launchBodyLowerHorizontal}>
                                <div className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`}>OPEN DATE:</div>

                                    <div className={styles.textLabelInput}>
                                        <input
                                            className={styles.inputBox}
                                            type="text"
                                            value={mints}
                                            onChange={(e) => {
                                                setMints(e.target.value);
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`}>OPEN TIME:</div>

                                    <div className={styles.textLabelInput}>
                                        <input
                                            className={styles.inputBox}
                                            type="text"
                                            value={totalPrice}
                                            onChange={(e) => {
                                                setTotalPrice(e.target.value);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.launchBodyLowerHorizontal}>
                                <div className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`}>CLOSE DATE:</div>

                                    <div className={styles.textLabelInput}>
                                        <input
                                            className={styles.inputBox}
                                            type="text"
                                            value={mints}
                                            onChange={(e) => {
                                                setMints(e.target.value);
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`}>CLOSE TIME:</div>

                                    <div className={styles.textLabelInput}>
                                        <input
                                            className={styles.inputBox}
                                            type="text"
                                            value={totalPrice}
                                            onChange={(e) => {
                                                setTotalPrice(e.target.value);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={`${styles.textLabel} font-face-kg`}>LIQUIDITY POOL</div>
                            <div className={styles.launchBodyLowerHorizontal}>
                                <div className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`}>OPEN DATE:</div>

                                    <div className={styles.textLabelInput}>
                                        <input
                                            className={styles.inputBox}
                                            type="text"
                                            value={mints}
                                            onChange={(e) => {
                                                setMints(e.target.value);
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`}>OPEN TIME:</div>

                                    <div className={styles.textLabelInput}>
                                        <input
                                            className={styles.inputBox}
                                            type="text"
                                            value={totalPrice}
                                            onChange={(e) => {
                                                setTotalPrice(e.target.value);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.launchBodyLowerHorizontal}>
                                <div className={styles.eachFieldLong}>
                                    <div style={{ width: "20%" }} className={`${styles.textLabel} font-face-kg`}>
                                        TEAM WALLET:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <input
                                            className={styles.inputBox}
                                            type="text"
                                            value={liquidity}
                                            onChange={(e) => {
                                                setLiquidity(e.target.value);
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
                        <button onClick={() => setScreen(Screen.LAUNCH_DETAILS)} className={`${styles.nextBtn} font-face-kg `}>
                            PREVIOUS
                        </button>
                        <button className={`${styles.nextBtn} font-face-kg `}>CONFIRM</button>
                    </div>
                </div>
            </VStack>
        </Center>
    );
}
