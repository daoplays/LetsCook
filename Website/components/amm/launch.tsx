import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import { Center, VStack, Text, HStack, Input, chakra, Flex, Box, Switch, Tooltip } from "@chakra-ui/react";
import {
    Mint,
    TOKEN_2022_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    getMetadataPointerState,
    getPermanentDelegate,
    getTokenMetadata,
    getTransferFeeConfig,
    getTransferHook,
    unpackMint,
    getExtensionData,
    ExtensionType,
} from "@solana/spl-token";
import { unpack, TokenMetadata } from "@solana/spl-token-metadata";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "../../styles/Launch.module.css";
import { Keypair, PublicKey, Connection } from "@solana/web3.js";
import { toast } from "react-toastify";

import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import useResponsive from "../../hooks/useResponsive";
import { MintData } from "../Solana/state";
import { Config, Extensions, METAPLEX_META, NetworkConfig, WRAPPED_SOL } from "../Solana/constants";
import ShowExtensions from "../Solana/extensions";
import { fetchWithTimeout } from "../../utils/fetchWithTimeout";
import { useConnection } from "@solana/wallet-adapter-react";
import useInitExternalAMM from "../../hooks/cookAMM/useInitExternalAMM";
import useTokenBalance from "../../hooks/data/useTokenBalance";
import { placeholderIcon } from "@/constant/root";

export async function getMint(connection: Connection, mint_string: string): Promise<[Mint, PublicKey] | null> {
    if (mint_string === "" || !mint_string) {
        return [null, null];
    }

    let mint_address: PublicKey;

    try {
        // Attempt to create a PublicKey instance
        mint_address = new PublicKey(mint_string);
        // If no error is thrown, input is a valid public key
    } catch (error) {
        toast.error("Invalid public key", {
            type: "error",
            isLoading: false,
            autoClose: 3000,
        });
        return [null, null];
    }

    let result = await connection.getAccountInfo(mint_address, "confirmed");

    let mint: Mint;
    if (result.owner.equals(TOKEN_PROGRAM_ID)) {
        try {
            mint = unpackMint(mint_address, result, TOKEN_PROGRAM_ID);
            console.log(mint);
        } catch (error) {
            toast.error("Error loading spl token", {
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            return [null, null];
        }
    } else {
        try {
            mint = unpackMint(mint_address, result, TOKEN_2022_PROGRAM_ID);
            console.log(mint);
        } catch (error) {
            toast.error("Error loading token22", {
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            return [null, null];
        }
    }

    return [mint, result.owner];
}

export async function getMintDataWithMint(connection: Connection, mint: Mint, token_program: PublicKey): Promise<MintData | null> {
    if (mint.address.equals(WRAPPED_SOL)) {
        let mint_data: MintData = {
            mint: mint,
            uri: "",
            name: "Wrapped " + Config.token,
            symbol: "W" + Config.token,
            icon: Config.token_image,
            extensions: 0,
            token_program: token_program,
        };
        return mint_data;
    }
    let uri: string | null = null;
    let metadata_pointer = null;
    let name: string;
    let symbol: string;
    if (token_program.equals(TOKEN_2022_PROGRAM_ID)) {
        // first look for t22 metadata
        metadata_pointer = getMetadataPointerState(mint);
    }

    //console.log("get mint data", mint.address.toString());
    if (metadata_pointer !== null) {
        //console.log("havemetadata pointer ",mint.address.toString(),  metadata_pointer.metadataAddress.toString());
        const data = getExtensionData(ExtensionType.TokenMetadata, mint.tlvData);
        let metadata: TokenMetadata = unpack(data);
        //console.log(metadata)
        uri = metadata.uri;
        name = metadata.name;
        symbol = metadata.symbol;
    } else {
        let token_meta_key = PublicKey.findProgramAddressSync(
            [Buffer.from("metadata"), METAPLEX_META.toBuffer(), mint.address.toBuffer()],
            METAPLEX_META,
        )[0];
        let raw_meta_data = await connection.getAccountInfo(token_meta_key);

        if (raw_meta_data === null) {
            return null;
        }

        let meta_data = Metadata.deserialize(raw_meta_data.data);
        //console.log(meta_data);
        //console.log(meta_data[0].data.symbol, meta_data[0].data.name);
        uri = meta_data[0].data.uri;
        name = meta_data[0].data.name;
        symbol = meta_data[0].data.symbol;
    }

    // check the extensions we care about
    let transfer_hook = getTransferHook(mint);
    let transfer_fee_config = getTransferFeeConfig(mint);
    let permanent_delegate = getPermanentDelegate(mint);

    let extensions =
        (Extensions.TransferFee * Number(transfer_fee_config !== null)) |
        (Extensions.PermanentDelegate * Number(permanent_delegate !== null)) |
        (Extensions.TransferHook * Number(transfer_hook !== null));

    //console.log(name, uri);
    let icon: string;
    uri = uri.replace("https://cf-ipfs.com/", "https://gateway.moralisipfs.com/");
    try {
        let uri_json = await fetchWithTimeout(uri, 3000).then((res) => res.json());
        //console.log(uri_json)
        icon = uri_json["image"];
    } catch (error) {
        console.log("error getting uri, using placeholder icon");
        console.log("name", name, uri, mint.address.toString());
        console.log(error);
        icon = placeholderIcon;
    }
    let mint_data: MintData = {
        mint: mint,
        uri: uri,
        name: name,
        symbol: symbol,
        icon: icon,
        extensions: extensions,
        token_program: token_program,
    };

    //console.log("have mint data", mint_data);
    return mint_data;
}

export async function getMintData(token_mint: string): Promise<MintData | null> {
    const connection = new Connection(Config.RPC_NODE, {
        wsEndpoint: Config.WSS_NODE,
    });

    let [mint, token_program]: [Mint, PublicKey] = await getMint(connection, token_mint);

    if (!mint || !token_program) {
        return null;
    }

    let mint_data = await getMintDataWithMint(connection, mint, token_program);

    return mint_data;
}

const LaunchAMM = () => {
    const { xs, sm, md, lg, xl } = useResponsive();

    const { connection } = useConnection();

    const [base_address, setBaseAddress] = useState<string>("");
    const [base_token, setBaseToken] = useState<MintData | null>(null);
    const [quote_address, setQuoteAddress] = useState<string>("");
    const [quote_token, setQuoteToken] = useState<MintData | null>(null);

    const [base_amount, setBaseAmount] = useState<string>("");
    const [quote_amount, setQuoteAmount] = useState<string>("");
    const [swap_fee, setSwapFee] = useState<string>("25");
    const [short_fraction, setShortFraction] = useState<string>("");
    const [borrow_cost, setBorrowCost] = useState<string>("");

    const [web, setWeb] = useState<string>("");
    const [telegram, setTelegram] = useState<string>("");
    const [twitter, setTwitter] = useState<string>("");
    const [discord, setDiscord] = useState<string>("");

    const [burnLP, setBurnLP] = useState<number>(0);
    const [wrapETH, setWrapETH] = useState<number>(0);
    const [lowLiquidity, setLowLiquidity] = useState<number>(0);

    const { InitExternalAMM, isLoading } = useInitExternalAMM();

    const baseMintAddress = useMemo(() => {
        return base_token?.mint?.address || null;
    }, [base_token]);

    const { tokenBalance: baseBalance } = useTokenBalance(baseMintAddress ? { mintAddress: baseMintAddress } : null);

    const quoteMintAdress = useMemo(() => {
        return quote_token?.mint?.address || null;
    }, [quote_token]);

    const { tokenBalance: quoteBalance } = useTokenBalance(quoteMintAdress ? { mintAddress: quoteMintAdress } : null);

    async function handleSetBaseData() {
        setBaseToken(await getMintData(base_address));
    }
    async function handleSetQuoteData() {
        setQuoteToken(await getMintData(quote_address));
    }

    const getWSOL = useCallback(async () => {
        let [wsol_mint, token_program] = await getMint(connection, WRAPPED_SOL.toString());
        let wsol = await getMintDataWithMint(connection, wsol_mint, token_program);
        setQuoteToken(wsol);
        setQuoteAddress(WRAPPED_SOL.toString());
    }, [connection]);

    useEffect(() => {
        if (quote_token === null) {
            getWSOL();
        }
    }, [quote_token, getWSOL]);

    useEffect(() => {
        console.log(sm, md, lg, xl);
    }, [sm, md, lg, xl]);

    return (
        <Center width="100%">
            <VStack w="100%" style={{ paddingBottom: md ? 35 : "200px" }}>
                <Text align="start" className="font-face-kg font-extrabold" color={"white"} fontSize="x-large">
                    AMM Info:
                </Text>
                <form style={{ width: xl ? "100%" : "1200px" }} className="mt-4 rounded-md bg-[#303030] py-4">
                    <VStack px={xs || sm || md ? 4 : 42} spacing={25}>
                        <HStack w="100%" spacing={xs || sm || md ? 10 : 12} style={{ flexDirection: lg ? "column" : "row" }}>
                            <VStack spacing={8} flexGrow={1} align="start" width="100%">
                                <HStack w="100%" spacing={xs || sm || md ? 10 : 12} style={{ flexDirection: lg ? "column" : "row" }}>
                                    {base_token ? (
                                        <VStack spacing={3}>
                                            <Image
                                                src={base_token.icon}
                                                width={200}
                                                height={200}
                                                alt="Image Frame"
                                                style={{ backgroundSize: "cover", borderRadius: 12 }}
                                            />
                                            <ShowExtensions extension_flag={base_token.extensions} />
                                        </VStack>
                                    ) : (
                                        <VStack
                                            justify="center"
                                            align="center"
                                            width={200}
                                            height={200}
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
                                        <HStack spacing={{ base: 2, md: 5 }} className={styles.eachField}>
                                            <Text
                                                className={`${styles.textLabel} font-face-kg`}
                                                w={{ base: "70px", xl: "78px" }}
                                                flexShrink={0}
                                                mb={0}
                                            >
                                                Base Token:
                                            </Text>

                                            <div className={styles.textLabelInputamms} style={{ flexGrow: 1 }}>
                                                <Input
                                                    placeholder="Search Token"
                                                    size={xs || sm || md ? "md" : "lg"}
                                                    required
                                                    className={styles.inputBox}
                                                    type="text"
                                                    value={base_address}
                                                    onChange={(e) => {
                                                        setBaseAddress(e.target.value);
                                                    }}
                                                />
                                            </div>

                                            <div style={{ marginLeft: "12px" }}>
                                                <label className={styles.label}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            handleSetBaseData();
                                                        }}
                                                        className={styles.browse}
                                                        style={{ cursor: "pointer", padding: "5px 10px", fontSize: sm ? "12px" : "20px" }}
                                                    >
                                                        Search
                                                    </button>
                                                </label>
                                            </div>
                                        </HStack>

                                        <Flex gap={sm ? 8 : 5} w="100%" flexDirection={sm ? "column" : "row"}>
                                            <HStack spacing={{ base: 2, md: 5 }} className={styles.eachField}>
                                                <Text
                                                    className={`${styles.textLabel} font-face-kg`}
                                                    w={{ base: "70px", xl: "78px" }}
                                                    flexShrink={0}
                                                    mb={0}
                                                >
                                                    Name:
                                                </Text>

                                                <div className={styles.textLabelInputamms} style={{ flexGrow: 1 }}>
                                                    <Input
                                                        placeholder="Token Name"
                                                        readOnly={true}
                                                        disabled
                                                        size={xs || sm || md ? "md" : "lg"}
                                                        className={styles.inputBox}
                                                        type="text"
                                                        value={base_token ? base_token.name : ""}
                                                    />
                                                </div>
                                                <Text
                                                    className={`${styles.textLabel} font-face-kg`}
                                                    w={{ base: "70px", xl: "auto" }}
                                                    mb={0}
                                                >
                                                    Symbol:
                                                </Text>
                                                <div className={styles.textLabelInputamms} style={{ flexGrow: 1 }}>
                                                    <Input
                                                        // pl={9}
                                                        bg="#494949"
                                                        placeholder="Token Symbol"
                                                        readOnly={true}
                                                        disabled
                                                        size={xs || sm || md ? "sm" : "lg"}
                                                        className={styles.inputBox}
                                                        type="text"
                                                        value={base_token ? base_token.symbol : ""}
                                                    />
                                                </div>
                                            </HStack>
                                        </Flex>
                                    </VStack>
                                </HStack>
                                <HStack w="100%" spacing={xs || sm || md ? 10 : 12} style={{ flexDirection: lg ? "column" : "row" }}>
                                    {quote_token ? (
                                        <VStack spacing={3}>
                                            <Image src={quote_token.icon} width={200} height={200} alt="Image Frame" />
                                            <ShowExtensions extension_flag={quote_token.extensions} />
                                        </VStack>
                                    ) : (
                                        <VStack
                                            justify="center"
                                            align="center"
                                            width={200}
                                            height={200}
                                            style={{
                                                cursor: "pointer",
                                            }}
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

                                    <VStack spacing={8} align="start" width="100%">
                                        <HStack spacing={{ base: 2, md: 5 }} className={styles.eachField}>
                                            <Text className={`${styles.textLabel} font-face-kg`} w={{ base: "70px", xl: "78px" }} mb={0}>
                                                Quote Token:
                                            </Text>
                                            <div className={styles.textLabelInputamms} style={{ flexGrow: 1 }}>
                                                <Input
                                                    placeholder="Search Token"
                                                    size={xs || sm || md ? "md" : "lg"}
                                                    required
                                                    className={styles.inputBox}
                                                    type="text"
                                                    value={quote_address}
                                                    readOnly={true}
                                                    onChange={(e) => {
                                                        setQuoteAddress(e.target.value);
                                                    }}
                                                />
                                            </div>
                                            {/*<div style={{ marginLeft: "12px" }}>
                                                <label className={styles.label}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            handleSetQuoteData();
                                                        }}
                                                        className={styles.browse}
                                                        style={{ cursor: "pointer", padding: "5px 10px" }}
                                                    >
                                                        Search
                                                    </button>
                                                </label>
                                            </div>*/}
                                        </HStack>

                                        <HStack spacing={{ base: 2, md: 5 }} className={styles.eachField}>
                                            <Text
                                                className={`${styles.textLabel} font-face-kg`}
                                                w={{ base: "70px", xl: "78px" }}
                                                flexShrink={0}
                                                mb={0}
                                            >
                                                Name:
                                            </Text>

                                            <div className={styles.textLabelInputamms} style={{ flexGrow: 1 }}>
                                                <Input
                                                    placeholder="Token Name"
                                                    readOnly={true}
                                                    disabled
                                                    size={xs || sm || md ? "md" : "lg"}
                                                    className={styles.inputBox}
                                                    type="text"
                                                    value={quote_token ? quote_token.name : ""}
                                                />
                                            </div>
                                            <Text className={`${styles.textLabel} font-face-kg`} w={{ base: "70px", xl: "auto" }} mb={0}>
                                                Symbol:
                                            </Text>

                                            <div className={styles.textLabelInputamms} style={{ flexGrow: 1 }}>
                                                <Input
                                                    // pl={9}
                                                    bg="#494949"
                                                    placeholder="Token Symbol"
                                                    readOnly={true}
                                                    disabled
                                                    size={xs || sm || md ? "md" : "lg"}
                                                    className={styles.inputBox}
                                                    type="text"
                                                    value={quote_token ? quote_token.symbol : ""}
                                                />
                                            </div>
                                        </HStack>
                                    </VStack>
                                </HStack>
                                <VStack width={"100%"} spacing={3}>
                                    <HStack spacing={{ base: 2, md: 5 }} w="100%" className={styles.eachField}>
                                        <Text className={`${styles.textLabel} font-face-kg`} w={{ base: "70px", xl: "170px" }} mb={7}>
                                            Base Amount:
                                        </Text>

                                        <div className={styles.textLabelInputamms} style={{ flexGrow: 1 }}>
                                            <Input
                                                bg="#494949"
                                                placeholder="Enter Base Amount"
                                                size={xs || sm || md ? "md" : "lg"}
                                                className={styles.inputBox}
                                                type="text"
                                                value={base_amount}
                                                onChange={(e) => {
                                                    setBaseAmount(e.target.value);
                                                }}
                                            />
                                            <Flex w={"100%"} gap={1} mt={2} alignItems={"center"} justifyContent={"flex-end"} opacity={0.5}>
                                                <Text textAlign={"right"} mb={0} fontFamily={"ChalkBoard"} fontSize={"18px"}>
                                                    Available Balance: {baseBalance}
                                                </Text>
                                                {base_token ? (
                                                    <Image width={35} height={35} src={base_token.icon} alt="base balance" />
                                                ) : (
                                                    ""
                                                )}
                                            </Flex>
                                        </div>
                                    </HStack>
                                    <HStack spacing={{ base: 2, md: 5 }} w="100%" className={styles.eachField}>
                                        <Text className={`${styles.textLabel} font-face-kg`} w={{ base: "70px", xl: "170px" }} mb={7}>
                                            Quote Amount:
                                        </Text>

                                        <div className={styles.textLabelInputamms} style={{ flexGrow: 1 }}>
                                            <Input
                                                bg="#494949"
                                                placeholder="Enter Quote Amount"
                                                size={xs || sm || md ? "md" : "lg"}
                                                className={styles.inputBox}
                                                type="text"
                                                value={quote_amount}
                                                onChange={(e) => {
                                                    setQuoteAmount(e.target.value);
                                                }}
                                            />
                                            <Flex w={"100%"} gap={1} mt={2} alignItems={"center"} justifyContent={"flex-end"}>
                                                <Text textAlign={"right"} mb={0} fontFamily={"ChalkBoard"} fontSize={"18px"} opacity={0.5}>
                                                    Available Balance: {quoteBalance}
                                                </Text>
                                                {quote_token ? (
                                                    <Image width={35} height={35} src={quote_token.icon} alt="quote balance" />
                                                ) : (
                                                    ""
                                                )}
                                            </Flex>
                                        </div>
                                    </HStack>
                                    {/*<HStack spacing={0} w="100%" className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: xs || sm || md ? "100px" : "140px" }}>
                                        Short Frac:
                                    </div>

                                    <div className={styles.textLabelInputamms} style={{flexGrow: 1}}>
                                        <Input
                                            bg="#494949"
                                            placeholder="Enter Short Pool Fraction (10 = 10% of base amount)"
                                            size={xs || sm || md ? "md" : "lg"}
                                            maxLength={8}
                                            className={styles.inputBox}
                                            type="text"
                                            value={short_fraction}
                                            onChange={(e) => {
                                                setShortFraction(e.target.value);
                                            }}
                                        />
                                    </div>
                                </HStack>*/}
                                    <HStack spacing={{ base: 2, md: 5 }} w="100%" className={styles.eachField}>
                                        <Text className={`${styles.textLabel} font-face-kg`} w={{ base: "70px", xl: "170px" }} mb={0}>
                                            AMM LP Fee:
                                        </Text>

                                        <div className={styles.textLabelInputamms} style={{ flexGrow: 1 }}>
                                            <Input
                                                bg="#494949"
                                                placeholder="Enter AMM Fee (Bps - 100 = 1%)"
                                                size={xs || sm || md ? "md" : "lg"}
                                                maxLength={8}
                                                className={styles.inputBox}
                                                type="text"
                                                value={swap_fee}
                                                disabled={true}
                                            />
                                        </div>
                                    </HStack>
                                </VStack>
                                {/*<HStack spacing={0} w="100%" className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: xs || sm || md ? "100px" : "140px" }}>
                                        Borrow Fee:
                                    </div>

                                    <div className={styles.textLabelInputamms} style={{flexGrow: 1}}>
                                        <Input
                                            bg="#494949"
                                            placeholder="Enter Short Borrow Fee (Bps - 100 = 1%)"
                                            size={xs || sm || md ? "md" : "lg"}
                                            maxLength={8}
                                            className={styles.inputBox}
                                            type="text"
                                            value={borrow_cost}
                                            onChange={(e) => {
                                                setBorrowCost(e.target.value);
                                            }}
                                        />
                                    </div>
                                </HStack>*/}
                            </VStack>
                        </HStack>
                        <VStack w="100%" spacing={30} my={18}>
                            <div className={styles.launchBodyLowerHorizontal}>
                                <div className={styles.eachField}>
                                    <Image width={40} height={40} src="/images/web.png" alt="Website Logo" />
                                    <div className={styles.textLabelInputamms} style={{ flexGrow: 1 }}>
                                        <input
                                            placeholder="Enter your Website URL (optional)"
                                            className={styles.inputBox}
                                            style={{ fontSize: xs || sm || md ? "medium" : "large" }}
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

                                    <div className={styles.textLabelInputamms} style={{ flexGrow: 1 }}>
                                        <input
                                            className={styles.inputBox}
                                            placeholder="Enter your Telegram Invite URL (optional)"
                                            style={{ fontSize: xs || sm || md ? "medium" : "large" }}
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

                                    <div className={styles.textLabelInputamms} style={{ flexGrow: 1 }}>
                                        <input
                                            required
                                            className={styles.inputBox}
                                            placeholder="Enter your Twitter URL (optional)"
                                            style={{ fontSize: xs || sm || md ? "medium" : "large" }}
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

                                    <div className={styles.textLabelInputamms} style={{ flexGrow: 1 }}>
                                        <input
                                            className={styles.inputBox}
                                            placeholder="Enter your Discord Invite URL (optional)"
                                            style={{ fontSize: xs || sm || md ? "medium" : "large" }}
                                            type="text"
                                            value={discord}
                                            onChange={(e) => {
                                                setDiscord(e.target.value);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <HStack spacing={15} w="100%" className={styles.eachField}>
                                <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: sm ? "120px" : "170px" }}>
                                    WRAP {Config.token}:
                                </div>
                                <HStack>
                                    <Switch
                                        ml={2}
                                        py={2}
                                        size={lg ? "md" : "lg"}
                                        isChecked={wrapETH === 1}
                                        onChange={() => setWrapETH(wrapETH === 0 ? 1 : 0)}
                                    />
                                    <Tooltip
                                        label={"Program will wrap the quote token for you"}
                                        hasArrow
                                        w={270}
                                        fontSize="large"
                                        offset={[0, 10]}
                                    >
                                        <Image width={25} height={25} src="/images/help.png" alt="Help" />
                                    </Tooltip>
                                </HStack>
                            </HStack>
                            <HStack spacing={15} w="100%" className={styles.eachField}>
                                <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: sm ? "120px" : "170px" }}>
                                    BURN LP TOKENS:
                                </div>
                                <HStack>
                                    <Switch
                                        ml={2}
                                        py={2}
                                        size={lg ? "md" : "lg"}
                                        isChecked={burnLP === 1}
                                        onChange={() => setBurnLP(burnLP === 0 ? 1 : 0)}
                                    />
                                    <Tooltip
                                        label={"Program will burn your LP tokens rather than transferring them to you"}
                                        hasArrow
                                        w={270}
                                        fontSize="large"
                                        offset={[0, 10]}
                                    >
                                        <Image width={25} height={25} src="/images/help.png" alt="Help" />
                                    </Tooltip>
                                </HStack>
                            </HStack>
                            {/*
                            <HStack spacing={15} w="100%" className={styles.eachField}>
                                <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: sm ? "120px" : "170px" }}>
                                    BONDING CURVE:
                                </div>
                                <HStack>
                                    <Switch
                                        ml={2}
                                        py={2}
                                        size={lg ? "md" : "lg"}
                                        isChecked={lowLiquidity === 1}
                                        onChange={() => setLowLiquidity(lowLiquidity === 0 ? 1 : 0)}
                                    />
                                    <Tooltip
                                        label={
                                            "AMM has two phases, one at low liquidity, where the pool behaves like a bonding curve.  There is reduced price impact and price acceleration.  At high liquidity it transition to a standard constant product AMM."
                                        }
                                        hasArrow
                                        w={270}
                                        fontSize="large"
                                        offset={[0, 10]}
                                    >
                                        <Image width={25} height={25} src="/images/help.png" alt="Help" />
                                    </Tooltip>
                                </HStack>
                            </HStack>
                            */}
                        </VStack>
                        <HStack mt={md ? 0 : 30}>
                            <button
                                type="button"
                                className={`${styles.nextBtn} font-face-kg`}
                                onClick={() => {
                                    InitExternalAMM(
                                        base_token,
                                        quote_token,
                                        web,
                                        twitter,
                                        telegram,
                                        discord,
                                        parseFloat(base_amount),
                                        parseFloat(quote_amount),
                                        wrapETH,
                                        burnLP,
                                        lowLiquidity,
                                    );
                                }}
                            >
                                Create
                            </button>
                        </HStack>
                    </VStack>
                </form>
            </VStack>
        </Center>
    );
};

export default LaunchAMM;
