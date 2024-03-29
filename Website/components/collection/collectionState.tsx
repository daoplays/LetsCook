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
    token_mint : null
};