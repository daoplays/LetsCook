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
    getRecentPrioritizationFees,
} from "../../components/Solana/state";
import { AMMData, serialise_ClaimReward_instruction } from "../../components/Solana/jupiter_state";

import { PublicKey, Transaction, TransactionInstruction, Connection, AccountMeta, ComputeBudgetProgram } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { LaunchKeys, PROGRAM, Config, SYSTEM_KEY, SOL_ACCOUNT_SEED, LaunchFlags } from "../../components/Solana/constants";
import { useCallback, useRef, useState } from "react";
import bs58 from "bs58";
import BN from "bn.js";
import { toast } from "react-toastify";
import useAppRoot from "../../context/useAppRoot";

import {
    getAssociatedTokenAddress,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getMint,
    getTransferHook,
    resolveExtraAccountMeta,
    ExtraAccountMetaAccountDataLayout,
} from "@solana/spl-token";

const useGetMMRewards = (amm: AMMData, amm_provider: number) => {
    const wallet = useWallet();
    const { checkProgramData, mintData } = useAppRoot();

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

        toast.success("Rewards Claimed!", {
            type: "success",
            isLoading: false,
            autoClose: 3000,
        });

        await checkProgramData();

        signature_ws_id.current = null;
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

    const GetMMRewards = async (date: number) => {
        setIsLoading(true);
        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        const token_mint = amm.base_mint;
        let mint_account = mintData.get(token_mint.toString());
        const wsol_mint = amm.quote_mint;

        let user_pda_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User_PDA")], PROGRAM)[0];

        let user_token_account_key = await getAssociatedTokenAddress(
            token_mint, // mint
            wallet.publicKey, // owner
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

        let user_date_account = PublicKey.findProgramAddressSync(
            [amm_data_account.toBytes(), wallet.publicKey.toBytes(), date_bytes],
            PROGRAM,
        )[0];

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
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
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

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
        transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));

        transaction.add(instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            var signature = await connection.sendRawTransaction(signed_transaction.serialize(), { skipPreflight: true });

            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");

            setTimeout(transaction_failed, 20000);
        } catch (error) {
            console.log(error);
            setIsLoading(false);
            return;
        }
    };

    return { GetMMRewards, isLoading };
};

export default useGetMMRewards;
