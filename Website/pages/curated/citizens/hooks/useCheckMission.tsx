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
} from "../../../../components/Solana/state";
import { CollectionData, AssignmentData, request_assignment_data } from "../../../../components/collection/collectionState";
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
import { Key, getAssetV1GpaBuilder, updateAuthority, AssetV1, deserializeAssetV1 } from "@metaplex-foundation/mpl-core";
import type { RpcAccount, PublicKey as umiKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import { useWallet } from "@solana/wallet-adapter-react";
import {
    PROGRAM,
    Config,
    SYSTEM_KEY,
    SOL_ACCOUNT_SEED,
    CollectionKeys,
    METAPLEX_META,
    CORE,
} from "../../../../components/Solana/constants";
import { useCallback, useRef, useState } from "react";
import bs58 from "bs58";
import { toast } from "react-toastify";
import { BeetStruct, FixableBeetStruct, array, bignum, u64, u8, uniformFixedSizeArray } from "@metaplex-foundation/beet";
import { CITIZENS } from "../../../../components/curated/citizens/state";

function serialise_check_mission_instruction(): Buffer {
    const data = new CheckMission_Instruction(1);

    const [buf] = CheckMission_Instruction.struct.serialize(data);

    return buf;
}

class CheckMission_Instruction {
    constructor(
        readonly instruction: number,
    ) {}

    static readonly struct = new BeetStruct<CheckMission_Instruction>(
        [
            ["instruction", u8],
        ],
        (args) => new CheckMission_Instruction(args.instruction!),
        "CheckMission_Instruction",
    );
}

export const CheckMissionInstructions = async (launchData: CollectionData, user: PublicKey, asset_key: string) => {
    let pda_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], CITIZENS)[0];

    let user_data_account = PublicKey.findProgramAddressSync([user.toBytes(), Buffer.from("UserData")], CITIZENS)[0];

    const instruction_data = serialise_check_mission_instruction();

    var account_vector = [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: new PublicKey(asset_key), isSigner: false, isWritable: true },
        { pubkey: launchData.keys[CollectionKeys.CollectionMint], isSigner: false, isWritable: true },
        { pubkey: user_data_account, isSigner: false, isWritable: true },
        { pubkey: pda_account, isSigner: false, isWritable: true },
    ];

    account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: false });

    const list_instruction = new TransactionInstruction({
        keys: account_vector,
        programId: CITIZENS,
        data: instruction_data,
    });

    let instructions: TransactionInstruction[] = [];

    let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);

    instructions.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));
    instructions.push(list_instruction);

    return instructions;
};

const useCheckMission = (launchData: CollectionData) => {
    const wallet = useWallet();

    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
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

        toast.success("Checked Mission", {
            type: "success",
            isLoading: false,
            autoClose: 3000,
        });
    }, []);

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

    const CheckMission = async (asset_key: string) => {
        console.log("in list nft");

        if (wallet.signTransaction === undefined) {
            console.log(wallet, "invalid wallet");
            return;
        }

        if (signature_ws_id.current !== null) {
            console.log("signature not null");
            alert("Transaction pending, please wait");
            return;
        }

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        if (launchData === null) {
            console.log("launch is null");
            return;
        }

        setIsLoading(true);

        let instructions = await CheckMissionInstructions(launchData, wallet.publicKey, asset_key);

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        for (let i = 0; i < instructions.length; i++) {
            transaction.add(instructions[i]);
        }

        try {
            let signed_transaction = await wallet.signTransaction(transaction);

            var signature = await connection.sendRawTransaction(signed_transaction.serialize(), { skipPreflight: true });

            console.log("check mission sig: ", signature);

            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
            setTimeout(transaction_failed, 20000);
        } catch (error) {
            console.log(error);
            setIsLoading(false);
            return;
        }
    };

    return { CheckMission, isLoading };
};

export default useCheckMission;
