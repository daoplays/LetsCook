import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
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
import { useWallet } from "@solana/wallet-adapter-react";

import { DEBUG, RPC_NODE, PROGRAM } from "./constants";
import { Box } from "@chakra-ui/react";

import BN from "bn.js";
import bs58 from "bs58";

import { WalletDisconnectButton } from "@solana/wallet-adapter-react-ui";

export async function get_JWT_token(): Promise<any | null> {
    const token_url = `/.netlify/functions/jwt`;

    var token_result;
    try {
        token_result = await fetch(token_url).then((res) => res.json());
    } catch (error) {
        console.log(error);
        return null;
    }

    if (DEBUG) console.log(token_result);

    return token_result;
}

export function WalletConnected() {
    return (
        <Box>
            <WalletDisconnectButton className="wallet-disconnect-button" />
        </Box>
    );
}

// Example POST method implementation:
export async function postData(url = "", bearer = "", data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearer}`,
        },
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
}

export function uInt8ToLEBytes(num: number): Buffer {
    const bytes = Buffer.alloc(1);
    bytes.writeUInt8(num);

    return bytes;
}

export function uInt16ToLEBytes(num: number): Buffer {
    const bytes = Buffer.alloc(2);
    bytes.writeUInt16LE(num);

    return bytes;
}

export function uInt32ToLEBytes(num: number): Buffer {
    const bytes = Buffer.alloc(4);
    bytes.writeUInt32LE(num);

    return bytes;
}

interface BasicReply {
    id: number;
    jsonrpc: string;
    result: string;
    error: string;
}

export function check_json(json_response: BasicReply): boolean {
    if (json_response.result === undefined) {
        if (json_response.error !== undefined) {
            console.log(json_response.error);
        }
        return false;
    }

    if (json_response.result === null) return false;

    return true;
}

////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////// Transactions ///////////////////////// /////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

interface BlockHash {
    blockhash: string;
    lastValidBlockHeight: number;
}

export async function get_current_blockhash(bearer: string): Promise<BlockHash> {
    var body = { id: 1, jsonrpc: "2.0", method: "getLatestBlockhash" };
    const blockhash_data_result = await postData(RPC_NODE, bearer, body);

    let blockhash = blockhash_data_result["result"]["value"]["blockhash"];
    let last_valid = blockhash_data_result["result"]["value"]["lastValidBlockHeight"];

    let hash_data: BlockHash = { blockhash: blockhash, lastValidBlockHeight: last_valid };

    return hash_data;
}

interface TransactionResponseData {
    id: number;
    jsonrpc: string;
    result: string;
}

export async function send_transaction(bearer: string, encoded_transaction: string): Promise<TransactionResponseData> {
    var body = { id: 1, jsonrpc: "2.0", method: "sendTransaction", params: [encoded_transaction, { skipPreflight: true }] };

    var response_json = await postData(RPC_NODE, bearer, body);
    let transaction_response: TransactionResponseData = response_json;

    let valid_json = check_json(response_json);

    if (valid_json) return transaction_response;

    transaction_response.result = "INVALID";
    return transaction_response;
}

interface SignatureResponseData {
    id: number;
    jsonrpc: string;
    result: {
        context: {
            apiVersion: string;
            slot: number;
        };
        value: [
            {
                confirmationStatus: string;
                confirmations: number;
                err: string | null;
                slot: number;
            },
        ];
    } | null;
}

export async function check_signature(bearer: string, signature: string): Promise<SignatureResponseData | null> {
    var body = { id: 1, jsonrpc: "2.0", method: "getSignatureStatuses", params: [[signature], { searchTransactionHistory: true }] };

    var response_json = await postData(RPC_NODE, bearer, body);
    let transaction_response: SignatureResponseData = response_json;

    let valid_json = check_json(response_json);

    if (valid_json) return transaction_response;

    return null;
}

interface AccountData {
    id: number;
    jsonrpc: string;
    result: {
        context: {
            apiVersion: string;
            slot: number;
        };
        value: {
            data: [string, string];
            executable: boolean;
            lamports: number;
            owner: string;
        };
    };
    error: string;
}

interface TokenBalanceData {
    id: number;
    jsonrpc: string;
    result: {
        context: {
            apiVersion: string;
            slot: number;
        };
        value: {
            amount: string;
            decimals: number;
            uiAmount: number;
            uiAmountString: string;
        };
    };
    error: string;
}

class InstructionNoArgs {
    constructor(readonly instruction: number) {}

    static readonly struct = new BeetStruct<InstructionNoArgs>(
        [["instruction", u8]],
        (args) => new InstructionNoArgs(args.instruction!),
        "InstructionNoArgs",
    );
}

export async function request_current_balance(bearer: string, pubkey: PublicKey): Promise<number> {
    var body = {
        id: 1,
        jsonrpc: "2.0",
        method: "getAccountInfo",
        params: [pubkey.toString(), { encoding: "base64", commitment: "confirmed" }],
    };

    var account_info_result;
    try {
        account_info_result = await postData(RPC_NODE, bearer, body);
    } catch (error) {
        console.log(error);
        return 0;
    }
    let valid_response = check_json(account_info_result);
    if (!valid_response) {
        console.log(account_info_result);
        return 0;
    }

    if (account_info_result["result"]["value"] == null || account_info_result["result"]["value"]["lamports"] == null) {
        console.log("Error getting lamports for ", pubkey.toString());
        return 0;
    }

    let current_balance: number = account_info_result["result"]["value"]["lamports"] / LAMPORTS_PER_SOL;

    return current_balance;
}
export async function request_token_amount(bearer: string, pubkey: PublicKey): Promise<number> {
    var body = {
        id: 1,
        jsonrpc: "2.0",
        method: "getTokenAccountBalance",
        params: [pubkey.toString(), { encoding: "base64", commitment: "confirmed" }],
    };

    var response;
    try {
        response = await postData(RPC_NODE, bearer, body);
    } catch (error) {
        console.log(error);
        return 0;
    }
    //console.log("TS result: ", response)

    let valid_response = check_json(response);

    //console.log("valid ", valid_response);
    if (!valid_response) {
        return 0;
    }

    let token_amount;
    try {
        let parsed_response: TokenBalanceData = response;

        //console.log("parsed", parsed_account_data);

        token_amount = parseInt(parsed_response.result.value.amount);
    } catch (error) {
        console.log(error);
        return 0;
    }

    return token_amount;
}

export async function request_raw_account_data(bearer: string, pubkey: PublicKey): Promise<Buffer | null> {
    var body = {
        id: 1,
        jsonrpc: "2.0",
        method: "getAccountInfo",
        params: [pubkey.toString(), { encoding: "base64", commitment: "confirmed" }],
    };

    var response;
    try {
        response = await postData(RPC_NODE, bearer, body);
    } catch (error) {
        console.log(error);
        return null;
    }
    //console.log("TS result: ", response)

    let valid_response = check_json(response);

    //console.log("valid ", valid_response);
    if (!valid_response) {
        return null;
    }

    let account_data;
    try {
        let parsed_account_data: AccountData = response;

        if (parsed_account_data.result.value === null) {
            return null;
        }

        let account_encoded_data = parsed_account_data.result.value.data;
        account_data = Buffer.from(account_encoded_data[0], "base64");
    } catch (error) {
        console.log(error);
        return null;
    }

    return account_data;
}

export function serialise_basic_instruction(instruction: number): Buffer {
    const data = new InstructionNoArgs(instruction);
    const [buf] = InstructionNoArgs.struct.serialize(data);

    return buf;
}

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////// LetsCook Instructions and MetaData /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

export const enum LaunchInstruction {
    init = 0,
    create_game = 1,
    buy_tickets = 2,
    claim_reward = 3,
    init_market = 4,
    init_amm = 5,
    hype_vote = 6,
    claim_refund = 7,
    edit_launch = 8,
    claim_tokens = 9,
}

export interface LaunchDataUserInput {
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
    distribution: number[];
    launch_date: Date;
    uri: string;
    pagename: string;
    description: string;
    web_url: string;
    tele_url: string;
    twt_url: string;
    disc_url: string;
    displayImg: string;
    opendate: Date;
    opentime: string;
    closedate: Date;
    closetime: string;
    opendateLP: Date;
    opentimeLP: string;
    team_wallet: string;
}

export const defaultUserInput: LaunchDataUserInput = {
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
    distribution: [0, 0, 0, 0, 0, 0],
    launch_date: new Date(new Date().setHours(0, 0, 0, 0)),
    uri: "",
    pagename: "",
    description: "",
    web_url: "",
    tele_url: "",
    twt_url: "",
    disc_url: "",
    opendate: new Date(new Date().setHours(0, 0, 0, 0)),
    opentime: "",
    closedate: new Date(new Date().setHours(0, 0, 0, 0)),
    closetime: "",
    opendateLP: new Date(new Date().setHours(0, 0, 0, 0)),
    opentimeLP: "",
    team_wallet: "",
};

export class myU64 {
    constructor(readonly value: bignum) {}

    static readonly struct = new BeetStruct<myU64>([["value", u64]], (args) => new myU64(args.value!), "myU64");
}

export class LaunchData {
    constructor(
        readonly account_type: number,
        readonly game_id: bignum,
        readonly last_interaction: bignum,
        readonly num_interactions: number,
        readonly seller: PublicKey,
        readonly status: number,
        readonly name: string,
        readonly symbol: string,
        readonly icon: string,
        readonly total_supply: bignum,
        readonly decimals: number,
        readonly num_mints: bignum,
        readonly ticket_price: bignum,
        readonly minimum_liquidity: bignum,
        readonly distribution: number[],
        readonly page_name: string,
        readonly description: string,
        readonly launch_date: bignum,
        readonly end_date: bignum,
        readonly banner: string,
        readonly website: string,
        readonly twitter: string,
        readonly telegram: string,
        readonly team_wallet: PublicKey,
        readonly mint_address: PublicKey,
        readonly sol_address: PublicKey,
        readonly tickets_sold: number,
        readonly tickets_claimed: number,
        readonly mints_won: number,
        readonly positive_votes: number,
        readonly negative_votes: number,
    ) {}

    static readonly struct = new FixableBeetStruct<LaunchData>(
        [
            ["account_type", u8],
            ["game_id", u64],
            ["last_interaction", i64],
            ["num_interactions", u16],
            ["seller", publicKey],
            ["status", u8],
            ["name", utf8String],
            ["symbol", utf8String],
            ["icon", utf8String],
            ["total_supply", u64],
            ["decimals", u8],
            ["num_mints", u32],
            ["ticket_price", u64],
            ["minimum_liquidity", u64],
            ["distribution", uniformFixedSizeArray(u8, 6)],
            ["page_name", utf8String],
            ["description", utf8String],
            ["launch_date", u64],
            ["end_date", u64],
            ["banner", utf8String],
            ["website", utf8String],
            ["twitter", utf8String],
            ["telegram", utf8String],
            ["team_wallet", publicKey],
            ["mint_address", publicKey],
            ["sol_address", publicKey],
            ["tickets_sold", u32],
            ["tickets_claimed", u32],
            ["mints_won", u32],
            ["positive_votes", u32],
            ["negative_votes", u32],
        ],
        (args) =>
            new LaunchData(
                args.account_type!,
                args.game_id!,
                args.last_interaction!,
                args.num_interactions!,
                args.seller!,
                args.status!,
                args.name!,
                args.symbol!,
                args.icon!,
                args.total_supply!,
                args.decimals!,
                args.num_mints!,
                args.ticket_price!,
                args.minimum_liquidity!,
                args.distribution!,
                args.page_name!,
                args.description!,
                args.launch_date!,
                args.end_date!,
                args.banner!,
                args.website!,
                args.twitter!,
                args.telegram!,
                args.team_wallet!,
                args.mint_address!,
                args.sol_address!,
                args.tickets_sold!,
                args.tickets_claimed!,
                args.mints_won!,
                args.positive_votes!,
                args.negative_votes!,
            ),
        "LaunchData",
    );
}

export class JoinData {
    constructor(
        readonly account_type: number,
        readonly joiner_key: PublicKey,
        readonly sol_key: PublicKey,
        readonly game_id: bignum,
        readonly num_tickets: number,
        readonly num_claimed_tickets: number,
        readonly num_winning_tickets: number,
        readonly ticket_status: number,
    ) {}

    static readonly struct = new BeetStruct<JoinData>(
        [
            ["account_type", u8],
            ["joiner_key", publicKey],
            ["sol_key", publicKey],
            ["game_id", u64],
            ["num_tickets", u16],
            ["num_claimed_tickets", u16],
            ["num_winning_tickets", u16],
            ["ticket_status", u8],
        ],
        (args) =>
            new JoinData(
                args.account_type!,
                args.joiner_key!,
                args.sol_key!,
                args.game_id!,
                args.num_tickets!,
                args.num_claimed_tickets!,
                args.num_winning_tickets!,
                args.ticket_status!,
            ),
        "JoinData",
    );
}

export class UserData {
    constructor(
        readonly account_type: number,
        readonly user_key: PublicKey,
        readonly total_points: number,
        readonly votes: number[],
    ) {}

    static readonly struct = new FixableBeetStruct<UserData>(
        [
            ["account_type", u8],
            ["user_key", publicKey],
            ["total_points", u32],
            ["votes", array(u64)],
        ],
        (args) => new UserData(args.account_type!, args.user_key!, args.total_points!, args.votes!),
        "UserData",
    );
}

export async function request_launch_data(bearer: string, pubkey: PublicKey): Promise<LaunchData | null> {
    let account_data = await request_raw_account_data(bearer, pubkey);

    if (account_data === null) {
        return null;
    }

    const [data] = LaunchData.struct.deserialize(account_data);

    return data;
}

export async function RunLaunchDataGPA(bearer: string): Promise<LaunchData[]> {
    let index_buffer = uInt8ToLEBytes(0);
    let account_bytes = bs58.encode(index_buffer);

    var body = {
        id: 1,
        jsonrpc: "2.0",
        method: "getProgramAccounts",
        params: [
            PROGRAM.toString(),
            { filters: [{ memcmp: { offset: 0, bytes: account_bytes } }], encoding: "base64", commitment: "confirmed" },
        ],
    };

    var program_accounts_result;
    try {
        program_accounts_result = await postData(RPC_NODE, bearer, body);
    } catch (error) {
        console.log(error);
        return [];
    }

    //console.log(program_accounts_result["result"]);

    let result: LaunchData[] = [];
    for (let i = 0; i < program_accounts_result["result"]?.length; i++) {
        //console.log(program_accounts_result["result"][i]);
        let encoded_data = program_accounts_result["result"][i]["account"]["data"][0];
        let decoded_data = Buffer.from(encoded_data, "base64");
        try {
            const [game] = LaunchData.struct.deserialize(decoded_data);
            result.push(game);
        } catch (error) {
            console.log(error);
        }
    }

    return result;
}

export async function RunUserDataGPA(bearer: string): Promise<UserData[]> {
    let index_buffer = uInt8ToLEBytes(2);
    let account_bytes = bs58.encode(index_buffer);

    var body = {
        id: 1,
        jsonrpc: "2.0",
        method: "getProgramAccounts",
        params: [
            PROGRAM.toString(),
            { filters: [{ memcmp: { offset: 0, bytes: account_bytes } }], encoding: "base64", commitment: "confirmed" },
        ],
    };

    var program_accounts_result;
    try {
        program_accounts_result = await postData(RPC_NODE, bearer, body);
    } catch (error) {
        console.log(error);
        return [];
    }

    // console.log(program_accounts_result["result"]);

    let result: UserData[] = [];
    for (let i = 0; i < program_accounts_result["result"]?.length; i++) {
        // console.log(program_accounts_result["result"][i]);
        let encoded_data = program_accounts_result["result"][i]["account"]["data"][0];
        let decoded_data = Buffer.from(encoded_data, "base64");
        try {
            const [game] = UserData.struct.deserialize(decoded_data);
            result.push(game);
        } catch (error) {
            console.log(error);
        }
    }

    return result;
}

export async function RunJoinDataGPA(): Promise<JoinData[]> {
    const wallet = useWallet();
    let index_buffer = uInt8ToLEBytes(3);
    let account_bytes = bs58.encode(index_buffer);
    let wallet_bytes = PublicKey.default.toBase58();

    console.log("wallet", wallet !== null ? wallet.toString() : "null");
    if (wallet !== null) {
        wallet_bytes = wallet.publicKey.toBase58();
    }

    var body = {
        id: 1,
        jsonrpc: "2.0",
        method: "getProgramAccounts",
        params: [
            PROGRAM.toString(),
            {
                filters: [{ memcmp: { offset: 0, bytes: account_bytes } }, { memcmp: { offset: 1, bytes: wallet_bytes } }],
                encoding: "base64",
                commitment: "confirmed",
            },
        ],
    };

    var program_accounts_result;
    try {
        program_accounts_result = await postData(RPC_NODE, "", body);
    } catch (error) {
        console.log(error);
        return [];
    }

    //console.log(program_accounts_result["result"]);

    let result: JoinData[] = [];
    for (let i = 0; i < program_accounts_result["result"]?.length; i++) {
        //console.log(program_accounts_result["result"][i]);
        let encoded_data = program_accounts_result["result"][i]["account"]["data"][0];
        let decoded_data = Buffer.from(encoded_data, "base64");
        try {
            const [joiner] = JoinData.struct.deserialize(decoded_data);
            result.push(joiner);
        } catch (error) {
            console.log(error);
        }
    }

    return result;
}

class CreateLaunch_Instruction {
    constructor(
        readonly instruction: number,
        readonly name: string,
        readonly symbol: string,
        readonly uri: string,
        readonly icon: string,
        readonly total_supply: bignum,
        readonly decimals: number,
        readonly launch_date: bignum,
        readonly close_date: bignum,
        readonly distribution: number[],
        readonly num_mints: number,
        readonly ticket_price: bignum,
        readonly page_name: string,
        readonly website: string,
        readonly twitter: string,
        readonly telegram: string,
    ) {}

    static readonly struct = new FixableBeetStruct<CreateLaunch_Instruction>(
        [
            ["instruction", u8],
            ["name", utf8String],
            ["symbol", utf8String],
            ["uri", utf8String],
            ["icon", utf8String],
            ["total_supply", u64],
            ["decimals", u8],
            ["launch_date", u64],
            ["close_date", u64],
            ["distribution", uniformFixedSizeArray(u8, 6)],
            ["num_mints", u32],
            ["ticket_price", u64],
            ["page_name", utf8String],
            ["website", utf8String],
            ["twitter", utf8String],
            ["telegram", utf8String],
        ],
        (args) =>
            new CreateLaunch_Instruction(
                args.instruction!,
                args.name!,
                args.symbol!,
                args.uri!,
                args.icon!,
                args.total_supply!,
                args.decimals!,
                args.launch_date!,
                args.close_date!,
                args.distribution!,
                args.num_mints!,
                args.ticket_price!,
                args.page_name!,
                args.website!,
                args.twitter!,
                args.telegram!,
            ),
        "CreateLaunch_Instruction",
    );
}

export function serialise_CreateLaunch_instruction(new_launch_data: LaunchDataUserInput): Buffer {
    console.log(new_launch_data);
    console.log(new_launch_data.opendate.toString());
    console.log(new_launch_data.closedate.toString());

    const data = new CreateLaunch_Instruction(
        LaunchInstruction.create_game,
        new_launch_data.name,
        new_launch_data.symbol,
        new_launch_data.uri,
        new_launch_data.icon_url,
        new_launch_data.total_supply,
        new_launch_data.decimals,
        new_launch_data.opendate.getTime(),
        new_launch_data.closedate.getTime(),
        new_launch_data.distribution,
        new_launch_data.num_mints,
        new_launch_data.ticket_price * LAMPORTS_PER_SOL,
        new_launch_data.pagename,
        new_launch_data.web_url,
        new_launch_data.twt_url,
        new_launch_data.tele_url,
    );
    const [buf] = CreateLaunch_Instruction.struct.serialize(data);

    return buf;
}

class EditLaunch_Instruction {
    constructor(
        readonly instruction: number,
        readonly description: string,
    ) {}

    static readonly struct = new FixableBeetStruct<EditLaunch_Instruction>(
        [
            ["instruction", u8],
            ["description", utf8String],
        ],
        (args) => new EditLaunch_Instruction(args.instruction!, args.description!),
        "EditLaunch_Instruction",
    );
}

export function serialise_EditLaunch_instruction(new_launch_data: LaunchDataUserInput): Buffer {
    const data = new EditLaunch_Instruction(LaunchInstruction.edit_launch, new_launch_data.description);
    const [buf] = EditLaunch_Instruction.struct.serialize(data);

    return buf;
}

class HypeVote_Instruction {
    constructor(
        readonly instruction: number,
        readonly game_id: bignum,
        readonly vote: number,
    ) {}

    static readonly struct = new BeetStruct<HypeVote_Instruction>(
        [
            ["instruction", u8],
            ["game_id", u64],
            ["vote", u8],
        ],
        (args) => new HypeVote_Instruction(args.instruction!, args.game_id!, args.vote!),
        "HypeVote_Instruction",
    );
}

export function serialise_HypeVote_instruction(game_id: bignum, vote: number): Buffer {
    const data = new HypeVote_Instruction(LaunchInstruction.hype_vote, game_id, vote);
    const [buf] = HypeVote_Instruction.struct.serialize(data);

    return buf;
}

class BuyTickets_Instruction {
    constructor(
        readonly instruction: number,
        readonly num_tickets: number,
    ) {}

    static readonly struct = new BeetStruct<BuyTickets_Instruction>(
        [
            ["instruction", u8],
            ["num_tickets", u16],
        ],
        (args) => new BuyTickets_Instruction(args.instruction!, args.num_tickets!),
        "BuyTickets_Instruction",
    );
}

export function serialise_BuyTickets_instruction(num_tickets: number): Buffer {
    const data = new BuyTickets_Instruction(LaunchInstruction.buy_tickets, num_tickets);
    const [buf] = BuyTickets_Instruction.struct.serialize(data);

    return buf;
}

class InitMarket_Instruction {
    constructor(
        readonly instruction: number,
        readonly vaultSignerNonce: bignum,
    ) {}

    static readonly struct = new FixableBeetStruct<InitMarket_Instruction>(
        [
            ["instruction", u8],
            ["vaultSignerNonce", u64],
        ],
        (args) => new InitMarket_Instruction(args.instruction, args.vaultSignerNonce!),
        "InitMarket_Instruction",
    );
}

export function serialise_InitMarket_Instruction(vaultSignerNonce: bignum): Buffer {
    const data = new InitMarket_Instruction(LaunchInstruction.init_market, vaultSignerNonce);
    const [buf] = InitMarket_Instruction.struct.serialize(data);

    return buf;
}

export function bignum_to_num(bn: bignum): number {
    let value = new BN(bn).toNumber();

    return value;
}

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////// Raydium Instructions and MetaData //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

class RaydiumInitMarket_Instruction {
    constructor(
        readonly version: number,
        readonly instruction: number,
        readonly baseLotSize: bignum,
        readonly quoteLotSize: bignum,
        readonly feeRateBps: number,
        readonly vaultSignerNonce: bignum,
        readonly quoteDustThreshold: bignum,
    ) {}

    static readonly struct = new BeetStruct<RaydiumInitMarket_Instruction>(
        [
            ["version", u8],
            ["instruction", u32],
            ["baseLotSize", u64],
            ["quoteLotSize", u64],
            ["feeRateBps", u16],
            ["vaultSignerNonce", u64],
            ["quoteDustThreshold", u64],
        ],
        (args) =>
            new RaydiumInitMarket_Instruction(
                args.version!,
                args.instruction!,
                args.baseLotSize!,
                args.quoteLotSize!,
                args.feeRateBps!,
                args.vaultSignerNonce!,
                args.quoteDustThreshold!,
            ),
        "RaydiumInitMarket_Instruction",
    );
}

export function serialise_RaydiumInitMarket_Instruction(
    version: number,
    instruction: number,
    baseLotSize: bignum,
    quoteLotSize: bignum,
    feeRateBps: number,
    vaultSignerNonce: bignum,
    quoteDustThreshold: bignum,
): Buffer {
    const data = new RaydiumInitMarket_Instruction(
        version,
        instruction,
        baseLotSize,
        quoteLotSize,
        feeRateBps,
        vaultSignerNonce,
        quoteDustThreshold,
    );
    const [buf] = RaydiumInitMarket_Instruction.struct.serialize(data);

    return buf;
}

class RaydiumCreatePool_Instruction {
    constructor(
        readonly instruction: number,
        readonly nonce: number,
        readonly openTime: bignum,
        readonly pcAmount: bignum,
        readonly coinAmount: bignum,
    ) {}

    static readonly struct = new BeetStruct<RaydiumCreatePool_Instruction>(
        [
            ["instruction", u8],
            ["nonce", u8],
            ["openTime", u64],
            ["pcAmount", u64],
            ["coinAmount", u64],
        ],
        (args) => new RaydiumCreatePool_Instruction(args.instruction!, args.nonce!, args.openTime!, args.pcAmount!, args.coinAmount!),
        "RaydiumCreatePool_Instruction",
    );
}

export function serialise_RaydiumCreatePool_Instruction(nonce: number, openTime: bignum, pcAmount: bignum, coinAmount: bignum): Buffer {
    const data = new RaydiumCreatePool_Instruction(1, nonce, openTime, pcAmount, coinAmount);
    const [buf] = RaydiumCreatePool_Instruction.struct.serialize(data);

    return buf;
}

export class MarketStateLayoutV2 {
    constructor(
        readonly header: number[],
        readonly accountFlags: bignum,
        readonly ownAddress: PublicKey,
        readonly vaultSignerNonce: bignum,
        readonly baseMint: PublicKey,
        readonly quoteMint: PublicKey,
        readonly baseVault: PublicKey,
        readonly baseDepositsTotal: bignum,
        readonly baseFeesAccrued: bignum,
        readonly quoteVault: PublicKey,
        readonly quoteDepositsTotal: bignum,
        readonly quoteFeesAccrued: bignum,
        readonly quoteDustThreshold: bignum,
        readonly requestQueue: PublicKey,
        readonly eventQueue: PublicKey,
        readonly bids: PublicKey,
        readonly asks: PublicKey,
        readonly baseLotSize: bignum,
        readonly quoteLotSize: bignum,
        readonly feeRateBps: bignum,
        readonly referrerRebatesAccrued: bignum,
        readonly footer: number[],
    ) {}

    static readonly struct = new BeetStruct<MarketStateLayoutV2>(
        [
            ["header", uniformFixedSizeArray(u8, 5)],
            ["accountFlags", u64],
            ["ownAddress", publicKey],
            ["vaultSignerNonce", u64],
            ["baseMint", publicKey],
            ["quoteMint", publicKey],
            ["baseVault", publicKey],
            ["baseDepositsTotal", u64],
            ["baseFeesAccrued", u64],
            ["quoteVault", publicKey],
            ["quoteDepositsTotal", u64],
            ["quoteFeesAccrued", u64],
            ["quoteDustThreshold", u64],
            ["requestQueue", publicKey],
            ["eventQueue", publicKey],
            ["bids", publicKey],
            ["asks", publicKey],
            ["baseLotSize", u64],
            ["quoteLotSize", u64],
            ["feeRateBps", u64],
            ["referrerRebatesAccrued", u64],
            ["footer", uniformFixedSizeArray(u8, 7)],
        ],
        (args) =>
            new MarketStateLayoutV2(
                args.header!,
                args.accountFlags!,
                args.ownAddress!,
                args.vaultSignerNonce!,
                args.baseMint!,
                args.quoteMint!,
                args.baseVault!,
                args.baseDepositsTotal!,
                args.baseFeesAccrued!,
                args.quoteVault!,
                args.quoteDepositsTotal!,
                args.quoteFeesAccrued!,
                args.quoteDustThreshold!,
                args.requestQueue!,
                args.eventQueue!,
                args.bids!,
                args.asks!,
                args.baseLotSize!,
                args.quoteLotSize!,
                args.feeRateBps!,
                args.referrerRebatesAccrued!,
                args.footer!,
            ),
        "MarketStateLayoutV2",
    );
}
