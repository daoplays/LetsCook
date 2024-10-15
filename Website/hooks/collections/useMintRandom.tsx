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
} from "../../components/Solana/state";
import { CollectionData, request_assignment_data } from "../../components/collection/collectionState";
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
import useAppRoot from "../../context/useAppRoot";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import useMintNFT from "./useMintNFT";
import { toast } from "react-toastify";

const useMintRandom = (launchData: CollectionData, updateData: boolean = false) => {
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

        toast.success("Transaction Successfull", {
            type: "success",
            isLoading: false,
            autoClose: 3000,
        });

        if (updateData) {
            await checkProgramData();
        }
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

    const MintRandom = async () => {
        setIsLoading(true);

        if (wallet.signTransaction === undefined) return;

        if (wallet.publicKey.toString() == launchData.keys[LaunchKeys.Seller].toString()) {
            alert("Launch creator cannot buy NFTs");
            return;
        }

        if (signature_ws_id.current !== null) {
            alert("Transaction pending, please wait");
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
        let mint_account = mintData.get(launchData.keys[CollectionKeys.MintAddress].toString());
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

        let nft_assignment_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), launchData.keys[CollectionKeys.CollectionMint].toBytes(), Buffer.from("assignment")],
            PROGRAM,
        )[0];

        //console.log("get assignment data");
        let assignment_data = await request_assignment_data(nft_assignment_account);

        console.log("assignment randoms", assignment_data.random_address.toString());
        if (assignment_data === null) {
            // console.log("no assignment data found");
            return;
        }

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
            { pubkey: launch_data_account, isSigner: false, isWritable: true },
            { pubkey: program_sol_account, isSigner: false, isWritable: true },
            { pubkey: nft_assignment_account, isSigner: false, isWritable: true },
            { pubkey: launchData.keys[CollectionKeys.CollectionMint], isSigner: false, isWritable: true },
            { pubkey: nft_mint_account, isSigner: true, isWritable: true },

            { pubkey: CORE, isSigner: false, isWritable: false },
            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
            { pubkey: assignment_data.random_address, isSigner: false, isWritable: false },
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

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
        transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));
        transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));
        transaction.add(list_instruction);

        transaction.partialSign(nft_mint_keypair);
        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            var signature = await connection.sendRawTransaction(signed_transaction.serialize(), { skipPreflight: true });

            console.log("mint random sig: ", signature);

            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
            setTimeout(transaction_failed, 20000);
        } catch (error) {
            console.log(error);
            setIsLoading(false);
            return;
        }
    };

    return { MintRandom, isLoading };
};

export default useMintRandom;
