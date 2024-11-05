import { Dispatch, SetStateAction, MutableRefObject, useState, useEffect } from "react";
import styles from "../../../styles/LaunchDetails.module.css";

import { Center, VStack, Text, Input, HStack, InputGroup, InputLeftElement, useDisclosure, Stack } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";

import { Config, DEFAULT_FONT_SIZE, PROGRAM } from "../../Solana/constants";
import {
    LaunchData,
    LaunchDataUserInput,
    ListingData,
    create_LaunchData,
    request_current_balance,
    request_launch_data,
    request_raw_account_data,
} from "../../Solana/state";
import useResponsive from "../../../hooks/useResponsive";
import { useRouter } from "next/router";
import useAppRoot from "../../../context/useAppRoot";
import { toast } from "react-toastify";
import { RxSlash } from "react-icons/rx";
import Image from "next/image";
import useCreateLaunch from "../../../hooks/launch/useCreateLaunch";
import LaunchPreviewModal from "../../launchPreview/modal";
import { Button } from "@/components/ui/button";

interface DetailsPageProps {
    setScreen: Dispatch<SetStateAction<string>>;
}

const DetailsPage = ({ setScreen }: DetailsPageProps) => {
    const router = useRouter();
    const { sm, md, lg, xl } = useResponsive();
    const { newLaunchData, launchList, listingData } = useAppRoot();
    const [name, setName] = useState<string>(newLaunchData.current.pagename);
    const [description, setDescription] = useState<string>(newLaunchData.current.description);
    const [web, setWeb] = useState<string>(newLaunchData.current.web_url);
    const [telegram, setTelegram] = useState<string>(newLaunchData.current.tele_url);
    const [twitter, setTwitter] = useState(newLaunchData.current.twt_url);
    const [discord, setDiscord] = useState(newLaunchData.current.disc_url);
    const [banner_name, setBannerName] = useState<string>("");

    const { CreateLaunch } = useCreateLaunch();

    const { isOpen, onOpen, onClose } = useDisclosure();

    const handleNameChange = (e) => {
        setName(e.target.value);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];

        if (!file.type.startsWith("image")) {
            toast.error("Please upload an image file.");
            return;
        }

        if (file) {
            if (file.size <= 4194304) {
                newLaunchData.current.banner_file = file;
                setBannerName(file.name);
            } else {
                alert("File size exceeds 4MB limit.");
            }
        }
    };

    function containsNone(str: string, set: string[]) {
        return str.split("").every(function (ch) {
            return set.indexOf(ch) === -1;
        });
    }

    async function setData(e): Promise<boolean> {
        e.preventDefault();

        let invalid_chars = [
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
        ];
        console.log("invalid chars:", invalid_chars);

        if (!containsNone(name, invalid_chars)) {
            toast.error("Page name contains invalid characters for URL");
            return false;
        }

        if (newLaunchData.current.launch_type !== 3 && name === "") {
            toast.error("Page name cannot be empty");
            return false;
        }

        if (description.length > 250) {
            toast.error("Description should be less than 250 characters long");
            return false;
        }

        if (description.length === 0) {
            toast.error("Description should be more than 0 characters long");
            return false;
        }

        if (newLaunchData.current.launch_type !== 3 && newLaunchData.current.banner_file === null) {
            toast.error("Please select a banner image.");
            return false;
        }

        if (newLaunchData.current.launch_type !== 3) {
            let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(name), Buffer.from("Launch")], PROGRAM)[0];

            let balance = 0;

            if (newLaunchData.current.edit_mode === false) {
                balance = await request_current_balance("", launch_data_account);
            }

            console.log("check balance", name, launch_data_account.toString(), balance);

            if (balance > 0) {
                let launch_data: LaunchData = await request_launch_data("", launch_data_account);
                if (launch_data !== null) {
                    let listing_data = await request_raw_account_data("", launch_data.listing);
                    if (listing_data !== null) {
                        const [listing] = ListingData.struct.deserialize(listing_data);
                        if (listing.description !== "") {
                            toast.error("Page name already exists");
                            return false;
                        }
                    }
                }
            }
        }

        newLaunchData.current.pagename = name;
        newLaunchData.current.description = description;
        newLaunchData.current.web_url = web;
        newLaunchData.current.twt_url = twitter;
        newLaunchData.current.disc_url = discord;
        newLaunchData.current.tele_url = telegram;

        return true;
    }

    async function preview(e) {
        if (await setData(e)) onOpen();
    }

    async function confirm(e) {
        if (await setData(e)) CreateLaunch();
    }

    async function nextPage(e) {
        if (await setData(e)) setScreen("book");
    }

    async function prevPage(e) {
        if (await setData(e)) setScreen("token");
    }

    return (
        <form className="mx-auto flex w-full flex-col items-center justify-center bg-[#161616] bg-opacity-75 bg-clip-padding px-6 py-6 shadow-2xl backdrop-blur-sm backdrop-filter md:rounded-xl md:border-t-[3px] md:border-orange-700 md:px-12 md:py-8 lg:w-[875px]">
            <Center width="100%">
                <VStack w="100%">
                    <div className="flex flex-col gap-2 md:mb-4">
                        <Text className="text-3xl font-semibold text-center text-white lg:text-4xl">Page Information:</Text>
                        {/* <p className="text-center transition-all cursor-pointer text-white/50 hover:text-white">Switch to Advance Mode</p> */}
                    </div>
                    <VStack width="100%" mt={4}>
                        <div className={styles.launchBodyUpper}>
                            <div className={styles.launchBodyUpperFields}>
                                {newLaunchData.current.launch_type !== 3 && (
                                    <>
                                        {" "}
                                        <HStack spacing={0} className={styles.eachField}>
                                            <p className="min-w-[120px] text-lg text-white md:min-w-[132px]">Page Name:</p>

                                            <InputGroup style={{ width: lg ? "100%" : "50%", position: "relative" }}>
                                                <InputLeftElement color="white">
                                                    <RxSlash size={22} style={{ opacity: 0.5, marginTop: lg ? 0 : 8 }} />
                                                </InputLeftElement>

                                                <Input
                                                    pl={8}
                                                    bg="#494949"
                                                    size={lg ? "md" : "lg"}
                                                    required
                                                    disabled={
                                                        newLaunchData.current.launch_type === 3 || newLaunchData.current.edit_mode === true
                                                    }
                                                    placeholder="Yourpagename"
                                                    className={styles.textLabelInput}
                                                    type="text"
                                                    value={name}
                                                    onChange={handleNameChange}
                                                />
                                            </InputGroup>
                                        </HStack>
                                        <HStack spacing={0} mt={sm ? 0 : 3} className={styles.eachField}>
                                            
                                        <p className="min-w-[120px] text-lg text-white md:min-w-[132px]">Banner:</p>

                                            <div>
                                                <label className={styles.label}>
                                                    <input
                                                        id="file"
                                                        type="file"
                                                        disabled={newLaunchData.current.launch_type === 3}
                                                        onChange={handleFileChange}
                                                    />
                                                    <span
                                                        className="rounded-3xl px-8 py-[0.6rem] font-semibold text-white"
                                                        style={{
                                                            cursor: newLaunchData.current.edit_mode === true ? "not-allowed" : "pointer",
                                                            background:
                                                                "linear-gradient(0deg, rgba(254, 106, 0, 1) 0%, rgba(236, 35, 0, 1) 100%)",
                                                        }}
                                                    >
                                                        BROWSE
                                                    </span>
                                                </label>
                                            </div>

                                            <span className="ml-4 text-white opacity-50 text-md">
                                                {newLaunchData.current.banner_file !== null ? banner_name : "No File Selected"}
                                            </span>
                                        </HStack>
                                    </>
                                )}
                            </div>
                        </div>

                        <VStack w="100%" spacing={30} mt={42} mb={25}>
                            <div className={styles.launchBodyLowerVertical}>
                                
                            <p className="min-w-[120px] text-lg text-white md:min-w-[175px]">Description:</p>

                                <div className={styles.textLabelInput}>
                                    <textarea
                                        maxLength={250}
                                        required
                                        placeholder="Feel free to provide more details about your token, it will be displayed in your token page."
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
                                    <Image width={40} height={40} src="/images/web.png" alt="Website Logo" />
                                    <div className={styles.textLabelInput}>
                                        <input
                                            placeholder="Enter your Website URL"
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
                                            placeholder="Enter your Telegram Invite URL"
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
                                            placeholder="Enter your Twitter URL"
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
                                            placeholder="Enter your Discord Invite URL"
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

                        <VStack spacing={3} align="center" justify="center" w="100%">
                            <Stack spacing={3} direction={{ base: "column", md: "row" }}>
                                <Button
                                    type="button"
                                    size="lg"
                                    className="mt-2"
                                    onClick={(e) => {
                                        prevPage(e);
                                    }}
                                >
                                    Go Back
                                </Button>
                                <Button
                                    type="button"
                                    size="lg"
                                    className="mt-2"
                                    onClick={(e) => {
                                        nextPage(e);
                                    }}
                                >
                                    Next (2/3)
                                </Button>
                            </Stack>
                        </VStack>
                    </VStack>
                </VStack>

                <LaunchPreviewModal isOpen={isOpen} onClose={onClose} data={create_LaunchData(newLaunchData.current)} />
            </Center>
        </form>
    );
};

export default DetailsPage;
