import { ApiV3PoolInfoStandardItemCpmm, CREATE_CPMM_POOL_FEE_ACC } from "@raydium-io/raydium-sdk-v2";
import BN from "bn.js";
import { Raydium, TxVersion, parseTokenAccountResp } from "@raydium-io/raydium-sdk-v2";
import {
    ComputeBudgetProgram,
    Connection,
    Keypair,
    PublicKey,
    SYSVAR_RENT_PUBKEY,
    Transaction,
    TransactionInstruction,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import bs58 from "bs58";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Config, LaunchKeys, PROGRAM, SOL_ACCOUNT_SEED, SYSTEM_KEY, TIMEOUT } from "../../components/Solana/constants";
import {
    Distribution,
    LaunchData,
    LaunchInstruction,
    ListingData,
    bignum_to_num,
    getRecentPrioritizationFees,
    get_current_blockhash,
    send_transaction,
    uInt16ToLEBytes,
    uInt32ToLEBytes,
} from "../../components/Solana/state";
import { FixableBeetStruct, array, bignum, u64, u8, uniformFixedSizeArray } from "@metaplex-foundation/beet";
import { useCallback, useRef, useState } from "react";
import { AMMData } from "../../components/Solana/jupiter_state";
import { toast } from "react-toastify";

export function serialise_CreateCP_instruction(amount_0, amount_1, start): Buffer {
    /*
    let hash_string = "global:initialize"
    const msgBuffer = new TextEncoder().encode(hash_string);                    

    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    console.log(hashArray.slice(0,8))
    */
    let discriminator: number[] = [175, 175, 109, 31, 13, 152, 155, 237];
    const data = new CreateCP_Instruction(LaunchInstruction.create_raydium, discriminator, amount_0, amount_1, start);
    const [buf] = CreateCP_Instruction.struct.serialize(data);

    return buf;
}

class CreateCP_Instruction {
    constructor(
        readonly instruction: number,
        readonly discriminator: number[],
        readonly amount_0: bignum,
        readonly amount_1: bignum,
        readonly start: bignum,
    ) {}

    static readonly struct = new FixableBeetStruct<CreateCP_Instruction>(
        [
            ["instruction", u8],
            ["discriminator", uniformFixedSizeArray(u8, 8)],
            ["amount_0", u64],
            ["amount_1", u64],
            ["start", u64],
        ],
        (args) => new CreateCP_Instruction(args.instruction!, args.discriminator!, args.amount_0!, args.amount_1!, args.start!),
        "CreateCP_Instruction",
    );
}

const AMM_CONFIG_SEED = "amm_config";
const AUTH_SEED = "vault_and_lp_mint_auth_seed";
const OBSERVATION_SEED = "observation";
const POOL_SEED = "pool";
const POOL_LP_MINT_SEED = "pool_lp_mint";
const POOL_VAULT_SEED = "pool_vault";

export const RAYDIUM_PROGRAM =
    Config.PROD === false
        ? new PublicKey("CPMDWBwJDtYax9qW7AyRuVC19Cc4L4Vcy4n2BHAbHkCW")
        : new PublicKey("CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C");
const RAYDIUM_FEES =
    Config.PROD === false
        ? new PublicKey("G11FKBRaAkHAKuLCgLM6K6NUc9rTjPAznRCjZifrTQe2")
        : new PublicKey("DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8");

export function getAMMConfigAccount() {
    return PublicKey.findProgramAddressSync([Buffer.from(AMM_CONFIG_SEED), uInt16ToLEBytes(0)], RAYDIUM_PROGRAM)[0];
}
export function getAuthorityAccount() {
    return PublicKey.findProgramAddressSync([Buffer.from(AUTH_SEED)], RAYDIUM_PROGRAM)[0];
}
export function getPoolStateAccount(base_mint: PublicKey, quote_mint: PublicKey) {
    const [token0, token1] = new BN(base_mint.toBuffer()).gt(new BN(quote_mint.toBuffer()))
        ? [quote_mint, base_mint]
        : [base_mint, quote_mint];

    return PublicKey.findProgramAddressSync(
        [Buffer.from(POOL_SEED), getAMMConfigAccount().toBytes(), token0.toBytes(), token1.toBytes()],
        RAYDIUM_PROGRAM,
    )[0];
}
export function getObservationAccount(base_mint: PublicKey, quote_mint: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(OBSERVATION_SEED), getPoolStateAccount(base_mint, quote_mint).toBytes()],
        RAYDIUM_PROGRAM,
    )[0];
}
export function getLPMintAccount(base_mint: PublicKey, quote_mint: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(POOL_LP_MINT_SEED), getPoolStateAccount(base_mint, quote_mint).toBytes()],
        RAYDIUM_PROGRAM,
    )[0];
}
export function getAMMBaseAccount(base_mint: PublicKey, quote_mint: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(POOL_VAULT_SEED), getPoolStateAccount(base_mint, quote_mint).toBytes(), base_mint.toBytes()],
        RAYDIUM_PROGRAM,
    )[0];
}
export function getAMMQuoteAccount(base_mint: PublicKey, quote_mint: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(POOL_VAULT_SEED), getPoolStateAccount(base_mint, quote_mint).toBytes(), quote_mint.toBytes()],
        RAYDIUM_PROGRAM,
    )[0];
}

export const useCreateCP = (listing: ListingData, launch: LaunchData) => {
    const wallet = useWallet();
    const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });
    const [isLoading, setIsLoading] = useState(false);
    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        signature_ws_id.current = null;
        setIsLoading(false);
        // if we have a subscription field check against ws_id
        if (result.err !== null) {
            toast.error("Transaction failed, please try again", {
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }

        toast.success("Transaction Successfull!", {
            type: "success",
            isLoading: false,
            autoClose: 3000,
        });
    }, []);

    const transaction_failed = useCallback(async () => {
        if (signature_ws_id.current == null) return;

        signature_ws_id.current = null;
        setIsLoading(false);

        toast.error("Transaction not processed, please try again", {
            type: "error",
            isLoading: false,
            autoClose: 3000,
        });
    }, []);

    const CreateCP = async () => {
        let sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

        let base_mint = listing.mint;
        let quote_mint = new PublicKey("So11111111111111111111111111111111111111112");

        const [token0, token1] = new BN(base_mint.toBuffer()).gt(new BN(quote_mint.toBuffer()))
            ? [quote_mint, base_mint]
            : [base_mint, quote_mint];

        let amm_config = getAMMConfigAccount();
        let authority = getAuthorityAccount();
        let pool_state = getPoolStateAccount(base_mint, quote_mint);
        let observation = getObservationAccount(base_mint, quote_mint);

        let lp_mint = getLPMintAccount(base_mint, quote_mint);
        let amm_0 = token0.equals(base_mint) ? getAMMBaseAccount(base_mint, quote_mint) : getAMMQuoteAccount(base_mint, quote_mint);
        let amm_1 = token0.equals(base_mint) ? getAMMQuoteAccount(base_mint, quote_mint) : getAMMBaseAccount(base_mint, quote_mint);

        let token_program_0 = token0.equals(base_mint) ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID;
        let token_program_1 = token0.equals(base_mint) ? TOKEN_PROGRAM_ID : TOKEN_2022_PROGRAM_ID;

        let pda_base = await getAssociatedTokenAddress(
            base_mint, // mint
            sol_account, // owner
            true, // allow owner off curve
            TOKEN_2022_PROGRAM_ID,
        );
        let pda_quote = launch.keys[LaunchKeys.WSOLAddress];
        let user_0 = token0.equals(base_mint) ? pda_base : pda_quote;
        let user_1 = token0.equals(base_mint) ? pda_quote : pda_base;

        let user_lp = await getAssociatedTokenAddress(
            lp_mint, // mint
            sol_account, // owner
            true, // allow owner off curve
            TOKEN_PROGRAM_ID,
        );

        console.log("pda", user_0.toString(), user_1.toString(), user_lp.toString());
        console.log("amm", amm_0.toString(), amm_1.toString());

        let quote_amount = bignum_to_num(launch.ticket_price) * launch.num_mints;
        let total_token_amount = bignum_to_num(launch.total_supply) * Math.pow(10, listing.decimals);
        let base_amount = Math.floor(total_token_amount * (launch.distribution[Distribution.LP] / 100.0));

        let amount_0 = token0.equals(base_mint) ? base_amount : quote_amount;
        let amount_1 = token0.equals(base_mint) ? quote_amount : base_amount;

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launch.page_name), Buffer.from("Launch")], PROGRAM)[0];

        let team_base_account = await getAssociatedTokenAddress(
            listing.mint, // mint
            launch.keys[LaunchKeys.TeamWallet], // owner
            true, // allow owner off curve
            TOKEN_2022_PROGRAM_ID,
        );

        let amm_seed_keys = [];
        if (base_mint.toString() < quote_mint.toString()) {
            amm_seed_keys.push(base_mint);
            amm_seed_keys.push(quote_mint);
        } else {
            amm_seed_keys.push(quote_mint);
            amm_seed_keys.push(base_mint);
        }

        let amm_data_account = PublicKey.findProgramAddressSync(
            [amm_seed_keys[0].toBytes(), amm_seed_keys[1].toBytes(), Buffer.from("RaydiumCPMM")],
            PROGRAM,
        )[0];

        let trade_to_earn_account = PublicKey.findProgramAddressSync([amm_data_account.toBytes(), Buffer.from("TradeToEarn")], PROGRAM)[0];

        let temp_wsol_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("Temp")], PROGRAM)[0];
        //let keys  = transaction["instructions"][0]["keys"]
        let keys = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_data_account, isSigner: false, isWritable: true },
            { pubkey: launch.listing, isSigner: false, isWritable: false },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },
            { pubkey: launch.keys[LaunchKeys.TeamWallet], isSigner: false, isWritable: true },
            { pubkey: team_base_account, isSigner: false, isWritable: true },
            { pubkey: sol_account, isSigner: false, isWritable: true },
            { pubkey: amm_config, isSigner: false, isWritable: false },
            { pubkey: authority, isSigner: false, isWritable: true },
            { pubkey: pool_state, isSigner: false, isWritable: true },
            { pubkey: token0, isSigner: false, isWritable: true },
            { pubkey: token1, isSigner: false, isWritable: true },
            { pubkey: lp_mint, isSigner: false, isWritable: true },
            { pubkey: user_0, isSigner: false, isWritable: true },
            { pubkey: user_1, isSigner: false, isWritable: true },
            { pubkey: user_lp, isSigner: false, isWritable: true },
            { pubkey: amm_0, isSigner: false, isWritable: true },
            { pubkey: amm_1, isSigner: false, isWritable: true },
            { pubkey: RAYDIUM_FEES, isSigner: false, isWritable: true },
            { pubkey: observation, isSigner: false, isWritable: true },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: token_program_0, isSigner: false, isWritable: false },
            { pubkey: token_program_1, isSigner: false, isWritable: false },
            { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
            { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
            { pubkey: RAYDIUM_PROGRAM, isSigner: false, isWritable: false },
            { pubkey: temp_wsol_account, isSigner: false, isWritable: true },
            { pubkey: trade_to_earn_account, isSigner: false, isWritable: true },
            { pubkey: amm_data_account, isSigner: false, isWritable: true },
        ];

        for (let i = 0; i < keys.length; i++) {
            console.log("key ", i, keys[i].pubkey.toString());
        }

        let init_raydium_data = serialise_CreateCP_instruction(amount_0, amount_1, 0);

        const init_instruction = new TransactionInstruction({
            keys: keys,
            programId: PROGRAM,
            data: init_raydium_data,
        });

        let list_txArgs = await get_current_blockhash("");

        let list_transaction = new Transaction(list_txArgs);

        list_transaction.feePayer = wallet.publicKey;
        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
        list_transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));
        list_transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));
        list_transaction.add(init_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(list_transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            let signature = transaction_response.result;

            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
            setTimeout(transaction_failed, TIMEOUT);

            console.log("swap sig: ", signature);
        } catch (error) {
            console.log(error);
            return;
        }
    };
    return { CreateCP, isLoading };
};
export default useCreateCP;
