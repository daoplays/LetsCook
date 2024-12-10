import {
    LaunchInstruction,
    serialise_basic_instruction,
    uInt32ToLEBytes,
    request_raw_account_data,
    getRecentPrioritizationFees,
} from "../../components/Solana/state";
import { PublicKey, TransactionInstruction, Connection, ComputeBudgetProgram, AccountMeta } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { SOL_ACCOUNT_SEED, PROGRAM, Config, SYSTEM_KEY } from "../../components/Solana/constants";
import {
    getAssociatedTokenAddress,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    getMint,
    getTransferHook,
    resolveExtraAccountMeta,
    ExtraAccountMetaAccountDataLayout,
    ExtraAccountMeta,
} from "@solana/spl-token";

import { LaunchKeys } from "../../components/Solana/constants";
import useAppRoot from "../../context/useAppRoot";
import useSendTransaction from "../useSendTransaction";
import { LaunchData } from "@letscook/sdk/dist/state/launch";

const useInitAMM = (launchData: LaunchData) => {
    const wallet = useWallet();
    const { mintData, listingData } = useAppRoot();

    const { sendTransaction, isLoading } = useSendTransaction();

    const GetInitAMMInstruction = async () => {
        // if we have already done this then just skip this step
        console.log(launchData);

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });
        let listing = listingData.get(launchData.listing.toString());
        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launchData.page_name), Buffer.from("Launch")], PROGRAM)[0];

        let wrapped_sol_mint = new PublicKey("So11111111111111111111111111111111111111112");
        var token_mint_pubkey = listing.mint;
        let mint_account = mintData.get(listing.mint.toString());

        var team_wallet = launchData.keys[LaunchKeys.TeamWallet];

        let team_token_account = await getAssociatedTokenAddress(
            token_mint_pubkey, // mint
            team_wallet, // owner
            true, // allow owner off curve
            mint_account.token_program,
        );

        let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

        let base_pda_account = await getAssociatedTokenAddress(
            token_mint_pubkey, // mint
            program_sol_account, // owner
            true, // allow owner off curve
            mint_account.token_program,
        );

        var quote_pda_account = launchData.keys[LaunchKeys.WSOLAddress];

        let amm_seed_keys = [];
        if (token_mint_pubkey.toString() < wrapped_sol_mint.toString()) {
            amm_seed_keys.push(token_mint_pubkey);
            amm_seed_keys.push(wrapped_sol_mint);
        } else {
            amm_seed_keys.push(wrapped_sol_mint);
            amm_seed_keys.push(token_mint_pubkey);
        }

        let amm_data_account = PublicKey.findProgramAddressSync(
            [amm_seed_keys[0].toBytes(), amm_seed_keys[1].toBytes(), Buffer.from("CookAMM")],
            PROGRAM,
        )[0];

        let base_amm_account = await getAssociatedTokenAddress(
            token_mint_pubkey, // mint
            amm_data_account, // owner
            true, // allow owner off curve
            mint_account.token_program,
        );

        let quote_amm_account = await getAssociatedTokenAddress(
            wrapped_sol_mint, // mint
            amm_data_account, // owner
            true, // allow owner off curve
            TOKEN_PROGRAM_ID,
        );

        let trade_to_earn_account = PublicKey.findProgramAddressSync([amm_data_account.toBytes(), Buffer.from("TradeToEarn")], PROGRAM)[0];

        let cook_lp_mint_account = PublicKey.findProgramAddressSync([amm_data_account.toBytes(), Buffer.from("LP")], PROGRAM)[0];

        let user_data_account = PublicKey.findProgramAddressSync(
            [launchData.keys[LaunchKeys.Seller].toBytes(), Buffer.from("User")],
            PROGRAM,
        )[0];

        let index_buffer = uInt32ToLEBytes(0);
        let price_data_account = PublicKey.findProgramAddressSync(
            [amm_data_account.toBytes(), index_buffer, Buffer.from("TimeSeries")],
            PROGRAM,
        )[0];

        let transfer_hook = getTransferHook(mint_account.mint);

        let transfer_hook_program_account: PublicKey | null = null;
        let transfer_hook_validation_account: PublicKey | null = null;
        let extra_hook_accounts: AccountMeta[] = [];
        if (transfer_hook !== null) {
            console.log(transfer_hook.programId.toString());

            transfer_hook_program_account = transfer_hook.programId;
            transfer_hook_validation_account = PublicKey.findProgramAddressSync(
                [Buffer.from("extra-account-metas"), token_mint_pubkey.toBuffer()],
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

        console.log("base amm", base_amm_account.toString());

        const instruction_data = serialise_basic_instruction(LaunchInstruction.init_market);
        
        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_data_account, isSigner: false, isWritable: true },
            { pubkey: launchData.listing, isSigner: false, isWritable: false },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },
            { pubkey: team_token_account, isSigner: false, isWritable: true },
            { pubkey: team_wallet, isSigner: false, isWritable: true },

            { pubkey: program_sol_account, isSigner: false, isWritable: true },
            { pubkey: amm_data_account, isSigner: false, isWritable: true },

            { pubkey: token_mint_pubkey, isSigner: false, isWritable: true },
            { pubkey: wrapped_sol_mint, isSigner: false, isWritable: true },
            { pubkey: cook_lp_mint_account, isSigner: false, isWritable: true },

            { pubkey: base_pda_account, isSigner: false, isWritable: true },
            { pubkey: quote_pda_account, isSigner: false, isWritable: true },

            { pubkey: base_amm_account, isSigner: false, isWritable: true },
            { pubkey: quote_amm_account, isSigner: false, isWritable: true },
            { pubkey: trade_to_earn_account, isSigner: false, isWritable: true },

            { pubkey: price_data_account, isSigner: false, isWritable: true },
        ];
        account_vector.push({ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: mint_account.token_program, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: false });

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

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        return list_instruction;
    };

    const InitAMM = async () => {
        // if we have already done this then just skip this step
        console.log(launchData);

        const list_instruction = await GetInitAMMInstruction();

        let instructions: TransactionInstruction[] = [];
        
        instructions.push(list_instruction);

        await sendTransaction({
            instructions,
            onSuccess: () => {
                // Handle success
            },
            onError: (error) => {
                // Handle error
            },
            computeUnits : 600_000
        });

    };

    return { InitAMM, GetInitAMMInstruction, isLoading };
};

export default useInitAMM;
