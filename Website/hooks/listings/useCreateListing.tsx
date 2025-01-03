import { useRef } from "react";
import { LaunchInstruction, request_raw_account_data, uInt32ToLEBytes } from "../../components/Solana/state";
import { SYSTEM_KEY, PROGRAM, Config, DATA_ACCOUNT_SEED, SOL_ACCOUNT_SEED } from "../../components/Solana/constants";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, TransactionInstruction, Connection } from "@solana/web3.js";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import "react-datepicker/dist/react-datepicker.css";
import bs58 from "bs58";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { getAMMBaseAccount, getAMMQuoteAccount, getLPMintAccount } from "../raydium/useCreateCP";
import { FixableBeetStruct, u8 } from "@metaplex-foundation/beet";
import { NewListing } from "../../components/listing/launch";
import { RaydiumAMM } from "../../components/Solana/jupiter_state";
import useSendTransaction from "../useSendTransaction";

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

export const GetCreateListingInstruction = async (user: PublicKey, connection: Connection, new_listing: NewListing, accept: boolean): Promise<TransactionInstruction> => {
    if (user === null) return;

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
        { pubkey: user, isSigner: true, isWritable: true },
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
    return list_instruction;
};

const useCreateListing = () => {
    const wallet = useWallet();
    const { sendTransaction, isLoading } = useSendTransaction();
    const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

    const CreateListing = async (new_listing: NewListing, accept: boolean) => {
        let instruction = await GetCreateListingInstruction(wallet.publicKey, connection, new_listing, accept);
        await sendTransaction({
            instructions: [instruction],
            onSuccess: () => {
                // Handle success
            },
            onError: (error) => {
                // Handle error
            },
        });
    };
    return { CreateListing };
};

export default useCreateListing;
