import {
    LaunchData,
    LaunchInstruction,
    get_current_blockhash,
    myU64,
    send_transaction,
    serialise_basic_instruction,
    uInt32ToLEBytes,
} from "../../components/Solana/state";
import { CollectionData } from "../../components/collection/collectionState";
import { PublicKey, Transaction, TransactionInstruction, Connection } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, RPC_NODE, SYSTEM_KEY, WSS_NODE, SOL_ACCOUNT_SEED, PYTH_BTC, PYTH_ETH, PYTH_SOL, CollectionKeys, METAPLEX_META } from "../../components/Solana/constants";
import { useCallback, useRef, useState } from "react";
import bs58 from "bs58";
import { LaunchKeys, LaunchFlags } from "../../components/Solana/constants";
import useAppRoot from "../../context/useAppRoot";
import useMintNFT from "./useMintNFT";
const useClaimNFT = (launchData: CollectionData, updateData: boolean = false) => {
    const wallet = useWallet();
    const { checkProgramData } = useAppRoot();
    const {MintNFT} = useMintNFT(launchData)
    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        // if we have a subscription field check against ws_id
        if (result.err !== null) {
            alert("Transaction failed, please try again");
        }
        signature_ws_id.current = null;
        console.log("transaction success");
        await MintNFT();

        if (updateData) {
            await checkProgramData();
        }
    }, []);

    const ClaimNFT = async () => {
        setIsLoading(true);

        if (wallet.signTransaction === undefined) return;

        if (wallet.publicKey.toString() == launchData.keys[LaunchKeys.Seller].toString()) {
            alert("Launch creator cannot buy tickets");
            return;
        }

        if (signature_ws_id.current !== null) {
            alert("Transaction pending, please wait");
            return;
        }

        const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });

        if (launchData === null) {
            return;
        }

        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launchData.page_name), Buffer.from("Collection")], PROGRAM)[0];

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        let nft_assignment_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), launchData.keys[CollectionKeys.CollectionMint].toBytes(), Buffer.from("assignment")],
            PROGRAM,
        )[0];

        let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

        let collection_metadata_account = PublicKey.findProgramAddressSync(
            [Buffer.from("metadata"), METAPLEX_META.toBuffer(), launchData.keys[CollectionKeys.CollectionMint].toBuffer()],
            METAPLEX_META,
        )[0];

        const instruction_data = serialise_basic_instruction(LaunchInstruction.claim_nft);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: nft_assignment_account, isSigner: false, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },
            { pubkey: program_sol_account, isSigner: false, isWritable: true },

            { pubkey: launchData.keys[CollectionKeys.CollectionMint], isSigner: false, isWritable: true },
            { pubkey: collection_metadata_account, isSigner: false, isWritable: true },

            { pubkey: PYTH_BTC, isSigner: false, isWritable: true },
            { pubkey: PYTH_ETH, isSigner: false, isWritable: true },
            { pubkey: PYTH_SOL, isSigner: false, isWritable: true },
            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: true },
        
        ];

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(list_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            let signature = transaction_response.result;

            console.log("join sig: ", signature);

            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
        } catch (error) {
            console.log(error);
            return;
        } finally {
            setIsLoading(false);
        }
    };

    return { ClaimNFT, isLoading };
};

export default useClaimNFT;
