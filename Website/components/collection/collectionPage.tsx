import { Dispatch, SetStateAction, useRef, useState, useCallback } from "react";
import styles from "../../styles/LaunchDetails.module.css";

import { Center, VStack, Text, Input, HStack, InputGroup, InputLeftElement, Spinner } from "@chakra-ui/react";

import {
    METAPLEX_META,
    DEBUG,
    SYSTEM_KEY,
    PROGRAM,
    DEFAULT_FONT_SIZE,
    LaunchKeys,
    Config,
    SOL_ACCOUNT_SEED,
    DATA_ACCOUNT_SEED,
    FEES_PROGRAM,
} from "../../components/Solana/constants";
import {
    LaunchDataUserInput,
    get_current_blockhash,
    send_transaction,
    create_LaunchData,
    LaunchData,
    bignum_to_num,
    request_current_balance,
    uInt32ToLEBytes,
} from "../../components/Solana/state";
import { serialise_LaunchCollection_instruction } from "./collectionState";
import { WebIrys } from "@irys/sdk";
import { useWallet } from "@solana/wallet-adapter-react";
import {
    Keypair,
    PublicKey,
    Transaction,
    TransactionInstruction,
    Connection,
    ComputeBudgetProgram,
    SYSVAR_RENT_PUBKEY,
    SystemProgram,
} from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import bs58 from "bs58";

import useResponsive from "../../hooks/useResponsive";
import { useRouter } from "next/router";
import useAppRoot from "../../context/useAppRoot";
import { toast } from "react-toastify";
import { RxSlash } from "react-icons/rx";
import Image from "next/image";
import useEditCollection from "../../hooks/collections/useEditCollection";

interface CollectionPageProps {
    setScreen: Dispatch<SetStateAction<string>>;
}

// Define the Tag type
type Tag = {
    name: string;
    value: string;
};

const CollectionPage = ({ setScreen }: CollectionPageProps) => {
    const router = useRouter();
    const { sm, md, lg } = useResponsive();
    const wallet = useWallet();
    const { newCollectionData } = useAppRoot();

    const [isLoading, setIsLoading] = useState(false);

    const [name, setName] = useState<string>(newCollectionData.current.pagename);
    const [web, setWeb] = useState<string>(newCollectionData.current.web_url);
    const [telegram, setTelegram] = useState<string>(newCollectionData.current.tele_url);
    const [twitter, setTwitter] = useState(newCollectionData.current.twt_url);
    const [discord, setDiscord] = useState(newCollectionData.current.disc_url);
    const [banner_name, setBannerName] = useState<string>("");
    const signature_ws_id = useRef<number | null>(null);

    const { EditCollection } = useEditCollection();

    const handleNameChange = (e) => {
        setName(e.target.value);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];

        if (file) {
            if (file.size <= 4194304) {
                newCollectionData.current.banner_file = file;
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

    const check_signature_update = useCallback(
        async (result: any) => {
            console.log(result);
            // if we have a subscription field check against ws_id

            setIsLoading(false);

            if (result.err !== null) {
                toast.error("Transaction failed, please try again", {
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                });
                return;
            }

            if (signature_ws_id.current === 1) {
                await EditCollection();
            }
            signature_ws_id.current = null;
        },
        [EditCollection],
    );

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

        if (newCollectionData.current.banner_file === null) {
            toast.error("Please select a banner image.");
            return false;
        }

        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(name), Buffer.from("Collection")], PROGRAM)[0];

        let balance = 0;

        if (newCollectionData.current.edit_mode === false) {
            balance = await request_current_balance("", launch_data_account);
        }

        console.log("check balance", name, launch_data_account.toString(), balance);

        if (balance > 0) {
            toast.error("Page name already exists");
            return false;
        }

        newCollectionData.current.pagename = name;
        newCollectionData.current.web_url = web;
        newCollectionData.current.twt_url = twitter;
        newCollectionData.current.disc_url = discord;
        newCollectionData.current.tele_url = telegram;

        return true;
    }

    async function nextPage(e) {
        if (await setData(e)) setScreen("book");
    }

    async function prevPage(e) {
        if (await setData(e)) setScreen("step 3");
    }

    async function Launch(e) {
        if (await setData(e)) CreateLaunch();
    }

    const CreateLaunch = useCallback(async () => {
        setIsLoading(true);
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        console.log(newCollectionData.current.icon_url);
        console.log(newCollectionData.current.banner_url);
        // if this is in edit mode then just call that function
        if (newCollectionData.current.edit_mode === true) {
            await EditCollection();
            return;
        }

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        const irys_wallet = { name: "phantom", provider: wallet };
        const irys = new WebIrys({
            url: Config.IRYS_URL,
            token: "solana",
            wallet: irys_wallet,
            config: {
                providerUrl: Config.RPC_NODE,
            },
        });

        if (newCollectionData.current.icon_url == "" || newCollectionData.current.banner_url == "") {
            const uploadImageToArweave = toast.loading("(1/4) Preparing to upload images - transferring balance to Arweave.");

            let file_list: File[] = [];
            file_list.push(newCollectionData.current.icon_file);
            file_list.push(newCollectionData.current.banner_file);
            for (let i = 0; i < newCollectionData.current.nft_images.length; i++) {
                file_list.push(newCollectionData.current.nft_images[i]);
            }

            let price;

            try {
                let size = 0;
                for (let i = 0; i < file_list.length; i++) {
                    size += file_list[i].size;
                }
                price = await irys.getPrice(size);
            } catch (e) {
                toast.update(uploadImageToArweave, {
                    render: e,
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                });
                return;
            }

            // console.log("balance_before", balance_before.toString());

            try {
                let txArgs = await get_current_blockhash("");

                var tx = new Transaction(txArgs).add(
                    SystemProgram.transfer({
                        fromPubkey: wallet.publicKey,
                        toPubkey: new PublicKey(Config.IRYS_WALLET),
                        lamports: Number(price),
                    }),
                );
                tx.feePayer = wallet.publicKey;
                let signed_transaction = await wallet.signTransaction(tx);
                const encoded_transaction = bs58.encode(signed_transaction.serialize());

                var transaction_response = await send_transaction("", encoded_transaction);
                let signature = transaction_response.result;

                let fund_check = await irys.funder.submitFundTransaction(signature);

                console.log(fund_check, fund_check.data);

                //await irys.fund(price);
                toast.update(uploadImageToArweave, {
                    render: "Your account has been successfully funded.",
                    type: "success",
                    isLoading: false,
                    autoClose: 2000,
                });
            } catch (error) {
                toast.update(uploadImageToArweave, {
                    render: "Oops! Something went wrong during funding. Please try again later. ",
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                });
                return;
            }

            let tags: Tag[] = [];

            for (let i = 0; i < file_list.length; i++) {
                tags.push({ name: "Content-Type", value: file_list[i].type });
            }

            const uploadToArweave = toast.loading("Sign to upload images on Arweave.");

            let receipt;

            try {
                receipt = await irys.uploadFolder(file_list, {
                    //@ts-ignore
                    tags,
                });
                toast.update(uploadToArweave, {
                    render: `Images have been uploaded successfully!
                    View: https://gateway.irys.xyz/${receipt.id}`,
                    type: "success",
                    isLoading: false,
                    autoClose: 2000,
                });
            } catch (error) {
                toast.update(uploadToArweave, {
                    render: `Failed to upload images, please try again later.`,
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                });

                return;
            }

            let manifestId = receipt.manifestId;

            let icon_url = "https://gateway.irys.xyz/" + receipt.manifest.paths[newCollectionData.current.icon_file.name].id;
            let banner_url = "https://gateway.irys.xyz/" + receipt.manifest.paths[newCollectionData.current.banner_file.name].id;

            newCollectionData.current.icon_url = icon_url;
            newCollectionData.current.banner_url = banner_url;
            newCollectionData.current.nft_image_url = "https://gateway.irys.xyz/" + manifestId + "/";
        }

        if (newCollectionData.current.uri == "") {
            // console.log(icon_url, banner_url);
            var metadata = {
                name: newCollectionData.current.collection_name,
                symbol: newCollectionData.current.collection_symbol,
                description: newCollectionData.current.description,
                image: newCollectionData.current.icon_url,
            };

            const jsn = JSON.stringify(metadata);
            const blob = new Blob([jsn], { type: "application/json" });
            const json_file = new File([blob], "metadata.json");

            let file_list: File[] = [];
            file_list.push(json_file);

            let fr = new FileReader();
            fr.onload = function () {
                let parsedJSON = JSON.parse(fr.result.toString());
                console.log(parsedJSON);
                // your code to consume the json
            };
            for (let i = 0; i < newCollectionData.current.nft_metadata.length; i++) {
                let text = await newCollectionData.current.nft_metadata[i].text();
                let json = JSON.parse(text);
                let index = newCollectionData.current.nft_metadata[i].name.split(".")[0];
                json["image"] = newCollectionData.current.nft_image_url + index + ".png";
                console.log(json);

                const blob = new Blob([JSON.stringify(json)], { type: "application/json" });
                const json_file = new File([blob], newCollectionData.current.nft_metadata[i].name);
                file_list.push(json_file);
            }

            let size = 0;
            for (let i = 0; i < file_list.length; i++) {
                size += file_list[i].size;
            }

            console.log(file_list);

            const json_price = await irys.getPrice(size);

            const fundMetadata = toast.loading("(2/4) Preparing to upload token metadata - transferring balance to Arweave.");

            try {
                let txArgs = await get_current_blockhash("");

                var tx = new Transaction(txArgs).add(
                    SystemProgram.transfer({
                        fromPubkey: wallet.publicKey,
                        toPubkey: new PublicKey(Config.IRYS_WALLET),
                        lamports: Number(json_price),
                    }),
                );
                tx.feePayer = wallet.publicKey;
                let signed_transaction = await wallet.signTransaction(tx);
                const encoded_transaction = bs58.encode(signed_transaction.serialize());

                var transaction_response = await send_transaction("", encoded_transaction);

                let signature = transaction_response.result;

                let fund_check = await irys.funder.submitFundTransaction(signature);

                console.log(fund_check, fund_check.data["confirmed"]);

                //await irys.fund(json_price);
                toast.update(fundMetadata, {
                    render: "Your account has been successfully funded.",
                    type: "success",
                    isLoading: false,
                    autoClose: 2000,
                });
            } catch (error) {
                toast.update(fundMetadata, {
                    render: "Something went wrong. Please try again later. ",
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                });
                return;
            }

            let json_tags: Tag[] = [];
            for (let i = 0; i < file_list.length; i++) {
                json_tags.push({ name: "Content-Type", value: "application/json" });
            }

            const uploadMetadata = toast.loading("Sign to upload token metadata on Arweave");

            let json_receipt;

            try {
                json_receipt = await irys.uploadFolder(file_list, {
                    //@ts-ignore
                    json_tags,
                });

                toast.update(uploadMetadata, {
                    render: `Token metadata has been uploaded successfully!
                    View: https://gateway.irys.xyz/${json_receipt.id}`,
                    type: "success",
                    isLoading: false,
                    pauseOnFocusLoss: false,
                    autoClose: 2000,
                });
            } catch (error) {
                toast.update(uploadMetadata, {
                    render: `Failed to upload token metadata, please try again later.`,
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                });

                return;
            }

            console.log(json_receipt);

            let manifestId = json_receipt.manifestId;

            let collection_meta_url = "https://gateway.irys.xyz/" + json_receipt.manifest.paths[json_file.name].id;

            newCollectionData.current.uri = collection_meta_url;
            newCollectionData.current.nft_metadata_url = "https://gateway.irys.xyz/" + manifestId + "/";

            console.log(newCollectionData.current.uri, newCollectionData.current.nft_metadata_url);
        }

        let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

        let launch_data_account = PublicKey.findProgramAddressSync(
            [Buffer.from(newCollectionData.current.pagename), Buffer.from("Collection")],
            PROGRAM,
        )[0];

        var collection_mint_pubkey = newCollectionData.current.token_keypair.publicKey;

        let collection_meta_key = PublicKey.findProgramAddressSync(
            [Buffer.from("metadata"), METAPLEX_META.toBuffer(), collection_mint_pubkey.toBuffer()],
            METAPLEX_META,
        )[0];

        let collection_token_account = await getAssociatedTokenAddress(
            collection_mint_pubkey, // mint
            program_sol_account, // owner
            true, // allow owner off curve
            TOKEN_2022_PROGRAM_ID,
        );

        let collection_master_key = PublicKey.findProgramAddressSync(
            [Buffer.from("metadata"), METAPLEX_META.toBuffer(), collection_mint_pubkey.toBuffer(), Buffer.from("edition")],
            METAPLEX_META,
        )[0];

        let team_wallet = new PublicKey(newCollectionData.current.team_wallet);

        console.log("mint", collection_mint_pubkey.toString());

        const instruction_data = serialise_LaunchCollection_instruction(newCollectionData.current);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },

            { pubkey: program_sol_account, isSigner: false, isWritable: true },

            { pubkey: collection_mint_pubkey, isSigner: true, isWritable: true },
            { pubkey: collection_token_account, isSigner: false, isWritable: true },
            { pubkey: collection_meta_key, isSigner: false, isWritable: true },
            { pubkey: collection_master_key, isSigner: false, isWritable: true },
            { pubkey: newCollectionData.current.token_mint, isSigner: false, isWritable: true },
        ];

        account_vector.push({ pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: true });
        account_vector.push({ pubkey: METAPLEX_META, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false });

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(list_instruction);
        transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));

        transaction.partialSign(newCollectionData.current.token_keypair);

        const createLaunch = toast.loading("(3/4) Setting up your launch accounts");

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            if (transaction_response.result === "INVALID") {
                console.log(transaction_response);
                toast.error("Transaction failed, please try again");
                return;
            }

            signature_ws_id.current = 1;

            let signature = transaction_response.result;

            if (DEBUG) {
                console.log("list signature: ", signature);
            }

            toast.update(createLaunch, {
                render: "Launch account is ready",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });

            connection.onSignature(signature, check_signature_update, "confirmed");
        } catch (error) {
            console.log(error);
            setIsLoading(false);
            toast.update(createLaunch, {
                render: "We couldn't create your launch accounts. Please try again.",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }
    }, [wallet, newCollectionData, EditCollection, check_signature_update]);

    return (
        <Center style={{ background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)" }} width="100%">
            <VStack w="100%" style={{ paddingBottom: md ? 35 : "75px" }}>
                <Text mb={8} align="start" className="font-face-kg" color={"white"} fontSize="x-large">
                    Page Information:
                </Text>
                <form onSubmit={nextPage} style={{ width: lg ? "100%" : "1200px" }}>
                    <VStack px={lg ? 4 : 12}>
                        <div className={styles.launchBodyUpper}>
                            <div className={styles.launchBodyUpperFields}>
                                <HStack spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "110px" : "147px" }}>
                                        Page Name:
                                    </div>

                                    <InputGroup style={{ width: lg ? "100%" : "50%", position: "relative" }}>
                                        <InputLeftElement color="white">
                                            <RxSlash size={22} style={{ opacity: 0.5, marginTop: lg ? 0 : 8 }} />
                                        </InputLeftElement>

                                        <Input
                                            pl={8}
                                            bg="#494949"
                                            size={lg ? "md" : "lg"}
                                            required
                                            placeholder="Yourpagename"
                                            className={styles.inputBox}
                                            type="text"
                                            value={name}
                                            onChange={handleNameChange}
                                        />
                                    </InputGroup>
                                </HStack>

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
                                                    cursor: newCollectionData.current.edit_mode === true ? "not-allowed" : "pointer",
                                                    padding: "5px 10px",
                                                }}
                                            >
                                                BROWSE
                                            </span>
                                        </label>
                                    </div>

                                    <Text m={0} ml={5} color="white" className="font-face-rk" fontSize={lg ? "medium" : "lg"}>
                                        {newCollectionData.current.banner_file !== null ? banner_name : "No File Selected"}
                                    </Text>
                                </HStack>
                            </div>
                        </div>

                        <VStack w="100%" spacing={30} mt={42} mb={25}>
                            <div className={styles.launchBodyLowerHorizontal}>
                                <div className={styles.eachField}>
                                    <Image width={40} height={40} src="/images/web.png" alt="Website Logo" />
                                    <div className={styles.textLabelInput}>
                                        <input
                                            placeholder="Enter your Website URL"
                                            className={styles.inputBox}
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
                                            className={styles.inputBox}
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
                                            className={styles.inputBox}
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
                                            className={styles.inputBox}
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

                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 20,
                                marginTop: -1,
                            }}
                        >
                            <button
                                type="button"
                                onClick={(e) => {
                                    setScreen("step 3");
                                }}
                                className={`${styles.nextBtn} font-face-kg `}
                            >
                                Go Back
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    if (!isLoading) {
                                        Launch(e);
                                    }
                                }}
                                className={`${styles.nextBtn} font-face-kg `}
                            >
                                {isLoading ? <Spinner /> : "CONFIRM (4/4)"}
                            </button>
                        </div>
                    </VStack>
                </form>
            </VStack>
        </Center>
    );
};

export default CollectionPage;
