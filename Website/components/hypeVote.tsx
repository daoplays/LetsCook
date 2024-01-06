import { useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, TransactionInstruction, Connection } from "@solana/web3.js";
import { Text, HStack, Tooltip } from "@chakra-ui/react";
import { PROGRAM, SYSTEM_KEY, RPC_NODE, WSS_NODE } from "./Solana/constants";
import { LaunchData, get_current_blockhash, send_transaction, serialise_HypeVote_instruction, UserData } from "./Solana/state";
import bs58 from "bs58";
import Image from "next/image";
import UseWalletConnection from "../hooks/useWallet";

export function HypeVote({ launch_data, user_data }: { launch_data: LaunchData; user_data: UserData }) {
    const wallet = useWallet();
    const { handleConnectWallet } = UseWalletConnection();
    const hype_vote_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        // if we have a subscription field check against ws_id
        if (result.err !== null) {
            alert("Hype vote transaction failed, please try again");
        }
        hype_vote_ws_id.current = null;
    }, []);

    const Vote = useCallback(
        async ({ vote }: { vote: number }) => {
            if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

            if (hype_vote_ws_id.current !== null) {
                alert("Hype vote pending, please wait");
                return;
            }

            const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });

            let launch_data_account = PublicKey.findProgramAddressSync(
                [Buffer.from(launch_data.page_name), Buffer.from("Launch")],
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

                console.log("hype sig: ", signature);
                hype_vote_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
            } catch (error) {
                console.log(error);
                return;
            }
        },
        [wallet, launch_data.game_id, launch_data.page_name, check_signature_update],
    );

    let has_voted: boolean = false;
    if (user_data !== null) {
        for (let i = 0; i < user_data.votes.length; i++) {
            if (user_data.votes[i].toString() == launch_data.game_id.toString()) {
                has_voted = true;
                break;
            }
        }
    }
    // console.log("has_voted: ", has_voted);
    let total_votes = launch_data.positive_votes + launch_data.negative_votes;
    let vote_ratio = 0;
    let vote_color = "";
    if (total_votes > 0) {
        vote_ratio = (100 * launch_data.positive_votes) / total_votes;
        if (vote_ratio >= 70) {
            vote_color = "green";
        } else if (vote_ratio > 50 && vote_ratio < 70) {
            vote_color = "yellow";
        } else {
            vote_color = "red";
        }
    }

    if (wallet.publicKey !== null && wallet.publicKey.toString() === launch_data.seller.toString()) {
        return (
            <>
                {total_votes > 0 && (
                    <Text m="0" fontSize="large" color={vote_color}>
                        {vote_ratio.toFixed(0) + "%"}
                    </Text>
                )}
                {total_votes === 0 && (
                    <Text m="0" fontSize="large" color="white">
                        --
                    </Text>
                )}
            </>
        );
    }

    if (has_voted) {
        return (
            <>
                <Text m="0" fontSize="large" color={vote_color}>
                    {vote_ratio.toFixed(0) + "%"}
                </Text>
            </>
        );
    }
    return (
        <>
            <HStack justify="center" align="center" gap={4} onClick={(e) => e.stopPropagation()}>
                <Tooltip label="Hype" hasArrow fontSize="large" offset={[0, 15]}>
                    <Image
                        onClick={() => {
                            if (user_data !== null) {
                                Vote({ vote: 1 });
                            } else {
                                handleConnectWallet();
                            }
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
                            if (user_data !== null) {
                                Vote({ vote: 2 });
                            } else {
                                handleConnectWallet();
                            }
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
