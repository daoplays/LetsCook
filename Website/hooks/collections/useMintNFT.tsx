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
import { toast } from "react-toastify";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import useSendTransaction from "../useSendTransaction";
import { getMintData } from "@/components/amm/launch";

const useMintNFT = (launchData: CollectionData, updateData: boolean = false) => {
    const wallet = useWallet();
    const { sendTransaction, isLoading } = useSendTransaction();

    const MintNFT = async () => {
        if (wallet.signTransaction === undefined) {
            //console.log(wallet, "invalid wallet");
            return;
        }

        if (wallet.publicKey.toString() == launchData.keys[LaunchKeys.Seller].toString()) {
            alert("Launch creator cannot buy tickets");
            return;
        }

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

        let asset_keypair = new Keypair();

        let launch_data_account = PublicKey.findProgramAddressSync(
            [Buffer.from(launchData.page_name), Buffer.from("Collection")],
            PROGRAM,
        )[0];

        let token_mint = launchData.keys[CollectionKeys.MintAddress];
        let mint_info = await getMintData(launchData.keys[CollectionKeys.MintAddress].toString());

        let user_token_account_key = await getAssociatedTokenAddress(
            token_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            mint_info.token_program,
        );

        let pda_token_account_key = await getAssociatedTokenAddress(
            token_mint, // mint
            program_sol_account, // owner
            true, // allow owner off curve
            mint_info.token_program,
        );

        let team_token_account_key = await getAssociatedTokenAddress(
            token_mint, // mint
            launchData.keys[CollectionKeys.TeamWallet], // owner
            true, // allow owner off curve
            mint_info.token_program,
        );

        const instruction_data = serialise_basic_instruction(LaunchInstruction.mint_nft);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: nft_assignment_account, isSigner: false, isWritable: true },

            { pubkey: launch_data_account, isSigner: false, isWritable: true },
            { pubkey: program_sol_account, isSigner: false, isWritable: true },

            { pubkey: asset_keypair.publicKey, isSigner: true, isWritable: true },
            { pubkey: launchData.keys[CollectionKeys.CollectionMint], isSigner: false, isWritable: true },

            { pubkey: launchData.keys[CollectionKeys.TeamWallet], isSigner: false, isWritable: true },
            { pubkey: token_mint, isSigner: false, isWritable: false },
            { pubkey: pda_token_account_key, isSigner: false, isWritable: true },
            { pubkey: user_token_account_key, isSigner: false, isWritable: true },
            { pubkey: team_token_account_key, isSigner: false, isWritable: true },
        ];

        account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: CORE, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: assignment_data.random_address, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: mint_info.token_program, isSigner: false, isWritable: false });

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);

        let instructions: TransactionInstruction[] = [];

        instructions.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));
        instructions.push(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));
        instructions.push(list_instruction);

        await sendTransaction({
            instructions,
            onSuccess: () => {
                // Handle success
            },
            onError: (error) => {
                console.error("Failed to buy NFT:", error);
            },
            additionalSigner: asset_keypair,
        });
    };

    return { MintNFT, isLoading };
};

export default useMintNFT;
