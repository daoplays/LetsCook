/**
 * Hook for placing market orders on the AMM
 * @module hooks/jupiter/usePerformSwap
 */

import { uInt32ToLEBytes, request_raw_account_data, getRecentPrioritizationFees } from "../../components/Solana/state";
import { AMMData, AMMPluginData, getAMMPlugins, serialise_PlaceLimit_instruction } from "../../components/Solana/jupiter_state";

import { PublicKey, TransactionInstruction, Connection, AccountMeta } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, Config, SYSTEM_KEY } from "../../components/Solana/constants";

import { ComputeBudgetProgram } from "@solana/web3.js";

import {
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getTransferHook,
    resolveExtraAccountMeta,
    ExtraAccountMetaAccountDataLayout,
} from "@solana/spl-token";
import { getMintData } from "@/components/amm/launch";
import useSendTransaction from "../useSendTransaction";
import { toast } from "react-toastify";

/**
 * Custom hook for executing swaps on the AMM
 * @param {AMMData} amm - AMM instance data containing base/quote mint and other relevant information
 * @returns {Object} Swap utilities
 * @property {Function} PerformSwap - Execute a swap
 * @property {boolean} isLoading - Transaction loading state
 *
 * @example
 * ```tsx
 * const MyTradingComponent = ({ amm }) => {
 *   const { PerformSwap, isLoading } = usePerformSwap(amm);
 *
 *   const handleTrade = async () => {
 *     // Buy 1 token for 0.1 SOL
 *     await PerformSwap(1, 0.1, 0); // 0 = buy order
 *   };
 *
 *   return (
 *     <button disabled={isLoading} onClick={handleTrade}>
 *       {isLoading ? 'Processing...' : 'Trade'}
 *     </button>
 *   );
 * };
 * ```
 */
export const getPerformSwapInstruction = async (
    connection: Connection,
    token_amount: number,
    sol_amount: number,
    order_type: number,
    user: PublicKey,
    amm: AMMData
) => {
    // Initialize connection and check wallet

    if (user === null) return;

    // Setup token mints and convert amounts to proper decimals
    const token_mint = amm.base_mint;
    const wsol_mint = amm.quote_mint;
    let mint_account = await getMintData(token_mint.toString());

    token_amount = token_amount * Math.pow(10, mint_account.mint.decimals);
    sol_amount = sol_amount * Math.pow(10, 9);

    // Create temporary wrapped SOL account, needed to unwrap back to SOL
    let temp_wsol_account = PublicKey.findProgramAddressSync([user.toBytes(), Buffer.from("Temp")], PROGRAM)[0];

    // Determine AMM account ordering based on mint addresses
    let amm_seed_keys = [];
    if (token_mint.toString() < wsol_mint.toString()) {
        amm_seed_keys.push(token_mint);
        amm_seed_keys.push(wsol_mint);
    } else {
        amm_seed_keys.push(wsol_mint);
        amm_seed_keys.push(token_mint);
    }

    let amm_data_account = PublicKey.findProgramAddressSync(
        [amm_seed_keys[0].toBytes(), amm_seed_keys[1].toBytes(), Buffer.from("CookAMM")],
        PROGRAM,
    )[0];

    // Generate associated token accounts
    let user_token_account_key = await getAssociatedTokenAddress(
        token_mint, // mint
        user, // owner
        true, // allow owner off curve
        mint_account.token_program,
    );

    let base_amm_account = await getAssociatedTokenAddress(
        token_mint, // mint
        amm_data_account, // owner
        true, // allow owner off curve
        mint_account.token_program,
    );

    let quote_amm_account = await getAssociatedTokenAddress(
        wsol_mint, // mint
        amm_data_account, // owner
        true, // allow owner off curve
        TOKEN_PROGRAM_ID,
    );

    // Check the AMM Plugins to see if we have trade to earn rewards
    let amm_plugins: AMMPluginData = getAMMPlugins(amm);
    let current_date = Math.floor(new Date().getTime() / 1000 / 24 / 60 / 60) - amm_plugins.trade_reward_first_date;
    let date_bytes = uInt32ToLEBytes(current_date);

    // If we have trade to earn rewards we will use extra accounts
    // for the user and total days trading
    let launch_date_account = PublicKey.findProgramAddressSync(
        [amm_data_account.toBytes(), date_bytes, Buffer.from("LaunchDate")],
        PROGRAM,
    )[0];

    let user_date_account = PublicKey.findProgramAddressSync([amm_data_account.toBytes(), user.toBytes(), date_bytes], PROGRAM)[0];

    // Token account for trade to earn rewards
    let trade_to_earn_account = PublicKey.findProgramAddressSync([amm_data_account.toBytes(), Buffer.from("TradeToEarn")], PROGRAM)[0];

    // Lets Cook user data account
    let user_data_account = PublicKey.findProgramAddressSync([user.toBytes(), Buffer.from("User")], PROGRAM)[0];

    // Time Series price data account
    let index_buffer = uInt32ToLEBytes(0);
    let price_data_account = PublicKey.findProgramAddressSync(
        [amm_data_account.toBytes(), index_buffer, Buffer.from("TimeSeries")],
        PROGRAM,
    )[0];

    // Handle transfer hook accounts if we have a token that has that extension
    let transfer_hook = getTransferHook(mint_account.mint);

    let transfer_hook_program_account: PublicKey | null = null;
    let transfer_hook_validation_account: PublicKey | null = null;
    let extra_hook_accounts: AccountMeta[] = [];
    if (transfer_hook !== null) {
        console.log(transfer_hook.programId.toString());

        transfer_hook_program_account = transfer_hook.programId;
        transfer_hook_validation_account = PublicKey.findProgramAddressSync(
            [Buffer.from("extra-account-metas"), token_mint.toBuffer()],
            transfer_hook_program_account,
        )[0];

        // check if the validation account exists
        console.log("check extra accounts");
        let hook_accounts = await request_raw_account_data("", transfer_hook_validation_account);

        let extra_account_metas = ExtraAccountMetaAccountDataLayout.decode(Uint8Array.from(hook_accounts));
        console.log(extra_account_metas);
        for (let i = 0; i < extra_account_metas.extraAccountsList.count; i++) {
            console.log(extra_account_metas.extraAccountsList.extraAccounts[i]);
            let extra = extra_account_metas.extraAccountsList.extraAccounts[i];
            let meta = await resolveExtraAccountMeta(
                connection,
                extra,
                extra_hook_accounts,
                Buffer.from([]),
                transfer_hook_program_account,
            );
            console.log(meta);
            extra_hook_accounts.push(meta);
        }
    }
    const instruction_data = serialise_PlaceLimit_instruction(order_type, order_type === 0 ? sol_amount : token_amount, []);

    var account_vector = [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: user_data_account, isSigner: false, isWritable: true },

        { pubkey: user_token_account_key, isSigner: false, isWritable: true },
        { pubkey: temp_wsol_account, isSigner: false, isWritable: true },

        { pubkey: token_mint, isSigner: false, isWritable: false },
        { pubkey: wsol_mint, isSigner: false, isWritable: false },

        { pubkey: amm_data_account, isSigner: false, isWritable: true },
        { pubkey: base_amm_account, isSigner: false, isWritable: true },
        { pubkey: quote_amm_account, isSigner: false, isWritable: true },

        { pubkey: trade_to_earn_account, isSigner: false, isWritable: true },

        { pubkey: launch_date_account, isSigner: false, isWritable: true },
        { pubkey: user_date_account, isSigner: false, isWritable: true },

        { pubkey: price_data_account, isSigner: false, isWritable: true },

        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: mint_account.token_program, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
        { pubkey: Config.COOK_FEES, isSigner: false, isWritable: true },
    ];

    // if we had transfer hook accounts we also need to add the
    // hook program and validation account
    if (transfer_hook_program_account !== null) {
        account_vector.push({ pubkey: transfer_hook_program_account, isSigner: false, isWritable: true });
        account_vector.push({ pubkey: transfer_hook_validation_account, isSigner: false, isWritable: true });

        for (let i = 0; i < extra_hook_accounts.length; i++) {
            account_vector.push({
                pubkey: extra_hook_accounts[i].pubkey,
                isSigner: extra_hook_accounts[i].isSigner,
                isWritable: extra_hook_accounts[i].isWritable,
            });
        }
    }

    const instruction = new TransactionInstruction({
        keys: account_vector,
        programId: PROGRAM,
        data: instruction_data,
    });

    return instruction;
};

const usePerformSwap = (amm: AMMData) => {
    const wallet = useWallet();
    const { sendTransaction, isLoading } = useSendTransaction();
    const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });
    /**
     * Handles transaction signature updates from Solana
     * @param result - Transaction result from Solana
     * @returns Promise<void>
     */

    /**
     * Executes a swap transaction on the AMM
     * @param token_amount - Amount of base token to swap
     * @param sol_amount - Amount of SOL to swap
     * @param order_type - 0 for buy, 1 for sell
     */
    const PerformSwap = async (token_amount: number, sol_amount: number, order_type: number) => {
       
        if (!amm) {
            toast.error("Failed to get AMM Data");
            return;
        }

        let instruction = await getPerformSwapInstruction(connection, token_amount, sol_amount, order_type, wallet.publicKey, amm)

        if (!instruction) {
            toast.error("Failed to get Get MM Rewards instruction");
            return;
        }
        await sendTransaction({
            instructions: [instruction],
            onSuccess: () => {
                // Handle success
            },
            onError: (error) => {
                // Handle error
            },
        });
        
    };

    return { PerformSwap, isLoading };
};

export default usePerformSwap;
