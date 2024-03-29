import { Dispatch, SetStateAction, useState } from "react";
import { Center, VStack, Text, HStack, Input, chakra, Flex } from "@chakra-ui/react";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "../../styles/Launch.module.css";
import useResponsive from "../../hooks/useResponsive";
import styles2 from "../../styles/LaunchDetails.module.css";

interface NFTDataProps {
    setScreen: Dispatch<SetStateAction<string>>;
}

const NFTData = ({ setScreen }: NFTDataProps) => {
    const router = useRouter();
    const { sm, md, lg } = useResponsive();
    const [collectionName, setCollectionName] = useState<string>("");
    const [nftImage, setNftImage] = useState<string>("");
    const [metadata, setMetadata] = useState<string>("");

    const handleCollectionNameChange = (e) => {
        setCollectionName(e.target.value);
    };

    const handleNftImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files && e.target.files[0];

        if (files) {
            setNftImage(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleMetadataChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files && e.target.files[0];

        if (files) {
            setMetadata(URL.createObjectURL(e.target.files[0]));
        }
    };

    function setLaunchData(e) {
        e.preventDefault();

        // Todo: Validation

        setScreen("step 3");
    }

    return (
        <Center style={{ background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)" }} width="100%">
            <VStack w="100%" style={{ paddingBottom: md ? 35 : "300px" }}>
                <Text align="start" className="font-face-kg" color={"white"} fontSize="x-large">
                    Individual NFT info:
                </Text>
                <form onSubmit={setLaunchData} style={{ width: lg ? "100%" : "1200px" }}>
                    <VStack px={lg ? 4 : 12} spacing={25}>
                        <HStack w="100%" spacing={lg ? 10 : 12} style={{ flexDirection: lg ? "column" : "row" }}>
                            <VStack spacing={8} flexGrow={1} align="start" width="100%">
                                <HStack spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "132px" }}>
                                        Name:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            placeholder="Enter Collection Name"
                                            size={lg ? "md" : "lg"}
                                            maxLength={25}
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            value={collectionName}
                                            onChange={(e) => handleCollectionNameChange(e)}
                                        />
                                    </div>
                                </HStack>

                                <HStack spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "132px" }}>
                                        Images:
                                    </div>
                                    <div>
                                        <label className={styles.label}>
                                            <input id="file" type="file" onChange={(e) => handleNftImageChange(e)} />
                                            <span className={styles.browse} style={{ cursor: "pointer", padding: "5px 10px" }}>
                                                BROWSE
                                            </span>
                                        </label>
                                    </div>
                                    <Text m={0} ml={5} className="font-face-rk" fontSize={lg ? "medium" : "lg"}>
                                        {nftImage ? "File Selected" : "No File Selected"}
                                    </Text>
                                </HStack>

                                <HStack spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "132px" }}>
                                        Metadata:
                                    </div>
                                    <div>
                                        <label className={styles.label}>
                                            <input id="file" type="file" onChange={(e) => handleMetadataChange(e)} />
                                            <span className={styles.browse} style={{ cursor: "pointer", padding: "5px 10px" }}>
                                                BROWSE
                                            </span>
                                        </label>
                                    </div>
                                    <Text m={0} ml={5} className="font-face-rk" fontSize={lg ? "medium" : "lg"}>
                                        {metadata ? "File Selected" : "No File Selected"}
                                    </Text>
                                </HStack>
                            </VStack>
                        </HStack>

                        <HStack mt={md ? 0 : 30}>
                            <button
                                type="button"
                                className={`${styles.nextBtn} font-face-kg `}
                                onClick={() => {
                                    setScreen("step 1");
                                }}
                            >
                                Go Back
                            </button>
                            <button type="submit" className={`${styles.nextBtn} font-face-kg `}>
                                NEXT (2/4)
                            </button>
                        </HStack>
                    </VStack>
                </form>
            </VStack>
        </Center>
    );
};

export default NFTData;
