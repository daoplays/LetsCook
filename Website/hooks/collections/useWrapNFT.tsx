import {
    LaunchData,
    LaunchInstruction,
    get_current_blockhash,
    myU64,
    send_transaction,
    serialise_basic_instruction,
    uInt32ToLEBytes,
    request_raw_account_data,
    getRecentPrioritizationFees,
    MintData,
} from "../../components/Solana/state";
import { CollectionData, AssignmentData, request_assignment_data } from "../../components/collection/collectionState";
import {
    ComputeBudgetProgram,
    SYSVAR_RENT_PUBKEY,
    PublicKey,
    Transaction,
    TransactionInstruction,
    Connection,
    Keypair,
    AccountMeta,
} from "@solana/web3.js";
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    getAssociatedTokenAddressSync,
    unpackAccount,
    Account,
    getTransferHook,
    resolveExtraAccountMeta,
    ExtraAccountMetaAccountDataLayout,
} from "@solana/spl-token";
import { Key, getAssetV1GpaBuilder, updateAuthority, AssetV1, deserializeAssetV1 } from "@metaplex-foundation/mpl-core";
import type { RpcAccount, PublicKey as umiKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, Config, SYSTEM_KEY, SOL_ACCOUNT_SEED, CollectionKeys, METAPLEX_META, CORE } from "../../components/Solana/constants";
import { useCallback, useRef, useState } from "react";
import bs58 from "bs58";
import { LaunchKeys, LaunchFlags } from "../../components/Solana/constants";
import { toast } from "react-toastify";
import { getMintData } from "@/components/amm/launch";
import useSendTransaction from "../useSendTransaction";

export const GetWrapInstructions = async (
    launchData: CollectionData,
    mint_account: MintData,
    user: PublicKey,
    asset_key: PublicKey | null,
) => {
    const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

    let wrapped_nft_key: PublicKey;

    if (asset_key === null) {
        const umi = createUmi(Config.RPC_NODE, "confirmed");

        let collection_umiKey = publicKey(launchData.keys[CollectionKeys.CollectionMint].toString());

        const assets = await getAssetV1GpaBuilder(umi)
            .whereField("key", Key.AssetV1)
            .whereField("updateAuthority", updateAuthority("Collection", [collection_umiKey]))
            .getDeserialized();

        let valid_assets: AssetV1[] = [];
        for (let i = 0; i < assets.length; i++) {
            if (assets[i].owner !== user.toString()) {
                continue;
            }

            //console.log(account, token_mints[i].toString())
            valid_assets.push(assets[i]);
        }
        //console.log(valid_lookups);

        if (valid_assets.length === 0) {
            console.log("no nfts owned by user");
            return;
        }

        let wrapped_index = Math.floor(Math.random() * valid_assets.length);
        wrapped_nft_key = new PublicKey(valid_assets[wrapped_index].publicKey.toString());
    } else {
        wrapped_nft_key = asset_key;
    }

    let user_data_account = PublicKey.findProgramAddressSync([user.toBytes(), Buffer.from("User")], PROGRAM)[0];

    let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

    let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launchData.page_name), Buffer.from("Collection")], PROGRAM)[0];

    let token_mint = launchData.keys[CollectionKeys.MintAddress];

    let user_token_account_key = await getAssociatedTokenAddress(
        token_mint, // mint
        user, // owner
        true, // allow owner off curve
        mint_account.token_program,
    );

    let pda_token_account_key = await getAssociatedTokenAddress(
        token_mint, // mint
        program_sol_account, // owner
        true, // allow owner off curve
        mint_account.token_program,
    );

    let team_token_account_key = await getAssociatedTokenAddress(
        token_mint, // mint
        launchData.keys[CollectionKeys.TeamWallet], // owner
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
            [Buffer.from("extra-account-metas"), launchData.keys[CollectionKeys.MintAddress].toBuffer()],
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

    const instruction_data = serialise_basic_instruction(LaunchInstruction.wrap_nft);

    var account_vector = [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: user_data_account, isSigner: false, isWritable: true },

        { pubkey: launch_data_account, isSigner: false, isWritable: true },
        { pubkey: program_sol_account, isSigner: false, isWritable: true },

        { pubkey: token_mint, isSigner: false, isWritable: true },
        { pubkey: user_token_account_key, isSigner: false, isWritable: true },
        { pubkey: pda_token_account_key, isSigner: false, isWritable: true },
        { pubkey: team_token_account_key, isSigner: false, isWritable: true },

        { pubkey: wrapped_nft_key, isSigner: false, isWritable: true },
        { pubkey: launchData.keys[CollectionKeys.CollectionMint], isSigner: false, isWritable: true },
    ];

    account_vector.push({ pubkey: mint_account.token_program, isSigner: false, isWritable: false });
    account_vector.push({ pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
    account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: false });
    account_vector.push({ pubkey: CORE, isSigner: false, isWritable: false });

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

    let instructions: TransactionInstruction[] = [];

    let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);

    instructions.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));
    instructions.push(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));
    instructions.push(list_instruction);

    return instructions;
};

const useWrapNFT = (launchData: CollectionData, updateData: boolean = false) => {
    const wallet = useWallet();
    const { sendTransaction, isLoading } = useSendTransaction();



    const WrapNFT = async (asset_key: PublicKey | null) => {
        console.log("in wrap nft");

        if (wallet.signTransaction === undefined) {
            console.log(wallet, "invalid wallet");
            return;
        }

        if (wallet.publicKey.toString() == launchData.keys[LaunchKeys.Seller].toString()) {
            alert("Launch creator cannot buy tickets");
            return;
        }



        if (launchData === null) {
            console.log("launch is null");
            return;
        }

        let mint_account = await getMintData(launchData.keys[CollectionKeys.MintAddress].toString());

        let instructions = await GetWrapInstructions(launchData, mint_account, wallet.publicKey, asset_key);
        await sendTransaction({
            instructions,
            onSuccess: () => {
                // Handle success
            },
            onError: (error) => {
                // Handle error
            }
        });

    };

    return { WrapNFT, GetWrapInstructions, isLoading };
};

export default useWrapNFT;
