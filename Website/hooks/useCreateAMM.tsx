import {
    LaunchData,
    LaunchInstruction,
    get_current_blockhash,
    myU64,
    send_transaction,
    serialise_basic_instruction,
    request_current_balance,
} from "../components/Solana/state";
import { PublicKey, Transaction, TransactionInstruction, Connection } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, RPC_NODE, SYSTEM_KEY, WSS_NODE } from "../components/Solana/constants";
import { useCallback, useRef, useState } from "react";
import bs58 from "bs58";
import BN from "bn.js";
import { toast } from "react-toastify";

import {
    Token,
    DEVNET_PROGRAM_ID,
    MAINNET_PROGRAM_ID,
    Liquidity,
    SYSTEM_PROGRAM_ID,
    RENT_PROGRAM_ID,
    LOOKUP_TABLE_CACHE,
} from "@raydium-io/raydium-sdk";

import { ComputeBudgetProgram } from "@solana/web3.js";

import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { LaunchKeys, LaunchFlags, PROD } from "../components/Solana/constants";
import { make_tweet } from "../components/launch/twitter";

const PROGRAMIDS = PROD ? MAINNET_PROGRAM_ID : DEVNET_PROGRAM_ID;
const addLookupTableInfo = PROD ? LOOKUP_TABLE_CACHE : undefined;

//https://github.com/raydium-io/raydium-amm
const RAYDIUM_FEES = PROD
    ? new PublicKey("7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5")
    : new PublicKey("3XMrhbv989VxAMi3DErLV9eJht1pHppW5LbKxe9fkEFR");

const ZERO = new BN(0);
type BN = typeof ZERO;

const DEFAULT_TOKEN = {
    WSOL: new Token(TOKEN_PROGRAM_ID, new PublicKey("So11111111111111111111111111111111111111112"), 9, "WSOL", "WSOL"),
};

const useCreateAMM = (launchData: LaunchData) => {
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

    async function generatePubKey({
        fromPublicKey,
        seed,
        programId = TOKEN_PROGRAM_ID,
    }: {
        fromPublicKey: PublicKey;
        seed: string;
        programId: PublicKey;
    }) {
        const publicKey = await PublicKey.createWithSeed(fromPublicKey, seed, programId);
        return { publicKey, seed };
    }

    const CreateAMM = async () => {
        // if we have already done this then just skip this step
        console.log(launchData);
        if (launchData.flags[LaunchFlags.LPState] == 2) {
            console.log("AMM already exists");
            return;
        }

        const createAMMToast = toast.loading("(4/4) Creating the AMM");

        const quoteToken = DEFAULT_TOKEN.WSOL; // RAY

        const seed_base = launchData.keys[LaunchKeys.MintAddress].toBase58().slice(0, 31);
        const targetMargetId = await generatePubKey({
            fromPublicKey: wallet.publicKey,
            seed: seed_base + "1",
            programId: PROGRAMIDS.OPENBOOK_MARKET,
        });

        const poolInfo = Liquidity.getAssociatedPoolKeys({
            version: 4,
            marketVersion: 3,
            marketId: targetMargetId.publicKey,
            baseMint: launchData.keys[LaunchKeys.MintAddress],
            quoteMint: quoteToken.mint,
            baseDecimals: launchData.decimals,
            quoteDecimals: quoteToken.decimals,
            programId: PROGRAMIDS.AmmV4,
            marketProgramId: PROGRAMIDS.OPENBOOK_MARKET,
        });

        //console.log(poolInfo);
        let sol_account = PublicKey.findProgramAddressSync([Buffer.from("sol_account")], PROGRAM)[0];

        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launchData.page_name), Buffer.from("Launch")], PROGRAM)[0];

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        let team_base_account = await getAssociatedTokenAddress(
            launchData.keys[LaunchKeys.MintAddress], // mint
            launchData.keys[LaunchKeys.TeamWallet], // owner
            true, // allow owner off curve
        );

        let program_base_account = await getAssociatedTokenAddress(
            launchData.keys[LaunchKeys.MintAddress], // mint
            sol_account, // owner
            true, // allow owner off curve
        );

        let program_quote_account = await getAssociatedTokenAddress(
            quoteToken.mint, // mint
            sol_account, // owner
            true, // allow owner off curve
        );

        let program_lp_account = await getAssociatedTokenAddress(
            poolInfo.lpMint, // mint
            sol_account, // owner
            true, // allow owner off curve
        );

        let user_base_account = await getAssociatedTokenAddress(
            launchData.keys[LaunchKeys.MintAddress], // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );

        let user_quote_account = await getAssociatedTokenAddress(
            quoteToken.mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );

        let user_lp_account = await getAssociatedTokenAddress(
            poolInfo.lpMint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );

        console.log(user_base_account.toString());
        console.log(user_quote_account.toString());
        console.log(user_lp_account.toString());
        console.log(program_quote_account.toString());
        console.log(program_base_account.toString());

        const keys = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_data_account, isSigner: false, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },
            { pubkey: team_base_account, isSigner: false, isWritable: true },

            { pubkey: poolInfo.id, isSigner: false, isWritable: true },
            { pubkey: poolInfo.authority, isSigner: false, isWritable: true },
            { pubkey: poolInfo.openOrders, isSigner: false, isWritable: true },
            { pubkey: poolInfo.lpMint, isSigner: false, isWritable: true },
            { pubkey: poolInfo.baseMint, isSigner: false, isWritable: false },
            { pubkey: poolInfo.quoteMint, isSigner: false, isWritable: false },
            { pubkey: poolInfo.baseVault, isSigner: false, isWritable: true },
            { pubkey: poolInfo.quoteVault, isSigner: false, isWritable: true },
            { pubkey: poolInfo.targetOrders, isSigner: false, isWritable: true },
            { pubkey: poolInfo.configId, isSigner: false, isWritable: false },
            { pubkey: RAYDIUM_FEES, isSigner: false, isWritable: true },
            { pubkey: poolInfo.marketProgramId, isSigner: false, isWritable: false },
            { pubkey: poolInfo.marketId, isSigner: false, isWritable: false },

            { pubkey: program_base_account, isSigner: false, isWritable: true },
            { pubkey: launchData.keys[LaunchKeys.WSOLAddress], isSigner: false, isWritable: true },
            { pubkey: program_lp_account, isSigner: false, isWritable: true },

            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: RENT_PROGRAM_ID, isSigner: false, isWritable: false },

            { pubkey: sol_account, isSigner: false, isWritable: true },
            { pubkey: PROGRAMIDS.AmmV4, isSigner: false, isWritable: false },
        ];

        console.log("baseVault", poolInfo.baseVault.toString());
        console.log("quoteVault", poolInfo.quoteVault.toString());

        console.log("id", poolInfo.id.toString());
        console.log("authority", poolInfo.authority.toString());
        console.log("openOrders", poolInfo.openOrders.toString());
        console.log("withdrawQueue", poolInfo.withdrawQueue.toString());
        console.log("targetOrders", poolInfo.targetOrders.toString());

        let create_amm_data = serialise_basic_instruction(LaunchInstruction.init_amm);

        const list_instruction = new TransactionInstruction({
            keys: keys,
            programId: PROGRAM,
            data: create_amm_data,
        });

        console.log(list_instruction);

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }));

        transaction.add(list_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            console.log("amm", transaction_response);

            toast.update(createAMMToast, {
                render: "AMM created",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });
        } catch (error) {
            toast.update(createAMMToast, {
                render: "AMM creation failed.  Please try again later.",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
        }
    };

    return { CreateAMM, isLoading };
};

export default useCreateAMM;
