import { Dispatch, SetStateAction, useState } from "react";
import { Center, VStack, Text, HStack, Input, chakra, Flex, Box } from "@chakra-ui/react";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "../../styles/Launch.module.css";
import useResponsive from "../../hooks/useResponsive";
import styles2 from "../../styles/LaunchDetails.module.css";
import { Keypair, PublicKey } from "@solana/web3.js";
import useAppRoot from "../../context/useAppRoot";
import { toast } from "react-toastify";


interface HybridInfoProps {
    setScreen: Dispatch<SetStateAction<string>>;
}

const HybridInfo = ({ setScreen }: HybridInfoProps) => {
    const router = useRouter();
    const { newCollectionData } = useAppRoot();

    const { sm, md, lg } = useResponsive();
    const [displayImg, setDisplayImg] = useState<string>("");
    const [token_mint, setTokenMint] = useState<string>("");
    const [team_wallet, setTeamWallet] = useState<string>("");
    const [swap_fee, setSwapFee] = useState<string>("");
    const [swap_rate, setSwapRate] = useState<string>("");

    function setLaunchData(e) {
        e.preventDefault();

        newCollectionData.current.team_wallet = team_wallet;
        

        setScreen("step 4");
    }

    return (
        <Center style={{ background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)" }} width="100%">
            <VStack w="100%" style={{ paddingBottom: md ? 35 : "200px" }}>
                <Text align="start" className="font-face-kg" color={"white"} fontSize="x-large">
                    Hybrid Info:
                </Text>
                <form onSubmit={setLaunchData} style={{ width: lg ? "100%" : "1200px" }}>
                    <VStack px={lg ? 4 : 12} spacing={25}>
                        <HStack w="100%" spacing={lg ? 10 : 12} style={{ flexDirection: lg ? "column" : "row" }}>
                            <VStack spacing={8} flexGrow={1} align="start" width="100%">
                                <HStack spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "140px" }}>
                                        Token:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            placeholder="Search Token"
                                            size={lg ? "md" : "lg"}
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            onChange={(e) => {
                                                setTokenMint(e.target.value);
                                            }}                                        />
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
                                            onChange={(e) => {
                                                setSwapRate(e.target.value);
                                            }}                                        />
                                    </div>
                                </HStack>

                                    <HStack spacing={0} w="100%" className={styles.eachField}>
                                        <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "140px" }}>
                                            Swap Fee:
                                        </div>

                                        <div className={styles.distributionField}>
                                            <Input size="lg" 
                                            onChange={(e) => {
                                                setSwapFee(e.target.value);
                                            }} 
                                            />
                                            bps
                                        </div>
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
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            onChange={(e) => {
                                                setTeamWallet(e.target.value);
                                            }}                                         />
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
                            <button type="submit" className={`${styles.nextBtn} font-face-kg `}>
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
