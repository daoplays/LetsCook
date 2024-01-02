import { Dispatch, SetStateAction, MutableRefObject, useState, MouseEventHandler, useRef } from "react";
import styles from "../../styles/LaunchDetails.module.css";
import { useMediaQuery } from "react-responsive";

import { Center, VStack, Text } from "@chakra-ui/react";

import Image from "next/image";
import { DEFAULT_FONT_SIZE } from "../../components/Solana/constants";
import { LaunchDataUserInput, defaultUserInput } from "../../components/Solana/state";

interface DetailsPageProps {
    newLaunchData: MutableRefObject<LaunchDataUserInput>;
    setScreen: Dispatch<SetStateAction<string>>;
}

const DetailsPage = ({ newLaunchData, setScreen }: DetailsPageProps) => {
    const [name, setName] = useState<string>(newLaunchData.current.pagename);
    const [icon, setIcon] = useState<string>(newLaunchData.current.iconpage2);
    const [description, setDescription] = useState<string>(newLaunchData.current.description);
    const [web, setWeb] = useState<string>(newLaunchData.current.web_url);
    const [telegram, setTelegram] = useState<string>(newLaunchData.current.tele_url);
    const [twitter, setTwitter] = useState(newLaunchData.current.twt_url);
    const [discord, setDiscord] = useState(newLaunchData.current.disc_url);

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
        newLaunchData.current.pagename = name;
        newLaunchData.current.iconpage2 = icon;
        newLaunchData.current.description = description;
        newLaunchData.current.web_url = web;
        newLaunchData.current.twt_url = twitter;
        newLaunchData.current.disc_url = discord;
        newLaunchData.current.tele_url = telegram;
        setScreen("book");
    }
    function setLaunchDataPrevious(e) {
        newLaunchData.current.pagename = name;
        newLaunchData.current.description = description;
        newLaunchData.current.web_url = web;
        newLaunchData.current.twt_url = twitter;
        newLaunchData.current.disc_url = discord;
        newLaunchData.current.tele_url = telegram;
        setScreen("details");
    }
    return (
        <Center style={{ background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)" }} pt="20px" width="100%">
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
                                <img className={styles.mediaLogo} src="./images/web.png" alt="" />
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
                                <img className={styles.mediaLogo} src="/images/tele.png" alt="Telegram" />

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
                                <img className={styles.mediaLogo} src="/images/twt.png" alt="Twitter" />

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
                                <img className={styles.mediaLogo} src="/images/discord.png" alt="Discord" />

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

                    {/* <div>
                        <button className={`${styles.nextBtn} font-face-kg `}>PREVIEW</button>
                    </div> */}
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
                                setScreen("token");
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
};

export default DetailsPage;
