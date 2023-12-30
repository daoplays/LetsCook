import { Dispatch, SetStateAction, MutableRefObject, useState, MouseEventHandler } from "react";
import styles from "../styles/LaunchBook.module.css";
import TimePicker from "react-time-picker";
import { Center, VStack, Text } from "@chakra-ui/react";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE, Screen } from "./Solana/constants";
import { LaunchDataUserInput } from "./Solana/state";
import { useMediaQuery } from "react-responsive";
import Image from "next/image";

export function LaunchBook({
    newLaunch,
    ListGameOnArena,
    setScreen,
}: {
    newLaunch: MutableRefObject<LaunchDataUserInput>;
    ListGameOnArena: MouseEventHandler<HTMLParagraphElement>;
    setScreen: Dispatch<SetStateAction<Screen>>;
}) {
    const [openDate, setOpenDate] = useState<Date>(newLaunch.current.opendate);
    const [closeDate, setcloseDate] = useState<Date>(newLaunch.current.closedate);

    const [wallet, setWallet] = useState<string>(newLaunch.current.team_wallet);

    const isDesktopOrLaptop = useMediaQuery({
        query: "(max-width: 1000px)",
    });
    function setLaunchData(e) {
        newLaunch.current.opendate = openDate;
        newLaunch.current.closedate = closeDate;
        newLaunch.current.team_wallet = wallet;
        setScreen(Screen.LAUNCH_DETAILS);
    }
    function confirm(e) {
        e.preventDefault();
        if (closeDate && openDate && wallet) {
            ListGameOnArena(e);
        } else {
            alert("Please fill all the details on this page.");
        }
    }
    return (
        <Center style={{ background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)" }} pt="20px" width="100%">
            <Image
                onClick={() => setScreen(Screen.FAQ_SCREEN)}
                className={styles.help}
                width={40}
                height={40}
                src="/images/help.png"
                alt="Help"
            />

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
                                            value={wallet}
                                            onChange={(e) => {
                                                setWallet(e.target.value);
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
}
