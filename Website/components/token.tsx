import { Dispatch, SetStateAction, useCallback, useEffect, useState, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, Transaction, TransactionInstruction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Center, VStack, Text, Box, HStack } from "@chakra-ui/react";
import { PieChart } from "react-minimal-pie-chart";

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
import Image from "next/image";

import styles from "../styles/Launch.module.css";


export function TokenScreen({ launch_data }: { launch_data: LaunchData }) {
    const wallet = useWallet();
    let name = launch_data.name;
    console.log(launch_data.mint_address.toString());

    const BuyTickets = useCallback(async () => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launch_data.page_name), Buffer.from("Launch")], PROGRAM)[0];

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


    let splitDate = new Date(bignum_to_num(launch_data.launch_date)).toUTCString().split(" ");
    let date = splitDate[0] + " " + splitDate[1] + " " + splitDate[2] + " " + splitDate[3];
    let one_mint = bignum_to_num(launch_data.total_supply) * (launch_data.distribution[0] / 100) / launch_data.num_mints
    let current_time = new Date().getTime();
    return (
        <Center mt="20px" width="90%">
            <VStack>
                <HStack>
                    <Image src={launch_data.icon} width={200} height={200} alt={"Logo"} />
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
                                {date}
                            </Text>
                            <Raydium launch_data={launch_data} />
                        </HStack>
                    </VStack>
                </HStack>

                <HStack mt="50px" spacing={"200px"}>
                    <VStack>
                        <Text color="white" className="font-face-kg" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                            {launch_data.num_mints}  MINTS = {launch_data.distribution[0]}% OF TOTAL SUPPLY
                        </Text>
                        <HStack>
                            <Text m="0" color="white" className="font-face-kg" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                                1 MINT = {one_mint}
                            </Text>
                            <Image src={launch_data.icon} width={50} height={50} alt={"Logo"} />
                        </HStack>
                        <Text m="0" color="white" className="font-face-kg" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                            {bignum_to_num(launch_data.ticket_price)/LAMPORTS_PER_SOL} SOL PER TICKET
                        </Text>
                    </VStack>
                    <VStack>
                        {current_time < launch_data.launch_date &&
                                <Text>TIckets not yet available for purchase</Text>
                        }
                        {current_time >= launch_data.launch_date && current_time < launch_data.end_date &&
                            <HStack>
                                <Image src={tickets2.src} width={160} height={160} alt={"Tickets"} />
                                <Image
                                    src={tickets.src}
                                    onClick={() => {
                                        BuyTickets();
                                    }}
                                    width={200}
                                    height={200}
                                    alt={"Tickets"}
                                />
                            </HStack>
                        }
                        {current_time >= launch_data.end_date && launch_data.tickets_sold >= launch_data.num_mints &&
                            <Text textColor={"white"}> Check your Tickets</Text>
                        }
                        {current_time >= launch_data.end_date && launch_data.tickets_sold < launch_data.num_mints &&
                            <Text textColor={"white"}> Claim Refund</Text>
                        }
                        <Text m="0" color="white" className="font-face-kg" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                            Platform Fee: 0.01 SOL per ticket
                        </Text>
                    </VStack>
                </HStack>

                <VStack mt="50px">
                    <Text m="0" color="white" className="font-face-kg" textAlign={"center"} fontSize={DUNGEON_FONT_SIZE}>
                        Tickets Sold: {launch_data.tickets_sold}
                        <br />
                        Guaranteed Liquidity (SOL): 714/1000
                    </Text>
                    <Image src={bar.src} width={700} height={160} alt={"Progress Bar"} />
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
                        Total Supply: {bignum_to_num(launch_data.total_supply)}
                    </Text>

                    <div className={styles.distributionBox}>
                        <div className={styles.distributionBoxFields}>
                            <div style={{ color: "white" }} className={`${styles.textLabel} font-face-kg`}>
                                Distribution{" "}
                            </div>

                            <div className={styles.distributionBoxEachFields}>
                                <div className={styles.colorBox1}></div>
                                <div className={`${styles.textLabel} ${styles.textLabel2} `}>LetsCookRaffle</div>
                                <div className={styles.distributionField}>
                                <Text m="0">{launch_data.distribution[0]} %</Text> 
                                </div>
                            </div>

                            <div className={styles.distributionBoxEachFields}>
                                <div className={styles.colorBox2}></div>
                                <div className={`${styles.textLabel} ${styles.textLabel2}`}>Liquidity Pool</div>
                                <div className={styles.distributionField}>
                                <Text m="0">{launch_data.distribution[1]} %</Text> 
                                </div>
                            </div>

                            {launch_data.distribution[2] > 0 &&
                                <div className={styles.distributionBoxEachFields}>
                                    <div className={styles.colorBox3}></div>
                                    <div className={`${styles.textLabel} ${styles.textLabel2}`}>LP Rewards</div>
                                    <div className={styles.distributionField}>
                                    <Text m="0">{launch_data.distribution[2]} %</Text> 
                                    </div>
                                </div>
                            }

                            {launch_data.distribution[3] > 0 &&
                            <div className={styles.distributionBoxEachFields}>
                                <div className={styles.colorBox4}></div>
                                <div className={`${styles.textLabel} ${styles.textLabel2}`}>Airdrops</div>
                                <div className={styles.distributionField}>
                                <Text m="0">{launch_data.distribution[3]} %</Text> 
                                </div>
                            </div>
                            }
                            {launch_data.distribution[4] > 0 &&
                                <div className={styles.distributionBoxEachFields}>
                                    <div className={styles.colorBox5}></div>
                                    <div className={`${styles.textLabel} ${styles.textLabel2} `}>Team</div>
                                    <div className={styles.distributionField}>
                                    <Text m="0">{launch_data.distribution[4]} %</Text> 
                                    </div>
                                </div>
                            }
                            {launch_data.distribution[5] > 0 &&
                                <div className={styles.distributionBoxEachFields}>
                                    <div className={styles.colorBox6}></div>
                                    <div className={`${styles.textLabel} ${styles.textLabel2}`}>Other (See Website)</div>
                                    <div className={styles.distributionField}>
                                    <Text m="0">{launch_data.distribution[5]} %</Text> 
                                    </div>
                                </div>
                            }
                        </div>
                    <div className={styles.piechart}>
                            <PieChart
                                animate={true}
                                totalValue={100}
                                data={[
                                    { title: "LetsCookRaffle", value: launch_data.distribution[0], color: "#FF5151" },
                                    { title: "Liquidity Pool", value: launch_data.distribution[1], color: "#489CFF" },
                                    { title: "LP Rewards", value: launch_data.distribution[2], color: "#74DD5A" },
                                    { title: "Airdrops", value: launch_data.distribution[3], color: "#FFEF5E" },
                                    { title: "Team", value: launch_data.distribution[4], color: "#B96CF6" },
                                    { title: "Other", value: launch_data.distribution[5], color: "#FF994E" },
                                ]}
                            />
                        </div>
                        </div>

                </VStack>
            </VStack>
        </Center>
    );
}
