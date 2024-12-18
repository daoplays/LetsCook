import { LaunchInstruction, uInt32ToLEBytes, request_raw_account_data, getRecentPrioritizationFees } from "../../components/Solana/state";
import { AMMData } from "../../components/Solana/jupiter_state";

import { PublicKey, TransactionInstruction, Connection, AccountMeta } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, Config, SYSTEM_KEY, SOL_ACCOUNT_SEED } from "../../components/Solana/constants";

import { ComputeBudgetProgram } from "@solana/web3.js";

import {
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getTransferHook,
    resolveExtraAccountMeta,
    ExtraAccountMetaAccountDataLayout,
} from "@solana/spl-token";
import { FixableBeetStruct, bignum, u64, u8 } from "@metaplex-foundation/beet";
import { getMintData } from "@/components/amm/launch";
import useSendTransaction from "../useSendTransaction";
import { toast } from "react-toastify";

export class UpdateLiquidity_Instruction {
    constructor(
        readonly instruction: number,
        readonly side: number,
        readonly in_amount: bignum,
    ) {}

    static readonly struct = new FixableBeetStruct<UpdateLiquidity_Instruction>(
        [
            ["instruction", u8],
            ["side", u8],
            ["in_amount", u64],
        ],
        (args) => new UpdateLiquidity_Instruction(args.instruction!, args.side!, args.in_amount!),
        "UpdateLiquidity_Instruction",
    );
}
export const getUpdateCookLiquidityInstruction = async (
    connection: Connection,
    user: PublicKey,
    amm: AMMData,
    token_amount: number,
    order_type: number,
) => {
    function serialise_update_liquidity(side: number, in_amount: bignum): Buffer {
        const data = new UpdateLiquidity_Instruction(LaunchInstruction.update_cook_liquidity, side, in_amount);
        const [buf] = UpdateLiquidity_Instruction.struct.serialize(data);

        return buf;
    }

    function serialise_remove_liquidity(side: number, in_amount: bignum): Buffer {
        const data = new UpdateLiquidity_Instruction(LaunchInstruction.remove_cook_liquidity, side, in_amount);
        const [buf] = UpdateLiquidity_Instruction.struct.serialize(data);

        return buf;
    }

    if (user === null) return;

    const token_mint = amm.base_mint;
    const wsol_mint = amm.quote_mint;
    let mint_account = await getMintData(token_mint.toString());

    let user_token_account_key = await getAssociatedTokenAddress(
        token_mint, // mint
        user, // owner
        true, // allow owner off curve
        mint_account.token_program,
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
        [amm_seed_keys[0].toBytes(), amm_seed_keys[1].toBytes(), Buffer.from("CookAMM")],
        PROGRAM,
    )[0];

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

    let cook_lp_mint_account = PublicKey.findProgramAddressSync([amm_data_account.toBytes(), Buffer.from("LP")], PROGRAM)[0];

    let user_lp_token_account_key = await getAssociatedTokenAddress(
        cook_lp_mint_account, // mint
        user, // owner
        true, // allow owner off curve
        mint_account.token_program,
    );

    console.log("lp", cook_lp_mint_account.toString(), user_lp_token_account_key.toString());

    let temp_wsol_account = PublicKey.findProgramAddressSync([user.toBytes(), Buffer.from("Temp")], PROGRAM)[0];

    let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

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
    const instruction_data = order_type == 0 ? serialise_update_liquidity(0, token_amount) : serialise_remove_liquidity(0, token_amount);

    var account_vector = [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: token_mint, isSigner: false, isWritable: false },
        { pubkey: wsol_mint, isSigner: false, isWritable: false },
        { pubkey: cook_lp_mint_account, isSigner: false, isWritable: true },

        { pubkey: temp_wsol_account, isSigner: false, isWritable: true },
        { pubkey: user_token_account_key, isSigner: false, isWritable: true },
        { pubkey: user_lp_token_account_key, isSigner: false, isWritable: true },

        { pubkey: amm_data_account, isSigner: false, isWritable: true },
        { pubkey: base_amm_account, isSigner: false, isWritable: true },
        { pubkey: quote_amm_account, isSigner: false, isWritable: true },
        { pubkey: program_sol_account, isSigner: false, isWritable: false },

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

    const instruction = new TransactionInstruction({
        keys: account_vector,
        programId: PROGRAM,
        data: instruction_data,
    });

    return instruction;
};

const useUpdateCookLiquidity = (amm: AMMData) => {
    const wallet = useWallet();

    const { sendTransaction, isLoading } = useSendTransaction();
    const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

    const UpdateCookLiquidity = async (token_amount: number, order_type: number) => {
        
        if (!amm) {
            toast.error("Failed to get AMM Data");
            return;
        }

        let instruction = await getUpdateCookLiquidityInstruction(
            connection,
            wallet.publicKey,
            amm,
            token_amount,
            order_type,
        );

        if (!instruction) {
            toast.error("Failed to get Get instruction");
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

    return { UpdateCookLiquidity, isLoading };
};

export default useUpdateCookLiquidity;
