import { Dispatch, SetStateAction, useCallback, useEffect, useState, useRef } from "react";

import BN from "bn.js";
import Decimal from "decimal.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Center, VStack, Text, Box, HStack, FormControl, Input } from "@chakra-ui/react";
import { sha256 } from "@noble/hashes/sha256";

import {
    Token,
    DEVNET_PROGRAM_ID,
    MAINNET_PROGRAM_ID,
    RAYDIUM_MAINNET,
    Currency,
    Liquidity,
    SYSTEM_PROGRAM_ID,
    RENT_PROGRAM_ID,
    LOOKUP_TABLE_CACHE,
    splitTxAndSigners,
    InnerSimpleTransaction,
    CacheLTA,
    InnerSimpleV0Transaction,
} from "@raydium-io/raydium-sdk";

import {
    Keypair,
    PublicKey,
    SystemProgram,
    TransactionInstruction,
    Transaction,
    Connection,
    ComputeBudgetProgram,
    LAMPORTS_PER_SOL,
    SYSVAR_RENT_PUBKEY,
    VersionedTransaction,
    Signer,
    AddressLookupTableAccount,
    TransactionMessage,
} from "@solana/web3.js";

import {
    getAssociatedTokenAddress,
    AccountLayout,
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountInstruction,
    createSyncNativeInstruction,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createInitializeAccount3Instruction,
} from "@solana/spl-token";

import bs58 from "bs58";

import {
    send_transaction,
    get_current_blockhash,
    serialise_RaydiumCreatePool_Instruction,
    serialise_basic_instruction,
    serialise_RaydiumInitMarket_Instruction,
    MarketStateLayoutV2,
    bignum_to_num,
    serialise_InitMarket_Instruction,
    LaunchData,
    LaunchInstruction,
} from "./state";
import { RPC_NODE, PROGRAM, LaunchKeys, LaunchFlags } from "./constants";

const PROGRAMIDS = DEVNET_PROGRAM_ID;
const addLookupTableInfo = LOOKUP_TABLE_CACHE;

const ZERO = new BN(0);
type BN = typeof ZERO;

enum AccountType {
    "market",
    "requestQueue",
    "eventQueue",
    "bids",
    "asks",
    "baseVault",
    "quoteVault",
}

enum TxVersion {
    "V0",
    "LEGACY",
}

enum InstructionType {
    "createAccount",
    "initAccount",
    "createATA",
    "closeAccount",
    "transferAmount",
    "initMint",
    "mintTo",

    "initMarket", // create market main ins
    "util1216OwnerClaim", // owner claim token ins

    "setComputeUnitPrice", // addComputeBudget
    "setComputeUnitLimit", // addComputeBudget

    // CLMM
    "clmmCreatePool",
    "clmmOpenPosition",
    "clmmIncreasePosition",
    "clmmDecreasePosition",
    "clmmClosePosition",
    "clmmSwapBaseIn",
    "clmmSwapBaseOut",
    "clmmInitReward",
    "clmmSetReward",
    "clmmCollectReward",

    "ammV4Swap",
    "ammV4AddLiquidity",
    "ammV4RemoveLiquidity",
    "ammV4SimulatePoolInfo",
    "ammV4SwapBaseIn",
    "ammV4SwapBaseOut",
    "ammV4CreatePool",
    "ammV4InitPool",
    "ammV4CreatePoolV2",

    "ammV5AddLiquidity",
    "ammV5RemoveLiquidity",
    "ammV5SimulatePoolInfo",
    "ammV5SwapBaseIn",
    "ammV5SwapBaseOut",

    "routeSwap",
    "routeSwap1",
    "routeSwap2",

    "farmV3Deposit",
    "farmV3Withdraw",
    "farmV3CreateLedger",

    "farmV5Deposit",
    "farmV5Withdraw",
    "farmV5CreateLedger",

    "farmV6Deposit",
    "farmV6Withdraw",
    "farmV6Create",
    "farmV6Restart",
    "farmV6CreatorAddReward",
    "farmV6CreatorWithdraw",

    "test",
}

const DEFAULT_TOKEN = {
    WSOL: new Token(TOKEN_PROGRAM_ID, new PublicKey("So11111111111111111111111111111111111111112"), 9, "WSOL", "WSOL"),
};

export function Raydium({ launch_data }: { launch_data: LaunchData }) {
    const wallet = useWallet();

    function initializeMarketInstruction({
        programId,
        marketInfo,
    }: {
        programId: PublicKey;
        marketInfo: {
            id: PublicKey;
            requestQueue: PublicKey;
            eventQueue: PublicKey;
            bids: PublicKey;
            asks: PublicKey;
            baseVault: PublicKey;
            quoteVault: PublicKey;
            baseMint: PublicKey;
            quoteMint: PublicKey;
            authority?: PublicKey;
            pruneAuthority?: PublicKey;

            baseLotSize: BN;
            quoteLotSize: BN;
            feeRateBps: number;
            vaultSignerNonce: BN;
            quoteDustThreshold: BN;
        };
    }) {
        const keys = [
            { pubkey: marketInfo.id, isSigner: false, isWritable: true },
            { pubkey: marketInfo.requestQueue, isSigner: false, isWritable: true },
            { pubkey: marketInfo.eventQueue, isSigner: false, isWritable: true },
            { pubkey: marketInfo.bids, isSigner: false, isWritable: true },
            { pubkey: marketInfo.asks, isSigner: false, isWritable: true },
            { pubkey: marketInfo.baseVault, isSigner: false, isWritable: true },
            { pubkey: marketInfo.quoteVault, isSigner: false, isWritable: true },
            { pubkey: marketInfo.baseMint, isSigner: false, isWritable: false },
            { pubkey: marketInfo.quoteMint, isSigner: false, isWritable: false },
            {
                pubkey: SYSVAR_RENT_PUBKEY,
                isSigner: false,
                isWritable: false,
            },
        ];

        const data = serialise_RaydiumInitMarket_Instruction(
            0,
            0,
            marketInfo.baseLotSize,
            marketInfo.quoteLotSize,
            marketInfo.feeRateBps,
            marketInfo.vaultSignerNonce,
            marketInfo.quoteDustThreshold,
        );

        return new TransactionInstruction({
            keys,
            programId,
            data,
        });
    }

    async function buildSimpleTransaction({
        connection,
        makeTxVersion,
        payer,
        innerTransactions,
        recentBlockhash,
        addLookupTableInfo,
    }: {
        makeTxVersion: TxVersion;
        payer: PublicKey;
        connection: Connection;
        innerTransactions: InnerSimpleTransaction[];
        recentBlockhash?: string | undefined;
        addLookupTableInfo?: CacheLTA | undefined;
    }): Promise<(VersionedTransaction | Transaction)[]> {
        if (makeTxVersion !== TxVersion.V0 && makeTxVersion !== TxVersion.LEGACY) throw Error(" make tx version args error");

        const _recentBlockhash = recentBlockhash ?? (await connection.getLatestBlockhash()).blockhash;

        const txList: (VersionedTransaction | Transaction)[] = [];
        for (const itemIx of innerTransactions) {
            const transactionMessage = new TransactionMessage({
                payerKey: payer,
                recentBlockhash: _recentBlockhash,
                instructions: itemIx.instructions,
            });
            const itemV = new VersionedTransaction(
                transactionMessage.compileToV0Message(
                    Object.values({
                        ...(addLookupTableInfo ?? {}),
                        ...((itemIx as InnerSimpleV0Transaction).lookupTableAddress ?? {}),
                    }),
                ),
            );
            itemV.sign(itemIx.signers);
            txList.push(itemV);
        }
        return txList;
    }

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

    const createPool = useCallback(async () => {
        const quoteToken = DEFAULT_TOKEN.WSOL; // RAY
        const addBaseAmount = new BN(10000); // 10000 / 10 ** 6,
        const addQuoteAmount = new BN(10000); // 10000 / 10 ** 6,
        const startTime = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // start from 7 days later

        const seed_base = launch_data.keys[LaunchKeys.MintAddress].toBase58().slice(0, 31);
        const targetMargetId = await generatePubKey({
            fromPublicKey: wallet.publicKey,
            seed: seed_base + "1",
            programId: PROGRAMIDS.OPENBOOK_MARKET,
        });

        /*
        const associatedToken = getAssociatedTokenAddressSync(quoteToken.mint, wallet.publicKey, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

        let ata_txArgs = await get_current_blockhash("");


        const ata_transaction = new Transaction(ata_txArgs).add(
            createAssociatedTokenAccountInstruction(
                wallet.publicKey,
                associatedToken,
                wallet.publicKey,
                quoteToken.mint,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID,
            ),
            SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: associatedToken,
                lamports: LAMPORTS_PER_SOL,
              }),
              // sync wrapped SOL balance
              createSyncNativeInstruction(associatedToken)
        );

        ata_transaction.feePayer = wallet.publicKey;

          
        let signed_ata_transaction = await wallet.signTransaction(ata_transaction);
        const encoded_ata_transaction = bs58.encode(signed_ata_transaction.serialize());

        var transaction_response = await send_transaction("", encoded_ata_transaction);
*/

        const poolInfo = Liquidity.getAssociatedPoolKeys({
            version: 4,
            marketVersion: 3,
            marketId: targetMargetId.publicKey,
            baseMint: launch_data.keys[LaunchKeys.MintAddress],
            quoteMint: quoteToken.mint,
            baseDecimals: launch_data.decimals,
            quoteDecimals: quoteToken.decimals,
            programId: PROGRAMIDS.AmmV4,
            marketProgramId: PROGRAMIDS.OPENBOOK_MARKET,
        });

        //console.log(poolInfo);
        let arena_account = PublicKey.findProgramAddressSync([Buffer.from("arena_account")], PROGRAM)[0];
        let sol_account = PublicKey.findProgramAddressSync([Buffer.from("sol_account")], PROGRAM)[0];

        let createPool_data = serialise_RaydiumCreatePool_Instruction(poolInfo.nonce, startTime, addBaseAmount, addQuoteAmount);

        let program_base_account = await getAssociatedTokenAddress(
            launch_data.keys[LaunchKeys.MintAddress], // mint
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
            launch_data.keys[LaunchKeys.MintAddress], // mint
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

        //https://github.com/raydium-io/raydium-amm
        let feeAccount = new PublicKey("3XMrhbv989VxAMi3DErLV9eJht1pHppW5LbKxe9fkEFR");

        const keys = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
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
            { pubkey: feeAccount, isSigner: false, isWritable: true },
            { pubkey: poolInfo.marketProgramId, isSigner: false, isWritable: false },
            { pubkey: poolInfo.marketId, isSigner: false, isWritable: false },

            { pubkey: program_base_account, isSigner: false, isWritable: true },
            { pubkey: launch_data.keys[LaunchKeys.WSOLAddress], isSigner: false, isWritable: true },
            { pubkey: program_lp_account, isSigner: false, isWritable: true },

            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: RENT_PROGRAM_ID, isSigner: false, isWritable: false },

            { pubkey: arena_account, isSigner: false, isWritable: true },
            { pubkey: sol_account, isSigner: false, isWritable: true },
            { pubkey: PROGRAMIDS.AmmV4, isSigner: false, isWritable: false },
        ];

        /*
        const keys = [
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: RENT_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: poolInfo.id, isSigner: false, isWritable: true },
            { pubkey: poolInfo.authority, isSigner: false, isWritable: false },
            { pubkey: poolInfo.openOrders, isSigner: false, isWritable: true },
            { pubkey: poolInfo.lpMint, isSigner: false, isWritable: true },
            { pubkey: poolInfo.baseMint, isSigner: false, isWritable: false },
            { pubkey: poolInfo.quoteMint, isSigner: false, isWritable: false },
            { pubkey: poolInfo.baseVault, isSigner: false, isWritable: true },
            { pubkey: poolInfo.quoteVault, isSigner: false, isWritable: true },
            { pubkey: poolInfo.targetOrders, isSigner: false, isWritable: true },
            { pubkey: poolInfo.configId, isSigner: false, isWritable: false },
            { pubkey: feeAccount, isSigner: false, isWritable: true },
            { pubkey: poolInfo.marketProgramId, isSigner: false, isWritable: false },
            { pubkey: poolInfo.marketId, isSigner: false, isWritable: false },
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_base_account, isSigner: false, isWritable: true },
            { pubkey: user_quote_account, isSigner: false, isWritable: true },
            { pubkey: user_lp_account, isSigner: false, isWritable: true },
        ];
*/
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
        /*
        const list_instruction = new TransactionInstruction({
            keys: keys,
            programId: PROGRAMIDS.AmmV4,
            data: createPool_data,
        });
*/
        console.log(list_instruction);

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }));

        transaction.add(list_instruction);

        let signed_transaction = await wallet.signTransaction(transaction);
        const encoded_transaction = bs58.encode(signed_transaction.serialize());

        var transaction_response = await send_transaction("", encoded_transaction);

        console.log(transaction_response);
    }, [wallet, launch_data]);


    return (
        <Box
            as="button"
            onClick={() => {
                createPool();
            }}
        >
            <Text m="0" color={"white"}>
                Launch LP
            </Text>
        </Box>
    );
}
