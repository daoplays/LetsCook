import { PublicKey, Transaction, TransactionInstruction, Connection, ComputeBudgetProgram, AccountMeta } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { useCallback, useRef, useState } from "react";
import bs58 from "bs58";
import BN from "bn.js";
import { toast } from "react-toastify";

import { getAssociatedTokenAddress, ASSOCIATED_TOKEN_PROGRAM_ID, unpackMint } from "@solana/spl-token";
import { FixableBeetStruct, bignum, u16, u64, u8 } from "@metaplex-foundation/beet";
import { PROGRAM, SYSTEM_KEY } from "../../components/Solana/constants";
import { LaunchInstruction, uInt32ToLEBytes } from "../../components/Solana/state";

class InitAMM_Instruction {
    constructor(
        readonly instruction: number,
        readonly base_quantity: bignum,
        readonly quote_quantity: bignum,
        readonly fee: number,
        readonly short_frac: number,
        readonly borrow_cost: number,
    ) {}

    static readonly struct = new FixableBeetStruct<InitAMM_Instruction>(
        [
            ["instruction", u8],
            ["base_quantity", u64],
            ["quote_quantity", u64],
            ["fee", u16],
            ["short_frac", u16],
            ["borrow_cost", u16],
        ],
        (args) =>
            new InitAMM_Instruction(
                args.instruction!,
                args.base_quantity!,
                args.quote_quantity!,
                args.fee!,
                args.short_frac!,
                args.borrow_cost!,
            ),
        "InitAMM_Instruction",
    );
}

export function serialise_InitAMM_instruction(
    base_quantity: number,
    quote_quantity: number,
    fee: number,
    short_frac: number,
    borrow_cost: number,
): Buffer {
    const data = new InitAMM_Instruction(LaunchInstruction.init_market, base_quantity, quote_quantity, fee, short_frac, borrow_cost);
    const [buf] = InitAMM_Instruction.struct.serialize(data);

    return buf;
}

const useInitAMM = () => {
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

    const InitAMM = async (
        base_mint_string: string,
        quote_mint_string: string,
        base_quantity: number,
        quote_quantity: number,
        fee: number,
        short_frac: number,
        borrow_fee: number,
    ) => {
        toast.info("Sending Transaction", {
            isLoading: false,
            autoClose: 3000,
        });

        let pda = PublicKey.findProgramAddressSync([Buffer.from("pda")], PROGRAM)[0];

        let base_mint = new PublicKey(base_mint_string);
        let quote_mint = new PublicKey(quote_mint_string);

        let base_mint_account = await connection.getAccountInfo(base_mint);
        let quote_mint_account = await connection.getAccountInfo(quote_mint);

        let base_mint_data = unpackMint(base_mint, base_mint_account, base_mint_account.owner);
        let quote_mint_data = unpackMint(quote_mint, quote_mint_account, quote_mint_account.owner);

        let amm_seed_keys = [];
        if (base_mint.toString() < quote_mint.toString()) {
            amm_seed_keys.push(base_mint);
            amm_seed_keys.push(quote_mint);
        } else {
            amm_seed_keys.push(quote_mint);
            amm_seed_keys.push(base_mint);
        }

        let amm_data_account = PublicKey.findProgramAddressSync(
            [amm_seed_keys[0].toBytes(), amm_seed_keys[1].toBytes(), Buffer.from("AMM")],
            PROGRAM,
        )[0];

        let amm_base = await getAssociatedTokenAddress(
            base_mint, // mint
            amm_data_account, // owner
            true, // allow owner off curve
            base_mint_account.owner,
        );

        let amm_quote = await getAssociatedTokenAddress(
            quote_mint, // mint
            amm_data_account, // owner
            true, // allow owner off curve
            quote_mint_account.owner,
        );

        let lp_mint_account = PublicKey.findProgramAddressSync([amm_data_account.toBytes(), Buffer.from("LP")], PROGRAM)[0];

        let user_base = await getAssociatedTokenAddress(
            base_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            base_mint_account.owner,
        );

        let user_quote = await getAssociatedTokenAddress(
            quote_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            quote_mint_account.owner,
        );

        let user_lp = await getAssociatedTokenAddress(
            lp_mint_account, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            base_mint_account.owner,
        );

        let index_buffer = uInt32ToLEBytes(0);
        let price_data_account = PublicKey.findProgramAddressSync(
            [amm_data_account.toBytes(), index_buffer, Buffer.from("TimeSeries")],
            PROGRAM,
        )[0];

        const instruction_data = serialise_InitAMM_instruction(
            base_quantity * Math.pow(10, base_mint_data.decimals),
            quote_quantity * Math.pow(10, quote_mint_data.decimals),
            fee,
            short_frac,
            borrow_fee,
        );

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },

            { pubkey: pda, isSigner: false, isWritable: true },
            { pubkey: amm_data_account, isSigner: false, isWritable: true },

            { pubkey: base_mint, isSigner: false, isWritable: true },
            { pubkey: quote_mint, isSigner: false, isWritable: true },
            { pubkey: lp_mint_account, isSigner: false, isWritable: true },

            { pubkey: user_base, isSigner: false, isWritable: true },
            { pubkey: user_quote, isSigner: false, isWritable: true },
            { pubkey: user_lp, isSigner: false, isWritable: true },
            { pubkey: amm_base, isSigner: false, isWritable: true },
            { pubkey: amm_quote, isSigner: false, isWritable: true },
            { pubkey: price_data_account, isSigner: false, isWritable: true },
            { pubkey: quote_mint_account.owner, isSigner: false, isWritable: false },

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

            var transaction_response = await connection.sendRawTransaction(signed_transaction.serialize(), { skipPreflight: true });

            let signature = transaction_response;

            console.log("list sig: ", signature);

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

    return { InitAMM, isLoading };
};

export default useInitAMM;
