import { Dispatch, SetStateAction, useCallback, useEffect, useState, useRef } from "react";

import BN from "bn.js";
import Decimal from "decimal.js";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Center, VStack, Text, Box, HStack, FormControl, Input } from "@chakra-ui/react";

import {
    Clmm,
    ClmmConfigInfo,
    ENDPOINT,
    Token,
    buildSimpleTransaction,
    InnerSimpleV0Transaction,
    DEVNET_PROGRAM_ID,
    MAINNET_PROGRAM_ID,
    RAYDIUM_MAINNET,
    TxVersion,
    Currency,
    Liquidity,
    SYSTEM_PROGRAM_ID,
    RENT_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TokenAccount,
    SPL_ACCOUNT_LAYOUT,
    generatePubKey,
    InstructionType,
    Spl,
    LOOKUP_TABLE_CACHE
} from "@raydium-io/raydium-sdk";
import { Keypair, PublicKey, SystemProgram, TransactionInstruction, Transaction, Connection } from "@solana/web3.js";

import { getAssociatedTokenAddress, AccountLayout, } from "@solana/spl-token";

import bs58 from "bs58";

import { send_transaction, get_current_blockhash, serialise_RaydiumCreatePool_Instruction } from "./state";
import {RPC_NODE} from "./constants";

const PROGRAMIDS = DEVNET_PROGRAM_ID;
const addLookupTableInfo = LOOKUP_TABLE_CACHE

const ZERO = new BN(0);
type BN = typeof ZERO;

type LiquidityPairTargetInfo = {
    baseToken: Token;
    quoteToken: Token;
    targetMargetId: PublicKey;
};

function getMarketAssociatedPoolKeys(input: LiquidityPairTargetInfo) {
    return Liquidity.getAssociatedPoolKeys({
        version: 4,
        marketVersion: 3,
        baseMint: input.baseToken.mint,
        quoteMint: input.quoteToken.mint,
        baseDecimals: input.baseToken.decimals,
        quoteDecimals: input.quoteToken.decimals,
        marketId: input.targetMargetId,
        programId: PROGRAMIDS.AmmV4,
        marketProgramId: PROGRAMIDS.OPENBOOK_MARKET,
    });
}

const DEFAULT_TOKEN = {
    SOL: new Currency(9, "USDC", "USDC"),
    WSOL: new Token(TOKEN_PROGRAM_ID, new PublicKey("So11111111111111111111111111111111111111112"), 9, "WSOL", "WSOL"),
    USDC: new Token(TOKEN_PROGRAM_ID, new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), 6, "USDC", "USDC"),
    RAY: new Token(TOKEN_PROGRAM_ID, new PublicKey("4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R"), 6, "RAY", "RAY"),
    "RAY_USDC-LP": new Token(TOKEN_PROGRAM_ID, new PublicKey("FGYXP4vBkMEtKhxrmEBcWN8VNmXX8qNgEJpENKDETZ4Y"), 6, "RAY-USDC", "RAY-USDC"),
    "Test": new Token(TOKEN_PROGRAM_ID, new PublicKey("5CTaSsqrjSmnxVe45MMknGtX72Wx1nquadBmnXGNrJHQ"), 6, "Test", "Test"),
    "Test2": new Token(TOKEN_PROGRAM_ID, new PublicKey("2qR7QmMFELQ5tiHf66kKJcWa9SmcPpVMcdU2bxg6HykK"), 6, "Test2", "Test2"),

    
};

export function Raydium() {
    const wallet = useWallet();
    const connection  = new Connection(RPC_NODE);

    async function getWalletTokenAccount(connection: Connection, wallet: PublicKey): Promise<TokenAccount[]> {
      const walletTokenAccount = await connection.getTokenAccountsByOwner(wallet, {
        programId: TOKEN_PROGRAM_ID,
      });
      return walletTokenAccount.value.map((i) => ({
        pubkey: i.pubkey,
        programId: i.account.owner,
        accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
      }));
    }

    async function test({mint} : {mint : PublicKey}) {

        const frontInstructions: TransactionInstruction[] = []
        const endInstructions: TransactionInstruction[] = []
        const frontInstructionsType: InstructionType[] = []
        const endInstructionsType: InstructionType[] = []

        const newTokenAccount = generatePubKey({ fromPublicKey: wallet.publicKey, programId: TOKEN_PROGRAM_ID })
        const balanceNeeded = await connection.getMinimumBalanceForRentExemption(AccountLayout.span)

        const createAccountIns = SystemProgram.createAccountWithSeed({
          fromPubkey: wallet.publicKey,
          basePubkey: wallet.publicKey,
          seed: newTokenAccount.seed,
          newAccountPubkey: newTokenAccount.publicKey,
          lamports: balanceNeeded,
          space: AccountLayout.span,
          programId: TOKEN_PROGRAM_ID,
        })

        const initAccountIns = Spl.createInitAccountInstruction(TOKEN_PROGRAM_ID, mint, newTokenAccount.publicKey, wallet.publicKey)
        frontInstructions.push(createAccountIns, initAccountIns)
        frontInstructionsType.push(InstructionType.createAccount, InstructionType.initAccount)
        ;(endInstructions ?? []).push(
          Spl.makeCloseAccountInstruction({
            programId: TOKEN_PROGRAM_ID,
            tokenAccount: newTokenAccount.publicKey,
            owner: wallet.publicKey,
            payer: wallet.publicKey,
            instructionsType: endInstructionsType ?? [],
          }),
        )
        return newTokenAccount.publicKey
    }

    const createPool2 = useCallback(async () => {

        const baseToken = DEFAULT_TOKEN.Test; // USDC
        const quoteToken = DEFAULT_TOKEN.Test2; // RAY
        const targetMargetId = Keypair.generate().publicKey;
        const addBaseAmount = new BN(10000); // 10000 / 10 ** 6,
        const addQuoteAmount = new BN(10000); // 10000 / 10 ** 6,
        const startTime = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // start from 7 days later

        let m1 = await test(baseToken)
        let m2 = await test(quoteToken)

        console.log(m1.toString(), m2.toString())
        const poolInfo = Liquidity.getAssociatedPoolKeys({
            version: 4,
            marketVersion: 3,
            marketId: targetMargetId,
            baseMint: baseToken.mint,
            quoteMint: quoteToken.mint,
            baseDecimals: baseToken.decimals,
            quoteDecimals: quoteToken.decimals,
            programId: PROGRAMIDS.AmmV4,
            marketProgramId: PROGRAMIDS.OPENBOOK_MARKET,
        });

        const makeTxVersion = TxVersion.V0;

        let user_base_account = await getAssociatedTokenAddress(
            baseToken.mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );

        let user_quote_account = await getAssociatedTokenAddress(
            quoteToken.mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
        );

        //console.log(poolInfo);

        const walletTokenAccounts = await getWalletTokenAccount(connection, wallet.publicKey)

        const ata1 = Spl.getAssociatedTokenAccount({ mint : baseToken.mint, owner : wallet.publicKey, programId: TOKEN_PROGRAM_ID })
        const accounts1 = walletTokenAccounts
        .filter((i) => i.accountInfo.mint.equals(baseToken.mint) && (!false || i.pubkey.equals(ata1)))
        .sort((a, b) => (a.accountInfo.amount.lt(b.accountInfo.amount) ? 1 : -1))

        console.log("accounts 1 " , user_base_account.toString(), ata1.toString(), accounts1);

        const ata2 = Spl.getAssociatedTokenAccount({ mint : quoteToken.mint, owner : wallet.publicKey, programId: TOKEN_PROGRAM_ID })
        const accounts2 = walletTokenAccounts
        .filter((i) => i.accountInfo.mint.equals(quoteToken.mint) && (!false || i.pubkey.equals(ata1)))
        .sort((a, b) => (a.accountInfo.amount.lt(b.accountInfo.amount) ? 1 : -1))

        console.log("accounts 2 " , user_quote_account.toString(), ata2.toString(), accounts2);

          const initPoolInstructionResponse = await Liquidity.makeCreatePoolV4InstructionV2Simple({
            connection,
            programId: PROGRAMIDS.AmmV4,
            marketInfo: {
              marketId: targetMargetId,
              programId: PROGRAMIDS.OPENBOOK_MARKET,
            },
            baseMintInfo: baseToken,
            quoteMintInfo: quoteToken,
            baseAmount: addBaseAmount,
            quoteAmount: addQuoteAmount,
            startTime: new BN(Math.floor(startTime)),
            ownerInfo: {
              feePayer: wallet.publicKey,
              wallet: wallet.publicKey,
              tokenAccounts: walletTokenAccounts,
              useSOLBalance: true,
            },
            associatedOnly: false,
            checkCreateATAOwner: true,
            makeTxVersion,
          })

          console.log(initPoolInstructionResponse)

          const willSendTx = await buildSimpleTransaction({
            connection,
            makeTxVersion,
            payer: wallet.publicKey,
            innerTransactions: initPoolInstructionResponse.innerTransactions,
            addLookupTableInfo: undefined,
          })

          console.log(willSendTx)

        let signed_transaction = await wallet.signTransaction(willSendTx[0]);
        const encoded_transaction = bs58.encode(signed_transaction.serialize());

        var transaction_response = await send_transaction("", encoded_transaction);

        console.log(transaction_response)


  
    }, [wallet]);

    const createPool = useCallback(async () => {
        const baseToken = DEFAULT_TOKEN.Test; // USDC
        const quoteToken = DEFAULT_TOKEN.Test2; // RAY
        const targetMargetId = Keypair.generate().publicKey;
        const addBaseAmount = new BN(10000); // 10000 / 10 ** 6,
        const addQuoteAmount = new BN(10000); // 10000 / 10 ** 6,
        const startTime = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7; // start from 7 days later

        /* do something with market associated pool keys if needed */
        const associatedPoolKeys = getMarketAssociatedPoolKeys({
            baseToken,
            quoteToken,
            targetMargetId,
        });

        console.log(associatedPoolKeys);

        const poolInfo = Liquidity.getAssociatedPoolKeys({
            version: 4,
            marketVersion: 3,
            marketId: targetMargetId,
            baseMint: baseToken.mint,
            quoteMint: quoteToken.mint,
            baseDecimals: baseToken.decimals,
            quoteDecimals: quoteToken.decimals,
            programId: PROGRAMIDS.AmmV4,
            marketProgramId: PROGRAMIDS.OPENBOOK_MARKET,
        });

        console.log(poolInfo);

        let createPool_data = serialise_RaydiumCreatePool_Instruction(poolInfo.nonce, startTime, addBaseAmount, addQuoteAmount);

        let user_base_account = await getAssociatedTokenAddress(
            baseToken.mint, // mint
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
            { pubkey: poolInfo.withdrawQueue, isSigner: false, isWritable: true },
            { pubkey: poolInfo.targetOrders, isSigner: false, isWritable: true },
            { pubkey: poolInfo.lpVault, isSigner: false, isWritable: true },
            { pubkey: poolInfo.marketProgramId, isSigner: false, isWritable: false },
            { pubkey: poolInfo.marketId, isSigner: false, isWritable: false },
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_base_account, isSigner: false, isWritable: true },
            { pubkey: user_quote_account, isSigner: false, isWritable: true },
            { pubkey: user_lp_account, isSigner: false, isWritable: true },
        ];

        const list_instruction = new TransactionInstruction({
            keys: keys,
            programId: PROGRAMIDS.AmmV4,
            data: createPool_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(list_instruction);

        let signed_transaction = await wallet.signTransaction(transaction);
        const encoded_transaction = bs58.encode(signed_transaction.serialize());

        var transaction_response = await send_transaction("", encoded_transaction);

        console.log(transaction_response)

    }, [wallet]);


    return(
      <Box
            as="button"
            onClick={() => {
              createPool2();
            }}
        >
            <Text m="0" color={"white"}>Launch LP</Text>
        </Box>
    );
}
