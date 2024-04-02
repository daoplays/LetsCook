import {
    LaunchData,
    LaunchInstruction,
    get_current_blockhash,
    myU64,
    send_transaction,
    serialise_basic_instruction,
    uInt32ToLEBytes,
} from "../../components/Solana/state";
import { CollectionData, request_assignment_data, request_lookup_data } from "../../components/collection/collectionState";
import { ComputeBudgetProgram, PublicKey, Transaction, TransactionInstruction, Connection, Keypair, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, RPC_NODE, SYSTEM_KEY, WSS_NODE, SOL_ACCOUNT_SEED, PYTH_BTC, PYTH_ETH, PYTH_SOL, CollectionKeys, METAPLEX_META } from "../../components/Solana/constants";
import { useCallback, useRef, useState, useEffect } from "react";
import bs58 from "bs58";
import { LaunchKeys, LaunchFlags } from "../../components/Solana/constants";
import useAppRoot from "../../context/useAppRoot";
import { TOKEN_2022_PROGRAM_ID,ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";


const useClaimNFT = (launchData: CollectionData, updateData: boolean = false) => {
    const wallet = useWallet();
    const { checkProgramData } = useAppRoot();
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

    useEffect(() => {
        console.log("wallet updated", wallet)
    }, [wallet])

    const MintNFT = useCallback(async () => {

        console.log("in local mint callback")
        setIsLoading(true);

        if (wallet.signTransaction === undefined) {
            console.log(wallet, "invalid wallet");
            return
        };

        if (wallet.publicKey.toString() == launchData.keys[LaunchKeys.Seller].toString()) {
            alert("Launch creator cannot buy tickets");
            return;
        }

        if (signature_ws_id.current !== null) {
            console.log("signature not null")
            alert("Transaction pending, please wait");
            return;
        }

        const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });

        if (launchData === null) {
            console.log("launch is null");
            return;
        }

        let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

        let nft_assignment_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), launchData.keys[CollectionKeys.CollectionMint].toBytes(), Buffer.from("assignment")],
            PROGRAM,
        )[0];

        console.log("get assignment data")
        let assignment_data = await request_assignment_data(nft_assignment_account);

        if (assignment_data === null) {
            console.log("no assignment data found");
            return;
        }

        console.log(assignment_data);

        let nft_lookup_account = PublicKey.findProgramAddressSync(
            [launchData.keys[CollectionKeys.CollectionMint].toBytes(), uInt32ToLEBytes(assignment_data.nft_index), Buffer.from("Lookup")],
            PROGRAM,
        )[0];

        let lookup_data = await request_lookup_data(nft_lookup_account);

        var nft_keypair : Keypair = null;
        var nft_pubkey = null
        var mint_is_signer = false;
        if (lookup_data === null) {
            console.log("no lookup data found");
            nft_keypair = new Keypair();
            nft_pubkey = nft_keypair.publicKey
            mint_is_signer = true;
        }
        else {
            nft_pubkey = lookup_data.nft_mint;
            console.log(lookup_data);

        }



        let token_mint_pubkey = nft_keypair.publicKey;

        let token_meta_key = PublicKey.findProgramAddressSync(
            [Buffer.from("metadata"), METAPLEX_META.toBuffer(), token_mint_pubkey.toBuffer()],
            METAPLEX_META,
        )[0];

        let nft_token_account = await getAssociatedTokenAddress(
            token_mint_pubkey, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            TOKEN_2022_PROGRAM_ID,
        );

        let nft_escrow_account = await getAssociatedTokenAddress(
            token_mint_pubkey, // mint
            program_sol_account, // owner
            true, // allow owner off curve
            TOKEN_2022_PROGRAM_ID,
        );


        let nft_master_key = (PublicKey.findProgramAddressSync([Buffer.from("metadata"),
            METAPLEX_META.toBuffer(), token_mint_pubkey.toBuffer(), Buffer.from("edition")], METAPLEX_META))[0];

        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launchData.page_name), Buffer.from("Collection")], PROGRAM)[0];

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        

        let collection_metadata_account = PublicKey.findProgramAddressSync(
            [Buffer.from("metadata"), METAPLEX_META.toBuffer(), launchData.keys[CollectionKeys.CollectionMint].toBuffer()],
            METAPLEX_META,
        )[0];


        let collection_master_key = (PublicKey.findProgramAddressSync([Buffer.from("metadata"),
            METAPLEX_META.toBuffer(), launchData.keys[CollectionKeys.CollectionMint].toBuffer(), Buffer.from("edition")], METAPLEX_META))[0];


        const instruction_data = serialise_basic_instruction(LaunchInstruction.mint_nft);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: nft_assignment_account, isSigner: false, isWritable: true },
            { pubkey: nft_lookup_account, isSigner: false, isWritable: true },

            { pubkey: launch_data_account, isSigner: false, isWritable: true },
            { pubkey: program_sol_account, isSigner: false, isWritable: true },

            { pubkey: token_mint_pubkey, isSigner: mint_is_signer, isWritable: true },
            { pubkey: nft_token_account, isSigner: false, isWritable: true },
            { pubkey: token_meta_key, isSigner: false, isWritable: true },
            { pubkey: nft_master_key, isSigner: false, isWritable: true },
            { pubkey: nft_escrow_account, isSigner: false, isWritable: true },

            { pubkey: launchData.keys[CollectionKeys.CollectionMint], isSigner: false, isWritable: true },
            { pubkey: collection_metadata_account, isSigner: false, isWritable: true },
            { pubkey: collection_master_key, isSigner: false, isWritable: true },

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

        if (mint_is_signer) {
            transaction.partialSign(nft_keypair);
        }

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            let signature = transaction_response.result;

            console.log("join sig: ", signature);

        } catch (error) {
            console.log(error);
            return;
        } finally {
            setIsLoading(false);
        }
    }, [wallet]);

    const ClaimNFT = async () => {

        let nft_assignment_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), launchData.keys[CollectionKeys.CollectionMint].toBytes(), Buffer.from("assignment")],
            PROGRAM,
        )[0];
        console.log("get assignment data")
        let assignment_data = await request_assignment_data(nft_assignment_account);

        if (assignment_data !== null) {
            console.log("assignment data found");
            if (assignment_data.status > 0) {
                await MintNFT();
                return;
            }
        }

        setIsLoading(true);

        if (wallet.signTransaction === undefined) return;

        console.log("in claim, ", wallet)
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
