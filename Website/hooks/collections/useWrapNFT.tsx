import {
    LaunchData,
    LaunchInstruction,
    get_current_blockhash,
    myU64,
    send_transaction,
    serialise_basic_instruction,
    uInt32ToLEBytes,
} from "../../components/Solana/state";
import {
    CollectionData,
    AssignmentData,
    LookupData,
    request_assignment_data,
    request_lookup_data,
} from "../../components/collection/collectionState";
import {
    ComputeBudgetProgram,
    SYSVAR_RENT_PUBKEY,
    PublicKey,
    Transaction,
    TransactionInstruction,
    Connection,
    Keypair,
} from "@solana/web3.js";
import {
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    getAssociatedTokenAddressSync,
    unpackAccount,
    Account,
} from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import {
    PROGRAM,
    RPC_NODE,
    SYSTEM_KEY,
    WSS_NODE,
    SOL_ACCOUNT_SEED,
    PYTH_BTC,
    PYTH_ETH,
    PYTH_SOL,
    CollectionKeys,
    METAPLEX_META,
} from "../../components/Solana/constants";
import { useCallback, useRef, useState } from "react";
import bs58 from "bs58";
import { LaunchKeys, LaunchFlags } from "../../components/Solana/constants";
import useAppRoot from "../../context/useAppRoot";

const useWrapNFT = (launchData: CollectionData, updateData: boolean = false) => {
    const wallet = useWallet();
    const { checkProgramData, NFTLookup } = useAppRoot();

    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        // if we have a subscription field check against ws_id
        if (result.err !== null) {
            alert("Transaction failed, please try again");
        }
        signature_ws_id.current = null;

        if (updateData) {
            await checkProgramData();
        }
    }, []);

    const WrapNFT = async () => {
        console.log("in mint nft");
        setIsLoading(true);

        if (wallet.signTransaction === undefined) {
            console.log(wallet, "invalid wallet");
            return;
        }

        if (wallet.publicKey.toString() == launchData.keys[LaunchKeys.Seller].toString()) {
            alert("Launch creator cannot buy tickets");
            return;
        }

        if (signature_ws_id.current !== null) {
            console.log("signature not null");
            alert("Transaction pending, please wait");
            return;
        }

        const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });

        if (launchData === null) {
            console.log("launch is null");
            return;
        }

        let CollectionLookup = NFTLookup.current.get(launchData.keys[CollectionKeys.CollectionMint].toString());
        let token_addresses: PublicKey[] = [];
        let token_mints: PublicKey[] = [];

        let lookup_keys = CollectionLookup.keys()
        while(true) {
            let lookup_it = lookup_keys.next();
            if (lookup_it.done)
                break;

            let nft_mint = new PublicKey(lookup_it.value)
            let token_account = getAssociatedTokenAddressSync(
                nft_mint, // mint
                wallet.publicKey, // owner
                true, // allow owner off curve
                TOKEN_2022_PROGRAM_ID,
            );
            token_addresses.push(token_account);
            token_mints.push(nft_mint);
        }

        console.log(token_addresses.length, " potential nfts found");
        let token_infos = await connection.getMultipleAccountsInfo(token_addresses, "confirmed");

        let valid_lookups: LookupData[] = [];
        for (let i = 0; i < token_infos.length; i++) {
            if ( token_infos[i] === null) {
                continue;
            }
            let account = unpackAccount(token_addresses[i], token_infos[i], TOKEN_2022_PROGRAM_ID);
            console.log(account, token_mints[i].toString())
            if (account.amount > 0) {
                valid_lookups.push(CollectionLookup.get(token_mints[i].toString()));
            }
        }
        console.log(valid_lookups);

        if (valid_lookups.length === 0) {
            console.log("no nfts owned by user")
            return;
        }

        let wrapped_index = Math.floor(Math.random() * valid_lookups.length);
        let wrapped_nft_key = valid_lookups[wrapped_index].nft_mint;

        let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

        let nft_lookup_account = PublicKey.findProgramAddressSync(
            [
                launchData.keys[CollectionKeys.CollectionMint].toBytes(),
                uInt32ToLEBytes(valid_lookups[wrapped_index].nft_index),
                Buffer.from("Lookup"),
            ],
            PROGRAM,
        )[0];

        let nft_token_account = await getAssociatedTokenAddress(
            wrapped_nft_key, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            TOKEN_2022_PROGRAM_ID,
        );

        let nft_escrow_account = await getAssociatedTokenAddress(
            wrapped_nft_key, // mint
            program_sol_account, // owner
            true, // allow owner off curve
            TOKEN_2022_PROGRAM_ID,
        );

        let launch_data_account = PublicKey.findProgramAddressSync(
            [Buffer.from(launchData.page_name), Buffer.from("Collection")],
            PROGRAM,
        )[0];

        const instruction_data = serialise_basic_instruction(LaunchInstruction.wrap_nft);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: nft_lookup_account, isSigner: false, isWritable: true },

            { pubkey: launch_data_account, isSigner: false, isWritable: true },
            { pubkey: program_sol_account, isSigner: false, isWritable: true },

            { pubkey: wrapped_nft_key, isSigner: false, isWritable: true },
            { pubkey: nft_token_account, isSigner: false, isWritable: true },
            { pubkey: nft_escrow_account, isSigner: false, isWritable: true },
        ];

        account_vector.push({ pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: true });

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(list_instruction);
        transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            let signature = transaction_response.result;

            console.log("join sig: ", signature);

            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
        } catch (error) {
            console.log(error);
            return;
        } finally {
            setIsLoading(false);
        }
    };

    return { WrapNFT, isLoading };
};

export default useWrapNFT;
