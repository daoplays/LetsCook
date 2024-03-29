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
import {LaunchInstruction } from "../Solana/state";

import { Box } from "@chakra-ui/react";

import BN from "bn.js";
import bs58 from "bs58";

import { WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";



export interface CollectionDataUserInput {
    edit_mode: boolean;
    name: string;
    symbol: string;
    icon_file: File | null;
    uri_file: File | null;
    banner_file: File | null;
    icon_url: string;
    banner_url: string;
    total_supply: number;
    decimals: number;
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
    opendate: Date;
    closedate: Date;
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
}

export const defaultCollectionInput: CollectionDataUserInput = {
    edit_mode: false,
    name: "",
    symbol: "",
    icon_file: null,
    uri_file: null,
    banner_file: null,
    icon_url: "",
    banner_url: "",
    displayImg: null,
    total_supply: 0,
    decimals: 0,
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
    opendate: new Date(new Date().setHours(0, 0, 0, 0)),
    closedate: new Date(new Date().setHours(0, 0, 0, 0)),
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
    token_mint : null,
    
};


export class CollectionData {
    constructor(
        readonly account_type: number,
        readonly game_id: bignum,
        readonly last_interaction: bignum,
        readonly num_interactions: number,

        readonly name: string,
        readonly symbol: string,
        readonly icon: string,
        readonly meta_url: string,
        readonly banner: string,
        readonly page_name: string,
        readonly description: string,

        readonly total_supply: bignum,
        readonly decimals: number,
        readonly num_mints: bignum,
        readonly ticket_price: bignum,
        readonly minimum_liquidity: bignum,
        readonly launch_date: bignum,
        readonly end_date: bignum,

        readonly tickets_sold: number,
        readonly tickets_claimed: number,
        readonly mints_won: number,
        readonly positive_votes: number,
        readonly negative_votes: number,

        readonly total_mm_buy_amount: bignum,
        readonly total_mm_sell_amount: bignum,
        readonly last_mm_reward_date: number,

        readonly socials: string[],
        readonly distribution: number[],
        readonly flags: number[],
        readonly strings: string[],
        readonly keys: PublicKey[],
    ) {}

    static readonly struct = new FixableBeetStruct<CollectionData>(
        [
            ["account_type", u8],
            ["game_id", u64],
            ["last_interaction", i64],
            ["num_interactions", u16],

            ["name", utf8String],
            ["symbol", utf8String],
            ["icon", utf8String],
            ["meta_url", utf8String],
            ["banner", utf8String],
            ["page_name", utf8String],
            ["description", utf8String],

            ["total_supply", u64],
            ["decimals", u8],
            ["num_mints", u32],
            ["ticket_price", u64],
            ["minimum_liquidity", u64],
            ["launch_date", u64],
            ["end_date", u64],

            ["tickets_sold", u32],
            ["tickets_claimed", u32],
            ["mints_won", u32],
            ["positive_votes", u32],
            ["negative_votes", u32],

            ["total_mm_buy_amount", u64],
            ["total_mm_sell_amount", u64],
            ["last_mm_reward_date", u32],

            ["socials", array(utf8String)],
            ["distribution", array(u8)],
            ["flags", array(u8)],
            ["strings", array(utf8String)],
            ["keys", array(publicKey)],
        ],
        (args) =>
            new CollectionData(
                args.account_type!,
                args.game_id!,
                args.last_interaction!,
                args.num_interactions!,

                args.name!,
                args.symbol!,
                args.icon!,
                args.meta_url!,
                args.banner!,
                args.page_name!,
                args.description!,

                args.total_supply!,
                args.decimals!,
                args.num_mints!,
                args.ticket_price!,
                args.minimum_liquidity!,
                args.launch_date!,
                args.end_date!,

                args.tickets_sold!,
                args.tickets_claimed!,
                args.mints_won!,
                args.positive_votes!,
                args.negative_votes!,

                args.total_mm_buy_amount!,
                args.total_mm_sell_amount!,
                args.last_mm_reward_date!,

                args.socials!,
                args.distribution!,
                args.flags!,
                args.strings!,
                args.keys!,
            ),
        "CollectionData",
    );
}

class LaunchCollection_Instruction {
    constructor(
        readonly instruction: number,
        readonly name: string,
        readonly symbol: string,
        readonly uri: string,
        readonly icon: string,
        readonly banner: string,
        readonly num_mints: number,
        readonly ticket_price: bignum,
        readonly page_name: string,
        readonly transfer_fee: number,
        readonly max_transfer_fee: bignum,
        readonly extensions: number,   
        readonly description: string,
        readonly website: string,
        readonly twitter: string,
        readonly telegram: string,
        readonly discord: string,
    ) {}

    static readonly struct = new FixableBeetStruct<LaunchCollection_Instruction>(
        [
            ["instruction", u8],
            ["name", utf8String],
            ["symbol", utf8String],
            ["uri", utf8String],
            ["icon", utf8String],
            ["banner", utf8String],
            ["num_mints", u32],
            ["ticket_price", u64],
            ["page_name", utf8String],
            ["transfer_fee", u16],
            ["max_transfer_fee", u64],
            ["extensions", u8],
            ["description", utf8String],
            ["website", utf8String],
            ["twitter", utf8String],
            ["telegram", utf8String],
            ["discord", utf8String],

        ],
        (args) =>
            new LaunchCollection_Instruction(
                args.instruction!,
                args.name!,
                args.symbol!,
                args.uri!,
                args.icon!,
                args.banner!,
                args.num_mints!,
                args.ticket_price!,
                args.page_name!,
                args.transfer_fee!,
                args.max_transfer_fee!,
                args.extensions!,
                args.description!,
                args.website!,
                args.twitter!,
                args.telegram!,
                args.discord!,
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

    const data = new LaunchCollection_Instruction(
        LaunchInstruction.launch_collection,
        new_launch_data.name,
        new_launch_data.symbol,
        new_launch_data.uri,
        new_launch_data.icon_url,
        new_launch_data.banner_url,
        new_launch_data.num_mints,
        new_launch_data.ticket_price * LAMPORTS_PER_SOL,
        new_launch_data.pagename,
        new_launch_data.transfer_fee,
        new_launch_data.max_transfer_fee,
        extensions,
        new_launch_data.description,
        new_launch_data.web_url,
        new_launch_data.twt_url,
        new_launch_data.tele_url,
        new_launch_data.disc_url,
    );
    const [buf] = LaunchCollection_Instruction.struct.serialize(data);

    return buf;
}