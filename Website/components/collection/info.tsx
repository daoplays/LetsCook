import { Dispatch, SetStateAction, useState } from "react";
import { Center, VStack, Text, HStack, Input, chakra, Flex } from "@chakra-ui/react";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "../../styles/Launch.module.css";
import useResponsive from "../../hooks/useResponsive";
import styles2 from "../../styles/LaunchDetails.module.css";
import getImageDimensions from "../../utils/getImageDimension";
import useAppRoot from "../../context/useAppRoot";
import { toast } from "react-toastify";
import { Keypair, PublicKey } from "@solana/web3.js";

interface CollectionInfoProps {
    setScreen: Dispatch<SetStateAction<string>>;
}

const CollectionInfo = ({ setScreen }: CollectionInfoProps) => {
    const router = useRouter();
    const { newCollectionData } = useAppRoot();

    const { sm, md, lg } = useResponsive();
    const [name, setName] = useState<string>(newCollectionData.current.collection_name);
    const [symbol, setSymbol] = useState<string>(newCollectionData.current.collection_symbol);
    const [tokenStart, setTokenStart] = useState<string>("");
    const [displayImg, setDisplayImg] = useState<string>(newCollectionData.current.displayImg);
    const [description, setDescription] = useState<string>(newCollectionData.current.description);

    function setLaunchData(e) {
        e.preventDefault();

        if (newCollectionData.current.icon_file === null) {
            toast.error("Please select an icon image.");
            return;
        }

        if (symbol.length > 10) {
            toast.error("Maximum symbol length is 10 characters");
            return;
        }

        if (name.length > 25) {
            toast.error("Maximum name length is 25 characters");
            return;
        }

        if (description.length > 250) {
            toast.error("Description should be less than 250 characters long");
            return false;
        }

        newCollectionData.current.token_keypair = Keypair.generate();

        if (tokenStart !== "") {
            let est_time = "1s";
            if (tokenStart.length == 2) est_time = "5s";
            if (tokenStart.length === 3) est_time = "5min";

            const grindToast = toast.loading("Performing token prefix grind.. Est. time:  " + est_time);
            let attempts = 0;

            while (newCollectionData.current.token_keypair.publicKey.toString().substring(0, tokenStart.length) !== tokenStart) {
                attempts += 1;
                let seed_buffer = [];
                for (let i = 0; i < 32; i++) {
                    seed_buffer.push(Math.floor(Math.random() * 255));
                }
                let seed = new Uint8Array(seed_buffer);

                newCollectionData.current.token_keypair = Keypair.fromSeed(seed);
                if (attempts % 10000 === 0) {
                    console.log("attempts: " + attempts);
                    toast.update(grindToast, {
                        render: "Grind Attempts: " + attempts.toString(),
                        type: "info",
                    });
                }
            }

            //console.log("Took ", attempts, "to get pubkey", newLaunchData.current.token_keypair.publicKey.toString());
            toast.update(grindToast, {
                render: "Token Prefix found after " + attempts.toString() + " attempts!",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });
        }

        newCollectionData.current.collection_name = name;
        newCollectionData.current.collection_symbol = symbol;
        newCollectionData.current.displayImg = displayImg;
        newCollectionData.current.description = description;

        setScreen("step 2");
    }

    const handleNameChange = (e) => {
        setName(e.target.value);
    };
    const handleSymbolChange = (e) => {
        setSymbol(e.target.value);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];

        if (file) {
            if (file.size <= 1048576) {
                const dimensions = await getImageDimensions(file);

                if (dimensions.width === dimensions.height) {
                    newCollectionData.current.icon_file = file;
                    setDisplayImg(URL.createObjectURL(e.target.files[0]));
                } else {
                    toast.error("Please upload an image with equal width and height.");
                }
            } else {
                toast.error("File size exceeds 1MB limit.");
            }
        }
    };

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
                        style={{ cursor: newCollectionData.current.edit_mode === true ? "not-allowed" : "pointer", padding: "5px 10px" }}
                    >
                        BROWSE
                    </span>
                </label>
            </div>
            <Text m={0} ml={5} className="font-face-rk" fontSize={lg ? "medium" : "lg"}>
                {newCollectionData.current.icon_file !== null
                    ? newCollectionData.current.icon_file.name
                    : "No File Selected (Size Limit: 1MB)"}
            </Text>
        </HStack>
    );

    return (
        <Center style={{ background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)" }} width="100%">
            <VStack w="100%" style={{ paddingBottom: md ? 35 : "75px" }}>
                <Text align="start" className="font-face-kg" color={"white"} fontSize="x-large">
                    Collection Info:
                </Text>
                <form onSubmit={setLaunchData} style={{ width: lg ? "100%" : "1200px" }}>
                    <VStack px={lg ? 4 : 12} spacing={25}>
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
                                            disabled={newCollectionData.current.edit_mode === true}
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

                                <Flex gap={sm ? 8 : 5} w="100%" flexDirection={sm ? "column" : "row"}>
                                    <HStack spacing={0} className={styles.eachField}>
                                        <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "132px" }}>
                                            Symbol:
                                        </div>

                                        {/* <InputGroup style={{ position: "relative" }}> */}
                                        {/* <InputLeftElement>
                                                <FaDollarSign size={22} style={{ opacity: 0.5, marginTop: lg ? 0 : 8 }} />
                                            </InputLeftElement> */}
                                        <div className={styles.textLabelInput}>
                                            <Input
                                                // pl={9}
                                                bg="#494949"
                                                placeholder="Enter Token Ticker. (Ex. $SOL)"
                                                disabled={newCollectionData.current.edit_mode === true}
                                                size={lg ? "md" : "lg"}
                                                maxLength={8}
                                                required
                                                className={styles.inputBox}
                                                type="text"
                                                value={symbol}
                                                onChange={handleSymbolChange}
                                            />
                                        </div>
                                        {/* </InputGroup> */}
                                    </HStack>

                                    <HStack spacing={0} className={styles.eachField}>
                                        <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "120px" }}>
                                            Token Prefix:
                                        </div>

                                        <div className={styles.textLabelInput}>
                                            <Input
                                                maxLength={3}
                                                disabled={newCollectionData.current.edit_mode === true}
                                                size={lg ? "md" : "lg"}
                                                className={styles.inputBox}
                                                placeholder="Enter Token Prefix Grind (Max 3 Characters)"
                                                value={tokenStart}
                                                onChange={(e) => {
                                                    setTokenStart(e.target.value);
                                                }}
                                            />
                                        </div>
                                    </HStack>
                                </Flex>

                                {!lg && <Browse />}
                            </VStack>
                        </HStack>

                        <div className={styles2.launchBodyLowerVertical}>
                            <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: "175px", color: "white" }}>
                                DESCRIPTION:
                            </div>
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

                        <HStack mt={md ? 0 : 30}>
                            <button type="button" className={`${styles.nextBtn} font-face-kg `} onClick={() => router.push("/dashboard")}>
                                Cancel
                            </button>
                            <button type="submit" className={`${styles.nextBtn} font-face-kg `}>
                                NEXT (1/4)
                            </button>
                        </HStack>
                    </VStack>
                </form>
            </VStack>
        </Center>
    );
};

export default CollectionInfo;
