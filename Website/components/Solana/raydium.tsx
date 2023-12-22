import { Dispatch, SetStateAction, useCallback, useEffect, useState, useRef } from "react";

import BN from 'bn.js';
import Decimal from 'decimal.js';
import { useWallet } from "@solana/wallet-adapter-react";

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
  RENT_PROGRAM_ID
} from '@raydium-io/raydium-sdk';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  Transaction
} from '@solana/web3.js';

import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";


import bs58 from "bs58";


import {send_transaction, get_current_blockhash, serialise_RaydiumCreatePool_Instruction} from "./state"

const RAYDIUM_MAINNET_API = RAYDIUM_MAINNET;
const PROGRAMIDS = DEVNET_PROGRAM_ID;
const makeTxVersion = TxVersion.V0; // LEGACY

const ZERO = new BN(0)
type BN = typeof ZERO

type LiquidityPairTargetInfo = {
  baseToken: Token
  quoteToken: Token
  targetMargetId: PublicKey
}

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
  })
}


const DEFAULT_TOKEN = {
    'SOL': new Currency(9, 'USDC', 'USDC'),
    'WSOL': new Token(TOKEN_PROGRAM_ID, new PublicKey('So11111111111111111111111111111111111111112'), 9, 'WSOL', 'WSOL'),
    'USDC': new Token(TOKEN_PROGRAM_ID, new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), 6, 'USDC', 'USDC'),
    'RAY': new Token(TOKEN_PROGRAM_ID, new PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'), 6, 'RAY', 'RAY'),
    'RAY_USDC-LP': new Token(TOKEN_PROGRAM_ID, new PublicKey('FGYXP4vBkMEtKhxrmEBcWN8VNmXX8qNgEJpENKDETZ4Y'), 6, 'RAY-USDC', 'RAY-USDC'),
}


export function Raydium() {

    const wallet = useWallet();

    const createPool = useCallback(async () => {


      const baseToken = DEFAULT_TOKEN.USDC // USDC
      const quoteToken = DEFAULT_TOKEN.RAY // RAY
      const targetMargetId = Keypair.generate().publicKey
      const addBaseAmount = new BN(10000) // 10000 / 10 ** 6,
      const addQuoteAmount = new BN(10000) // 10000 / 10 ** 6,
      const startTime = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // start from 7 days later

      /* do something with market associated pool keys if needed */
      const associatedPoolKeys = getMarketAssociatedPoolKeys({
        baseToken,
        quoteToken,
        targetMargetId,
      })

      console.log(associatedPoolKeys)

      const poolInfo = Liquidity.getAssociatedPoolKeys({
        version: 4,
        marketVersion: 3,
        marketId: targetMargetId,
        baseMint: baseToken.mint,
        quoteMint: quoteToken.mint,
        baseDecimals: baseToken.decimals,
        quoteDecimals: quoteToken.decimals,
        programId : PROGRAMIDS.AmmV4,
        marketProgramId: PROGRAMIDS.OPENBOOK_MARKET,
      })

      console.log(poolInfo)

      let createPool_data = serialise_RaydiumCreatePool_Instruction(poolInfo.nonce, startTime, addBaseAmount, addQuoteAmount)

        let user_base_account = await getAssociatedTokenAddress(
          baseToken.mint, // mint
          wallet.publicKey, // owner
          true // allow owner off curve
      );

      let user_quote_account = await getAssociatedTokenAddress(
        quoteToken.mint, // mint
        wallet.publicKey, // owner
        true // allow owner off curve
      );

      let user_lp_account = await getAssociatedTokenAddress(
        poolInfo.lpMint, // mint
        wallet.publicKey, // owner
        true // allow owner off curve
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
        ]
        
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

      }, [wallet]);

}