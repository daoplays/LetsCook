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
} from "@metaplex-foundation/beet";
import { publicKey } from "@metaplex-foundation/beet-solana";
import { CollectionKeys, Extensions, Socials } from "../Solana/constants";
import { bignum_to_num, LaunchInstruction, request_raw_account_data } from "../Solana/state";
import BN from "bn.js";
import { CollectionData } from "@letscook/sdk/dist/state/collections";

export class MarketplaceSummary {
    constructor(readonly num_listings: number) {}

    static readonly struct = new BeetStruct<MarketplaceSummary>(
        [["num_listings", u32]],
        (args) => new MarketplaceSummary(args.num_listings!),
        "MarketplaceSummary",
    );
}

export class NewNFTListingData {
    constructor(
        readonly collection: PublicKey,
        readonly asset: PublicKey,
        readonly seller: PublicKey,
        readonly price: bignum,
    ) {}

    static readonly struct = new BeetStruct<NewNFTListingData>(
        [
            ["collection", publicKey],
            ["asset", publicKey],
            ["seller", publicKey],
            ["price", u64],
        ],
        (args) => new NewNFTListingData(args.collection!, args.asset!, args.seller!, args.price!),
        "NewNFTListingData",
    );
}

export class NFTListingData {
    constructor(
        readonly asset: PublicKey,
        readonly seller: PublicKey,
        readonly price: bignum,
    ) {}

    static readonly struct = new BeetStruct<NFTListingData>(
        [
            ["asset", publicKey],
            ["seller", publicKey],
            ["price", u64],
        ],
        (args) => new NFTListingData(args.asset!, args.seller!, args.price!),
        "NFTListingData",
    );
}

export interface CollectionPluginData {
    // mint probability
    probability: string;

    //whitelist plugin
    whitelistKey: PublicKey | null;
    whitelistAmount: bignum | null;
    whitelistPhaseEnd: Date | null;

    // mint only plugin
    mintOnly: boolean;

    // listings
    listings: NFTListingData[];
}

export function getCollectionPlugins(collection: CollectionData): CollectionPluginData {
    const initialData: CollectionPluginData = {
        probability: "",
        whitelistKey: null,
        whitelistAmount: null,
        whitelistPhaseEnd: null,
        mintOnly: false,
        listings: [],
    };

    return collection.plugins.reduce((acc, plugin) => {
        switch (plugin["__kind"]) {
            case "MintProbability":
                acc.probability = `${plugin["mint_prob"]}% mint chance`;
                break;
            case "Whitelist":
                acc.whitelistKey = plugin["key"];
                acc.whitelistAmount = plugin["amount"];
                acc.whitelistPhaseEnd = new Date(bignum_to_num(plugin["phase_end"]));
                break;
            case "MintOnly":
                acc.mintOnly = true;
                break;
            case "Marketplace":
                acc.listings = plugin["listings"];
                break;
            default:
                break;
        }
        return acc;
    }, initialData);
}

export interface OnChainAttributes {
    name: string;
    min: string;
    max: string;
    saved: boolean;
    editMode: boolean;
}

export interface CollectionDataUserInput {
    edit_mode: boolean;
    collection_type: number;
    collection_name: string;
    collection_symbol: string;
    icon_file: File | null;
    uri_file: File | null;
    banner_file: File | null;
    icon_url: string;
    banner_url: string;
    total_supply: number;
    collection_size: number;
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
    swap_rate: number;
    swap_fee: number;
    mint_prob: number;

    // nft_extension data
    permanent_delegate: PublicKey | null;
    transfer_hook_program: PublicKey | null;
    nft_images: FileList | null;
    nft_metadata: FileList | null;
    nft_image_url: string;
    nft_metadata_url: string;
    nft_name: string;
    nft_type: string;
    token_mint: PublicKey | null;
    token_name: string;
    token_symbol: string;
    token_image_url: string;
    token_decimals: number;
    token_extensions: number;
    attributes: OnChainAttributes[];

    //whitelist plugin
    whitelist_key: string;
    whitelist_amount: number;
    whitelist_phase_end: Date;

    // mint only plugin
    mint_only: boolean;

    // upload state
    image_payment: boolean;
    images_uploaded: number;
    manifest: any;
    metadata_payment: boolean;
    metadata_uploaded: boolean;
}

export const defaultCollectionInput: CollectionDataUserInput = {
    edit_mode: false,
    collection_type: 0,
    collection_name: "",
    collection_symbol: "",
    icon_file: null,
    uri_file: null,
    banner_file: null,
    icon_url: "",
    banner_url: "",
    displayImg: null,
    total_supply: 0,
    collection_size: 0,
    uri: "",
    pagename: "",
    description: "",
    web_url: "",
    tele_url: "",
    twt_url: "",
    disc_url: "",
    team_wallet: "",
    token_keypair: null,
    swap_rate: 0,
    swap_fee: 0,
    mint_prob: 100,
    permanent_delegate: null,
    transfer_hook_program: null,
    nft_images: null,
    nft_metadata: null,
    nft_image_url: "",
    nft_metadata_url: "",
    nft_name: "",
    nft_type: "",
    token_mint: null,
    token_name: "",
    token_symbol: "",
    token_image_url: "",
    token_decimals: 0,
    token_extensions: 0,
    attributes: [],
    whitelist_key: "",
    whitelist_amount: 0,
    whitelist_phase_end: new Date(0),
    mint_only: false,
    image_payment: false,
    images_uploaded: 0,
    manifest: null,
    metadata_payment: false,
    metadata_uploaded: false,
};

export function create_CollectionDataInput(launch_data: CollectionData, edit_mode: boolean): CollectionDataUserInput {
    // console.log(new_launch_data);
    // console.log(new_launch_data.opendate.toString());
    // console.log(new_launch_data.closedate.toString());

    let mint_prob = 100;
    let whitelist_key = "";
    let whitelist_amount = 0;
    let whitelist_phase_end = 0;

    let mint_only = false;

    let plugins = getCollectionPlugins(launch_data);

    for (let i = 0; i < launch_data.plugins.length; i++) {
        if (plugins.probability !== "") {
            mint_prob = launch_data.plugins[i]["mint_prob"];
            //console.log("Have mint prob", prob_string);
        }
        if (plugins.whitelistKey !== null) {
            whitelist_key = plugins.whitelistKey.toString();
            whitelist_amount = bignum_to_num(plugins.whitelistAmount);
            whitelist_phase_end = plugins.whitelistPhaseEnd.getTime();
            //console.log("Have mint prob", prob_string);
        }

        if (plugins.mintOnly) {
            mint_only = true;
        }
    }

    const data: CollectionDataUserInput = {
        edit_mode: edit_mode,
        collection_type: launch_data.collection_meta["__kind"] === "RandomFixedSupply" ? 0 : 1,
        collection_name: launch_data.collection_name,
        collection_symbol: "",
        icon_file: null,
        uri_file: null,
        banner_file: null,
        icon_url: launch_data.collection_icon_url,
        banner_url: launch_data.banner,
        displayImg: launch_data.collection_icon_url,
        total_supply: launch_data.num_available,
        collection_size: launch_data.num_available,
        uri: launch_data.collection_meta_url,
        pagename: launch_data.page_name,
        description: launch_data.description,
        web_url: launch_data.socials[Socials.Website].toString(),
        tele_url: launch_data.socials[Socials.Telegram].toString(),
        twt_url: launch_data.socials[Socials.Twitter].toString(),
        disc_url: launch_data.socials[Socials.Discord].toString(),
        team_wallet: launch_data.keys[CollectionKeys.TeamWallet].toString(),
        token_keypair: null,
        swap_rate: bignum_to_num(launch_data.swap_price) / Math.pow(10, launch_data.token_decimals),
        swap_fee: launch_data.swap_fee,
        mint_prob: mint_prob,
        permanent_delegate: null,
        transfer_hook_program: null,
        nft_images: null,
        nft_metadata: null,
        nft_image_url: launch_data.nft_icon_url,
        nft_metadata_url: launch_data.nft_meta_url,
        nft_name: launch_data.nft_name,
        nft_type: launch_data.nft_type,
        token_mint: launch_data.keys[CollectionKeys.MintAddress],
        token_name: launch_data.token_name,
        token_symbol: launch_data.token_symbol,
        token_image_url: launch_data.token_icon_url,
        token_decimals: launch_data.token_decimals,
        token_extensions: launch_data.token_extensions,
        attributes: [],
        whitelist_key: whitelist_key,
        whitelist_amount: whitelist_amount,
        whitelist_phase_end: new Date(bignum_to_num(whitelist_phase_end)),
        mint_only: mint_only,
        image_payment: false,
        images_uploaded: 0,
        manifest: null,
        metadata_payment: false,
        metadata_uploaded: false,
    };

    return data;
}

export class AssignmentData {
    constructor(
        readonly account_type: number,
        readonly nft_address: PublicKey,
        readonly random_address: PublicKey,
        readonly nft_index: number,
        readonly status: number,
        readonly num_interations: number,
    ) {}

    static readonly struct = new FixableBeetStruct<AssignmentData>(
        [
            ["account_type", u8],
            ["nft_address", publicKey],
            ["random_address", publicKey],
            ["nft_index", u32],
            ["status", u8],
            ["num_interations", u32],
        ],
        (args) =>
            new AssignmentData(
                args.account_type!,
                args.nft_address!,
                args.random_address!,
                args.nft_index!,
                args.status!,
                args.num_interations!,
            ),
        "AssignmentData",
    );
}

export async function request_assignment_data(pubkey: PublicKey): Promise<AssignmentData | null> {
    let account_data = await request_raw_account_data("", pubkey);

    if (account_data === null) {
        return null;
    }

    console.log("assignment", pubkey.toString(), account_data);

    try {
        const [data] = AssignmentData.struct.deserialize(account_data);
        return data;
    } catch (error) {
        console.log("Error deserializing assignment data", error);
        return null;
    }
}

class Attribute {
    constructor(
        readonly name: string,
        readonly min: string,
        readonly max: string,
    ) {}

    static readonly struct = new FixableBeetStruct<Attribute>(
        [
            ["name", utf8String],
            ["min", utf8String],
            ["max", utf8String],
        ],
        (args) => new Attribute(args.name!, args.min!, args.max!),
        "Attribute",
    );
}

class LaunchCollection_Instruction {
    constructor(
        readonly instruction: number,
        readonly collection_type: number,
        readonly collection_name: string,
        readonly collection_symbol: string,
        readonly collection_uri: string,
        readonly collection_icon: string,

        readonly token_name: string,
        readonly token_symbol: string,
        readonly token_icon: string,
        readonly token_decimals: number,
        readonly token_extensions: number,

        readonly nft_uri: string,
        readonly nft_icon: string,
        readonly nft_name: string,
        readonly nft_type: string,

        readonly banner: string,
        readonly collection_size: number,
        readonly swap_price: bignum,
        readonly page_name: string,
        readonly swap_fee: number,
        readonly nft_extensions: number,
        readonly mint_prob: number,
        readonly attributes: Attribute[],
        readonly whitelist_tokens: bignum,
        readonly whitelist_end: bignum,
        readonly mint_only: number,
    ) {}

    static readonly struct = new FixableBeetStruct<LaunchCollection_Instruction>(
        [
            ["instruction", u8],
            ["collection_type", u8],
            ["collection_name", utf8String],
            ["collection_symbol", utf8String],
            ["collection_uri", utf8String],
            ["collection_icon", utf8String],
            ["token_name", utf8String],
            ["token_symbol", utf8String],
            ["token_icon", utf8String],
            ["token_decimals", u8],
            ["token_extensions", u8],
            ["nft_uri", utf8String],
            ["nft_icon", utf8String],
            ["nft_name", utf8String],
            ["nft_type", utf8String],
            ["banner", utf8String],
            ["collection_size", u32],
            ["swap_price", u64],
            ["page_name", utf8String],
            ["swap_fee", u16],
            ["nft_extensions", u8],
            ["mint_prob", u16],
            ["attributes", array(Attribute.struct)],
            ["whitelist_tokens", u64],
            ["whitelist_end", u64],
            ["mint_only", u8],
        ],
        (args) =>
            new LaunchCollection_Instruction(
                args.instruction!,
                args.collection_type!,
                args.collection_name!,
                args.collection_symbol!,
                args.collection_uri!,
                args.collection_icon!,
                args.token_name!,
                args.token_symbol!,
                args.token_icon!,
                args.token_decimals!,
                args.token_extensions!,
                args.nft_uri!,
                args.nft_icon!,
                args.nft_name!,
                args.nft_type!,
                args.banner!,
                args.collection_size!,
                args.swap_price!,
                args.page_name!,
                args.swap_fee!,
                args.nft_extensions!,
                args.mint_prob!,
                args.attributes!,
                args.whitelist_tokens!,
                args.whitelist_end!,
                args.mint_only!,
            ),
        "LaunchCollection_Instruction",
    );
}

class EditCollection_Instruction {
    constructor(
        readonly instruction: number,
        readonly description: string,
        readonly website: string,
        readonly twitter: string,
        readonly telegram: string,
        readonly discord: string,
    ) {}

    static readonly struct = new FixableBeetStruct<EditCollection_Instruction>(
        [
            ["instruction", u8],
            ["description", utf8String],
            ["website", utf8String],
            ["twitter", utf8String],
            ["telegram", utf8String],
            ["discord", utf8String],
        ],
        (args) =>
            new EditCollection_Instruction(
                args.instruction!,
                args.description!,
                args.website!,
                args.twitter!,
                args.telegram!,
                args.discord!,
            ),
        "EditCollection_Instruction",
    );
}

export function serialise_LaunchCollection_instruction(new_launch_data: CollectionDataUserInput): Buffer {
    // console.log(new_launch_data);
    // console.log(new_launch_data.opendate.toString());
    // console.log(new_launch_data.closedate.toString());

    let nft_extensions =
        (Extensions.PermanentDelegate * Number(new_launch_data.permanent_delegate !== null)) |
        (Extensions.TransferHook * Number(new_launch_data.transfer_hook_program !== null));

    let attributes: Attribute[] = [];
    for (let i = 0; i < new_launch_data.attributes.length; i++) {
        let attribute: Attribute = new Attribute(
            new_launch_data.attributes[i].name,
            new_launch_data.attributes[i].min,
            new_launch_data.attributes[i].max,
        );
        attributes.push(attribute);
    }

    console.log(new_launch_data);
    const data = new LaunchCollection_Instruction(
        LaunchInstruction.launch_collection,
        new_launch_data.collection_type,
        new_launch_data.collection_name,
        new_launch_data.collection_symbol,
        new_launch_data.uri,
        new_launch_data.icon_url,
        new_launch_data.token_name,
        new_launch_data.token_symbol,
        new_launch_data.token_image_url,
        new_launch_data.token_decimals,
        new_launch_data.token_extensions,
        new_launch_data.nft_metadata_url,
        new_launch_data.nft_image_url,
        new_launch_data.nft_name,
        new_launch_data.nft_type,
        new_launch_data.banner_url,
        new_launch_data.collection_size,
        new_launch_data.swap_rate * Math.pow(10, new_launch_data.token_decimals),
        new_launch_data.pagename,
        new_launch_data.swap_fee,
        nft_extensions,
        new_launch_data.mint_prob,
        attributes,
        new BN(new_launch_data.whitelist_amount),
        new BN(new_launch_data.whitelist_phase_end.getTime()),
        new_launch_data.mint_only ? 1 : 0,
    );
    const [buf] = LaunchCollection_Instruction.struct.serialize(data);

    return buf;
}

export function serialise_EditCollection_instruction(new_launch_data: CollectionDataUserInput): Buffer {
    const data = new EditCollection_Instruction(
        LaunchInstruction.edit_collection,
        new_launch_data.description,
        new_launch_data.web_url,
        new_launch_data.twt_url,
        new_launch_data.tele_url,
        new_launch_data.disc_url,
    );
    const [buf] = EditCollection_Instruction.struct.serialize(data);

    return buf;
}
