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
    serialise_BuyTickets_instruction,
    myU64,
} from "./Solana/state";
import { Raydium } from "./Solana/raydium";
import bs58 from "bs58";
import BN from "bn.js";

import logo from "../public/images/sauce.png";
import tickets from "../public/images/Mint.png";
import tickets2 from "../public/images/Mint2.png";
import bar from "../public/images/bar.png";

export function TokenScreen({ launch_data }: { launch_data: LaunchData }) {
    const wallet = useWallet();
    let name = launch_data.name;
    console.log(launch_data.mint_address.toString());

    const BuyTickets = useCallback(async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        let launch_data_account = PublicKey.findProgramAddressSync(
            [launch_data.seller.toBytes(), Buffer.from(launch_data.name), Buffer.from("Game")],
            PROGRAM,
        )[0];

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        const game_id = new myU64(launch_data.game_id);
        const [game_id_buf] = myU64.struct.serialize(game_id);
        console.log("game id ", launch_data.game_id, game_id_buf);
        console.log("Mint", launch_data.mint_address.toString());
        console.log("sol", launch_data.sol_address.toString());

        let user_join_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), game_id_buf, Buffer.from("Joiner")],
            PROGRAM,
        )[0];

        const instruction_data = serialise_BuyTickets_instruction(1);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_data_account, isSigner: false, isWritable: true },
            { pubkey: user_join_account, isSigner: false, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },
            { pubkey: launch_data.sol_address, isSigner: false, isWritable: true },
        ];

        account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: true });
        account_vector.push({ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: true });

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
        <Center mt="20px" width="90%">
            <VStack>
                <HStack>
                    <img src={logo.src} width="auto" alt={""} style={{ maxHeight: "200px", maxWidth: "200px" }} />
                    <VStack>
                        <Text color="white" className="font-face-kg" textAlign={"center"} fontSize={DEFAULT_FONT_SIZE}>
                            {name}
                        </Text>
                        <Text color="white" className="font-face-rk" textAlign={"center"} fontSize={10}>
                            solscan link
                        </Text>
                        <Text color="white" className="font-face-rk" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                            {launch_data.description}
                        </Text>
                        <HStack>
                            <FaTwitter color="white" />
                            <FaTwitch color="white" />
                            <Text m="0" color="white" className="font-face-rk" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                                24 Jan 2024
                            </Text>
                            <Raydium launch_data={launch_data} />
                        </HStack>
                    </VStack>
                </HStack>

                <HStack mt="50px" spacing={"200px"}>
                    <VStack>
                        <Text color="white" className="font-face-kg" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                            2000 MINTS = 20% OF TOTAL SUPPLY
                        </Text>
                        <HStack>
                            <Text m="0" color="white" className="font-face-kg" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                                1 MINT = 2000000
                            </Text>
                            <img src={logo.src} width="auto" alt={""} style={{ maxHeight: "50px", maxWidth: "50px" }} />
                        </HStack>
                        <Text m="0" color="white" className="font-face-kg" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                            0.5 SOL PER TICKET
                        </Text>
                    </VStack>
                    <VStack>
                        <HStack>
                            <img src={tickets2.src} width="auto" alt={""} style={{ maxHeight: "160px", maxWidth: "160px" }} />
                            <img
                                src={tickets.src}
                                onClick={() => {
                                    BuyTickets();
                                }}
                                width="auto"
                                alt={""}
                                style={{ maxHeight: "200px", maxWidth: "200px" }}
                            />
                        </HStack>
                        <Text m="0" color="white" className="font-face-kg" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                            Platform Fee: 0.02 SOL per ticket
                            <br />
                            (50% goes to token LP)
                        </Text>
                    </VStack>
                </HStack>

                <VStack mt="50px">
                    <Text m="0" color="white" className="font-face-kg" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                        Tickets Sold: 1400
                        <br />
                        Guaranteed Liquidity (SOL): 714/1000
                    </Text>
                    <img src={bar.src} width="auto" alt={""} style={{ maxHeight: "160px", maxWidth: "700px" }} />
                    <Text m="0" color="white" className="font-face-kg" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                        REFUND FOR ALL IF LIQUIDITY THRESHOLD NOT REACHED
                        <br />
                        REFUND FOR LOSING TICKETS
                    </Text>
                </VStack>

                <VStack mt="50px">
                    <Text m="0" color="white" className="font-face-kg" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                        DISTRIBUTION
                    </Text>
                    <Text m="0" color="white" className="font-face-rt" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                        Total Supply: 4.20B
                    </Text>
                </VStack>
            </VStack>
        </Center>
    );
}
