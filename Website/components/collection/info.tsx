import { Dispatch, SetStateAction, useState, useRef, useEffect } from "react";
import { Center, VStack, Text, HStack, Input, chakra, Flex, RadioGroup, Radio, Stack, Tooltip, Switch, Divider } from "@chakra-ui/react";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "../../styles/Launch.module.css";
import useResponsive from "../../hooks/useResponsive";
import styles2 from "../../styles/LaunchDetails.module.css";
import getImageDimensions from "../../utils/getImageDimension";
import useAppRoot from "../../context/useAppRoot";
import { toast } from "react-toastify";
import { Keypair, PublicKey } from "@solana/web3.js";
import trimAddress from "../../utils/trimAddress";
import { Button } from "../ui/button";
interface CollectionInfoProps {
    setScreen: Dispatch<SetStateAction<string>>;
}

const CollectionInfo = ({ setScreen }: CollectionInfoProps) => {
    const router = useRouter();
    const { newCollectionData } = useAppRoot();

    const { sm, md, lg, xl } = useResponsive();
    const [name, setName] = useState<string>(newCollectionData.current.collection_name);
    const [tokenStart, setTokenStart] = useState<string>("");
    const [displayImg, setDisplayImg] = useState<string>(newCollectionData.current.displayImg);
    const [description, setDescription] = useState<string>(newCollectionData.current.description);
    const [isLoading, setIsLoading] = useState(false);
    const [grindComplete, setGrindComplete] = useState(false);
    const [isUnlimitedSupply, setIsUnlimitedSupply] = useState<boolean>(false); // Default to Fixed Supply
    const [isStandardMint, setIsStandardMint] = useState<boolean>(true); // Default to Standard Mint

    const grind_attempts = useRef<number>(0);
    const grind_toast = useRef<any | null>(null);

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
            newCollectionData.current.token_keypair = new Keypair(); //.fromSeed(seed);
            //console.log(newLaunchData.current.token_keypair.publicKey.toString(), tokenStart);
            if (newCollectionData.current.token_keypair.publicKey.toString().startsWith(tokenStart)) {
                success = true;
                console.log("have found key", newCollectionData.current.token_keypair.publicKey.toString());
                break;
            }
        }

        if (success) {
            let key_str = trimAddress(newCollectionData.current.token_keypair.publicKey.toString());
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

    useEffect(() => {
        newCollectionData.current.collection_type = isUnlimitedSupply ? 1 : 0;
        newCollectionData.current.mint_only = isStandardMint;
    }, [isUnlimitedSupply, isStandardMint, newCollectionData]);

    async function setData(e): Promise<boolean> {
        e.preventDefault();

        if (newCollectionData.current.icon_file === null) {
            toast.error("Please select an icon image.");
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

        if (description.length === 0) {
            toast.error("Description should be more than 0 characters long");
            return false;
        }

        if (!containsNone(tokenStart, invalid_prefix_chars)) {
            toast.error("Prefix contains invalid characters for token");
            return false;
        }

        newCollectionData.current.token_keypair = Keypair.generate();

        newCollectionData.current.collection_name = name;
        newCollectionData.current.displayImg = displayImg;
        newCollectionData.current.description = description;

        if (tokenStart !== "") {
            // Call tokenGrind() and wait for it to finish
            await tokenGrind();
        } else {
            setGrindComplete(true);
        }

        return true;
    }

    useEffect(() => {
        if (!grindComplete) {
            return;
        }

        if (!newCollectionData.current.edit_mode) setScreen("step 2");
        else setScreen("step 4");
    }, [grindComplete, newCollectionData, setScreen]);

    async function nextPage(e) {
        await setData(e);
    }

    const handleNameChange = (e) => {
        setName(e.target.value);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];

        if (!file.type.startsWith("image")) {
            toast.error("Please upload an image file.");
            return;
        }

        if (file) {
            if (file.size <= 2048576) {
                const dimensions = await getImageDimensions(file);

                if (dimensions.width === dimensions.height) {
                    newCollectionData.current.icon_file = file;
                    setDisplayImg(URL.createObjectURL(e.target.files[0]));
                } else {
                    toast.error("Please upload an image with equal width and height.");
                }
            } else {
                toast.error("File size exceeds 2MB limit.");
            }
        }
    };

    const Browse = () => (
        <HStack spacing={0} className={styles.eachField}>
            <p className="min-w-[100px] text-lg text-white md:min-w-[132px]">Icon:</p>
            <div>
                <label className={styles.label}>
                    <input id="file" type="file" onChange={handleFileChange} />
                    <span
                        className="rounded-3xl px-8 py-[0.6rem] font-semibold"
                        style={{
                            background: "linear-gradient(0deg, rgba(254, 106, 0, 1) 0%, rgba(236, 35, 0, 1) 100%)",
                            cursor: newCollectionData.current.edit_mode === true ? "not-allowed" : "pointer",
                        }}
                    >
                        Browse
                    </span>
                </label>
            </div>
            <Text m={0} ml={5} className="font-face-rk overflow-auto text-nowrap" fontSize={lg ? "medium" : "lg"}>
                {newCollectionData.current.icon_file !== null
                    ? newCollectionData.current.icon_file.name
                    : "No File Selected (Size Limit: 2MB)"}
            </Text>
        </HStack>
    );

    return (
        <form className="mx-auto flex w-full flex-col items-center justify-center bg-[#161616] bg-opacity-75 bg-clip-padding px-6 py-6 shadow-2xl backdrop-blur-sm backdrop-filter md:w-[975px] md:rounded-xl md:border-t-[3px] md:border-orange-700 md:px-12 md:py-8">
            <Center width="100%" h="100%">
                <VStack w="100%" h="100%">
                    <div className="mb-4 flex flex-col gap-2">
                        <Text className="text-center text-3xl font-semibold text-white lg:text-4xl">New Collection</Text>
                    </div>
                    <VStack spacing={25} className="w-full">
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
                                    <p className="min-w-[100px] text-lg text-white md:min-w-[132px]">Name:</p>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            placeholder="Enter Collection Name. (Ex. Smile NFT)"
                                            disabled={newCollectionData.current.edit_mode === true}
                                            size={lg ? "md" : "lg"}
                                            maxLength={25}
                                            required
                                            type="text"
                                            value={name}
                                            onChange={handleNameChange}
                                        />
                                    </div>
                                </HStack>

                                <Flex gap={sm ? 8 : 5} w="100%" flexDirection={sm ? "column" : "row"}>
                                    <HStack spacing={0} className={styles.eachField}>
                                        <p className="min-w-[100px] text-lg text-white md:min-w-[130px]">Prefix:</p>

                                        <div className={styles.textLabelInput}>
                                            <Input
                                                maxLength={3}
                                                disabled={newCollectionData.current.edit_mode === true}
                                                size={lg ? "md" : "lg"}
                                                placeholder="Enter Collection Prefix (Max 3 Characters) - Optional"
                                                value={tokenStart}
                                                onChange={(e) => {
                                                    setTokenStart(e.target.value);
                                                }}
                                            />
                                        </div>
                                    </HStack>
                                </Flex>
                                <HStack className={`w-full flex-nowrap overflow-auto`}>
                                    <HStack spacing={0} className={styles.eachField}>
                                        <p className="min-w-[100px] text-lg text-white md:min-w-[130px]">Mode:</p>
                                        <RadioGroup
                                            onChange={(value: string) => {
                                                setIsStandardMint(value === "standard");
                                            }}
                                            value={isStandardMint ? "standard" : "hybrid"}
                                        >
                                            <Stack direction="row" gap={5}>
                                                <Radio value="standard" color="white">
                                                    <Tooltip
                                                        label="Users buy NFTs with tokens. Once sold out, no more can be minted."
                                                        hasArrow
                                                        fontSize="large"
                                                        offset={[0, 10]}
                                                    >
                                                        <Text
                                                            color="white"
                                                            m={0}
                                                            className="font-face-rk text-nowrap"
                                                            fontSize={lg ? "medium" : "lg"}
                                                        >
                                                            Standard Mint
                                                        </Text>
                                                    </Tooltip>
                                                </Radio>
                                                <Radio value="hybrid">
                                                    <Tooltip
                                                        label="Users can swap tokens for NFTs and back, with a swap fee sent to wallet you assigned."
                                                        hasArrow
                                                        fontSize="large"
                                                        offset={[0, 10]}
                                                    >
                                                        <Text
                                                            color="white"
                                                            m={0}
                                                            className="font-face-rk text-nowrap"
                                                            fontSize={lg ? "medium" : "lg"}
                                                        >
                                                            Hybrid Mint
                                                        </Text>
                                                    </Tooltip>
                                                </Radio>
                                            </Stack>
                                        </RadioGroup>
                                    </HStack>
                                    <Center height="20px" className="mx-2">
                                        <Divider orientation="vertical" />
                                    </Center>
                                    <Tooltip
                                        label="No limit on the number of NFTs that can be minted. The launch will end on the specified date."
                                        hasArrow
                                        fontSize="lg"
                                        offset={[0, 10]}
                                    >
                                        <HStack
                                            className={styles.eachField}
                                            alignItems="center"
                                            spacing={3} // Adds spacing for better visual separation
                                        >
                                            <Text
                                                className="font-face-rk text-nowrap text-lg text-white"
                                                color="white"
                                                m={0}
                                                fontSize={lg ? "medium" : "lg"}
                                            >
                                                Unlimited Supply
                                            </Text>
                                            <Switch
                                                py={2}
                                                size="md"
                                                isChecked={isUnlimitedSupply}
                                                onChange={() => setIsUnlimitedSupply(!isUnlimitedSupply)}
                                            />
                                        </HStack>
                                    </Tooltip>
                                </HStack>
                                {!lg && <Browse />}
                            </VStack>
                        </HStack>

                        <div className={styles2.launchBodyLowerVertical}>
                            <p className="min-w-[100px] text-lg text-white md:min-w-[175px]">Description:</p>
                            <div>
                                <textarea
                                    maxLength={250}
                                    required
                                    placeholder="Feel free to provide more details about your NFT collection, it will be displayed in your collection page."
                                    style={{ minHeight: 200 }}
                                    className={`${styles.inputBox} ${styles2.inputTxtarea}`}
                                    value={description}
                                    onChange={(e) => {
                                        setDescription(e.target.value);
                                    }}
                                />
                            </div>
                        </div>

                        <HStack>
                            <Button type="button" size="lg" className="mt-2" onClick={() => router.push("/dashboard")}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                size="lg"
                                className="mt-2"
                                onClick={(e) => {
                                    if (!isLoading) {
                                        nextPage(e);
                                    }
                                }}
                                style={{ cursor: isLoading ? "not-allowed" : "pointer" }}
                            >
                                {isLoading ? "Please Wait" : "Next (1/4)"}
                            </Button>
                        </HStack>
                    </VStack>
                </VStack>
            </Center>
        </form>
    );
};

export default CollectionInfo;
