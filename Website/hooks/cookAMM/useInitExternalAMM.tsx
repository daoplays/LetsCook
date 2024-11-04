import { useCallback, useRef, useState } from "react";

import {
    LaunchDataUserInput,
    LaunchInstruction,
    MintData,
    getRecentPrioritizationFees,
    get_current_blockhash,
    request_current_balance,
    send_transaction,
    serialise_CreateLaunch_instruction,
    uInt32ToLEBytes,
} from "../../components/Solana/state";
import {
    DEBUG,
    SYSTEM_KEY,
    PROGRAM,
    Config,
    LaunchKeys,
    METAPLEX_META,
    SOL_ACCOUNT_SEED,
    DATA_ACCOUNT_SEED,
} from "../../components/Solana/constants";
import { useWallet } from "@solana/wallet-adapter-react";
import {
    PublicKey,
    Transaction,
    TransactionInstruction,
    Connection,
    ComputeBudgetProgram,
    SystemProgram,
    SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import "react-datepicker/dist/react-datepicker.css";
import bs58 from "bs58";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import useAppRoot from "../../context/useAppRoot";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import useIrysUploader from "../useIrysUploader";
import { bignum, FixableBeetStruct, u64, u8, utf8String } from "@metaplex-foundation/beet";

class CreateExternalAMM_Instruction {
    constructor(
        readonly instruction: number,
        readonly name: string,
        readonly symbol: string,
        readonly uri: string,
        readonly icon: string,
        readonly website: string,
        readonly twitter: string,
        readonly telegram: string,
        readonly discord: string,
        readonly baseAmount: bignum,
        readonly quoteAmount: bignum,
        readonly wrap: number,
        readonly burnLP: number,
        readonly lowLiquidity: number,
    ) {}

    static readonly struct = new FixableBeetStruct<CreateExternalAMM_Instruction>(
        [
            ["instruction", u8],
            ["name", utf8String],
            ["symbol", utf8String],
            ["uri", utf8String],
            ["icon", utf8String],
            ["website", utf8String],
            ["twitter", utf8String],
            ["telegram", utf8String],
            ["discord", utf8String],
            ["baseAmount", u64],
            ["quoteAmount", u64],
            ["wrap", u8],
            ["burnLP", u8],
            ["lowLiquidity", u8],
        ],
        (args) =>
            new CreateExternalAMM_Instruction(
                args.instruction!,
                args.name!,
                args.symbol!,
                args.uri!,
                args.icon!,
                args.website!,
                args.twitter!,
                args.telegram!,
                args.discord!,
                args.baseAmount!,
                args.quoteAmount!,
                args.wrap!,
                args.burnLP!,
                args.lowLiquidity!,
            ),
        "CreateExternalAMM_Instruction",
    );
}

function serialise_CreateExternalAMM_instruction(
    base_mint: MintData,
    web: string,
    twitter: string,
    telegram: string,
    discord: string,
    baseAmount: number,
    quoteAmount: number,
    wrap: number,
    burn: number,
    lowLiquidity: number,
): Buffer {
    const data = new CreateExternalAMM_Instruction(
        LaunchInstruction.init_cook_external,
        base_mint.name,
        base_mint.symbol,
        base_mint.uri,
        base_mint.icon,
        web,
        twitter,
        telegram,
        discord,
        baseAmount,
        quoteAmount,
        wrap,
        burn,
        lowLiquidity,
    );
    const [buf] = CreateExternalAMM_Instruction.struct.serialize(data);

    return buf;
}

const useInitExternalAMM = () => {
    const router = useRouter();
    const wallet = useWallet();
    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);
    const amm_id = useRef<string>("");

    const check_signature_update = useCallback(async (result: any) => {
        // if we have a subscription field check against ws_id
        signature_ws_id.current = null;
        setIsLoading(false);

        if (result.err !== null) {
            toast.error("Transaction failed, please try again");
            return;
        }

        toast.success("Launch Complete!", {
            type: "success",
            isLoading: false,
            autoClose: 3000,
        });

        router.push(`/trade/${amm_id.current}`).then(() => {
            window.location.reload();
        });

        signature_ws_id.current = null;
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

    const InitExternalAMM = async (
        baseMint: MintData,
        quoteMint: MintData,
        web: string,
        twitter: string,
        telegram: string,
        discord: string,
        baseAmount: number,
        quoteAmount: number,
        wrap: number,
        burn: number,
        lowLiquidity: number,
    ) => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        setIsLoading(true);

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);

        let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        let listing = PublicKey.findProgramAddressSync([baseMint.mint.address.toBuffer(), Buffer.from("Listing")], PROGRAM)[0];

        let amm_seed_keys = [];
        if (baseMint.mint.address.toString() < quoteMint.mint.address.toString()) {
            amm_seed_keys.push(baseMint.mint.address);
            amm_seed_keys.push(quoteMint.mint.address);
        } else {
            amm_seed_keys.push(quoteMint.mint.address);
            amm_seed_keys.push(baseMint.mint.address);
        }

        let amm_data_account = PublicKey.findProgramAddressSync(
            [amm_seed_keys[0].toBytes(), amm_seed_keys[1].toBytes(), Buffer.from("CookAMM")],
            PROGRAM,
        )[0];

        amm_id.current = amm_data_account.toString();

        let cook_lp_mint_account = PublicKey.findProgramAddressSync([amm_data_account.toBytes(), Buffer.from("LP")], PROGRAM)[0];

        let base_amm_account = await getAssociatedTokenAddress(
            baseMint.mint.address, // mint
            amm_data_account, // owner
            true, // allow owner off curve
            baseMint.token_program,
        );

        let quote_amm_account = await getAssociatedTokenAddress(
            quoteMint.mint.address, // mint
            amm_data_account, // owner
            true, // allow owner off curve
            quoteMint.token_program,
        );

        let base_user_account = await getAssociatedTokenAddress(
            baseMint.mint.address, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            baseMint.token_program,
        );

        let quote_user_account = await getAssociatedTokenAddress(
            quoteMint.mint.address, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            quoteMint.token_program,
        );

        let lp_user_account = await getAssociatedTokenAddress(
            cook_lp_mint_account, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            baseMint.token_program,
        );

        let index_buffer = uInt32ToLEBytes(0);
        let price_data_account = PublicKey.findProgramAddressSync(
            [amm_data_account.toBytes(), index_buffer, Buffer.from("TimeSeries")],
            PROGRAM,
        )[0];

        let trade_to_earn_account = PublicKey.findProgramAddressSync([amm_data_account.toBytes(), Buffer.from("TradeToEarn")], PROGRAM)[0];

        const instruction_data = serialise_CreateExternalAMM_instruction(
            baseMint,
            web,
            twitter,
            telegram,
            discord,
            baseAmount * Math.pow(10, baseMint.mint.decimals),
            quoteAmount * Math.pow(10, quoteMint.mint.decimals),
            wrap,
            burn,
            lowLiquidity,
        );

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_data_account, isSigner: false, isWritable: true },

            { pubkey: listing, isSigner: false, isWritable: true },
            { pubkey: program_sol_account, isSigner: false, isWritable: false },

            { pubkey: amm_data_account, isSigner: false, isWritable: true },

            { pubkey: baseMint.mint.address, isSigner: false, isWritable: true },
            { pubkey: quoteMint.mint.address, isSigner: false, isWritable: false },
            { pubkey: cook_lp_mint_account, isSigner: false, isWritable: true },

            { pubkey: base_user_account, isSigner: false, isWritable: true },
            { pubkey: quote_user_account, isSigner: false, isWritable: true },
            { pubkey: lp_user_account, isSigner: false, isWritable: true },

            { pubkey: base_amm_account, isSigner: false, isWritable: true },
            { pubkey: quote_amm_account, isSigner: false, isWritable: true },

            { pubkey: trade_to_earn_account, isSigner: false, isWritable: true },
            { pubkey: price_data_account, isSigner: false, isWritable: true },
        ];

        account_vector.push({ pubkey: quoteMint.token_program, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: baseMint.token_program, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false });
        account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: false });

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));
        transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));
        transaction.add(list_instruction);

        const createLaunch = toast.info("Setting up your AMM");

        try {
            let signed_transaction = await wallet.signTransaction(transaction);

            var signature = await connection.sendRawTransaction(signed_transaction.serialize(), { skipPreflight: true });

            console.log(signature);
            //var transaction_response = await send_transaction("", encoded_transaction);

            if (signature === undefined) {
                console.log(signature);
                toast.error("Transaction failed, please try again");
                return;
            }

            //let signature = transaction_response.result;

            if (DEBUG) {
                console.log("list signature: ", signature);
            }
            signature_ws_id.current = 1;

            connection.onSignature(signature, check_signature_update, "confirmed");
            setTimeout(transaction_failed, 20000);
        } catch (error) {
            console.log(error);
            setIsLoading(false);
            toast.update(createLaunch, {
                render: "We couldn't create your launch accounts. Please try again.",
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }
    };

    return { InitExternalAMM, isLoading };
};

export default useInitExternalAMM;
