import {
    LaunchInstruction,
    get_current_blockhash,
    myU64,
    send_transaction,
    serialise_basic_instruction,
    uInt32ToLEBytes,
    request_raw_account_data,
    getRecentPrioritizationFees,
} from "../../components/Solana/state";
import { request_assignment_data } from "../../components/collection/collectionState";
import {
    ComputeBudgetProgram,
    PublicKey,
    Transaction,
    TransactionInstruction,
    Connection,
    Keypair,
    SYSVAR_RENT_PUBKEY,
    AccountMeta,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getTransferHook, resolveExtraAccountMeta, ExtraAccountMetaAccountDataLayout } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, Config, SYSTEM_KEY, SOL_ACCOUNT_SEED, CollectionKeys, METAPLEX_META, CORE } from "../../components/Solana/constants";
import { useCallback, useRef, useState, useEffect } from "react";
import bs58 from "bs58";
import { LaunchKeys, LaunchFlags } from "../../components/Solana/constants";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import useMintNFT from "./useMintNFT";
import { toast } from "react-toastify";
import useSendTransaction from "../useSendTransaction";
import { getMintData } from "@/components/amm/launch";
import { CollectionData } from "@letscook/sdk/dist/state/collections";

const useMintRandom = (launchData: CollectionData, updateData: boolean = false) => {
    const wallet = useWallet();
    const { sendTransaction, isLoading } = useSendTransaction();

    const MintRandom = async () => {
        if (wallet.signTransaction === undefined) return;

        if (wallet.publicKey.toString() == launchData.keys[LaunchKeys.Seller].toString()) {
            alert("Launch creator cannot buy NFTs");
            return;
        }

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        if (launchData === null) {
            return;
        }

        let launch_data_account = PublicKey.findProgramAddressSync(
            [Buffer.from(launchData.page_name), Buffer.from("Collection")],
            PROGRAM,
        )[0];

        let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

        let token_mint = launchData.keys[CollectionKeys.MintAddress];
        let mint_account = await getMintData(launchData.keys[CollectionKeys.MintAddress].toString());
        let user_token_account_key = await getAssociatedTokenAddress(
            token_mint, // mint
            wallet.publicKey, // owner
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

        let nft_assignment_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), launchData.keys[CollectionKeys.CollectionMint].toBytes(), Buffer.from("assignment")],
            PROGRAM,
        )[0];

        //console.log("get assignment data");
        let assignment_data = await request_assignment_data(nft_assignment_account);

        if (assignment_data === null) {
            toast.error("Unable to retrieve nft assignment data, please try again later", {
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }
        console.log("assignment randoms", assignment_data.random_address.toString());

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        let nft_mint_keypair = new Keypair();
        let nft_mint_account = nft_mint_keypair.publicKey;

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

        const instruction_data = serialise_basic_instruction(LaunchInstruction.mint_random);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: nft_assignment_account, isSigner: false, isWritable: true },

            { pubkey: launch_data_account, isSigner: false, isWritable: true },
            { pubkey: program_sol_account, isSigner: false, isWritable: true },

            { pubkey: nft_mint_account, isSigner: true, isWritable: true },
            { pubkey: launchData.keys[CollectionKeys.CollectionMint], isSigner: false, isWritable: true },

            { pubkey: launchData.keys[CollectionKeys.TeamWallet], isSigner: false, isWritable: true },
            { pubkey: token_mint, isSigner: false, isWritable: false },
            { pubkey: pda_token_account_key, isSigner: false, isWritable: true },
            { pubkey: user_token_account_key, isSigner: false, isWritable: true },
            { pubkey: team_token_account_key, isSigner: false, isWritable: true },
        ];

        account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: CORE, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: assignment_data.random_address, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: mint_account.token_program, isSigner: false, isWritable: false });

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
        instructions.push(list_instruction);

        await sendTransaction({
            instructions,
            onSuccess: () => {
                // Handle success
            },
            onError: (error) => {
                // Handle error
            },
            additionalSigner: nft_mint_keypair,
        });
    };

    return { MintRandom, isLoading };
};

export default useMintRandom;
