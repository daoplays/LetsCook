import {
    LaunchData,
    LaunchInstruction,
    get_current_blockhash,
    myU64,
    send_transaction,
    serialise_basic_instruction,
    uInt32ToLEBytes,
    request_raw_account_data,
    getRecentPrioritizationFees,
} from "../../components/Solana/state";
import { CollectionData, AssignmentData, request_assignment_data } from "../../components/collection/collectionState";
import {
    ComputeBudgetProgram,
    SYSVAR_RENT_PUBKEY,
    PublicKey,
    Transaction,
    TransactionInstruction,
    Connection,
    Keypair,
    AccountMeta,
} from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, Config, SYSTEM_KEY, SOL_ACCOUNT_SEED, CollectionKeys, METAPLEX_META, CORE } from "../../components/Solana/constants";
import { useCallback, useRef, useState } from "react";
import bs58 from "bs58";
import { LaunchKeys, LaunchFlags } from "../../components/Solana/constants";
import useAppRoot from "../../context/useAppRoot";
import { toast } from "react-toastify";
import { getAssociatedTokenAddress } from "@solana/spl-token";

const useMintNFT = (launchData: CollectionData, updateData: boolean = false) => {
    const wallet = useWallet();
    const { checkProgramData, mintData } = useAppRoot();

    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        //console.log(result);
        // if we have a subscription field check against ws_id

        signature_ws_id.current = null;
        setIsLoading(false);

        if (result.err !== null) {
            toast.error("Transaction failed, please try again", {
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }

        toast.success("Transaction Successfull!", {
            type: "success",
            isLoading: false,
            autoClose: 3000,
        });

        if (updateData) {
            await checkProgramData();
        }
    }, []);

    const transaction_failed = useCallback(async () => {
        if (signature_ws_id.current == null) return;

        signature_ws_id.current = null;
        setIsLoading(false);
        console.log("transaction failed at ", new Date());
        toast.error("Transaction not processed, please try again", {
            type: "error",
            isLoading: false,
            autoClose: 3000,
        });
    }, []);

    const MintNFT = async () => {
        if (wallet.signTransaction === undefined) {
            //console.log(wallet, "invalid wallet");
            return;
        }

        if (wallet.publicKey.toString() == launchData.keys[LaunchKeys.Seller].toString()) {
            alert("Launch creator cannot buy tickets");
            return;
        }

        if (signature_ws_id.current !== null) {
            //console.log("signature not null");
            alert("Transaction pending, please wait");
            return;
        }

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        if (launchData === null) {
            //console.log("launch is null");
            return;
        }

        let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

        let nft_assignment_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), launchData.keys[CollectionKeys.CollectionMint].toBytes(), Buffer.from("assignment")],
            PROGRAM,
        )[0];

        //console.log("get assignment data");
        let assignment_data = await request_assignment_data(nft_assignment_account);

        if (assignment_data === null) {
            // console.log("no assignment data found");
            return;
        }

        let r_data = await request_raw_account_data("", assignment_data.random_address);
        console.log(r_data);

        setIsLoading(true);

        let asset_keypair = new Keypair();

        let launch_data_account = PublicKey.findProgramAddressSync(
            [Buffer.from(launchData.page_name), Buffer.from("Collection")],
            PROGRAM,
        )[0];

        const instruction_data = serialise_basic_instruction(LaunchInstruction.mint_nft);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: nft_assignment_account, isSigner: false, isWritable: true },

            { pubkey: launch_data_account, isSigner: false, isWritable: true },
            { pubkey: program_sol_account, isSigner: false, isWritable: true },

            { pubkey: asset_keypair.publicKey, isSigner: true, isWritable: true },

            { pubkey: launchData.keys[CollectionKeys.CollectionMint], isSigner: false, isWritable: true },
        ];

        account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: CORE, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: assignment_data.random_address, isSigner: false, isWritable: false });

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
        transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));

        transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));
        transaction.add(list_instruction);

        transaction.partialSign(asset_keypair);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            var signature = await connection.sendRawTransaction(signed_transaction.serialize(), { skipPreflight: true });

            console.log("mint nft sig at ", new Date(), signature);

            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
            setTimeout(transaction_failed, 20000);
        } catch (error) {
            console.log(error);
            setIsLoading(false);
            return;
        }
    };

    return { MintNFT, isLoading };
};

export default useMintNFT;
