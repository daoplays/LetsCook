import {
    LaunchInstruction,
    get_current_blockhash,
    serialise_basic_instruction,
    uInt32ToLEBytes,
    request_raw_account_data,
    getRecentPrioritizationFees,
} from "../../components/Solana/state";
import { PublicKey, Transaction, TransactionInstruction, Connection, AccountMeta, ComputeBudgetProgram } from "@solana/web3.js";
import {
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getTransferHook,
    resolveExtraAccountMeta,
    ExtraAccountMetaAccountDataLayout,
} from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, Config, SYSTEM_KEY, SOL_ACCOUNT_SEED } from "../../components/Solana/constants";
import { LaunchKeys } from "../../components/Solana/constants";
import useSendTransaction from "../useSendTransaction";
import { LaunchData } from "@letscook/sdk/dist/state/launch";
import { ListingData } from "@letscook/sdk/dist/state/listing";
import { getMintData } from "@letscook/sdk";

export const GetClaimTokensInstruction = async(user: PublicKey, launchData: LaunchData, listingData: ListingData)=>{

        if (launchData === null) {
            return;
        }

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        if (user.toString() == launchData.keys[LaunchKeys.Seller].toString()) {
            alert("Launch creator cannot buy tickets");
            return;
        }

        let user_data_account = PublicKey.findProgramAddressSync([user.toBytes(), Buffer.from("User")], PROGRAM)[0];

        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launchData.page_name), Buffer.from("Launch")], PROGRAM)[0];

        let user_join_account = PublicKey.findProgramAddressSync(
            [user.toBytes(), Buffer.from(launchData.page_name), Buffer.from("Joiner")],
            PROGRAM,
        )[0];

        let temp_wsol_account = PublicKey.findProgramAddressSync([user.toBytes(), Buffer.from("Temp")], PROGRAM)[0];

        let wrapped_sol_mint = new PublicKey("So11111111111111111111111111111111111111112");
        let mint_account = await getMintData(connection, listingData.mint.toString());

        let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

        let token_raffle_account_key = await getAssociatedTokenAddress(
            listingData.mint, // mint
            program_sol_account, // owner
            true, // allow owner off curve
            mint_account.token_program,
        );

        let user_token_account_key = await getAssociatedTokenAddress(
            listingData.mint, // mint
            user, // owner
            true, // allow owner off curve
            mint_account.token_program,
        );

        let transfer_hook = getTransferHook(mint_account.mint);

        let transfer_hook_program_account: PublicKey | null = null;
        let transfer_hook_validation_account: PublicKey | null = null;
        let extra_hook_accounts: AccountMeta[] = [];
        if (transfer_hook !== null) {
            console.log(transfer_hook.programId.toString());

            transfer_hook_program_account = transfer_hook.programId;
            transfer_hook_validation_account = PublicKey.findProgramAddressSync(
                [Buffer.from("extra-account-metas"), listingData.mint.toBuffer()],
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
        const instruction_data = serialise_basic_instruction(LaunchInstruction.claim_tokens);

        var account_vector = [
            { pubkey: user, isSigner: true, isWritable: true },
            { pubkey: user_data_account, isSigner: false, isWritable: true },
            { pubkey: user_join_account, isSigner: false, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },

            { pubkey: launchData.keys[LaunchKeys.WSOLAddress], isSigner: false, isWritable: true },
            { pubkey: temp_wsol_account, isSigner: false, isWritable: true },
            { pubkey: wrapped_sol_mint, isSigner: false, isWritable: true },

            { pubkey: token_raffle_account_key, isSigner: false, isWritable: true },
            { pubkey: user_token_account_key, isSigner: false, isWritable: true },
            { pubkey: listingData.mint, isSigner: false, isWritable: true },

            { pubkey: program_sol_account, isSigner: false, isWritable: true },
            { pubkey: launchData.listing, isSigner: false, isWritable: false },

            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: mint_account.token_program, isSigner: false, isWritable: false },
            { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
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

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });
        
        return list_instruction;

}

const useClaimTokens = (launchData: LaunchData, listingData: ListingData) => {
    const wallet = useWallet();

    const { sendTransaction, isLoading } = useSendTransaction();
    const ClaimTokens = async () => {
        let instruction = await GetClaimTokensInstruction(wallet.publicKey, launchData, listingData);
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

    return { ClaimTokens, isLoading };
};

export default useClaimTokens;
