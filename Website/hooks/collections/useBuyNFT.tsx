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
    bignum_to_num,
} from "../../components/Solana/state";
import {
    CollectionData,
    AssignmentData,
    request_assignment_data,
    getCollectionPlugins,
    NewNFTListingData,
} from "../../components/collection/collectionState";
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
import bs58 from "bs58";
import { LaunchKeys, LaunchFlags } from "../../components/Solana/constants";
import { toast } from "react-toastify";
import { BeetStruct, FixableBeetStruct, array, bignum, u32, u64, u8, uniformFixedSizeArray } from "@metaplex-foundation/beet";
import useSendTransaction from "../useSendTransaction";

function serialise_buy_nft_instruction(index: number): Buffer {
    const data = new BuyNFT_Instruction(LaunchInstruction.buy_nft, index);

    const [buf] = BuyNFT_Instruction.struct.serialize(data);

    return buf;
}

class BuyNFT_Instruction {
    constructor(
        readonly instruction: number,
        readonly index: number,
    ) {}

    static readonly struct = new BeetStruct<BuyNFT_Instruction>(
        [
            ["instruction", u8],
            ["index", u32],
        ],
        (args) => new BuyNFT_Instruction(args.instruction!, args.index!),
        "BuyNFT_Instruction",
    );
}

export const GetBuyNFTInstructions = async (launchData: CollectionData, user: PublicKey, asset_key: PublicKey, index: number) => {
    let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

    let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launchData.page_name), Buffer.from("Collection")], PROGRAM)[0];
    let listings_program = new PublicKey("288fPpF7XGk82Wth2XgyoF2A82YKryEyzL58txxt47kd");
    let listings_account = PublicKey.findProgramAddressSync([asset_key.toBytes(), Buffer.from("Listing")], listings_program)[0];
    let listings_summary_account = PublicKey.findProgramAddressSync(
        [launchData.keys[CollectionKeys.CollectionMint].toBytes(), Buffer.from("Summary")],
        listings_program,
    )[0];

    let listing_data = await request_raw_account_data("", listings_account);
    let seller;
    if (listing_data) {
        const [listing] = NewNFTListingData.struct.deserialize(listing_data);
        seller = listing.seller;
        console.log("Have listing data: ", listing, listing.seller.toString());
    } else {
        let plugins = getCollectionPlugins(launchData);

        if (index == undefined) {
            toast.error("Invalid index", {
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            return [];
        }

        if (!plugins.listings[index].asset.equals(asset_key)) {
            toast.error("Asset doesn't match index", {
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            return [];
        }
        seller = plugins.listings[index].seller;
    }
    const instruction_data = serialise_buy_nft_instruction(index);

    var account_vector = [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: launch_data_account, isSigner: false, isWritable: true },
        { pubkey: program_sol_account, isSigner: false, isWritable: true },
        { pubkey: asset_key, isSigner: false, isWritable: true },
        { pubkey: launchData.keys[CollectionKeys.CollectionMint], isSigner: false, isWritable: true },
        { pubkey: seller, isSigner: false, isWritable: true },
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

const useBuyNFT = (launchData: CollectionData) => {
    const wallet = useWallet();

    const { sendTransaction, isLoading } = useSendTransaction();

    const BuyNFT = async (asset_key: PublicKey, index: number) => {
        if (wallet.signTransaction === undefined) {
            console.log(wallet, "invalid wallet");
            return;
        }

        if (isLoading) {
            console.log("signature not null");
            alert("Transaction pending, please wait");
            return;
        }

        if (launchData === null) {
            console.log("launch is null");
            return;
        }

        let instructions = await GetBuyNFTInstructions(launchData, wallet.publicKey, asset_key, index);

        await sendTransaction({
            instructions,
            onSuccess: () => {
                // Handle success
            },
            onError: (error) => {
                console.error("Failed to buy NFT:", error);
            }
        });
    };

    return { BuyNFT, isLoading };
};

export default useBuyNFT;
