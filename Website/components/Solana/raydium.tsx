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
  TOKEN_PROGRAM_ID,
  Currency
} from '@raydium-io/raydium-sdk';
import {
  Keypair,
  PublicKey,
  SystemProgram
} from '@solana/web3.js';



type TestTxInputInfo = {
  baseToken: Token
  quoteToken: Token
  clmmConfigId: string
  wallet: Keypair
  startPoolPrice: Decimal
  startTime: BN
}

const RAYDIUM_MAINNET_API = RAYDIUM_MAINNET;
const PROGRAMIDS = DEVNET_PROGRAM_ID;
const makeTxVersion = TxVersion.V0; // LEGACY

const DEFAULT_TOKEN = {
    'SOL': new Currency(9, 'USDC', 'USDC'),
    'WSOL': new Token(TOKEN_PROGRAM_ID, new PublicKey('So11111111111111111111111111111111111111112'), 9, 'WSOL', 'WSOL'),
    'USDC': new Token(TOKEN_PROGRAM_ID, new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'), 6, 'USDC', 'USDC'),
    'RAY': new Token(TOKEN_PROGRAM_ID, new PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'), 6, 'RAY', 'RAY'),
    'RAY_USDC-LP': new Token(TOKEN_PROGRAM_ID, new PublicKey('FGYXP4vBkMEtKhxrmEBcWN8VNmXX8qNgEJpENKDETZ4Y'), 6, 'RAY-USDC', 'RAY-USDC'),
}


function decimalToX64(num: Decimal): BN {
    return new BN(num.mul(Decimal.pow(2, 64)).floor().toFixed())
  }




function priceToSqrtPriceX64(price: Decimal, decimalsA: number, decimalsB: number): BN {
    return decimalToX64(price.mul(Decimal.pow(10, decimalsB - decimalsA)).sqrt())
}

/*

async function clmmCreatePool(input: TestTxInputInfo) {

    // -------- pre-action: fetch basic ammConfig info --------
    const ammConfigs = (await (await fetch(ENDPOINT + RAYDIUM_MAINNET_API.clmmConfigs)).json()).data as Record<
        string,
        Omit<ClmmConfigInfo, 'id'> & { id: string }
    >
    const makePublickey = (config: Omit<ClmmConfigInfo, 'id'> & { id: string }): ClmmConfigInfo => ({
        ...config,
        id: new PublicKey(config.id),
    })
    const ammConfig = makePublickey(ammConfigs[input.clmmConfigId])

    // -------- step 1: make create pool instructions --------
    const makeCreatePoolInstruction = await Clmm.makeCreatePoolInstructionSimple({
        connection,
        programId: PROGRAMIDS.CLMM,
        owner: input.wallet.publicKey,
        mint1: input.baseToken,
        mint2: input.quoteToken,
        ammConfig,
        initialPrice: input.startPoolPrice,
        startTime: input.startTime,
        makeTxVersion,
        payer: wallet.publicKey,
    })

    // send makeCreatePoolInstruction.innerTransactions
}
*/
/*
async function howToUse({mint1, mint2, decimals1, decimals2} : {mint1 : PublicKey, mint2 : PublicKey, decimals1: number, decimals2: number}) {

    const wallet = useWallet();
  const baseToken = DEFAULT_TOKEN.USDC // USDC
  const quoteToken = DEFAULT_TOKEN.RAY // RAY
  const clmmConfigId = 'E64NGkDLLCdQ2yFNPcavaKptrEgmiQaNykUuLC1Qgwyp'
  const startPoolPrice = new Decimal(1)
  const startTime = new BN(Math.floor(new Date().getTime() / 1000))

  clmmCreatePool({
    baseToken,
    quoteToken,
    clmmConfigId,
    wallet: wallet,
    startPoolPrice,
    startTime,
  })


  const [mintA, mintB, initPrice] = new BN(mint1.toBuffer()).gt(new BN(mint2.toBuffer()))
  ? [mint2, mint1, new Decimal(1).div(startPoolPrice)]
  : [mint1, mint2, startPoolPrice]

    const initialPriceX64 = priceToSqrtPriceX64(initPrice, decimals1, decimals2)


  const instructions = [
    SystemProgram.createAccountWithSeed({
      fromPubkey: wallet.publicKey,
      basePubkey: wallet.publicKey,
      seed: observationId.seed,
      newAccountPubkey: observationId.publicKey,
      lamports: await connection.getMinimumBalanceForRentExemption(ObservationInfoLayout.span),
      space: ObservationInfoLayout.span,
      programId,
    }),
    createPoolInstruction(
      programId,
      poolId,
      owner,
      ammConfigId,
      observationId.publicKey,
      mintA.mint,
      mintAVault,
      mintA.programId,
      mintB.mint,
      mintBVault,
      mintB.programId,
      getPdaExBitmapAccount(programId, poolId).publicKey,
      initialPriceX64,
      startTime,
    ),
  ]
  
}
*/