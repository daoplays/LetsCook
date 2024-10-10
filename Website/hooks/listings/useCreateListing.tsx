import { Dispatch, SetStateAction, MutableRefObject, useCallback, useRef, useState } from "react";
import { getStore } from "@netlify/blobs";
import {
    LaunchDataUserInput,
    LaunchInstruction,
    ListingData,
    getRecentPrioritizationFees,
    get_current_blockhash,
    request_launch_data,
    request_raw_account_data,
    send_transaction,
    serialise_EditLaunch_instruction,
    serialise_basic_instruction,
    uInt32ToLEBytes,
} from "../../components/Solana/state";
import {
    DEBUG,
    SYSTEM_KEY,
    PROGRAM,
    Config,
    LaunchKeys,
    LaunchFlags,
    DATA_ACCOUNT_SEED,
    SOL_ACCOUNT_SEED,
    TIMEOUT,
} from "../../components/Solana/constants";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, TransactionInstruction, Connection, ComputeBudgetProgram } from "@solana/web3.js";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import "react-datepicker/dist/react-datepicker.css";
import bs58 from "bs58";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import useAppRoot from "../../context/useAppRoot";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getAMMBaseAccount, getAMMQuoteAccount, getLPMintAccount, getPoolStateAccount } from "../raydium/useCreateCP";
import { FixableBeetStruct, array, u8, utf8String } from "@metaplex-foundation/beet";
import { NewListing } from "../../components/listing/launch";
import { RaydiumAMM } from "../../components/Solana/jupiter_state";
import { update_listings_blob } from "../../pages/_contexts";

class CreateListing_Instruction {
    constructor(
        readonly instruction: number,
        readonly amm_provider: number,
    ) {}

    static readonly struct = new FixableBeetStruct<CreateListing_Instruction>(
        [
            ["instruction", u8],
            ["amm_provider", u8],
        ],
        (args) => new CreateListing_Instruction(args.instruction!, args.amm_provider!),
        "CreateListing_Instruction",
    );
}

function serialise_CreateListing_instruction(provider: number): Buffer {
    const data = new CreateListing_Instruction(LaunchInstruction.create_listing, provider);
    const [buf] = CreateListing_Instruction.struct.serialize(data);

    return buf;
}

const useCreateListing = () => {
    const wallet = useWallet();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        // if we have a subscription field check against ws_id

        signature_ws_id.current = null;
        setIsLoading(false);

        if (result.err !== null) {
            toast.error("Transaction failed, please try again", {
                type: "error",
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }

        toast.success("Listing Created!", {
            type: "success",
            isLoading: false,
            autoClose: 3000,
        });

        // update the netlify blob
        //update_listings_blob(listing.mint.toString());
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

    const CreateListing = async (new_listing: NewListing, accept: boolean) => {
        if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

        if (signature_ws_id.current !== null) {
            //toast.success("Transaction pending, please wait");
            //return;
        }

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        let program_data_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(DATA_ACCOUNT_SEED)], PROGRAM)[0];
        let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];
        let token_mint = new PublicKey(new_listing.token);
        let quote_mint = new PublicKey("So11111111111111111111111111111111111111112");

        let creator = new PublicKey(new_listing.user);
        let creator_data_account = PublicKey.findProgramAddressSync([creator.toBytes(), Buffer.from("User")], PROGRAM)[0];

        let unverified = PublicKey.findProgramAddressSync(
            [token_mint.toBytes(), creator.toBytes(), Buffer.from("UnverifiedListing")],
            PROGRAM,
        )[0];
        let verified = accept ? PublicKey.findProgramAddressSync([token_mint.toBytes(), Buffer.from("Listing")], PROGRAM)[0] : PROGRAM;

        // check for raydium poolsl
        let amm_provider = 0;
        let ray_market = null;
        let amm_account: PublicKey = PROGRAM;
        let pool_account: PublicKey = PROGRAM;
        let raydium_base_account: PublicKey = PROGRAM;
        let raydium_quote_account: PublicKey = PROGRAM;
        let raydium_lp_mint_account: PublicKey = PROGRAM;

        if (Config.PROD) {
            const options = { method: "GET", headers: { "X-API-KEY": "e819487c98444f82857d02612432a051" } };

            let market_url = "https://public-api.birdeye.so/defi/v2/markets?address=" + token_mint.toString();
            let market_result = await fetch(market_url, options).then((response) => response.json());

            let type: String;
            for (let i = 0; i < market_result["data"]["items"].length; i++) {
                let item = market_result["data"]["items"][i];
                if (
                    item.base.address !== "So11111111111111111111111111111111111111112" &&
                    item.quote.address !== "So11111111111111111111111111111111111111112"
                )
                    continue;

                if (item["source"] === "Raydium") {
                    ray_market = market_result["data"]["items"][i];
                    type = "Raydium";
                    amm_provider = 2;
                    break;
                }
                if (item["source"] === "Raydium Cp") {
                    ray_market = market_result["data"]["items"][i];
                    type = "RaydiumCPMM";
                    amm_provider = 1;
                    break;
                }
            }

            if (ray_market === null) {
                toast.error("No Raydium Market Found");
                return;
            }

            if (ray_market !== null) {
                console.log(ray_market);
                pool_account = new PublicKey(ray_market.address);

                let amm_seed_keys = [];
                if (token_mint.toString() < quote_mint.toString()) {
                    amm_seed_keys.push(token_mint);
                    amm_seed_keys.push(quote_mint);
                } else {
                    amm_seed_keys.push(quote_mint);
                    amm_seed_keys.push(token_mint);
                }

                let amm_data_account = PublicKey.findProgramAddressSync(
                    [amm_seed_keys[0].toBytes(), amm_seed_keys[1].toBytes(), Buffer.from(type)],
                    PROGRAM,
                )[0];

                amm_account = amm_data_account;

                if (type === "Raydium") {
                    let pool_data = await request_raw_account_data("", pool_account);
                    const [ray_pool] = RaydiumAMM.struct.deserialize(pool_data);
                    raydium_lp_mint_account = ray_pool.lpMint;
                    if (ray_pool.quoteMint.equals(new PublicKey("So11111111111111111111111111111111111111112"))) {
                        raydium_base_account = ray_pool.baseVault;
                        raydium_quote_account = ray_pool.quoteVault;
                    } else {
                        raydium_base_account = ray_pool.quoteVault;
                        raydium_quote_account = ray_pool.baseVault;
                    }
                }

                if (type === "RaydiumCPMM") {
                    raydium_base_account = getAMMBaseAccount(token_mint, quote_mint);
                    raydium_quote_account = getAMMQuoteAccount(token_mint, quote_mint);
                    raydium_lp_mint_account = getLPMintAccount(token_mint, quote_mint);
                }
            }
        }

        const instruction_data = serialise_CreateListing_instruction(amm_provider);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: creator, isSigner: false, isWritable: true },
            { pubkey: creator_data_account, isSigner: false, isWritable: true },
            { pubkey: unverified, isSigner: false, isWritable: true },
            { pubkey: verified, isSigner: false, isWritable: true },
            { pubkey: program_data_account, isSigner: false, isWritable: true },
            { pubkey: program_sol_account, isSigner: false, isWritable: true },
            { pubkey: token_mint, isSigner: false, isWritable: true },
            { pubkey: amm_account, isSigner: false, isWritable: true },
            { pubkey: pool_account, isSigner: false, isWritable: true },
            { pubkey: quote_mint, isSigner: false, isWritable: true },
            { pubkey: raydium_quote_account, isSigner: false, isWritable: true },
            { pubkey: raydium_base_account, isSigner: false, isWritable: true },
            { pubkey: raydium_lp_mint_account, isSigner: false, isWritable: true },

            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
        ];

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
        transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));

        transaction.add(list_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            var signature = await connection.sendRawTransaction(signed_transaction.serialize(), { skipPreflight: true });

            if (signature === undefined) {
                console.log(signature);
                toast.error("Transaction failed, please try again");
                return;
            }

            if (DEBUG) {
                console.log("list signature: ", signature);
            }
            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
            setTimeout(transaction_failed, TIMEOUT);
        } catch (error) {
            console.log(error);
            toast.error("Something went wrong launching your token , please try again later.", {
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }
    };
    return { CreateListing };
};

export default useCreateListing;
