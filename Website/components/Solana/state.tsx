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
} from "@metaplex-foundation/beet";
import { publicKey } from "@metaplex-foundation/beet-solana";

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
async function postData(url = "", bearer = "", data = {}) {
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

        //console.log("parsed", parsed_account_data);

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

const enum LaunchInstruction {
    init = 0,
    create_game = 1,
    join_game = 2,
    cancel_game = 3,
    take_move = 4,
    reveal_move = 5,
    claim_reward = 6,
    forfeit = 7,
}

export interface LaunchDataUserInput {
    name: string;
    symbol: string;
    icon: string;
    total_supply : number,
    decimals : number,
    num_mints : number,
    minimum_liquidity: number,
    ticket_price : number,
    distribution : number[],
    launch_date: number;
    uri: string;
    pagename: string,
    iconpage2: string,
    description : string,
    web_url : string,
    tele_url : string,
    twt_url: string,
    disc_url : string,
    displayImg:string,
    opendate: string,
    opentime: string,
    closedate : string,
    closetime : string,
    opendateLP : string,
    opentimeLP: string,
    team_wallet : string,
}

export const defaultUserInput: LaunchDataUserInput = {
    name: "",
    symbol: "",
    icon: "",
    displayImg:null,
    total_supply : 0,
    decimals : 0,
    num_mints : 0,
    minimum_liquidity: 0,
    ticket_price : 0,
    distribution : [0,0,0,0,0,0],
    launch_date: (new Date()).getTime() / 1000,
    uri: "",
    pagename: "",
    iconpage2: "",
    description : '',
    web_url : "",
    tele_url : "",
    twt_url: "",
    disc_url : '',
    opendate: "",
    opentime: "",
    closedate : "",
    closetime : "",
    opendateLP : "",
    opentimeLP: "",
    team_wallet : "",
};






export class LaunchData {
    constructor(
        readonly account_type: number,
        readonly game_id: bignum,
        readonly last_interaction: bignum,
        readonly num_interactions: number,
        readonly seller: PublicKey,
        readonly status: number,
        readonly name: String,
        readonly symbol: String,
        readonly icon: String,
        readonly total_supply: bignum,
        readonly decimals: number,
        readonly num_mints: bignum,
        readonly ticket_price: bignum,
        readonly minimum_liquidity: bignum,
        readonly distribution: number[],
        readonly page_name: String,
        readonly description: String,
        readonly launch_date: bignum,
        readonly end_date: bignum,
        readonly banner: String,
        readonly website: String,
        readonly twitter: String,
        readonly telegram: String,
        readonly team_wallet: PublicKey,
        readonly mint_address: PublicKey,
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
            ["num_mints", u64],
            ["ticket_price", u64],
            ["minimum_liquidity", u64],
            ["distribution", uniformFixedSizeArray(u8, 6)],
            ["page_name", utf8String],
            ["description", utf8String],
            ["launch_date", u64],
            ["end_date", utf8String],
            ["banner", utf8String],
            ["website", utf8String],
            ["twitter", utf8String],
            ["telegram", utf8String],
            ["team_wallet", publicKey],
            ["mint_address", publicKey],
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
            ),
        "LaunchData",
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

export async function run_launch_data_GPA(bearer: string): Promise<LaunchData[]> {
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

    console.log(program_accounts_result["result"]);

    let result: LaunchData[] = [];
    for (let i = 0; i < program_accounts_result["result"]?.length; i++) {
        console.log(program_accounts_result["result"][i]);
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

class CreateLaunch_Instruction {
    constructor(
        readonly instruction: number,
        readonly name: String,
        readonly symbol: String,
        readonly uri: String,
        readonly launch_date: number,
    ) {}

    static readonly struct = new FixableBeetStruct<CreateLaunch_Instruction>(
        [
            ["instruction", u8],
            ["name", utf8String],
            ["symbol", utf8String],
            ["uri", utf8String],
            ["launch_date", u64],
        ],
        (args) => new CreateLaunch_Instruction(args.instruction!, args.name!, args.symbol!, args.uri!, args.launch_date!),
        "CreateLaunch_Instruction",
    );
}

export function serialise_CreateLaunch_instruction(new_launch_data: LaunchDataUserInput): Buffer {
    console.log(new_launch_data);
    const data = new CreateLaunch_Instruction(
        LaunchInstruction.create_game,
        new_launch_data.name,
        new_launch_data.symbol,
        new_launch_data.uri,
        new_launch_data.launch_date,
    );
    const [buf] = CreateLaunch_Instruction.struct.serialize(data);

    return buf;
}

export function bignum_to_num(bn: bignum): number {
    let value = new BN(bn).toNumber();

    return value;
}




////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////// Raydium Instructions and MetaData //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////


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

export function serialise_RaydiumCreatePool_Instruction(nonce : number, openTime : bignum, pcAmount: bignum, coinAmount : bignum): Buffer {

    const data = new RaydiumCreatePool_Instruction(
        1,
        nonce,
        openTime,
        pcAmount,
        coinAmount,
    );
    const [buf] = RaydiumCreatePool_Instruction.struct.serialize(data);

    return buf;
}