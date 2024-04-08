import { Dispatch, SetStateAction, useState } from "react";
import { Center, VStack, Text, HStack, Input, chakra, Flex, Box } from "@chakra-ui/react";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "../../styles/Launch.module.css";
import useResponsive from "../../hooks/useResponsive";
import styles2 from "../../styles/LaunchDetails.module.css";
import { Keypair, PublicKey, Connection } from "@solana/web3.js";
import useAppRoot from "../../context/useAppRoot";
import { toast } from "react-toastify";
import { RPC_NODE, WSS_NODE, PROGRAM, LaunchFlags, SYSTEM_KEY, LaunchKeys, METAPLEX_META, Extensions } from "../Solana/constants";
import { unpackMint, Mint, TOKEN_2022_PROGRAM_ID, getTransferHook, getTransferFeeConfig, getPermanentDelegate } from "@solana/spl-token";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { request_raw_account_data } from "../Solana/state";
import ShowExtensions from "../Solana/extensions";

interface HybridInfoProps {
    setScreen: Dispatch<SetStateAction<string>>;
}

const HybridInfo = ({ setScreen }: HybridInfoProps) => {
    const router = useRouter();
    const { newCollectionData } = useAppRoot();

    const { sm, md, lg } = useResponsive();
    const [token_mint, setTokenMint] = useState<string>(newCollectionData.current.token_mint?.toString());
    const [token_name, setTokenName] = useState<string>(newCollectionData.current.token_symbol);
    const [token_icon_url, setTokenIconURL] = useState<string>(newCollectionData.current.token_image_url);
    const [token_symbol, setTokenSymbol] = useState<string>(newCollectionData.current.token_symbol);
    const [token_decimals, setTokenDecimals] = useState<number>(0);
    const [token_extensions, setTokenExtensions] = useState<number>(0);

    const [team_wallet, setTeamWallet] = useState<string>(newCollectionData.current.team_wallet);
    const [swap_fee, setSwapFee] = useState<string>(newCollectionData.current.swap_fee > 0 ? newCollectionData.current.swap_fee.toString() : "");
    const [swap_rate, setSwapRate] = useState<string>(newCollectionData.current.swap_rate > 0 ? newCollectionData.current.swap_rate.toString() : "");

    async function setMintData(e): Promise<void> {
        e.preventDefault();

        let token_key = new PublicKey(token_mint);
        let token_meta_key = PublicKey.findProgramAddressSync(
            [Buffer.from("metadata"), METAPLEX_META.toBuffer(), token_key.toBuffer()],
            METAPLEX_META,
        )[0];
        let raw_meta_data = await request_raw_account_data("", token_meta_key);

        if (raw_meta_data === null) {
            toast.error("Token metadata not found");
            return;
        }

        const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });
        let result = await connection.getAccountInfo(token_key, "confirmed");
    
        let mint : Mint;
        try {
            mint = unpackMint(token_key, result, TOKEN_2022_PROGRAM_ID);
            console.log(mint);
        }
        catch(error){
            toast.error("Token not using Token2022 program");
            return;
        }

        // check the extensions we care about
        let transfer_hook = getTransferHook(mint);
        let transfer_fee_config = getTransferFeeConfig(mint);
        let permanent_delegate = getPermanentDelegate(mint);

        let extensions =
        (Extensions.TransferFee * Number(transfer_fee_config !== null)) |
        (Extensions.PermanentDelegate * Number(permanent_delegate !== null)) |
        (Extensions.TransferHook * Number(transfer_hook !== null));
        console.log("extensions", extensions)

        //console.log("deserialize meta data");
        let meta_data = Metadata.deserialize(raw_meta_data);
        console.log(meta_data);
        console.log(meta_data[0].data.symbol, meta_data[0].data.name);
        let uri_json = await fetch(meta_data[0].data.uri).then((res) => res.json());
        console.log(uri_json["image"]);
        setTokenName(meta_data[0].data.name);
        setTokenIconURL(uri_json["image"]);
        setTokenSymbol(meta_data[0].data.symbol);
        setTokenDecimals(mint.decimals);
        setTokenExtensions(extensions);
        return;
    }

    function setLaunchData(e) {
        e.preventDefault();

        if (token_name === "") {
            toast.error("Token name not set, please search for valid Token 2022 token");
            return;
        }

        newCollectionData.current.team_wallet = team_wallet;
        newCollectionData.current.token_image_url = token_icon_url;
        newCollectionData.current.token_name = token_name;
        newCollectionData.current.token_symbol = token_symbol;
        newCollectionData.current.token_mint = new PublicKey(token_mint);
        newCollectionData.current.swap_rate = parseInt(swap_rate);
        newCollectionData.current.swap_fee = parseInt(swap_fee);
        newCollectionData.current.token_decimals = token_decimals;
        newCollectionData.current.token_extensions = token_extensions;


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
                                            value={token_mint}
                                            onChange={(e) => {
                                                setTokenMint(e.target.value);
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginLeft: "12px" }}>
                                        <label className={styles.label}>
                                            <button
                                                onClick={(e) => setMintData(e)}
                                                className={styles.browse}
                                                style={{ cursor: "pointer", padding: "5px 10px" }}
                                            >
                                                Search
                                            </button>
                                        </label>
                                    </div>
                                </HStack>
                                <HStack w="100%" spacing={lg ? 10 : 12} style={{ flexDirection: lg ? "column" : "row" }}>
                                    {token_icon_url ? (
                                        <VStack>
                                        <Image
                                            src={token_icon_url}
                                            width={lg ? 180 : 235}
                                            height={lg ? 180 : 235}
                                            alt="Image Frame"
                                            style={{ backgroundSize: "cover", borderRadius: 12 }}
                                        />
                                        <ShowExtensions extension_flag={token_extensions}/>
                                        </VStack>
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
                                        </VStack>
                                    )}

                                    <VStack spacing={8} flexGrow={1} align="start" width="100%">
                                        <HStack spacing={0} className={styles.eachField}>
                                            <div
                                                className={`${styles.textLabel} font-face-kg`}
                                                style={{ minWidth: lg ? "100px" : "132px" }}
                                            >
                                                Name:
                                            </div>

                                            <div className={styles.textLabelInput}>
                                                <Input
                                                    placeholder="Token Name"
                                                    readOnly={true}
                                                    size={lg ? "md" : "lg"}
                                                    className={styles.inputBox}
                                                    type="text"
                                                    value={token_name}
                                                />
                                            </div>
                                        </HStack>

                                        <Flex gap={sm ? 8 : 5} w="100%" flexDirection={sm ? "column" : "row"}>
                                            <HStack spacing={0} className={styles.eachField}>
                                                <div
                                                    className={`${styles.textLabel} font-face-kg`}
                                                    style={{ minWidth: lg ? "100px" : "132px" }}
                                                >
                                                    Symbol:
                                                </div>
                                                <div className={styles.textLabelInput}>
                                                    <Input
                                                        // pl={9}
                                                        bg="#494949"
                                                        placeholder="Token Symbol"
                                                        readOnly={true}
                                                        size={lg ? "md" : "lg"}
                                                        className={styles.inputBox}
                                                        type="text"
                                                        value={token_symbol}
                                                    />
                                                </div>
                                            </HStack>
                                        </Flex>
                                    </VStack>
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
                                            value={swap_rate}
                                            onChange={(e) => {
                                                setSwapRate(e.target.value);
                                            }}
                                        />
                                    </div>
                                </HStack>

                                <HStack spacing={0} w="100%" className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "140px" }}>
                                        Swap Fee:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            bg="#494949"
                                            placeholder="Enter Swap Fee (Bps - 100 = 1%)"
                                            size={lg ? "md" : "lg"}
                                            maxLength={8}
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            value={swap_fee}
                                            onChange={(e) => {
                                                setSwapFee(e.target.value);
                                            }}
                                        />
                                        
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
                                            value={team_wallet}
                                            onChange={(e) => {
                                                setTeamWallet(e.target.value);
                                            }}
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
