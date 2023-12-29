import { Dispatch, SetStateAction, useCallback, useEffect, useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Center, VStack, Text, Box, HStack } from "@chakra-ui/react";

import { FaTwitter, FaTwitch } from "react-icons/fa";

import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE, PROGRAM, SYSTEM_KEY } from "./Solana/constants";
import {
    LaunchData,
    bignum_to_num,
    get_current_blockhash,
    send_transaction,
    serialise_HypeVote_instruction,
    myU64,
} from "./Solana/state";
import { Raydium } from "./Solana/raydium";
import bs58 from "bs58";
import BN from "bn.js";

import logo from "../public/images/sauce.png";
import tickets from "../public/images/Mint.png";
import tickets2 from "../public/images/Mint2.png";
import bar from "../public/images/bar.png";

export function HypeVote({ launch_data }: { launch_data: LaunchData }) {

    const wallet = useWallet();
    let name = launch_data.name;
    console.log(launch_data.mint_address.toString());

    const Vote = useCallback(async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        let launch_data_account = PublicKey.findProgramAddressSync(
            [launch_data.seller.toBytes(), Buffer.from(launch_data.name), Buffer.from("Game")],
            PROGRAM,
        )[0];

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        const instruction_data = serialise_HypeVote_instruction(launch_data.game_id, 1);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_data_account, isSigner: false, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },
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

            console.log("join sig: ", signature);
        } catch (error) {
            console.log(error);
            return;
        }
    }, [wallet]);

    return (
        <>
        </>
    );
}
