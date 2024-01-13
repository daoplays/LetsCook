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
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
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
    RAYDIUM_MAINNET,
    LOOKUP_TABLE_CACHE,
    splitTxAndSigners,
    InnerSimpleTransaction,
    CacheLTA,
    InnerSimpleV0Transaction,
} from "@raydium-io/raydium-sdk";

import {
    Keypair,
    SystemProgram,
    ComputeBudgetProgram,
    LAMPORTS_PER_SOL,
    SYSVAR_RENT_PUBKEY,
    VersionedTransaction,
    Signer,
    AddressLookupTableAccount,
    TransactionMessage,
} from "@solana/web3.js";

import { createInitializeAccount3Instruction } from "@solana/spl-token";

import { serialise_RaydiumInitMarket_Instruction, MarketStateLayoutV2, bignum_to_num } from "../components/Solana/state";
import { LaunchKeys, LaunchFlags, PROD } from "../components/Solana/constants";
import useCreateAMM from "./useCreateAMM";

const PROGRAMIDS = PROD ? MAINNET_PROGRAM_ID : DEVNET_PROGRAM_ID;
const addLookupTableInfo = PROD? LOOKUP_TABLE_CACHE : undefined; 

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

const useCreateMarket = (launchData: LaunchData) => {
    const wallet = useWallet();
    const { CreateAMM } = useCreateAMM(launchData);

    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(
        async (result: any) => {
            console.log(result);
            // if we have a subscription field check against ws_id
            if (result.err !== null) {
                alert("Transaction failed, please try again");
            }

            if (signature_ws_id.current === 2) {
                await CreateAMM();
            }
            signature_ws_id.current = null;
        },
        [CreateAMM],
    );

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

    const CreateMarket = async () => {
        // if we have already done this then just skip this step
        console.log(launchData);
        if (launchData.flags[LaunchFlags.LPState] > 0) {
            console.log("Market already exists");
            await CreateAMM();
            return;
        }

        const connection = new Connection(RPC_NODE);

        const createMarketToast = toast.loading("(1/4) Creating the market token accounts");

        const quoteToken = DEFAULT_TOKEN.WSOL; // RAY
        const makeTxVersion = TxVersion.V0;
        let min_order_size = 1;
        let tick_size = 0.000001;

        const seed_base = launchData.keys[LaunchKeys.MintAddress].toBase58().slice(0, 31);

        const market = await generatePubKey({
            fromPublicKey: wallet.publicKey,
            seed: seed_base + "1",
            programId: PROGRAMIDS.OPENBOOK_MARKET,
        });
        const requestQueue = await generatePubKey({
            fromPublicKey: wallet.publicKey,
            seed: seed_base + "2",
            programId: PROGRAMIDS.OPENBOOK_MARKET,
        });
        const eventQueue = await generatePubKey({
            fromPublicKey: wallet.publicKey,
            seed: seed_base + "3",
            programId: PROGRAMIDS.OPENBOOK_MARKET,
        });
        const bids = await generatePubKey({
            fromPublicKey: wallet.publicKey,
            seed: seed_base + "4",
            programId: PROGRAMIDS.OPENBOOK_MARKET,
        });
        const asks = await generatePubKey({
            fromPublicKey: wallet.publicKey,
            seed: seed_base + "5",
            programId: PROGRAMIDS.OPENBOOK_MARKET,
        });
        const baseVault = await generatePubKey({ fromPublicKey: wallet.publicKey, seed: seed_base + "6", programId: TOKEN_PROGRAM_ID });
        const quoteVault = await generatePubKey({ fromPublicKey: wallet.publicKey, seed: seed_base + "7", programId: TOKEN_PROGRAM_ID });

        console.log("mint", launchData.keys[LaunchKeys.MintAddress].toString());
        console.log("market", market.publicKey.toString());

        const feeRateBps = 0;
        const quoteDustThreshold = new BN(100);

        function getVaultOwnerAndNonce() {
            const vaultSignerNonce = new BN(0);
            // eslint-disable-next-line no-constant-condition
            while (true) {
                try {
                    const vaultOwner = PublicKey.createProgramAddressSync(
                        [market.publicKey.toBuffer(), vaultSignerNonce.toArrayLike(Buffer, "le", 8)],
                        PROGRAMIDS.OPENBOOK_MARKET,
                    );
                    return { vaultOwner, vaultSignerNonce };
                } catch (e) {
                    vaultSignerNonce.iaddn(1);
                    if (vaultSignerNonce.gt(new BN(25555))) throw Error("find vault owner error");
                }
            }
        }
        const { vaultOwner, vaultSignerNonce } = getVaultOwnerAndNonce();

        const baseLotSize = new BN(Math.round(10 ** launchData.decimals * min_order_size));
        const quoteLotSize = new BN(Math.round(min_order_size * 10 ** quoteToken.decimals * tick_size));

        console.log("lot sizes", bignum_to_num(baseLotSize), bignum_to_num(quoteLotSize));
        const ins1: TransactionInstruction[] = [];
        const accountLamports = await connection.getMinimumBalanceForRentExemption(165);
        ins1.push(
            SystemProgram.createAccountWithSeed({
                fromPubkey: wallet.publicKey,
                basePubkey: wallet.publicKey,
                seed: baseVault.seed,
                newAccountPubkey: baseVault.publicKey,
                lamports: accountLamports,
                space: 165,
                programId: TOKEN_PROGRAM_ID,
            }),
            SystemProgram.createAccountWithSeed({
                fromPubkey: wallet.publicKey,
                basePubkey: wallet.publicKey,
                seed: quoteVault.seed,
                newAccountPubkey: quoteVault.publicKey,
                lamports: accountLamports,
                space: 165,
                programId: TOKEN_PROGRAM_ID,
            }),
            createInitializeAccount3Instruction(baseVault.publicKey, launchData.keys[LaunchKeys.MintAddress], vaultOwner),
            createInitializeAccount3Instruction(quoteVault.publicKey, quoteToken.mint, vaultOwner),
        );

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        for (let i = 0; i < ins1.length; i++) {
            transaction.add(ins1[i]);
        }
        try {
            let base_balance = await request_current_balance("", baseVault.publicKey);

            if (base_balance == 0) {
                let signed_transaction = await wallet.signTransaction(transaction);
                const encoded_transaction = bs58.encode(signed_transaction.serialize());

                var transaction_response = await send_transaction("", encoded_transaction);
                console.log("init market accounts");
                console.log(transaction_response);
            }

            toast.update(createMarketToast, {
                render: "Token accounts created",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });
        } catch (error) {
            console.log(error);
            toast.update(createMarketToast, {
                render: "Token account creation failed.  Please try later",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
        }

        const createMarketAccountsToast = toast.loading("(2/4) Create market accounts...");

        const ins2: TransactionInstruction[] = [];
        ins2.push(
            SystemProgram.createAccountWithSeed({
                fromPubkey: wallet.publicKey,
                basePubkey: wallet.publicKey,
                seed: market.seed,
                newAccountPubkey: market.publicKey,
                lamports: await connection.getMinimumBalanceForRentExemption(MarketStateLayoutV2.struct.byteSize),
                space: MarketStateLayoutV2.struct.byteSize,
                programId: PROGRAMIDS.OPENBOOK_MARKET,
            }),
            SystemProgram.createAccountWithSeed({
                fromPubkey: wallet.publicKey,
                basePubkey: wallet.publicKey,
                seed: requestQueue.seed,
                newAccountPubkey: requestQueue.publicKey,
                lamports: await connection.getMinimumBalanceForRentExemption(5120 + 12),
                space: 5120 + 12,
                programId: PROGRAMIDS.OPENBOOK_MARKET,
            }),
            SystemProgram.createAccountWithSeed({
                fromPubkey: wallet.publicKey,
                basePubkey: wallet.publicKey,
                seed: eventQueue.seed,
                newAccountPubkey: eventQueue.publicKey,
                lamports: await connection.getMinimumBalanceForRentExemption(262144 + 12),
                space: 262144 + 12,
                programId: PROGRAMIDS.OPENBOOK_MARKET,
            }),
            SystemProgram.createAccountWithSeed({
                fromPubkey: wallet.publicKey,
                basePubkey: wallet.publicKey,
                seed: bids.seed,
                newAccountPubkey: bids.publicKey,
                lamports: await connection.getMinimumBalanceForRentExemption(65536 + 12),
                space: 65536 + 12,
                programId: PROGRAMIDS.OPENBOOK_MARKET,
            }),
            SystemProgram.createAccountWithSeed({
                fromPubkey: wallet.publicKey,
                basePubkey: wallet.publicKey,
                seed: asks.seed,
                newAccountPubkey: asks.publicKey,
                lamports: await connection.getMinimumBalanceForRentExemption(65536 + 12),
                space: 65536 + 12,
                programId: PROGRAMIDS.OPENBOOK_MARKET,
            }),
            initializeMarketInstruction({
                programId: PROGRAMIDS.OPENBOOK_MARKET,
                marketInfo: {
                    id: market.publicKey,
                    requestQueue: requestQueue.publicKey,
                    eventQueue: eventQueue.publicKey,
                    bids: bids.publicKey,
                    asks: asks.publicKey,
                    baseVault: baseVault.publicKey,
                    quoteVault: quoteVault.publicKey,
                    baseMint: launchData.keys[LaunchKeys.MintAddress],
                    quoteMint: quoteToken.mint,

                    baseLotSize: baseLotSize,
                    quoteLotSize: quoteLotSize,
                    feeRateBps: feeRateBps,
                    vaultSignerNonce: vaultSignerNonce,
                    quoteDustThreshold: quoteDustThreshold,
                },
            }),
        );

        const ins = {
            address: {
                marketId: market.publicKey,
                requestQueue: requestQueue.publicKey,
                eventQueue: eventQueue.publicKey,
                bids: bids.publicKey,
                asks: asks.publicKey,
                baseVault: baseVault.publicKey,
                quoteVault: quoteVault.publicKey,
                baseMint: launchData.keys[LaunchKeys.MintAddress],
                quoteMint: quoteToken.mint,
            },
            innerTransactions: [
                {
                    instructions: ins2,
                    signers: [],
                    instructionTypes: [
                        InstructionType.createAccount,
                        InstructionType.createAccount,
                        InstructionType.createAccount,
                        InstructionType.createAccount,
                        InstructionType.createAccount,
                        InstructionType.initMarket,
                    ],
                },
            ],
        };

        const create_market_instructions = {
            address: ins.address,
            innerTransactions: await splitTxAndSigners({
                connection,
                makeTxVersion,
                computeBudgetConfig: undefined,
                payer: wallet.publicKey,
                innerTransaction: ins.innerTransactions,
                lookupTableCache: addLookupTableInfo,
            }),
        };

        console.log(create_market_instructions);

        const market_tx = await buildSimpleTransaction({
            connection,
            makeTxVersion,
            payer: wallet.publicKey,
            innerTransactions: create_market_instructions.innerTransactions,
            addLookupTableInfo: undefined,
        });

        console.log("market tx:");
        console.log(market_tx.length, market_tx[0]);

        try {
            let market_balance = await request_current_balance("", market.publicKey);
            if (market_balance == 0) {
                for (let i = 0; i < market_tx.length; i++) {
                    let market_transaction = await wallet.signTransaction(market_tx[i]);
                    const encoded_market_transaction = bs58.encode(market_transaction.serialize());

                    var market_transaction_response = await send_transaction("", encoded_market_transaction);
                    console.log(market_transaction_response);
                }
            }

            toast.update(createMarketAccountsToast, {
                render: "Market accounts created",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });
        } catch (error) {
            toast.update(createMarketAccountsToast, {
                render: "Market account creation failed, please try again later",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
        }

        const updateCookAccountsToast = toast.loading("(3/4) Update Cook accounts...");

        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launchData.page_name), Buffer.from("Launch")], PROGRAM)[0];

        const instruction_data = serialise_basic_instruction(LaunchInstruction.init_market);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },
            { pubkey: baseVault.publicKey, isSigner: false, isWritable: true },
            { pubkey: quoteVault.publicKey, isSigner: false, isWritable: true },
            { pubkey: market.publicKey, isSigner: false, isWritable: true },
            { pubkey: requestQueue.publicKey, isSigner: false, isWritable: true },
            { pubkey: eventQueue.publicKey, isSigner: false, isWritable: true },
            { pubkey: bids.publicKey, isSigner: false, isWritable: true },
            { pubkey: asks.publicKey, isSigner: false, isWritable: true },
        ];
        account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: true });
        account_vector.push({ pubkey: PROGRAMIDS.OPENBOOK_MARKET, isSigner: false, isWritable: true });

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let list_txArgs = await get_current_blockhash("");

        let list_transaction = new Transaction(list_txArgs);
        list_transaction.feePayer = wallet.publicKey;

        list_transaction.add(list_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(list_transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            let signature = transaction_response.result;

            console.log("list sig: ", signature);

            signature_ws_id.current = 2;
            connection.onSignature(signature, check_signature_update, "confirmed");

            toast.update(updateCookAccountsToast, {
                render: "Cook accounts updated",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });
        } catch (error) {
            console.log(error);
            toast.update(updateCookAccountsToast, {
                render: "Cook account update failed, please try again later",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }
    };

    return { CreateMarket, isLoading };
};

export default useCreateMarket;
