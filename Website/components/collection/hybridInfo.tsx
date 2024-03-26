import { Dispatch, SetStateAction, useState } from "react";
import { Center, VStack, Text, HStack, Input, chakra, Flex, Box } from "@chakra-ui/react";
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

    return (
        <Center style={{ background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)" }} width="100%">
            <VStack w="100%" style={{ paddingBottom: md ? 35 : "200px" }}>
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
                                <HStack spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "140px" }}>
                                        Token:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            placeholder="Search Token"
                                            size={lg ? "md" : "lg"}
                                            maxLength={25}
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            onChange={() => {}}
                                        />
                                    </div>

                                    <div style={{ marginLeft: "12px" }}>
                                        <label className={styles.label}>
                                            <input id="file" type="file" />
                                            <span className={styles.browse} style={{ cursor: "pointer", padding: "5px 10px" }}>
                                                Search
                                            </span>
                                        </label>
                                    </div>
                                </HStack>

                                <HStack w={"100%"} spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "140px" }}>
                                        Swap Rate:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            bg="#494949"
                                            placeholder="Enter Swap Rate (Tokens per NFT)"
                                            size={lg ? "md" : "lg"}
                                            maxLength={8}
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            onChange={() => {}}
                                        />
                                    </div>
                                </HStack>

                                <HStack spacing={8}>
                                    <HStack spacing={0} w="100%" className={styles.eachField}>
                                        <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "140px" }}>
                                            Swap Fee:
                                        </div>

                                        <div className={styles.distributionField}>
                                            <Input size="lg" onChange={(e) => {}} />
                                            <Image
                                                className={styles.percentage}
                                                width={15}
                                                height={15}
                                                src="/images/perc.png"
                                                alt="Percentage"
                                            />
                                        </div>
                                    </HStack>

                                    <HStack align="center" spacing={0} w="100%" className={styles.eachField}>
                                        <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "140px" }}>
                                            Cooldown:
                                        </div>

                                        <div className={styles.distributionField}>
                                            <Input size="lg" onChange={(e) => {}} />
                                        </div>

                                        <Text m={0} ml={2} mt={1} className="font-face-rk" fontSize={"x-large"}>
                                            Days
                                        </Text>
                                    </HStack>
                                </HStack>

                                <HStack w={"100%"} spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "140px" }}>
                                        Fee Wallet:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            bg="#494949"
                                            placeholder="Enter Solana Wallet Address"
                                            size={lg ? "md" : "lg"}
                                            maxLength={8}
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            onChange={() => {}}
                                        />
                                    </div>
                                </HStack>
                            </VStack>
                        </HStack>

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
