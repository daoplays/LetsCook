import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { FixableBeetStruct, BeetStruct, uniformFixedSizeArray, u8, u16, u32, u64, i64, bignum, utf8String } from '@metaplex-foundation/beet'
import { publicKey } from '@metaplex-foundation/beet-solana';

import { DEBUG, RPC_NODE, PROGRAM} from './constants';
import {
    Box,
} from '@chakra-ui/react';

import BN from 'bn.js'

import {
    WalletDisconnectButton,
} from '@solana/wallet-adapter-react-ui';

export async function get_JWT_token() : Promise<any | null>
{
   
    const token_url = `/.netlify/functions/jwt`;

    var token_result;
    try {
        token_result = await fetch(token_url).then((res) => res.json());
    }
    catch(error) {
        console.log(error);
        return null;
    }

    if (DEBUG)
        console.log(token_result);


    return token_result
}


export function WalletConnected() 
{
    return (
        <Box>
            <WalletDisconnectButton  
                className="wallet-disconnect-button"  
            />
        </Box>
    );
}

// Example POST method implementation:
async function postData(url = "", bearer = "", data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      headers: {
        'Accept': 'application/json', 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bearer}`
      },
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
}


export function uInt16ToLEBytes(num : number) : Buffer {

    const bytes = Buffer.alloc(2);
    bytes.writeUInt16LE(num);
   
    return bytes
 }

 export function uInt32ToLEBytes(num : number) : Buffer {

    const bytes = Buffer.alloc(4);
    bytes.writeUInt32LE(num);
   
    return bytes
 }

interface BasicReply {
    id : number;
    jsonrpc : string;
    result: string;
    error: string;
}

export function check_json(json_response : BasicReply) : boolean 
{

    if (json_response.result === undefined) {
        if (json_response.error !== undefined) {
            console.log(json_response.error)
            
        }
        return  false;
    }

    if (json_response.result === null)
        return false;

    return true;
}

////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////// Transactions ///////////////////////// /////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////



interface BlockHash {
   blockhash : string;
   lastValidBlockHeight : number;
}

export async function get_current_blockhash(bearer : string) : Promise<BlockHash>
{
    var body = {"id": 1, "jsonrpc": "2.0", "method": "getLatestBlockhash"};
    const blockhash_data_result = await postData(RPC_NODE, bearer, body);

    
    let blockhash = blockhash_data_result["result"]["value"]["blockhash"];
    let last_valid = blockhash_data_result["result"]["value"]["lastValidBlockHeight"];

    let hash_data : BlockHash = { blockhash: blockhash, lastValidBlockHeight: last_valid};

    return hash_data;

}

interface TransactionResponseData {
    id : number;
    jsonrpc : string;
    result : string;
}


export async function send_transaction(bearer : string, encoded_transaction : string) : Promise <TransactionResponseData>
{
    var body = {"id": 1, "jsonrpc": "2.0", "method": "sendTransaction", "params": [encoded_transaction, {"skipPreflight": true}]};
   
    var response_json = await postData(RPC_NODE, bearer, body);
    let transaction_response : TransactionResponseData = response_json;

    let valid_json = check_json(response_json);

    if (valid_json)
        return transaction_response;

    transaction_response.result = "INVALID"
    return transaction_response;

    
}

interface SignatureResponseData {
    id : number;
    jsonrpc : string;
    result: {
        context: {
            apiVersion : string;
            slot : number;
        };
        value : [{
            confirmationStatus : string;
            confirmations : number;
            err : string | null;
            slot : number;
        }];
    } | null;
}


export async function check_signature(bearer : string, signature : string) : Promise <SignatureResponseData | null>
{

    var body = {"id": 1, "jsonrpc": "2.0", "method": "getSignatureStatuses", "params": [[signature],{"searchTransactionHistory": true}]};
   
    var response_json = await postData(RPC_NODE, bearer, body);
    let transaction_response : SignatureResponseData = response_json;

    let valid_json = check_json(response_json);

    if (valid_json)
        return transaction_response;

    
    return null;

    
}


interface AccountData {
    id : number;
    jsonrpc : string;
    result: {
        context: {
            apiVersion : string;
            slot : number;
        };
        value : {
            data : [string, string];
            executable : boolean;
            lamports : number;
            owner : string;
        };
    };
    error: string;
}

interface TokenBalanceData {
    id : number;
    jsonrpc : string;
    result: {
        context: {
            apiVersion : string;
            slot : number;
        };
        value : {
            amount : string;
            decimals : number;
            uiAmount : number;
            uiAmountString : string;
        };
    };
    error: string;
}




class InstructionNoArgs {
    constructor(
      readonly instruction: number
    ) {}
  
    static readonly struct = new BeetStruct<InstructionNoArgs>(
      [
        ['instruction', u8]
      ],
      (args) => new InstructionNoArgs(args.instruction!),
      'InstructionNoArgs'
    )
}

export async function request_current_balance(bearer : string, pubkey : PublicKey) : Promise<number>
{

    var body = {"id": 1, "jsonrpc": "2.0", "method": "getAccountInfo", "params": [pubkey.toString(), {"encoding": "base64", "commitment": "confirmed"}]};

    var account_info_result;
    try {
        account_info_result = await postData(RPC_NODE, bearer, body);
    }
    catch(error) {
        console.log(error);
        return 0;
    }
    let valid_response = check_json(account_info_result)
    if (!valid_response) {
        console.log(account_info_result);
        return 0;
    }

    if (account_info_result["result"]["value"] == null || account_info_result["result"]["value"]["lamports"] == null) {
        console.log("Error getting lamports for ", pubkey.toString());
        return 0;
    }

    let current_balance : number = account_info_result["result"]["value"]["lamports"] / LAMPORTS_PER_SOL;

    return current_balance;

}
export async function request_token_amount(bearer : string, pubkey : PublicKey) : Promise<number>
{
    var body = {"id": 1, "jsonrpc": "2.0", "method": "getTokenAccountBalance", "params": [pubkey.toString(), {"encoding": "base64", "commitment": "confirmed"}]};

    var response;
    try {
        response  = await postData(RPC_NODE, bearer, body);
    }
    catch(error) {
        console.log(error);
        return 0;
    }
    //console.log("TS result: ", response)

    let valid_response = check_json(response)

    //console.log("valid ", valid_response);
    if (!valid_response) {
        return  0;
    }

    let token_amount;
    try {
        let parsed_response : TokenBalanceData = response;

        //console.log("parsed", parsed_account_data);

        token_amount = parseInt(parsed_response.result.value.amount);
    }
    catch (error) {
        console.log(error);
        return 0;
    }

    return token_amount;
}





export async function request_raw_account_data(bearer : string, pubkey : PublicKey) : Promise<Buffer | null>
{
    var body = {"id": 1, "jsonrpc": "2.0", "method": "getAccountInfo", "params": [pubkey.toString(), {"encoding": "base64", "commitment": "confirmed"}]};

    var response;
    try {
        response = await postData(RPC_NODE, bearer, body);
    }
    catch(error) {
        console.log(error);
        return null;
    }
    //console.log("TS result: ", response)

    let valid_response = check_json(response)

    //console.log("valid ", valid_response);
    if (!valid_response) {
        return  null;
    }

    let account_data;
    try {
        let parsed_account_data : AccountData = response;

        //console.log("parsed", parsed_account_data);

        let account_encoded_data = parsed_account_data.result.value.data;
        account_data = Buffer.from(account_encoded_data[0], "base64");
    }
    catch (error) {
        console.log(error);
        return null;
    }

    return account_data;
}



export function serialise_basic_instruction(instruction : number) : Buffer
{

    const data = new InstructionNoArgs(instruction);
    const [buf] = InstructionNoArgs.struct.serialize(data);

    return buf;
}


////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////// LetsCook Instructions and MetaData /////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

export class LaunchData {
    constructor(
        readonly account_type: number,
        readonly game_id: bignum,
        readonly last_interaction: bignum,
        readonly num_interactions: number,   
        readonly launch_date: number,
        readonly seller: PublicKey,
        readonly status: number,
        readonly name: String,
        readonly description: String
    ) {}
  
    static readonly struct = new FixableBeetStruct<LaunchData>(
      [
        ['account_type', u8],
        ['game_id', u64],
        ['last_interaction', i64],
        ['num_interactions', u16],
        ['launch_date', u16],
        ['seller', publicKey],
        ['status', u8],
        ['name', utf8String],
        ['description', utf8String]
      ],
      (args) => new LaunchData(args.account_type!, args.game_id!, args.last_interaction!, args.num_interactions!, args.launch_date!, args.seller!, args.status!, args.name!, args.description!),
      'LaunchData'
    )
}

export async function request_launch_data(bearer : string, pubkey : PublicKey) : Promise<LaunchData | null>
{
 
    let account_data = await request_raw_account_data(bearer, pubkey);

    if (account_data === null) {
        return null;
    }

    const [data] = LaunchData.struct.deserialize(account_data);

    return data;
}

export async function run_launch_data_GPA(bearer : string) : Promise<LaunchData[]>
{

    var body = {"id": 1, "jsonrpc": "2.0", "method": "getProgramAccounts", "params": [PROGRAM.toString(), {"filters": [{ memcmp: { offset: 0, bytes: 0}}], "encoding": "base64", "commitment": "confirmed"}]};

    var program_accounts_result;
    try {
        program_accounts_result = await postData(RPC_NODE, bearer, body);
    }
    catch(error) {
        console.log(error);
        return [];
    }

    console.log(program_accounts_result["result"]);

    let result : LaunchData[] = [];
    for (let i = 0; i < program_accounts_result["result"]?.length; i++) {
        console.log(program_accounts_result["result"][i]);
        let encoded_data = program_accounts_result["result"][i]["account"]["data"][0];
        let decoded_data = Buffer.from(encoded_data, "base64");
        const [game] = LaunchData.struct.deserialize(decoded_data);
        result.push(game);
    }

    return result;
}

class CreateLaunch_Instruction {
    constructor(
        readonly instruction: number,
        readonly name: String,
        readonly symbol: String,
        readonly uri: String,
        readonly launch_date: number
    ) {}
  
    static readonly struct = new FixableBeetStruct<CreateLaunch_Instruction>(
      [
        ['instruction', u8],
        ['name', utf8String],
        ['symbol', utf8String],
        ["uri", utf8String],
        ['launch_date', u16]

      ],
      (args) => new CreateLaunch_Instruction(args.instruction!, args.name!, args.symbol!, args.uri!, args.launch_date!),
      'CreateLaunch_Instruction'
    )
}


export function serialise_CreateLaunch_instruction(instruction : number, name : String, symbol : String, uri: String, launch_date : number) : Buffer
{

    const data = new CreateLaunch_Instruction(instruction, name, symbol, uri, launch_date);
    const [buf] = CreateLaunch_Instruction.struct.serialize(data);

    return buf;
}


export function bignum_to_num(bn : bignum) : number
{
    let value = (new BN(bn)).toNumber();

    return value;
}