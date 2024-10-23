import { PublicKey, Transaction, TransactionInstruction, Connection, ComputeBudgetProgram, AccountMeta } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { useCallback, useRef, useState } from "react";
import bs58 from "bs58";
import BN from "bn.js";
import { toast } from "react-toastify";

import { getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID, unpackMint } from "@solana/spl-token";
import { FixableBeetStruct, bignum, u16, u64, u8 } from "@metaplex-foundation/beet";
import { PROGRAM, SOL_ACCOUNT_SEED, SYSTEM_KEY } from "../../components/Solana/constants";
import { LaunchInstruction, uInt32ToLEBytes } from "../../components/Solana/state";

class AddTradeRewards_Instruction {
    constructor(
        readonly instruction: number,
        readonly quantity: bignum,
    ) {}

    static readonly struct = new FixableBeetStruct<AddTradeRewards_Instruction>(
        [
            ["instruction", u8],
            ["quantity", u64]
        ],
        (args) =>
            new AddTradeRewards_Instruction(
                args.instruction!,
                args.quantity!,
            ),
        "AddTradeRewards_Instruction",
    );
}

export function serialise_AddTradeRewards_instruction(
    quantity: number,
): Buffer {
    const data = new AddTradeRewards_Instruction(LaunchInstruction.add_trade_rewards, quantity);
    const [buf] = AddTradeRewards_Instruction.struct.serialize(data);

    return buf;
}

const useAddTradeRewards = () => {
    const wallet = useWallet();
    const { connection } = useConnection();

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

        toast.success("Transaction processed", {
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

    const AddTradeRewards = async (
        base_mint_string: string,
        quote_mint_string: string,
        base_quantity: number
    ) => {
        toast.info("Sending Transaction", {
            isLoading: false,
            autoClose: 3000,
        });

        let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

        let base_mint = new PublicKey(base_mint_string);
        let quote_mint = new PublicKey(quote_mint_string);

        let base_mint_account = await connection.getAccountInfo(base_mint);

        let base_mint_data = unpackMint(base_mint, base_mint_account, base_mint_account.owner);

        let amm_seed_keys = [];
        if (base_mint.toString() < quote_mint.toString()) {
            amm_seed_keys.push(base_mint);
            amm_seed_keys.push(quote_mint);
        } else {
            amm_seed_keys.push(quote_mint);
            amm_seed_keys.push(base_mint);
        }

        let amm_data_account = PublicKey.findProgramAddressSync(
            [amm_seed_keys[0].toBytes(), amm_seed_keys[1].toBytes(), Buffer.from("CookAMM")],
            PROGRAM,
        )[0];


        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        let user_base = await getAssociatedTokenAddress(
            base_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            base_mint_account.owner,
        );

        let trade_to_earn_account = PublicKey.findProgramAddressSync([amm_data_account.toBytes(), Buffer.from("TradeToEarn")], PROGRAM)[0];



        const instruction_data = serialise_AddTradeRewards_instruction(
            base_quantity * Math.pow(10, base_mint_data.decimals)
        );

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_data_account, isSigner: false, isWritable: true },
            { pubkey: user_base, isSigner: false, isWritable: true },

            { pubkey: program_sol_account, isSigner: false, isWritable: false },
            { pubkey: amm_data_account, isSigner: false, isWritable: true },

            { pubkey: base_mint, isSigner: false, isWritable: false },
            { pubkey: quote_mint, isSigner: false, isWritable: false },
            { pubkey: trade_to_earn_account, isSigner: false, isWritable: true },

            { pubkey: base_mint_account.owner, isSigner: false, isWritable: false },
            {
                pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
                isSigner: false,
                isWritable: false,
            },
            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
        ];

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let blockhash_result = await connection.getLatestBlockhash();
        let txArgs = {
            blockhash: blockhash_result.blockhash,
            lastValidBlockHeight: blockhash_result.lastValidBlockHeight,
        };

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));
        let feeMicroLamports = 100000;
        transaction.add(
            ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: feeMicroLamports,
            }),
        );

        transaction.add(list_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);

            var signature = await connection.sendRawTransaction(signed_transaction.serialize(), { skipPreflight: true });

            console.log("list amm sig: ", signature);

            connection.onSignature(signature, check_signature_update, "confirmed");
            setTimeout(transaction_failed, 20000);
        } catch (error) {
            console.log(error);
            toast.error("AMM initialisation failed, please try again later", {
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }
    };

    return { AddTradeRewards, isLoading };
};

export default useAddTradeRewards;
