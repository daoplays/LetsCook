import {
    LaunchData,
    serialise_basic_instruction,
    uInt32ToLEBytes,
    bignum_to_num,
    getRecentPrioritizationFees,
} from "../../components/Solana/state";

import { PublicKey, TransactionInstruction, Connection } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, Config, SYSTEM_KEY } from "../../components/Solana/constants";
import { toast } from "react-toastify";


import { ComputeBudgetProgram } from "@solana/web3.js";

import { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { LaunchFlags } from "../../components/Solana/constants";
import useAppRoot from "../../context/useAppRoot";
import useSendTransaction from "../useSendTransaction";

const useGetMMTokens = () => {
    const wallet = useWallet();
    const { listingData } = useAppRoot();

    const { sendTransaction, isLoading } = useSendTransaction();

    const GetMMTokens = async (launch: LaunchData) => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        let listing = listingData.get(launch.listing.toString());

        const token_mint = listing.mint;
        const wsol_mint = new PublicKey("So11111111111111111111111111111111111111112");

        let user_pda_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User_PDA")], PROGRAM)[0];

        let user_token_account_key = await getAssociatedTokenAddress(
            token_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            TOKEN_2022_PROGRAM_ID,
        );

        let pda_token_account_key = await getAssociatedTokenAddress(
            token_mint, // mint
            user_pda_account, // owner
            true, // allow owner off curve
            TOKEN_2022_PROGRAM_ID,
        );

        let amm_seed_keys = [];
        if (token_mint.toString() < wsol_mint.toString()) {
            amm_seed_keys.push(token_mint);
            amm_seed_keys.push(wsol_mint);
        } else {
            amm_seed_keys.push(wsol_mint);
            amm_seed_keys.push(token_mint);
        }

        let amm_data_account = PublicKey.findProgramAddressSync(
            [
                amm_seed_keys[0].toBytes(),
                amm_seed_keys[1].toBytes(),
                Buffer.from(launch.flags[LaunchFlags.AMMProvider] === 0 ? "CookAMM" : "RaydiumCPMM"),
            ],
            PROGRAM,
        )[0];

        let current_date = Math.floor((new Date().getTime() / 1000 - bignum_to_num(launch.last_interaction)) / 24 / 60 / 60);
        console.log(current_date);

        let date_bytes = uInt32ToLEBytes(current_date);

        let launch_date_account = PublicKey.findProgramAddressSync(
            [amm_data_account.toBytes(), date_bytes, Buffer.from("LaunchDate")],
            PROGRAM,
        )[0];

        let user_date_account = PublicKey.findProgramAddressSync(
            [amm_data_account.toBytes(), wallet.publicKey.toBytes(), date_bytes],
            PROGRAM,
        )[0];

        const instruction_data = serialise_basic_instruction(0);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_pda_account, isSigner: false, isWritable: true },
            { pubkey: user_token_account_key, isSigner: false, isWritable: true },
            { pubkey: pda_token_account_key, isSigner: false, isWritable: true },
            { pubkey: amm_data_account, isSigner: false, isWritable: true },
            { pubkey: launch_date_account, isSigner: false, isWritable: true },
            { pubkey: user_date_account, isSigner: false, isWritable: true },
            { pubkey: token_mint, isSigner: false, isWritable: true },
            { pubkey: wsol_mint, isSigner: false, isWritable: true },
            { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
        ];

        const instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });


        let instructions: TransactionInstruction[] = [];

        instructions.push(instruction);

        await sendTransaction({
            instructions,
            onSuccess: () => {
                // Handle success
            },
            onError: (error) => {
                // Handle error
            },
        });
    };

    return { GetMMTokens, isLoading };
};

export default useGetMMTokens;
