import { uInt32ToLEBytes, request_raw_account_data, getRecentPrioritizationFees } from "../../components/Solana/state";
import { AMMData, serialise_ClaimReward_instruction } from "../../components/Solana/jupiter_state";

import { PublicKey, TransactionInstruction, Connection, AccountMeta, ComputeBudgetProgram } from "@solana/web3.js";
import { useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { PROGRAM, Config, SYSTEM_KEY, SOL_ACCOUNT_SEED } from "../../components/Solana/constants";

import { getAssociatedTokenAddress, getTransferHook, resolveExtraAccountMeta, ExtraAccountMetaAccountDataLayout } from "@solana/spl-token";
import { getMintData } from "@/components/amm/launch";
import useSendTransaction from "../useSendTransaction";
import { toast } from "react-toastify";

export const GetMMRewardsInstruction = async (
    connection: Connection,
    amm: AMMData,
    amm_provider: number,
    user: PublicKey,
    date: number,
): Promise<TransactionInstruction> => {
    if (user === null) return;

    const token_mint = amm.base_mint;
    let mint_account = await getMintData(token_mint.toString());
    const wsol_mint = amm.quote_mint;

    let user_pda_account = PublicKey.findProgramAddressSync([user.toBytes(), Buffer.from("User_PDA")], PROGRAM)[0];

    let user_token_account_key = await getAssociatedTokenAddress(
        token_mint, // mint
        user, // owner
        true, // allow owner off curve
        mint_account.token_program,
    );

    let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

    let amm_seed_keys = [];
    if (token_mint.toString() < wsol_mint.toString()) {
        amm_seed_keys.push(token_mint);
        amm_seed_keys.push(wsol_mint);
    } else {
        amm_seed_keys.push(wsol_mint);
        amm_seed_keys.push(token_mint);
    }

    let amm_data_account = PublicKey.findProgramAddressSync(
        [amm_seed_keys[0].toBytes(), amm_seed_keys[1].toBytes(), Buffer.from(amm_provider === 0 ? "CookAMM" : "RaydiumCPMM")],
        PROGRAM,
    )[0];

    let date_bytes = uInt32ToLEBytes(date);

    let launch_date_account = PublicKey.findProgramAddressSync(
        [amm_data_account.toBytes(), date_bytes, Buffer.from("LaunchDate")],
        PROGRAM,
    )[0];

    let user_date_account = PublicKey.findProgramAddressSync([amm_data_account.toBytes(), user.toBytes(), date_bytes], PROGRAM)[0];

    let trade_to_earn_account = PublicKey.findProgramAddressSync([amm_data_account.toBytes(), Buffer.from("TradeToEarn")], PROGRAM)[0];

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

    const instruction_data = serialise_ClaimReward_instruction(date, amm_provider);

    var account_vector = [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: user_pda_account, isSigner: false, isWritable: true },
        { pubkey: user_token_account_key, isSigner: false, isWritable: true },

        { pubkey: trade_to_earn_account, isSigner: false, isWritable: true },
        { pubkey: program_sol_account, isSigner: false, isWritable: true },

        { pubkey: amm_data_account, isSigner: false, isWritable: true },
        { pubkey: launch_date_account, isSigner: false, isWritable: true },
        { pubkey: user_date_account, isSigner: false, isWritable: true },
        { pubkey: token_mint, isSigner: false, isWritable: false },
        { pubkey: wsol_mint, isSigner: false, isWritable: false },
        { pubkey: mint_account.token_program, isSigner: false, isWritable: false },
        { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
    ];

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

const useGetMMRewards = (amm: AMMData, amm_provider: number) => {
    const wallet = useWallet();

    const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

    const { sendTransaction, isLoading } = useSendTransaction();

    const GetMMRewards = async (date: number) => {
        let instruction = await GetMMRewardsInstruction(connection, amm, amm_provider, wallet.publicKey, date);

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

    return { GetMMRewards, isLoading };
};

export default useGetMMRewards;
