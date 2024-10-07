import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Center, VStack, Text, HStack, Input, chakra, Flex, Box } from "@chakra-ui/react";
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
import styles2 from "../../styles/LaunchDetails.module.css";

import { Keypair, PublicKey, Connection, Transaction, ComputeBudgetProgram, SystemProgram } from "@solana/web3.js";
import { toast } from "react-toastify";

import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import useResponsive from "../../hooks/useResponsive";
import {
    ListingData,
    MintData,
    getRecentPrioritizationFees,
    get_current_blockhash,
    request_current_balance,
    send_transaction,
} from "../Solana/state";
import { Config, Extensions, METAPLEX_META, NetworkConfig, PROGRAM, Socials } from "../Solana/constants";
import ShowExtensions from "../Solana/extensions";
import useInitAMM from "../../hooks/cookAMM/useInitAMM";
import { setMintData } from "../amm/launch";
import { getPoolStateAccount } from "../../hooks/raydium/useCreateCP";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import useIrysUploader from "../../hooks/useIrysUploader";
import bs58 from "bs58";
import useCreateListing from "../../hooks/listings/useCreateListing";
import useCreateUnverifiedListing from "../../hooks/listings/useCreateUnverifiedListing";

// Define the Tag type
type Tag = {
    name: string;
    value: string;
};

export interface NewListing {
    network: string;
    user: string;
    token: string;
    name: string;
    symbol: string;
    icon: string;
    uri: string;
    banner: string;
    description: string;
    website: string;
    telegram: string;
    twitter: string;
    discord: string;
}

interface DiscordPost {
    network: string;
    user: string;
    token: string;
}

const fetchCPMM = async (connection: Connection, address: PublicKey, setRaydiumPool: Dispatch<SetStateAction<boolean>>) => {
    let pool_state_account = await connection.getAccountInfo(address);
    console.log("pool state:", pool_state_account);
    if (pool_state_account) {
        setRaydiumPool(true);
    }
};

const CreateListing = () => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const { sm, md, lg, xl } = useResponsive();
    const [base_address, setBaseAddress] = useState<string>("");
    const [base_token, setBaseToken] = useState<MintData | null>(null);
    const [raydium_pool, setRaydiumPool] = useState<boolean>(false);

    const [description, setDescription] = useState<string>("");
    const [web, setWeb] = useState<string>("");
    const [telegram, setTelegram] = useState<string>("");
    const [twitter, setTwitter] = useState("");
    const [discord, setDiscord] = useState("");
    const [banner_name, setBannerName] = useState<string>("");
    const [banner, setBanner] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [admin, setAdmin] = useState<boolean>(false);
    const [creator, setCreator] = useState<string>("");

    const { CreateUnverifiedListing } = useCreateUnverifiedListing();
    const { CreateListing } = useCreateListing();

    const { getIrysUploader } = useIrysUploader(wallet);

    async function handleSetCreator() {
        if (base_token === null) {
            return;
        }
        try {
            let creator_key = new PublicKey(creator);
            let unverified_key = PublicKey.findProgramAddressSync(
                [base_token.mint.address.toBytes(), creator_key.toBytes(), Buffer.from("UnverifiedListing")],
                PROGRAM,
            )[0];
            let unverified_account = await connection.getAccountInfo(unverified_key);
            const [unverified_listing] = ListingData.struct.deserialize(unverified_account.data);

            console.log(unverified_listing);
            if (unverified_listing.name !== base_token.name) {
                toast.error("Listing and token do not match.");
                return;
            }
            if (unverified_listing.symbol !== base_token.symbol) {
                toast.error("Listing and token do not match.");
                return;
            }
            if (unverified_listing.meta_url !== base_token.uri) {
                toast.error("Listing and token do not match.");
                return;
            }
            if (unverified_listing.icon !== base_token.icon) {
                toast.error("Listing and token do not match.");
                return;
            }
            if (!unverified_listing.mint.equals(base_token.mint.address)) {
                toast.error("Listing and token do not match.");
                return;
            }

            setBannerName(unverified_listing.banner);
            setDescription(unverified_listing.description);
            setWeb(unverified_listing.socials[Socials.Website]);
            setTelegram(unverified_listing.socials[Socials.Telegram]);
            setTwitter(unverified_listing.socials[Socials.Twitter]);
            setDiscord(unverified_listing.socials[Socials.Discord]);
        } catch (error) {
            toast.error("Error getting listing");
            return;
        }
    }

    async function handleSetBaseData() {
        let mint_data = await setMintData(base_address);
        if (mint_data === null) {
            toast.error("Token not found");
            return;
        }

        setBaseToken(mint_data);
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];

        if (!file.type.startsWith("image")) {
            toast.error("Please upload an image file.");
            return;
        }

        if (file) {
            if (file.size <= 4194304) {
                setBanner(file);
                setBannerName(file.name);
            } else {
                alert("File size exceeds 4MB limit.");
            }
        }
    };

    useEffect(() => {
        if (base_token === null) {
            return;
        }
        let quote_mint = new PublicKey("So11111111111111111111111111111111111111112");
        let pool_state = getPoolStateAccount(base_token.mint.address, quote_mint);
        fetchCPMM(connection, pool_state, setRaydiumPool);
    }, [connection, base_token]);

    useEffect(() => {
        if (wallet === null || wallet.publicKey === null) {
            setAdmin(false);
            return;
        }
        if (
            wallet.publicKey.toString() === "FxVpjJ5AGY6cfCwZQP5v8QBfS4J2NPa62HbGh1Fu2LpD" ||
            wallet.publicKey.toString() === "7oAfRLy81EwMJAXNKbZFaMTayBFoBpkua4ukWiCZBZz5"
        ) {
            setAdmin(true);
        } else {
            setAdmin(false);
        }
    }, [wallet]);

    const post_discord = async (listing: NewListing) => {
        const response = await fetch("/.netlify/functions/post_discord", {
            method: "POST",
            body: JSON.stringify(listing),
            headers: {
                "Content-Type": "application/json",
            },
        });

        const result = await response.json();
        console.log(result);
        return result.body;
    };

    async function sendRequestData(e, accept: boolean): Promise<void> {
        e.preventDefault();

        let new_listing: NewListing = {
            network: Config.NETWORK,
            user: creator,
            token: base_token.mint.address.toString(),
            name: base_token.name,
            symbol: base_token.symbol,
            icon: base_token.icon,
            uri: base_token.uri,
            banner: "",
            description: description,
            website: web,
            telegram: telegram,
            twitter: twitter,
            discord: discord,
        };

        await CreateListing(new_listing, accept);
    }

    async function setRequestData(e): Promise<void> {
        e.preventDefault();

        if (description.length > 250) {
            toast.error("Description should be less than 250 characters long");
            return;
        }

        if (description.length === 0) {
            toast.error("Description should be more than 0 characters long");
            return;
        }

        if (banner === null) {
            toast.error("Please select a banner image.");
            return;
        }

        const irys = await getIrysUploader();

        let listing_account = PublicKey.findProgramAddressSync([base_token.mint.address.toBytes(), Buffer.from("Listing")], PROGRAM)[0];

        let balance = await request_current_balance("", listing_account);

        console.log("check balance", listing_account.toString(), balance);

        if (balance > 0) {
            toast.error("Listing already exists");
            return;
        }

        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);

        const uploadImageToArweave = toast.info("(1/2) Preparing to upload images - transferring balance to Arweave.");

        let price = await irys.getPrice(banner.size);

        console.log("price", Number(price));

        try {
            //await irys.fund(price);

            let txArgs = await get_current_blockhash("");
            let irys_address = await irys.utils.getBundlerAddress();
            var tx = new Transaction(txArgs).add(
                ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }),
                SystemProgram.transfer({
                    fromPubkey: wallet.publicKey,
                    toPubkey: new PublicKey(irys_address),
                    lamports: Number(price),
                }),
            );
            tx.feePayer = wallet.publicKey;
            let signed_transaction = await wallet.signTransaction(tx);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);
            console.log(transaction_response);

            let signature = transaction_response.result;

            let fund_check = await irys.funder.submitFundTransaction(signature);

            console.log(fund_check, fund_check.data["confirmed"]);

            toast.update(uploadImageToArweave, {
                render: "Your account has been successfully funded.",
                type: "success",
                isLoading: false,
                autoClose: 2000,
            });
        } catch (error) {
            setIsLoading(false);

            toast.update(uploadImageToArweave, {
                render: "Oops! Something went wrong during funding. Please try again later. ",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }

        const tags: Tag[] = [{ name: "Content-Type", value: banner.type }];

        const uploadToArweave = toast.info("Sign to upload images on Arweave.");

        let receipt;

        try {
            receipt = await irys.uploadFolder([banner], {
                //@ts-ignore
                tags,
            });
            toast.update(uploadToArweave, {
                render: `Image have been uploaded successfully!
                View: https://gateway.irys.xyz/${receipt.id}`,
                type: "success",
                isLoading: false,
                autoClose: 2000,
            });

            console.log(receipt);

            let banner_url = "https://gateway.irys.xyz/" + receipt.manifest.paths[banner.name].id;

            let new_listing: NewListing = {
                network: Config.NETWORK,
                user: wallet.publicKey.toString(),
                token: base_token.mint.address.toString(),
                name: base_token.name,
                symbol: base_token.symbol,
                icon: base_token.icon,
                uri: base_token.uri,
                banner: banner_url,
                description: description,
                website: web,
                telegram: telegram,
                twitter: twitter,
                discord: discord,
            };

            await CreateUnverifiedListing(new_listing);

            let new_post: DiscordPost = {
                network: Config.NETWORK,
                user: wallet.publicKey.toString(),
                token: base_token.mint.address.toString(),
            };

            await post_discord(new_listing);
        } catch (error) {
            setIsLoading(false);

            toast.update(uploadToArweave, {
                render: `Failed to upload image, please try again later.`,
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });

            return;
        }
    }

    async function confirm(e, accept: boolean) {
        if (admin) {
            await sendRequestData(e, accept);
            return;
        }
        await setRequestData(e);
    }

    return (
        <Center
            style={{
                background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)",
            }}
            width="100%"
        >
            <VStack w="100%" style={{ paddingBottom: md ? 35 : "200px" }}>
                <Text align="start" className="font-face-kg" color={"white"} fontSize="x-large">
                    New Listing:
                </Text>
                <form style={{ width: xl ? "100%" : "1200px" }}>
                    <VStack px={lg ? 4 : 12} spacing={25}>
                        <HStack w="100%" spacing={lg ? 10 : 12} style={{ flexDirection: lg ? "column" : "row" }}>
                            <VStack spacing={8} flexGrow={1} align="start" width="100%">
                                <HStack w="100%" spacing={lg ? 10 : 12} style={{ flexDirection: lg ? "column" : "row" }}>
                                    {base_token ? (
                                        <VStack spacing={3}>
                                            <Image
                                                src={base_token.icon}
                                                width={lg ? 180 : 180}
                                                height={lg ? 180 : 180}
                                                alt="Image Frame"
                                                style={{ backgroundSize: "cover", borderRadius: 12 }}
                                            />
                                            <ShowExtensions extension_flag={base_token.extensions} />
                                        </VStack>
                                    ) : (
                                        <VStack
                                            justify="center"
                                            align="center"
                                            style={{
                                                minWidth: lg ? 180 : 180,
                                                minHeight: lg ? 180 : 180,
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

                                    <VStack spacing={8} flexGrow={1} align="start" width="100%">
                                        <HStack spacing={0} className={styles.eachField}>
                                            <div
                                                className={`${styles.textLabel} font-face-kg`}
                                                style={{ minWidth: lg ? "100px" : "120px" }}
                                            >
                                                Token:
                                            </div>

                                            <div className={styles.textLabelInput}>
                                                <Input
                                                    placeholder="Search Token"
                                                    size={lg ? "md" : "lg"}
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
                                                        style={{ cursor: "pointer", padding: lg ? "6px 10px" : "12px 10px" }}
                                                    >
                                                        Search
                                                    </button>
                                                </label>
                                            </div>
                                        </HStack>

                                        <Flex gap={sm ? 8 : 5} w="100%" flexDirection={sm ? "column" : "row"}>
                                            <HStack spacing={5} className={styles.eachField}>
                                                <div
                                                    className={`${styles.textLabel} font-face-kg`}
                                                    style={{ minWidth: lg ? "78px" : "100px" }}
                                                >
                                                    Name:
                                                </div>

                                                <div className={styles.textLabelInput}>
                                                    <Input
                                                        placeholder="Token Name"
                                                        readOnly={true}
                                                        disabled
                                                        size={lg ? "md" : "lg"}
                                                        className={styles.inputBox}
                                                        type="text"
                                                        value={base_token ? base_token.name : ""}
                                                    />
                                                </div>
                                                <div
                                                    className={`${styles.textLabel} font-face-kg`}
                                                    style={{ minWidth: lg ? "78px" : "110px" }}
                                                >
                                                    Symbol:
                                                </div>
                                                <div className={styles.textLabelInput}>
                                                    <Input
                                                        // pl={9}
                                                        bg="#494949"
                                                        placeholder="Token Symbol"
                                                        readOnly={true}
                                                        disabled
                                                        size={lg ? "md" : "lg"}
                                                        className={styles.inputBox}
                                                        type="text"
                                                        value={base_token ? base_token.symbol : ""}
                                                    />
                                                </div>
                                            </HStack>
                                        </Flex>
                                    </VStack>
                                </HStack>
                                {admin ? (
                                    <>
                                        <HStack spacing={0} className={styles.eachField}>
                                            <div
                                                className={`${styles.textLabel} font-face-kg`}
                                                style={{ minWidth: lg ? "100px" : "132px" }}
                                            >
                                                Creator:
                                            </div>

                                            <div className={styles.textLabelInput}>
                                                <Input
                                                    placeholder="Search Token"
                                                    size={lg ? "md" : "lg"}
                                                    required
                                                    className={styles.inputBox}
                                                    type="text"
                                                    value={creator}
                                                    onChange={(e) => {
                                                        setCreator(e.target.value);
                                                    }}
                                                />
                                            </div>

                                            <div style={{ marginLeft: "12px" }}>
                                                <label className={styles.label}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            handleSetCreator();
                                                        }}
                                                        className={styles.browse}
                                                        style={{ cursor: "pointer", padding: "5px 10px" }}
                                                    >
                                                        Search
                                                    </button>
                                                </label>
                                            </div>
                                        </HStack>
                                        <div className={styles2.launchBodyLowerVertical}>
                                            <div className={`${styles2.textLabel} font-face-kg`} style={{ minWidth: "175px" }}>
                                                BANNER:
                                            </div>
                                            <div>
                                                {banner_name !== "" && (
                                                    <Image
                                                        src={banner_name}
                                                        width={lg ? 130 : 200}
                                                        height={lg ? 130 : 200}
                                                        alt="Banner"
                                                        hidden={lg}
                                                        style={{ borderRadius: sm ? "12px" : "8px", backgroundSize: "cover" }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <HStack spacing={0} mt={sm ? 0 : 3} className={styles.eachField}>
                                        <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "110px" : "175px" }}>
                                            Banner:
                                        </div>

                                        <div>
                                            <label className={styles.label}>
                                                <input id="file" type="file" onChange={handleFileChange} />
                                                <span
                                                    className={styles.browse}
                                                    style={{
                                                        cursor: "pointer",
                                                        padding: "5px 10px",
                                                    }}
                                                >
                                                    BROWSE
                                                </span>
                                            </label>
                                        </div>

                                        <Text m={0} ml={5} color="white" className="font-face-rk" fontSize={lg ? "medium" : "lg"}>
                                            {banner !== null ? banner_name : "No File Selected"}
                                        </Text>
                                    </HStack>
                                )}

                                <VStack w="100%" spacing={30} mb={25}>
                                    <div className={styles2.launchBodyLowerVertical}>
                                        <div className={`${styles2.textLabel} font-face-kg`} style={{ minWidth: "175px" }}>
                                            DESCRIPTION:
                                        </div>
                                        <div>
                                            <textarea
                                                maxLength={250}
                                                required
                                                placeholder="Feel free to provide more details about your token, it will be displayed in your listing."
                                                style={{ minHeight: 200 }}
                                                className={`${styles2.inputBox} ${styles2.inputTxtarea}`}
                                                value={description}
                                                onChange={(e) => {
                                                    setDescription(e.target.value);
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles2.launchBodyLowerHorizontal}>
                                        <div className={styles2.eachField}>
                                            <Image width={40} height={40} src="/images/web.png" alt="Website Logo" />
                                            <div className={styles2.textLabelInput}>
                                                <input
                                                    placeholder="Enter your Website URL"
                                                    className={styles2.inputBox}
                                                    type="text"
                                                    value={web}
                                                    onChange={(e) => {
                                                        setWeb(e.target.value);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles2.launchBodyLowerHorizontal}>
                                        <div className={styles2.eachField}>
                                            <Image width={40} height={40} src="/images/tele.png" alt="Telegram" />

                                            <div className={styles2.textLabelInput}>
                                                <input
                                                    className={styles2.inputBox}
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
                                    <div className={styles2.launchBodyLowerHorizontal}>
                                        <div className={styles2.eachField}>
                                            <Image width={40} height={40} src="/images/twt.png" alt="Twitter" />

                                            <div className={styles2.textLabelInput}>
                                                <input
                                                    required
                                                    className={styles2.inputBox}
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

                                    <div className={styles2.launchBodyLowerHorizontal}>
                                        <div className={styles2.eachField}>
                                            <Image width={40} height={40} src="/images/discord.png" alt="Discord" />

                                            <div className={styles2.textLabelInput}>
                                                <input
                                                    className={styles2.inputBox}
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
                            </VStack>
                        </HStack>
                        {admin ? (
                            <HStack>
                                <button
                                    type="button"
                                    className={`${styles.nextBtn} font-face-kg `}
                                    onClick={(e) => {
                                        confirm(e, true);
                                    }}
                                >
                                    Accept
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.nextBtn} font-face-kg `}
                                    onClick={(e) => {
                                        confirm(e, false);
                                    }}
                                >
                                    Reject
                                </button>
                            </HStack>
                        ) : (
                            <button
                                type="button"
                                className={`${styles.nextBtn} font-face-kg `}
                                onClick={(e) => {
                                    confirm(e, true);
                                }}
                            >
                                Request
                            </button>
                        )}
                    </VStack>
                </form>
            </VStack>
        </Center>
    );
};

export default CreateListing;
