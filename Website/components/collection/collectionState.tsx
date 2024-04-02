import { PublicKey, Keypair, LAMPORTS_PER_SOL, AccountInfo } from "@solana/web3.js";
import {
    FixableBeetStruct,
    BeetStruct,
    uniformFixedSizeArray,
    u8,
    u16,
    u32,
    u64,
    i64,
    bignum,
    utf8String,
    array,
    coption,
    COption,
} from "@metaplex-foundation/beet";
import { publicKey } from "@metaplex-foundation/beet-solana";
import { Wallet, WalletContextState, useWallet } from "@solana/wallet-adapter-react";

import { DEBUG, RPC_NODE, PROGRAM, LaunchKeys, Socials, Extensions } from "../Solana/constants";
import { LaunchInstruction, request_raw_account_data } from "../Solana/state";

import { Box } from "@chakra-ui/react";

import BN from "bn.js";
import bs58 from "bs58";

import { WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export interface CollectionDataUserInput {
    edit_mode: boolean;
    collection_name: string;
    collection_symbol: string;
    icon_file: File | null;
    uri_file: File | null;
    banner_file: File | null;
    icon_url: string;
    banner_url: string;
    total_supply: number;
    num_mints: number;
    minimum_liquidity: number;
    ticket_price: number;
    uri: string;
    pagename: string;
    description: string;
    web_url: string;
    tele_url: string;
    twt_url: string;
    disc_url: string;
    displayImg: string;
    team_wallet: string;
    token_keypair: Keypair | null;
    // extension data
    transfer_fee: number;
    max_transfer_fee: number;
    permanent_delegate: PublicKey | null;
    transfer_hook_program: PublicKey | null;
    nft_images: FileList | null;
    nft_metadata: FileList | null;
    nft_image_url: string;
    nft_metadata_url: string;
    token_mint: PublicKey | null;
    token_name: string;
    token_symbol: string;
    token_image_url: string;
}

export const defaultCollectionInput: CollectionDataUserInput = {
    edit_mode: false,
    collection_name: "",
    collection_symbol: "",
    icon_file: null,
    uri_file: null,
    banner_file: null,
    icon_url: "",
    banner_url: "",
    displayImg: null,
    total_supply: 0,
    num_mints: 0,
    minimum_liquidity: 0,
    ticket_price: 0,
    uri: "",
    pagename: "",
    description: "",
    web_url: "",
    tele_url: "",
    twt_url: "",
    disc_url: "",
    team_wallet: "",
    token_keypair: null,
    transfer_fee: 0,
    max_transfer_fee: 0,
    permanent_delegate: null,
    transfer_hook_program: null,
    nft_images: null,
    nft_metadata: null,
    nft_image_url: "",
    nft_metadata_url: "",
    token_mint: null,
    token_name: "",
    token_symbol: "",
    token_image_url: "",
};

export class CollectionData {
    constructor(
        readonly account_type: number,

        readonly collection_name: string,
        readonly collection_symbol: string,
        readonly collection_icon_url: string,
        readonly collection_meta_url: string,

        readonly token_name: string,
        readonly token_symbol: string,
        readonly token_icon_url: string,

        readonly nft_icon_url: string,
        readonly nft_meta_url: string,

        readonly banner: string,
        readonly page_name: string,
        readonly description: string,

        readonly total_supply: number,
        readonly num_available: number,
        readonly swap_price: bignum,
        readonly swap_fee: number,

        readonly positive_votes: number,
        readonly negative_votes: number,

        readonly availability: number[],

        readonly total_mm_buy_amount: bignum,
        readonly total_mm_sell_amount: bignum,
        readonly last_mm_reward_date: number,

        readonly socials: string[],
        readonly flags: number[],
        readonly strings: string[],
        readonly keys: PublicKey[],
    ) {}

    static readonly struct = new FixableBeetStruct<CollectionData>(
        [
            ["account_type", u8],

            ["collection_name", utf8String],
            ["collection_symbol", utf8String],
            ["collection_icon_url", utf8String],
            ["collection_meta_url", utf8String],

            ["token_name", utf8String],
            ["token_symbol", utf8String],
            ["token_icon_url", utf8String],

            ["nft_icon_url", utf8String],
            ["nft_meta_url", utf8String],

            ["banner", utf8String],
            ["page_name", utf8String],
            ["description", utf8String],

            ["total_supply", u32],
            ["num_available", u32],
            ["swap_price", u64],
            ["swap_fee", u16],

            ["positive_votes", u32],
            ["negative_votes", u32],

            ["availability", array(u8)],

            ["total_mm_buy_amount", u64],
            ["total_mm_sell_amount", u64],
            ["last_mm_reward_date", u32],

            ["socials", array(utf8String)],
            ["flags", array(u8)],
            ["strings", array(utf8String)],
            ["keys", array(publicKey)],
        ],
        (args) =>
            new CollectionData(
                args.account_type!,

                args.collection_name!,
                args.collection_symbol!,
                args.collection_icon_url!,
                args.collection_meta_url!,

                args.token_name!,
                args.token_symbol!,
                args.token_icon_url!,

                args.nft_icon_url!,
                args.nft_meta_url!,

                args.banner!,
                args.page_name!,
                args.description!,

                args.total_supply!,
                args.num_available!,
                args.swap_price!,
                args.swap_fee!,

                args.positive_votes!,
                args.negative_votes!,

                args.availability!,

                args.total_mm_buy_amount!,
                args.total_mm_sell_amount!,
                args.last_mm_reward_date!,

                args.socials!,
                args.flags!,
                args.strings!,
                args.keys!,
            ),
        "CollectionData",
    );
}

export class AssignmentData {
    constructor(
        readonly account_type: number,
        readonly nft_index: number,
        readonly status: number,
    ) {}

    static readonly struct = new FixableBeetStruct<AssignmentData>(
        [
            ["account_type", u8],
            ["nft_index", u32],
            ["status", u8],
        ],
        (args) => new AssignmentData(args.account_type!, args.nft_index!, args.status!),
        "AssignmentData",
    );
}

export class LookupData {
    constructor(
        readonly account_type: number,
        readonly colection_mint: PublicKey,
        readonly nft_mint: PublicKey,
        readonly nft_index: number,
    ) {}

    static readonly struct = new FixableBeetStruct<LookupData>(
        [
            ["account_type", u8],
            ["colection_mint", publicKey],
            ["nft_mint", publicKey],
            ["nft_index", u32],
        ],
        (args) => new LookupData(args.account_type!, args.colection_mint!, args.nft_mint!, args.nft_index!),
        "LookupData",
    );
}

export async function request_assignment_data(pubkey: PublicKey): Promise<AssignmentData | null> {
    let account_data = await request_raw_account_data("", pubkey);

    if (account_data === null) {
        return null;
    }

    const [data] = AssignmentData.struct.deserialize(account_data);

    return data;
}

export async function request_lookup_data(pubkey: PublicKey): Promise<LookupData | null> {
    let account_data = await request_raw_account_data("", pubkey);

    if (account_data === null) {
        return null;
    }

    const [data] = LookupData.struct.deserialize(account_data);

    return data;
}

class LaunchCollection_Instruction {
    constructor(
        readonly instruction: number,
        readonly collection_name: string,
        readonly collection_symbol: string,
        readonly collection_uri: string,
        readonly collection_icon: string,

        readonly token_name: string,
        readonly token_symbol: string,
        readonly token_icon: string,

        readonly nft_uri: string,
        readonly nft_icon: string,

        readonly banner: string,
        readonly num_mints: number,
        readonly ticket_price: bignum,
        readonly page_name: string,
        readonly transfer_fee: number,
        readonly extensions: number,
    ) {}

    static readonly struct = new FixableBeetStruct<LaunchCollection_Instruction>(
        [
            ["instruction", u8],
            ["collection_name", utf8String],
            ["collection_symbol", utf8String],
            ["collection_uri", utf8String],
            ["collection_icon", utf8String],
            ["token_name", utf8String],
            ["token_symbol", utf8String],
            ["token_icon", utf8String],
            ["nft_uri", utf8String],
            ["nft_icon", utf8String],
            ["banner", utf8String],
            ["num_mints", u32],
            ["ticket_price", u64],
            ["page_name", utf8String],
            ["transfer_fee", u16],
            ["extensions", u8],
        ],
        (args) =>
            new LaunchCollection_Instruction(
                args.instruction!,
                args.collection_name!,
                args.collection_symbol!,
                args.collection_uri!,
                args.collection_icon!,
                args.token_name!,
                args.token_symbol!,
                args.token_icon!,
                args.nft_uri!,
                args.nft_icon!,
                args.banner!,
                args.num_mints!,
                args.ticket_price!,
                args.page_name!,
                args.transfer_fee!,
                args.extensions!,
            ),
        "LaunchCollection_Instruction",
    );
}

export function serialise_LaunchCollection_instruction(new_launch_data: CollectionDataUserInput): Buffer {
    // console.log(new_launch_data);
    // console.log(new_launch_data.opendate.toString());
    // console.log(new_launch_data.closedate.toString());

    let extensions =
        (Extensions.TransferFee * Number(new_launch_data.transfer_fee > 0)) |
        (Extensions.PermanentDelegate * Number(new_launch_data.permanent_delegate !== null)) |
        (Extensions.TransferHook * Number(new_launch_data.transfer_hook_program !== null));

    console.log(new_launch_data);
    const data = new LaunchCollection_Instruction(
        LaunchInstruction.launch_collection,
        new_launch_data.collection_name,
        new_launch_data.collection_symbol,
        new_launch_data.uri,
        new_launch_data.icon_url,
        new_launch_data.token_name,
        new_launch_data.token_symbol,
        new_launch_data.token_image_url,
        new_launch_data.nft_metadata_url,
        new_launch_data.nft_image_url,
        new_launch_data.banner_url,
        new_launch_data.num_mints,
        new_launch_data.ticket_price * LAMPORTS_PER_SOL,
        new_launch_data.pagename,
        new_launch_data.transfer_fee,
        extensions,
    );
    const [buf] = LaunchCollection_Instruction.struct.serialize(data);

    return buf;
}
