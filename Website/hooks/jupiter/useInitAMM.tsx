import {
    LaunchData,
    LaunchInstruction,
    get_current_blockhash,
    myU64,
    send_transaction,
    serialise_basic_instruction,
    request_current_balance,
    uInt32ToLEBytes,
    request_raw_account_data,
    Token22MintAccount,
    ExtraAccountMetaHead,
    MetaData,
    getRecentPrioritizationFees,
} from "../../components/Solana/state";
import { PublicKey, Transaction, TransactionInstruction, Connection, ComputeBudgetProgram, AccountMeta } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { SOL_ACCOUNT_SEED, PROGRAM, Config, SYSTEM_KEY } from "../../components/Solana/constants";
import { useCallback, useRef, useState } from "react";
import bs58 from "bs58";
import BN from "bn.js";
import { toast } from "react-toastify";

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

import { LaunchKeys, LaunchFlags } from "../../components/Solana/constants";
import { make_tweet } from "../../components/launch/twitter";
import useAppRoot from "../../context/useAppRoot";

const useInitAMM = (launchData: LaunchData) => {
    const wallet = useWallet();
    const { mintData, listingData } = useAppRoot();

    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        // if we have a subscription field check against ws_id
        if (result.err !== null) {
            alert("Transaction failed, please try again");
            return;
        }

        if (Config.PROD) {
            let response = await make_tweet(launchData.page_name);
            console.log(response);
        }
        signature_ws_id.current = null;
    }, []);

    const GetInitAMMInstruction = async () => {
        // if we have already done this then just skip this step
        console.log(launchData);

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });
        let listing = listingData.get(launchData.listing.toString())
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

            let extra_account_metas = ExtraAccountMetaAccountDataLayout.decode(hook_accounts);
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
        account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: true });

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

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        const initAMMToast = toast.loading("Initialising AMM...");

        const list_instruction = await GetInitAMMInstruction();

        let list_txArgs = await get_current_blockhash("");

        let list_transaction = new Transaction(list_txArgs);
        list_transaction.feePayer = wallet.publicKey;

        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
        list_transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));

        list_transaction.add(list_instruction);
        list_transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 600_000 }));

        try {
            let signed_transaction = await wallet.signTransaction(list_transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            let signature = transaction_response.result;

            console.log("list sig: ", signature);

            signature_ws_id.current = 2;
            connection.onSignature(signature, check_signature_update, "confirmed");

            toast.update(initAMMToast, {
                render: "AMM initialised",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });
        } catch (error) {
            console.log(error);
            toast.update(initAMMToast, {
                render: "AMM initialisation failed, please try again later",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }
    };

    return { InitAMM, GetInitAMMInstruction, isLoading };
};

export default useInitAMM;
