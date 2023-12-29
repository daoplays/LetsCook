import { Dispatch, SetStateAction, useCallback, useEffect, useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Center, VStack, Text, Box, HStack, Tooltip } from "@chakra-ui/react";

import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE, PROGRAM, SYSTEM_KEY } from "./Solana/constants";
import { LaunchData, bignum_to_num, get_current_blockhash, send_transaction, serialise_HypeVote_instruction, myU64 } from "./Solana/state";
import { Raydium } from "./Solana/raydium";
import bs58 from "bs58";
import BN from "bn.js";
import Image from "next/image";

export function HypeVote({ launch_data }: { launch_data: LaunchData }) {
    const wallet = useWallet();
    let name = launch_data.name;
    console.log(launch_data.mint_address.toString());

    const Vote = useCallback(
        async ({ vote }: { vote: number }) => {
            if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

            let launch_data_account = PublicKey.findProgramAddressSync(
                [launch_data.seller.toBytes(), Buffer.from(launch_data.name), Buffer.from("Game")],
                PROGRAM,
            )[0];

            let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

            const instruction_data = serialise_HypeVote_instruction(launch_data.game_id, vote);

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
        },
        [wallet],
    );

    return (
        <>
            {/* Like % displays after voting.
                >70% = Green #8EFF84
                50 to 70 = Yellow #FFEE59
                <50 = Red #FF8484 */}
            <HStack justify="center" align="center" gap={4} onClick={(e) => e.stopPropagation()}>
                <Tooltip label="Hype" hasArrow fontSize="large" offset={[0, 15]}>
                    <Image
                        onClick={() => {
                            Vote({ vote: 1 });
                        }}
                        src="/images/thumbs-up.svg"
                        width={40}
                        height={40}
                        alt="Thumbs Up"
                    />
                </Tooltip>
                <Tooltip label="Not Hype" hasArrow fontSize="large" offset={[0, 15]}>
                    <Image
                        onClick={() => {
                            Vote({ vote: 2 });
                        }}
                        src="/images/thumbs-down.svg"
                        width={40}
                        height={40}
                        alt="Thumbs Down"
                    />
                </Tooltip>
            </HStack>
        </>
    );
}
