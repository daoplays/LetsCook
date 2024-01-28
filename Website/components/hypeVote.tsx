import { useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, TransactionInstruction, Connection, Keypair } from "@solana/web3.js";
import { Text, HStack, Tooltip } from "@chakra-ui/react";
import { PROGRAM, SYSTEM_KEY, RPC_NODE, WSS_NODE, LaunchKeys } from "./Solana/constants";
import { LaunchData, get_current_blockhash, send_transaction, serialise_HypeVote_instruction, UserData } from "./Solana/state";
import bs58 from "bs58";
import Image from "next/image";
import UseWalletConnection from "../hooks/useWallet";
import useAppRoot from "../context/useAppRoot";
import { toast } from "react-toastify";
import useResponsive from "../hooks/useResponsive";
import { LimitOrderProvider } from "@jup-ag/limit-order-sdk";
import BN from "bn.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";


export function HypeVote({ launch_data, user_data }: { launch_data: LaunchData; user_data: UserData }) {
    const wallet = useWallet();
    const { handleConnectWallet } = UseWalletConnection();
    const { checkLaunchData } = useAppRoot();
    const { lg } = useResponsive();
    const hype_vote_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(
        async (result: any) => {
            console.log(result);
            hype_vote_ws_id.current = null;

            // if we have a subscription field check against ws_id
            if (result.err !== null) {
                alert("Hype vote transaction failed, please try again");
                return;
            } else {
                await checkLaunchData();
            }

            /*toast.success("First Hype Vote!",
            {
                position: "bottom-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
                icon: ({theme, type}) =>  <img src="/images/thumbs-up.svg"/>
            });*/
        },
        [checkLaunchData],
    );

    const Vote = useCallback(
        async ({ vote }: { vote: number }) => {
            if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

            if (hype_vote_ws_id.current !== null) {
                alert("Hype vote pending, please wait");
                return;
            }

            const connection = new Connection(RPC_NODE, { wsEndpoint: WSS_NODE });



        const limitOrder = new LimitOrderProvider(
            connection,
            null,
            "",
            "devnet",
        );
        // Base key are used to generate a unique order id
        const base = Keypair.generate();

        const { tx, orderPubKey } = await limitOrder.createOrder({
            owner: wallet.publicKey,
            inAmount: new BN(10), // 1000000 => 1 USDC if inputToken.address is USDC mint
            outAmount: new BN(100000),
            inputMint: new PublicKey(launch_data.keys[LaunchKeys.MintAddress]),
            outputMint: new PublicKey("So11111111111111111111111111111111111111112"),
            expiredAt: null, // new BN(new Date().valueOf() / 1000)
            base: base.publicKey,
        });
        console.log(tx.instructions)
        //console.log(tx.instructions[0].programId.toString())

        let check_account = await getAssociatedTokenAddress(
            launch_data.keys[LaunchKeys.MintAddress], // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );
        let check_account2 = await getAssociatedTokenAddress(
            launch_data.keys[LaunchKeys.MintAddress], // mint
            base.publicKey, // owner
            true, // allow owner off curve
        );
        let check_account3 = await getAssociatedTokenAddress(
            new PublicKey("So11111111111111111111111111111111111111112"), // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );
        let check_account4 = await getAssociatedTokenAddress(
            new PublicKey("So11111111111111111111111111111111111111112"), // mint
            base.publicKey, // owner
            true, // allow owner off curve
        );
        console.log("user token", check_account.toString());
        console.log("base token", check_account2.toString());

        console.log("user quote", check_account3.toString());
        console.log("base quote", check_account4.toString());

        let test_txArgs = await get_current_blockhash("");

        let tst_transaction = new Transaction(test_txArgs);
        tst_transaction.feePayer = wallet.publicKey;

        tst_transaction.add(tx.instructions[0]);

        tst_transaction.partialSign(base);


        try {
            let signed_transaction = await wallet.signTransaction(tst_transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);
            console.log(transaction_response)
        }
        catch(error) {
            console.log(error)
        }

        return

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
        vote_ratio = launch_data.positive_votes - launch_data.negative_votes;
        if (vote_ratio > 0) {
            vote_color = "#83FF81";
        } else if (vote_ratio == 0) {
            vote_color = "#FFEE59";
        } else {
            vote_color = "#FF6E6E";
        }
    }

    if (wallet.publicKey !== null && wallet.publicKey.toString() === launch_data.keys[LaunchKeys.Seller].toString()) {
        return (
            <>
                {total_votes > 0 && (
                    <Text m="0" fontSize={lg ? "large" : "x-large"} color={vote_color}>
                        {vote_ratio}
                    </Text>
                )}
                {total_votes === 0 && (
                    <Text m="0" fontSize={lg ? "large" : "x-large"} color="white">
                        --
                    </Text>
                )}
            </>
        );
    }

    if (has_voted) {
        return (
            <>
                <Text m="0" fontSize={lg ? "large" : "x-large"} color={vote_color}>
                    {vote_ratio}
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
                            if (wallet !== null) {
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
                            if (wallet !== null) {
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
