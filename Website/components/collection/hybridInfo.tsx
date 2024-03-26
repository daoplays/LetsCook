import { Dispatch, SetStateAction, useState } from "react";
import { Center, VStack, Text, HStack, Input, chakra, Flex } from "@chakra-ui/react";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "../../styles/Launch.module.css";
import useResponsive from "../../hooks/useResponsive";
import styles2 from "../../styles/LaunchDetails.module.css";

interface HybridInfoProps {
    setScreen: Dispatch<SetStateAction<string>>;
}

const HybridInfo = ({ setScreen }: HybridInfoProps) => {
    const router = useRouter();
    const { sm, md, lg } = useResponsive();
    const [displayImg, setDisplayImg] = useState<string>("");

    const Browse = () => (
        <HStack spacing={0} className={styles.eachField}>
            <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "132px" }}>
                Image:
            </div>
            <div>
                <label className={styles.label}>
                    <input id="file" type="file" />
                    <span className={styles.browse} style={{ cursor: "pointer", padding: "5px 10px" }}>
                        BROWSE
                    </span>
                </label>
            </div>
            <Text m={0} ml={5} className="font-face-rk" fontSize={lg ? "medium" : "lg"}>
                No File Selected
            </Text>
        </HStack>
    );

    return (
        <Center style={{ background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)" }} width="100%">
            <VStack w="100%" style={{ paddingBottom: md ? 35 : "75px" }}>
                <Text align="start" className="font-face-kg" color={"white"} fontSize="x-large">
                    Hybrid Info:
                </Text>
                <form onSubmit={() => {}} style={{ width: lg ? "100%" : "1200px" }}>
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
                                        Image Preview
                                    </Text>

                                    <chakra.input
                                        required
                                        style={{ display: "none" }}
                                        type="file"
                                        id="file"
                                        name="file"
                                        onChange={() => {}}
                                    />
                                </VStack>
                            )}

                            <VStack spacing={8} flexGrow={1} align="start" width="100%">
                                {lg && <Browse />}

                                <HStack spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "132px" }}>
                                        Token:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            placeholder="Enter Collection Name"
                                            size={lg ? "md" : "lg"}
                                            maxLength={25}
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            onChange={() => {}}
                                        />
                                    </div>

                                    <div>
                                        <label className={styles.label}>
                                            <input id="file" type="file" />
                                            <span className={styles.browse} style={{ cursor: "pointer", padding: "5px 10px" }}>
                                                BROWSE
                                            </span>
                                        </label>
                                    </div>
                                </HStack>

                                <Flex gap={sm ? 8 : 5} w="100%" flexDirection={sm ? "column" : "row"}>
                                    <HStack w={sm ? "100%" : "50%"} spacing={0} className={styles.eachField}>
                                        <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "132px" }}>
                                            Symbol:
                                        </div>

                                        <div className={styles.textLabelInput}>
                                            <Input
                                                bg="#494949"
                                                placeholder="Enter Collection Symbol"
                                                size={lg ? "md" : "lg"}
                                                maxLength={8}
                                                required
                                                className={styles.inputBox}
                                                type="text"
                                                onChange={() => {}}
                                            />
                                        </div>
                                    </HStack>

                                    <HStack w={sm ? "100%" : "50%"} spacing={sm ? 0 : 3} className={styles.eachField}>
                                        <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "140px" }}>
                                            Max Supply:
                                        </div>

                                        <div className={styles.textLabelInput}>
                                            <Input
                                                bg="#494949"
                                                placeholder="Enter Collection Max Supply"
                                                size={lg ? "md" : "lg"}
                                                maxLength={8}
                                                required
                                                className={styles.inputBox}
                                                type="text"
                                                onChange={() => {}}
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
                                    onChange={(e) => {}}
                                />
                            </div>
                        </div>

                        <HStack mt={md ? 0 : 30}>
                            <button
                                type="button"
                                className={`${styles.nextBtn} font-face-kg `}
                                onClick={() => {
                                    setScreen("step 2");
                                }}
                            >
                                Go Back
                            </button>
                            <button
                                className={`${styles.nextBtn} font-face-kg `}
                                onClick={() => {
                                    setScreen("step 4");
                                }}
                            >
                                NEXT (3/4)
                            </button>
                        </HStack>
                    </VStack>
                </form>
            </VStack>
        </Center>
    );
};

export default HybridInfo;
