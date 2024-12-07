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
    MintData,
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
    LAMPORTS_PER_SOL,
} from "@solana/web3.js";

import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, Config, SYSTEM_KEY, SOL_ACCOUNT_SEED, CollectionKeys, METAPLEX_META, CORE } from "../../components/Solana/constants";
import { useCallback, useRef, useState } from "react";
import { toast } from "react-toastify";
import { BeetStruct, FixableBeetStruct, array, bignum, u64, u8, uniformFixedSizeArray } from "@metaplex-foundation/beet";
import useSendTransaction from "../useSendTransaction";

function serialise_list_nft_instruction(price: number): Buffer {
    const data = new ListNFT_Instruction(LaunchInstruction.list_nft, price);

    const [buf] = ListNFT_Instruction.struct.serialize(data);

    return buf;
}

class ListNFT_Instruction {
    constructor(
        readonly instruction: number,
        readonly price: bignum,
    ) {}

    static readonly struct = new BeetStruct<ListNFT_Instruction>(
        [
            ["instruction", u8],
            ["price", u64],
        ],
        (args) => new ListNFT_Instruction(args.instruction!, args.price!),
        "ListNFT_Instruction",
    );
}

export const GetListInstructions = async (launchData: CollectionData, user: PublicKey, asset_key: PublicKey, price: number) => {
    let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

    let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launchData.page_name), Buffer.from("Collection")], PROGRAM)[0];
    let listings_program = new PublicKey("288fPpF7XGk82Wth2XgyoF2A82YKryEyzL58txxt47kd");
    let listings_account = PublicKey.findProgramAddressSync([asset_key.toBytes(), Buffer.from("Listing")], listings_program)[0];
    let listings_summary_account = PublicKey.findProgramAddressSync(
        [launchData.keys[CollectionKeys.CollectionMint].toBytes(), Buffer.from("Summary")],
        listings_program,
    )[0];

    const instruction_data = serialise_list_nft_instruction(price);

    var account_vector = [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: launch_data_account, isSigner: false, isWritable: true },
        { pubkey: program_sol_account, isSigner: false, isWritable: true },
        { pubkey: asset_key, isSigner: false, isWritable: true },
        { pubkey: launchData.keys[CollectionKeys.CollectionMint], isSigner: false, isWritable: true },
        { pubkey: listings_account, isSigner: false, isWritable: true },
        { pubkey: listings_summary_account, isSigner: false, isWritable: true },
    ];

    account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: false });
    account_vector.push({ pubkey: CORE, isSigner: false, isWritable: false });
    account_vector.push({ pubkey: listings_program, isSigner: false, isWritable: false });

    const list_instruction = new TransactionInstruction({
        keys: account_vector,
        programId: PROGRAM,
        data: instruction_data,
    });

    let instructions: TransactionInstruction[] = [];

    let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);

    instructions.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));
    instructions.push(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));
    instructions.push(list_instruction);

    return instructions;
};

const useListNFT = (launchData: CollectionData) => {
    const wallet = useWallet();
    const { sendTransaction, isLoading } = useSendTransaction();



    const ListNFT = async (asset_key: PublicKey, price: number) => {
        console.log("in list nft");

        if (wallet.signTransaction === undefined) {
            console.log(wallet, "invalid wallet");
            return;
        }

        if (launchData === null) {
            console.log("launch is null");
            return;
        }


        let instructions = await GetListInstructions(launchData, wallet.publicKey, asset_key, price * LAMPORTS_PER_SOL);

        await sendTransaction({
            instructions,
            onSuccess: () => {
                // Handle success
            },
            onError: (error) => {
                // Handle error
            }
        });
    };

    return { ListNFT, GetListInstructions, isLoading };
};

export default useListNFT;
