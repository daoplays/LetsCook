import {
    LaunchData,
    LaunchInstruction,
    get_current_blockhash,
    myU64,
    send_transaction,
    serialise_basic_instruction,
} from "../components/Solana/state";
import { PublicKey, Transaction, TransactionInstruction, Connection } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, RPC_NODE, SYSTEM_KEY, WSS_NODE } from "../components/Solana/constants";
import { useCallback, useRef, useState } from "react";
import bs58 from "bs58";

const useClaimTokens = (launchData: LaunchData) => {
    const wallet = useWallet();

    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        // if we have a subscription field check against ws_id
        if (result.err !== null) {
            alert("Transaction failed, please try again");
        }
        signature_ws_id.current = null;
    }, []);

    const ClaimTokens = async () => {
        setIsLoading(true);

        if (wallet.signTransaction === undefined) return;

        if (launchData === null) {
            return;
        }

        if (signature_ws_id.current !== null) {
            alert("Transaction pending, please wait");
            return;
        }

        const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });

        if (wallet.publicKey.toString() == launchData.seller.toString()) {
            alert("Launch creator cannot buy tickets");
            return;
        }

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launchData.page_name), Buffer.from("Launch")], PROGRAM)[0];

        const game_id = new myU64(launchData.game_id);
        const [game_id_buf] = myU64.struct.serialize(game_id);
        console.log("game id ", launchData.game_id, game_id_buf);
        console.log("Mint", launchData.mint_address.toString());
        console.log("sol", launchData.sol_address.toString());

        let user_join_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), game_id_buf, Buffer.from("Joiner")],
            PROGRAM,
        )[0];

        let temp_wsol_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), launchData.mint_address.toBytes(), Buffer.from("Temp")],
            PROGRAM,
        )[0];

        let wrapped_sol_mint = new PublicKey("So11111111111111111111111111111111111111112");

        let program_sol_account = PublicKey.findProgramAddressSync([Buffer.from("sol_account")], PROGRAM)[0];

        let token_raffle_account_key = await getAssociatedTokenAddress(
            launchData.mint_address, // mint
            program_sol_account, // owner
            true, // allow owner off curve
        );

        let user_token_account_key = await getAssociatedTokenAddress(
            launchData.mint_address, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );

        const instruction_data = serialise_basic_instruction(LaunchInstruction.claim_tokens);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_data_account, isSigner: false, isWritable: true },
            { pubkey: user_join_account, isSigner: false, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },

            { pubkey: launchData.sol_address, isSigner: false, isWritable: true },
            { pubkey: temp_wsol_account, isSigner: false, isWritable: true },
            { pubkey: wrapped_sol_mint, isSigner: false, isWritable: true },

            { pubkey: token_raffle_account_key, isSigner: false, isWritable: true },
            { pubkey: user_token_account_key, isSigner: false, isWritable: true },
            { pubkey: launchData.mint_address, isSigner: false, isWritable: true },

            { pubkey: program_sol_account, isSigner: false, isWritable: true },

            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: true },
            { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: true },
            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: true },
        ];

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(list_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            let signature = transaction_response.result;

            console.log("reward sig: ", signature);

            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
        } catch (error) {
            console.log(error);
            return;
        } finally {
            setIsLoading(false);
        }
    };

    return { ClaimTokens, isLoading };
};

export default useClaimTokens;
