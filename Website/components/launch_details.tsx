import { Dispatch, SetStateAction, MutableRefObject, useState, MouseEventHandler } from "react";
import styles from "../styles/LaunchDetails.module.css";
import { useMediaQuery } from "react-responsive";

import { Center, VStack, Text } from "@chakra-ui/react";

import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE, Screen } from "./Solana/constants";
import { LaunchDataUserInput } from "./Solana/state";
import Image from "next/image";

export function LaunchDetails({
    newLaunch,
    setScreen,
}: {
    newLaunch: MutableRefObject<LaunchDataUserInput>;
    setScreen: Dispatch<SetStateAction<Screen>>;
}) {
    const [name, setName] = useState<string>(newLaunch.current.pagename);
    const [icon, setIcon] = useState<string>(newLaunch.current.iconpage2);
    const [description, setDescription] = useState<string>(newLaunch.current.description);
    const [web, setWeb] = useState<string>(newLaunch.current.web_url);
    const [telegram, setTelegram] = useState<string>(newLaunch.current.tele_url);
    const [twitter, setTwitter] = useState(newLaunch.current.twt_url);
    const [discord, setDiscord] = useState(newLaunch.current.disc_url);

    const isDesktopOrLaptop = useMediaQuery({
        query: "(max-width: 1000px)",
    });

    const handleNameChange = (e) => {
        setName(e.target.value);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];

        if (file) {
            if (file.size <= 4194304) {
                const reader = new FileReader();

                reader.readAsDataURL(file);

                reader.onload = () => {
                    console.log("called: ", reader);
                    setIcon(reader.result.toString().replace("data:", "").replace(/^.+,/, ""));
                };
            } else {
                alert("File size exceeds 4MB limit.");
            }
        }
    };

    const [images, setImages] = useState([]);
    const maxNumber = 1000;

    const onChange = (imageList, addUpdateIndex) => {
        // data for submit
        console.log(imageList, addUpdateIndex);
        setImages(imageList);
    };

    function setLaunchData(e) {
        newLaunch.current.pagename = name;
        newLaunch.current.iconpage2 = icon;
        newLaunch.current.description = description;
        newLaunch.current.web_url = web;
        newLaunch.current.twt_url = twitter;
        newLaunch.current.disc_url = discord;
        newLaunch.current.tele_url = telegram;
        setScreen(Screen.LAUNCH_BOOK);
    }
    function setLaunchDataPrevious(e) {
        newLaunch.current.pagename = name;
        newLaunch.current.description = description;
        newLaunch.current.web_url = web;
        newLaunch.current.twt_url = twitter;
        newLaunch.current.disc_url = discord;
        newLaunch.current.tele_url = telegram;
        setScreen(Screen.LAUNCH_SCREEN);
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
                    Launch - Page
                </Text>
                <form onSubmit={setLaunchData} className={styles.launchBody}>
                    <div className={styles.launchBodyUpper}>
                        <div className={styles.launchBodyUpperFields}>
                            <div className={styles.eachField}>
                                <div className={`${styles.textLabel} font-face-kg`}>Page Name:</div>

                                <input
                                    required
                                    placeholder="/"
                                    className={styles.inputBox}
                                    type="text"
                                    value={name}
                                    onChange={handleNameChange}
                                />
                            </div>

                            <div className={styles.eachField}>
                                <div className={`${styles.textLabel} font-face-kg`}>Banner:</div>

                                <div>
                                    <label className={styles.label}>
                                        <input id="file" type="file" onChange={handleFileChange} />
                                        <span className={styles.browse}>BROWSE</span>
                                    </label>
                                </div>
                                <div className={styles.textLabelInput}>
                                    <input
                                        className={`${styles.inputBox} font-face-kg `}
                                        type="text"
                                        value={icon ? "File Selected" : "No File Selected"}
                                        disabled
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.launchBodyLower}>
                        <div className={styles.launchBodyLowerVertical}>
                            <div className={`${styles.textLabel} font-face-kg`}>DESCRIPTION:</div>
                            <div>
                                <textarea
                                    required
                                    style={{ minHeight: 200 }}
                                    className={`${styles.inputBox} ${styles.inputTxtarea}`}
                                    value={description}
                                    onChange={(e) => {
                                        setDescription(e.target.value);
                                    }}
                                />
                            </div>
                        </div>

                        <div className={styles.launchBodyLowerHorizontal}>
                            <div className={styles.eachField}>
                                <Image className={styles.mediaLogo} src="/images/web.png" alt="Website" />

                                <div className={styles.textLabelInput}>
                                    <input
                                        placeholder="URL"
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
                                <Image className={styles.mediaLogo} src="/images/tele.png" alt="Telegram" />

                                <div className={styles.textLabelInput}>
                                    <input
                                        className={styles.inputBox}
                                        placeholder="URL"
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
                                <Image className={styles.mediaLogo} src="/images/twt.png" alt="Twitter" />

                                <div className={styles.textLabelInput}>
                                    <input
                                        required
                                        className={styles.inputBox}
                                        placeholder="URL"
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
                                <Image className={styles.mediaLogo} src="/images/discord.png" alt="Discord" />

                                <div className={styles.textLabelInput}>
                                    <input
                                        className={styles.inputBox}
                                        placeholder="URL"
                                        type="text"
                                        value={discord}
                                        onChange={(e) => {
                                            setDiscord(e.target.value);
                                        }}
                                    />
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
                        <button
                            // type="submit"
                            onClick={() => {
                                setScreen(Screen.LAUNCH_SCREEN);
                            }}
                            className={`${styles.nextBtn} font-face-kg `}
                        >
                            PREVIOUS
                        </button>
                        <button type="submit" className={`${styles.nextBtn} font-face-kg `}>
                            NEXT
                        </button>
                    </div>
                </form>
            </VStack>
        </Center>
    );
}
