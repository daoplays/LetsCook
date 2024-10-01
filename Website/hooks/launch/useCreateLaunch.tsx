import { useCallback, useRef, useState } from "react";

import {
    getRecentPrioritizationFees,
    get_current_blockhash,
    request_current_balance,
    send_transaction,
    serialise_CreateLaunch_instruction,
    uInt32ToLEBytes,
} from "../../components/Solana/state";
import {
    DEBUG,
    SYSTEM_KEY,
    PROGRAM,
    Config,
    LaunchKeys,
    METAPLEX_META,
    SOL_ACCOUNT_SEED,
    DATA_ACCOUNT_SEED,
} from "../../components/Solana/constants";
import { useWallet } from "@solana/wallet-adapter-react";
import {
    PublicKey,
    Transaction,
    TransactionInstruction,
    Connection,
    ComputeBudgetProgram,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import "react-datepicker/dist/react-datepicker.css";
import bs58 from "bs58";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import useAppRoot from "../../context/useAppRoot";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import useEditLaunch from "./useEditLaunch";

import { WebUploader } from "@irys/web-upload";
import { WebEclipseEth, WebSolana } from "@irys/web-upload-solana";

// Define the Tag type
type Tag = {
    name: string;
    value: string;
};

const usuCreateLaunch = () => {
    const wallet = useWallet();
    const router = useRouter();
    const { newLaunchData, checkProgramData } = useAppRoot();
    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);
    const { EditLaunch } = useEditLaunch();

    const getEclipseIrysUploader = async () => {
        if (Config.PROD) {
            const irys = await WebUploader(WebEclipseEth).withProvider(wallet).withRpc(Config.RPC_NODE).mainnet();
            return irys;
        }
        const irys = await WebUploader(WebEclipseEth).withProvider(wallet).withRpc(Config.RPC_NODE).devnet();
        return irys;
    };

    const getSolanaIrysUploader = async () => {
        if (Config.PROD) {
            const irys = await WebUploader(WebSolana).withProvider(wallet).withRpc(Config.RPC_NODE).mainnet();
            return irys;
        }
        const irys = await WebUploader(WebSolana).withProvider(wallet).withRpc(Config.RPC_NODE).devnet();
        return irys;
    };

    const getIrysUploader = async () => {
       if (Config.NETWORK === "eclipse") {
           return getEclipseIrysUploader();
       }
         return getSolanaIrysUploader();
    };

    const check_signature_update = useCallback(
        async (result: any) => {
            // if we have a subscription field check against ws_id
            signature_ws_id.current = null;
            setIsLoading(false);

            if (result.err !== null) {
                toast.error("Transaction failed, please try again");
                return;
            }

            toast.success("Launch (1/2) Complete", {
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });

            await EditLaunch();
            signature_ws_id.current = null;
        },
        [EditLaunch],
    );

    const transaction_failed = useCallback(async () => {
        if (signature_ws_id.current == null) return;

        signature_ws_id.current = null;
        setIsLoading(false);

        toast.error("Transaction not processed, please try again", {
            type: "error",
            isLoading: false,
            autoClose: 3000,
        });
    }, []);

    const CreateLaunch = async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        console.log(newLaunchData.current.icon_url);
        console.log(newLaunchData.current.banner_url);
        // if this is in edit mode then just call that function
        if (newLaunchData.current.edit_mode === true) {
            await EditLaunch();
            return;
        }

        // check if the launch account already exists, if so just skip all this
        let test_launch_data_account = PublicKey.findProgramAddressSync(
            [Buffer.from(newLaunchData.current.pagename), Buffer.from("Launch")],
            PROGRAM,
        )[0];

        let account_balance = await request_current_balance("", test_launch_data_account);
        if (account_balance > 0) {
            await EditLaunch();
            return;
        }
        setIsLoading(true);

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        const irys = await getIrysUploader();

        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);

        if (newLaunchData.current.icon_url == "" || newLaunchData.current.icon_url == "") {
            const uploadImageToArweave = toast.info("(1/4) Preparing to upload images - transferring balance to Arweave.");

            let size = newLaunchData.current.icon_file.size + newLaunchData.current.banner_file.size;
            let atomic_price = await irys.getPrice(Math.ceil(1.1 * size));
            let price = irys.utils.fromAtomic(atomic_price);
            console.log("Uploading ", size, " bytes for ", Number(price), Number(atomic_price));

            try {
            
                let txArgs = await get_current_blockhash("");

                var tx = new Transaction(txArgs).add(
                    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }),
                    SystemProgram.transfer({
                        fromPubkey: wallet.publicKey,
                        toPubkey: new PublicKey(Config.IRYS_WALLET),
                        lamports: Number(atomic_price),
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
                console.log(error)
                toast.update(uploadImageToArweave, {
                    render: "Oops! Something went wrong during funding. Please try again later. ",
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                });
                return;
            }
        
            const tags: Tag[] = [
                { name: "Content-Type", value: newLaunchData.current.icon_file.type },
                { name: "Content-Type", value: newLaunchData.current.banner_file.type },
            ];

            const uploadToArweave = toast.info("Sign to upload images on Arweave.");

            let receipt;

            try {
                receipt = await irys.uploadFolder([newLaunchData.current.icon_file, newLaunchData.current.banner_file], {
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
                setIsLoading(false);

                toast.update(uploadToArweave, {
                    render: `Failed to upload images, please try again later.`,
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                });

                return;
            }

            console.log(receipt);

            let icon_url = "https://gateway.irys.xyz/" + receipt.manifest.paths[newLaunchData.current.icon_file.name].id;
            let banner_url = "https://gateway.irys.xyz/" + receipt.manifest.paths[newLaunchData.current.banner_file.name].id;

            newLaunchData.current.icon_url = icon_url;
            newLaunchData.current.banner_url = banner_url;
        }

        if (newLaunchData.current.uri == "") {
            // console.log(icon_url, banner_url);
            var metadata = {
                name: newLaunchData.current.name,
                symbol: newLaunchData.current.symbol,
                description: newLaunchData.current.description,
                image: newLaunchData.current.icon_url,
            };

            const jsn = JSON.stringify(metadata);
            const blob = new Blob([jsn], { type: "application/json" });
            const json_file = new File([blob], "metadata.json");

            let json_size = newLaunchData.current.icon_file.size + newLaunchData.current.banner_file.size;
            let json_atomic_price = await irys.getPrice(Math.ceil(1.1 * json_size));
            let json_price = irys.utils.fromAtomic(json_atomic_price);
            console.log("Uploading ", json_size, " bytes for ", json_price, json_atomic_price);



            const fundMetadata = toast.info("(2/4) Preparing to upload token metadata - transferring balance to Arweave.");
            try {
                let txArgs = await get_current_blockhash("");

                var tx = new Transaction(txArgs).add(
                    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }),
                    SystemProgram.transfer({
                        fromPubkey: wallet.publicKey,
                        toPubkey: new PublicKey(Config.IRYS_WALLET),
                        lamports: Number(json_atomic_price),
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

                //await irys.fund(json_price);
                toast.update(fundMetadata, {
                    render: "Your account has been successfully funded.",
                    type: "success",
                    isLoading: false,
                    autoClose: 2000,
                });
            } catch (error) {
                setIsLoading(false);

                toast.update(fundMetadata, {
                    render: "Something went wrong. Please try again later. ",
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                });
                return;
            }
            
            const json_tags: Tag[] = [{ name: "Content-Type", value: "application/json" }];

            const uploadMetadata = toast.info("Sign to upload token metadata on Arweave");

            let json_receipt;

            try {
                json_receipt = await irys.uploadFile(json_file, {
                    tags: json_tags,
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
                setIsLoading(false);

                toast.update(uploadMetadata, {
                    render: `Failed to upload token metadata, please try again later.`,
                    type: "error",
                    isLoading: false,
                    autoClose: 3000,
                });

                return;
            }

            newLaunchData.current.uri = "https://gateway.irys.xyz/" + json_receipt.id;
        }

        let program_data_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(DATA_ACCOUNT_SEED)], PROGRAM)[0];
        let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

        let launch_data_account = PublicKey.findProgramAddressSync(
            [Buffer.from(newLaunchData.current.pagename), Buffer.from("Launch")],
            PROGRAM,
        )[0];

        let wrapped_sol_mint = new PublicKey("So11111111111111111111111111111111111111112");
        var token_mint_pubkey = newLaunchData.current.token_keypair.publicKey;

        let token_raffle_account_key = await getAssociatedTokenAddress(
            token_mint_pubkey, // mint
            program_sol_account, // owner
            true, // allow owner off curve
            newLaunchData.current.token_program,
        );

        let listing = PublicKey.findProgramAddressSync([token_mint_pubkey.toBuffer(), Buffer.from("Listing")], PROGRAM)[0];

        let wrapped_sol_seed = token_mint_pubkey.toBase58().slice(0, 32);
        let wrapped_sol_account = await PublicKey.createWithSeed(program_sol_account, wrapped_sol_seed, TOKEN_PROGRAM_ID);

        if (DEBUG) {
            console.log("arena: ", program_data_account.toString());
            console.log("game_data_account: ", launch_data_account.toString());
            console.log("wsol seed", wrapped_sol_seed);
            console.log("mint", token_mint_pubkey.toString());
        }

        let team_wallet = new PublicKey(newLaunchData.current.team_wallet);
        let whitelist = newLaunchData.current.whitelist_key !== "" ? new PublicKey(newLaunchData.current.whitelist_key) : SYSTEM_KEY;
        const instruction_data = serialise_CreateLaunch_instruction(newLaunchData.current);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: listing, isSigner: false, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },

            { pubkey: wrapped_sol_mint, isSigner: false, isWritable: true },
            { pubkey: wrapped_sol_account, isSigner: false, isWritable: true },

            { pubkey: program_data_account, isSigner: false, isWritable: true },
            { pubkey: program_sol_account, isSigner: false, isWritable: true },

            { pubkey: token_mint_pubkey, isSigner: true, isWritable: true },
            { pubkey: token_raffle_account_key, isSigner: false, isWritable: true },

            { pubkey: team_wallet, isSigner: false, isWritable: true },
            { pubkey: whitelist, isSigner: false, isWritable: true },
        ];

        account_vector.push({ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: newLaunchData.current.token_program, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: false });

        if (newLaunchData.current.permanent_delegate !== null) {
            console.log("add PD");
            account_vector.push({ pubkey: newLaunchData.current.permanent_delegate, isSigner: false, isWritable: false });
        } else {
            account_vector.push({ pubkey: PROGRAM, isSigner: false, isWritable: false });
        }
        if (newLaunchData.current.transfer_hook_program !== null) {
            console.log("add hook", newLaunchData.current.transfer_hook_program.toString());
            account_vector.push({ pubkey: newLaunchData.current.transfer_hook_program, isSigner: false, isWritable: false });
        } else {
            account_vector.push({ pubkey: PROGRAM, isSigner: false, isWritable: false });
        }

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));
        transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));
        transaction.add(list_instruction);

        transaction.partialSign(newLaunchData.current.token_keypair);

        const createLaunch = toast.info("(3/4) Setting up your launch accounts");

        try {
            let signed_transaction = await wallet.signTransaction(transaction);

            var signature = await connection.sendRawTransaction(signed_transaction.serialize(), { skipPreflight: true });

            console.log(signature);
            //var transaction_response = await send_transaction("", encoded_transaction);

            if (signature === undefined) {
                console.log(signature);
                toast.error("Transaction failed, please try again");
                return;
            }

            //let signature = transaction_response.result;

            if (DEBUG) {
                console.log("list signature: ", signature);
            }
            signature_ws_id.current = 1;

            connection.onSignature(signature, check_signature_update, "confirmed");
            setTimeout(transaction_failed, 20000);
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
    };

    return { CreateLaunch };
};

export default usuCreateLaunch;
