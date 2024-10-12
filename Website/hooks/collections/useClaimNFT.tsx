import {
    LaunchData,
    LaunchInstruction,
    get_current_blockhash,
    myU64,
    send_transaction,
    serialise_basic_instruction,
    uInt32ToLEBytes,
    request_raw_account_data,
    getRecentPrioritizationFees,
} from "../../components/Solana/state";
import { CollectionData, request_assignment_data } from "../../components/collection/collectionState";
import {
    ComputeBudgetProgram,
    PublicKey,
    Transaction,
    TransactionInstruction,
    Connection,
    Keypair,
    SYSVAR_RENT_PUBKEY,
    AccountMeta,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getTransferHook, resolveExtraAccountMeta, ExtraAccountMetaAccountDataLayout } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, Config, SYSTEM_KEY, SOL_ACCOUNT_SEED, CollectionKeys, METAPLEX_META, TIMEOUT } from "../../components/Solana/constants";
import { useCallback, useRef, useState, useEffect } from "react";
import bs58 from "bs58";
import { LaunchKeys, LaunchFlags } from "../../components/Solana/constants";
import useAppRoot from "../../context/useAppRoot";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import useMintNFT from "./useMintNFT";
import { toast } from "react-toastify";
import { BeetStruct, FixableBeetStruct, array, bignum, u64, u8, uniformFixedSizeArray } from "@metaplex-foundation/beet";
import { publicKey } from "@metaplex-foundation/beet-solana";
import useMintRandom from "./useMintRandom";

class OraoTokenFeeConfig {
    constructor(
        readonly discriminator: number[],
        readonly mint: PublicKey,
        readonly treasury: PublicKey,
        readonly fee: bignum,
    ) {}

    static readonly struct = new FixableBeetStruct<OraoTokenFeeConfig>(
        [
            ["discriminator", uniformFixedSizeArray(u8, 8)],
            ["mint", publicKey],
            ["treasury", publicKey],
            ["fee", u64],
        ],
        (args) => new OraoTokenFeeConfig(args.discriminator!, args.mint!, args.treasury!, args.fee!),
        "OraoTokenFeeConfig",
    );
}

class OraoNetworkConfig {
    constructor(
        readonly discriminator: number[],
        readonly treasury: PublicKey,
        readonly requestFee: bignum,
        readonly fulfilmentAuthorities: PublicKey[],
        readonly tokenFeeConfig: OraoTokenFeeConfig,
    ) {}

    static readonly struct = new FixableBeetStruct<OraoNetworkConfig>(
        [
            ["discriminator", uniformFixedSizeArray(u8, 8)],
            ["treasury", publicKey],
            ["requestFee", u64],
            ["fulfilmentAuthorities", array(publicKey)],
            ["tokenFeeConfig", OraoTokenFeeConfig.struct],
        ],
        (args) =>
            new OraoNetworkConfig(args.discriminator!, args.treasury!, args.requestFee!, args.fulfilmentAuthorities!, args.tokenFeeConfig!),
        "OraoNetworkConfig",
    );
}

class OraoNetworkState {
    constructor(
        readonly discriminator: number[],
        readonly config: OraoNetworkConfig,
        readonly numRecieved: bignum,
    ) {}

    static readonly struct = new FixableBeetStruct<OraoNetworkState>(
        [
            ["discriminator", uniformFixedSizeArray(u8, 8)],
            ["config", OraoNetworkConfig.struct],
            ["numRecieved", u64],
        ],
        (args) => new OraoNetworkState(args.discriminator!, args.config!, args.numRecieved!),
        "OraoNetworkState",
    );
}

class OraoRandomnessResponse {
    constructor(
        readonly pubkey: PublicKey,
        readonly randomness: number[],
    ) {}

    static readonly struct = new FixableBeetStruct<OraoRandomnessResponse>(
        [
            ["pubkey", publicKey],
            ["randomness", uniformFixedSizeArray(u8, 64)],
        ],
        (args) => new OraoRandomnessResponse(args.pubkey!, args.randomness!),
        "OraoRandomnessResponse",
    );
}

export class OraoRandomness {
    constructor(
        readonly seed: number[],
        readonly randomness: number[],
        readonly responses: OraoRandomnessResponse[],
    ) {}

    static readonly struct = new FixableBeetStruct<OraoRandomness>(
        [
            ["seed", uniformFixedSizeArray(u8, 32)],
            ["randomness", uniformFixedSizeArray(u8, 64)],
            ["responses", array(OraoRandomnessResponse.struct)],
        ],
        (args) => new OraoRandomness(args.seed!, args.randomness!, args.responses!),
        "OraoRandomness",
    );
}

function serialise_claim_nft_instruction(seed: number[]): Buffer {
    const data = new ClaimNFT_Instruction(LaunchInstruction.claim_nft, seed);

    const [buf] = ClaimNFT_Instruction.struct.serialize(data);

    return buf;
}

function check_randomness(data: number[]) {
    let valid = false;
    for (let i = 0; i < data.length; i++) {
        if (data[i] != 0) {
            valid = true;
            break;
        }
    }

    return valid;
}
class ClaimNFT_Instruction {
    constructor(
        readonly instruction: number,
        readonly seed: number[],
    ) {}

    static readonly struct = new BeetStruct<ClaimNFT_Instruction>(
        [
            ["instruction", u8],
            ["seed", uniformFixedSizeArray(u8, 32)],
        ],
        (args) => new ClaimNFT_Instruction(args.instruction!, args.seed!),
        "ClaimNFT_Instruction",
    );
}

const useClaimNFT = (launchData: CollectionData, updateData: boolean = false) => {
    const wallet = useWallet();
    const { connection } = useConnection();

    const { checkProgramData, mintData } = useAppRoot();
    const [isLoading, setIsLoading] = useState(false);
    const [OraoRandoms, setOraoRandoms] = useState<number[]>([]);

    const { MintNFT } = useMintNFT(launchData);
    const { MintRandom } = useMintRandom(launchData);
    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        //console.log("claim nft signature: ", result);
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

        toast.success("Transaction successful! Waiting for Randomness", {
            type: "success",
            isLoading: false,
            autoClose: 3000,
        });
    }, []);

    const transaction_failed = useCallback(async () => {
        if (signature_ws_id.current == null) return;

        await connection.removeAccountChangeListener(signature_ws_id.current);

        signature_ws_id.current = null;
        setIsLoading(false);

        console.log("transaction failed at ", new Date());
        toast.error("Transaction not processed, please try again", {
            type: "error",
            isLoading: false,
            autoClose: 3000,
        });
    }, []);

    const ClaimNFT = async () => {
        let nft_assignment_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), launchData.keys[CollectionKeys.CollectionMint].toBytes(), Buffer.from("assignment")],
            PROGRAM,
        )[0];
        let assignment_data = await request_assignment_data(nft_assignment_account);

        if (assignment_data !== null) {
            console.log(assignment_data.random_address.toString(), assignment_data.status);
            if (!assignment_data.random_address.equals(SYSTEM_KEY) && assignment_data.status === 0) {
                console.log("assignment data found, minting nft");
                if (launchData.collection_meta["__kind"] === "RandomFixedSupply") {
                    MintNFT();
                }
                if (launchData.collection_meta["__kind"] === "RandomUnlimited") {
                    MintRandom();
                }
                return;
            }
        }

        if (launchData.num_available === 0) {
            return;
        }

        if (wallet.signTransaction === undefined) return;

        if (wallet.publicKey.toString() == launchData.keys[LaunchKeys.Seller].toString()) {
            alert("Launch creator cannot buy NFTs");
            return;
        }

        if (signature_ws_id.current !== null) {
            alert("Transaction pending, please wait");
            return;
        }

        if (launchData === null) {
            return;
        }

        setIsLoading(true);
        setOraoRandoms([]);

        let launch_data_account = PublicKey.findProgramAddressSync(
            [Buffer.from(launchData.page_name), Buffer.from("Collection")],
            PROGRAM,
        )[0];

        let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

        let token_mint = launchData.keys[CollectionKeys.MintAddress];
        let mint_info = mintData.get(launchData.keys[CollectionKeys.MintAddress].toString());
        let mint_account = mint_info.mint;

        let user_token_account_key = await getAssociatedTokenAddress(
            token_mint, // mint
            wallet.publicKey, // owner
            true, // allow owner off curve
            mint_info.token_program,
        );

        let pda_token_account_key = await getAssociatedTokenAddress(
            token_mint, // mint
            program_sol_account, // owner
            true, // allow owner off curve
            mint_info.token_program,
        );

        let team_token_account_key = await getAssociatedTokenAddress(
            token_mint, // mint
            launchData.keys[CollectionKeys.TeamWallet], // owner
            true, // allow owner off curve
            mint_info.token_program,
        );

        let token_destination_account = pda_token_account_key;
        for (let i = 0; i < launchData.plugins.length; i++) {
            if (launchData.plugins[i]["__kind"] === "MintOnly") {
                token_destination_account = team_token_account_key;
            }
        }

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        let transfer_hook = getTransferHook(mint_account);

        let transfer_hook_program_account: PublicKey | null = null;
        let transfer_hook_validation_account: PublicKey | null = null;
        let extra_hook_accounts: AccountMeta[] = [];
        if (transfer_hook !== null) {
            console.log(transfer_hook.programId.toString());

            transfer_hook_program_account = transfer_hook.programId;
            transfer_hook_validation_account = PublicKey.findProgramAddressSync(
                [Buffer.from("extra-account-metas"), launchData.keys[CollectionKeys.MintAddress].toBuffer()],
                transfer_hook_program_account,
            )[0];

            // check if the validation account exists
            console.log("check extra accounts");
            let hook_accounts = await request_raw_account_data("", transfer_hook_validation_account);

            let extra_account_metas = ExtraAccountMetaAccountDataLayout.decode(Uint8Array.from(hook_accounts));
            console.log(extra_account_metas);
            for (let i = 0; i < extra_account_metas.extraAccountsList.count; i++) {
                console.log(extra_account_metas.extraAccountsList.extraAccounts[i]);
                let extra = extra_account_metas.extraAccountsList.extraAccounts[i];
                let meta = await resolveExtraAccountMeta(
                    connection,
                    extra,
                    extra_hook_accounts,
                    Buffer.from([]),
                    transfer_hook_program_account,
                );
                console.log(meta);
                extra_hook_accounts.push(meta);
            }
        }

        let orao_program = PROGRAM;
        let randomKey = new Keypair();
        let key_bytes = randomKey.publicKey.toBytes();

        if (Config.NETWORK !== "eclipse") {
            orao_program = new PublicKey("VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y");
        }

        let orao_network = PublicKey.findProgramAddressSync([Buffer.from("orao-vrf-network-configuration")], orao_program)[0];

        let orao_random = PublicKey.findProgramAddressSync([Buffer.from("orao-vrf-randomness-request"), key_bytes], orao_program)[0];

        let orao_treasury: PublicKey = SYSTEM_KEY;
        if (Config.NETWORK !== "eclipse") {
            let orao_network_data = await request_raw_account_data("", orao_network);
            orao_treasury = new PublicKey(orao_network_data.slice(8, 40));
        }

        // check if we have the whitelist plugin
        let whitelist_mint = PROGRAM;
        let whitelist_account = PROGRAM;
        let whitelist_token_program = PROGRAM;

        console.log("collection has ", launchData.plugins.length, " plugins");
        for (let i = 0; i < launchData.plugins.length; i++) {
            if (launchData.plugins[i]["__kind"] === "Whitelist") {
                console.log("Have whitelist plugin");
                console.log(launchData.plugins[i]["key"].toString());
                whitelist_mint = launchData.plugins[i]["key"];
                let whitelist = mintData.get(whitelist_mint.toString());
                console.log("whitelist token:", whitelist);
                whitelist_account = await getAssociatedTokenAddress(
                    whitelist_mint, // mint
                    wallet.publicKey, // owner
                    true, // allow owner off curve
                    whitelist.token_program,
                );

                whitelist_token_program = whitelist.token_program;
            }
        }

        const instruction_data = serialise_claim_nft_instruction(Array.from(key_bytes));

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_data_account, isSigner: false, isWritable: true },

            { pubkey: nft_assignment_account, isSigner: false, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },

            { pubkey: program_sol_account, isSigner: false, isWritable: true },

            { pubkey: token_mint, isSigner: false, isWritable: true },
            { pubkey: user_token_account_key, isSigner: false, isWritable: true },
            { pubkey: token_destination_account, isSigner: false, isWritable: true },

            { pubkey: launchData.keys[CollectionKeys.CollectionMint], isSigner: false, isWritable: true },
            { pubkey: Config.COOK_FEES, isSigner: false, isWritable: true },
            { pubkey: launchData.keys[CollectionKeys.TeamWallet], isSigner: false, isWritable: true },

            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
            { pubkey: mint_info.token_program, isSigner: false, isWritable: false },

            { pubkey: orao_random, isSigner: false, isWritable: true },
            { pubkey: orao_treasury, isSigner: false, isWritable: true },
            { pubkey: orao_network, isSigner: false, isWritable: true },
            { pubkey: orao_program, isSigner: false, isWritable: false },

            { pubkey: whitelist_mint, isSigner: false, isWritable: true },
            { pubkey: whitelist_account, isSigner: false, isWritable: true },
            { pubkey: whitelist_token_program, isSigner: false, isWritable: false },
        ];

        if (transfer_hook_program_account !== null) {
            account_vector.push({ pubkey: transfer_hook_program_account, isSigner: false, isWritable: true });
            account_vector.push({ pubkey: transfer_hook_validation_account, isSigner: false, isWritable: true });

            for (let i = 0; i < extra_hook_accounts.length; i++) {
                account_vector.push({
                    pubkey: extra_hook_accounts[i].pubkey,
                    isSigner: extra_hook_accounts[i].isSigner,
                    isWritable: extra_hook_accounts[i].isWritable,
                });
            }
        }

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

            console.log("claim nft sig at ", new Date(), signature);

            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
            setTimeout(transaction_failed, TIMEOUT);
        } catch (error) {
            console.log(error);
            setIsLoading(false);
            return;
        }
    };

    return { ClaimNFT, isLoading, OraoRandoms, setOraoRandoms };
};

export default useClaimNFT;
