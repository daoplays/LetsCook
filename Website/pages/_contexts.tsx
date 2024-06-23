"use client";

import { useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import { LimitOrderProvider, OrderHistoryItem, TradeHistoryItem, ownerFilter } from "@jup-ag/limit-order-sdk";
import {
    LaunchData,
    UserData,
    bignum_to_num,
    LaunchDataUserInput,
    defaultUserInput,
    JoinData,
    RunGPA,
    serialise_basic_instruction,
    LaunchInstruction,
    get_current_blockhash,
    send_transaction,
    GPAccount,
    request_current_balance,
    requestMultipleAccounts,
    Token22MintAccount,
    uInt32ToLEBytes,
    MintData,
    ListingData,
} from "../components/Solana/state";
import { unpackMint, Mint, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { AMMData, getAMMKey, MMLaunchData, MMUserData, OpenOrder } from "../components/Solana/jupiter_state";
import { Config, PROGRAM, LaunchFlags, SYSTEM_KEY, LaunchKeys, CollectionKeys } from "../components/Solana/constants";
import { CollectionDataUserInput, defaultCollectionInput, CollectionData } from "../components/collection/collectionState";
import { PublicKey, Connection, Keypair, TransactionInstruction, Transaction, ComputeBudgetProgram } from "@solana/web3.js";
import { useCallback, useEffect, useState, useRef, PropsWithChildren } from "react";
import { AppRootContextProvider } from "../context/useAppRoot";
import bs58 from "bs58";
import "bootstrap/dist/css/bootstrap.css";
import { sleep } from "@irys/sdk/build/cjs/common/utils";
import { getMintData } from "../components/amm/launch";

const GetSOLPrice = async (setSOLPrice) => {
    // Default options are marked with *
    const options = { method: "GET" };

    let result = await fetch("https://price.jup.ag/v4/price?ids=SOL", options).then((response) => response.json());

    setSOLPrice(result["data"]["SOL"]["price"]);
};

const GetTokenPrices = async (mints : PublicKey[]) => {
    // Default options are marked with *
    const options = { method: "GET" };
    let mint_strings = ""
    for (let i = 0; i < mints.length; i++) {
        mint_strings += mints[i].toString() + ","
    }
    let url = "https://price.jup.ag/v6/price?ids=[" + mint_strings + "]&vsToken=SOL";
    let result = await fetch(url, options).then((response) => response.json());
    console.log(result)
};

const GetTradeMintData = async (trade_keys : PublicKey[], setMintMap) => {
    const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });
    let result = await connection.getMultipleAccountsInfo(trade_keys, "confirmed");

    let mint_map = new Map<String, MintData>();
    for (let i = 0; i < result.length; i++) {
        let mint = unpackMint(trade_keys[i], result[i], result[i].owner);
        let mint_data = await getMintData(connection, mint, result[i].owner);

        //console.log("mint; ", mint.address.toString());
        mint_map.set(trade_keys[i].toString(), mint_data);
    }
    setMintMap(mint_map);
};

const GetProgramData = async (check_program_data, setProgramData, setIsLaunchDataLoading, setIsHomePageDataLoading) => {
    if (!check_program_data.current) return;

    setIsLaunchDataLoading(true);
    setIsHomePageDataLoading(true);

    let list = await RunGPA();

    //console.log("check program data");
    //console.trace()
    setProgramData(list);

    //console.log(list);

    setIsLaunchDataLoading(false);
    setIsHomePageDataLoading(false);

    check_program_data.current = false;
};

const ContextProviders = ({ children }: PropsWithChildren) => {
    const wallet = useWallet();
    const [selectedNetwork, setSelectedNetwork] = useState(Config.NETWORK);
    const [sidePanelCollapsed, setSidePanelCollapsed] = useState(true);

    const [isLaunchDataLoading, setIsLaunchDataLoading] = useState(false);
    const [isHomePageDataLoading, setIsHomePageDataLoading] = useState(false);

    const [program_data, setProgramData] = useState<GPAccount[] | null>(null);

    const [launch_data, setLaunchData] = useState<Map<string, LaunchData> | null>(null);
    const [collection_data, setCollectionData] = useState<Map<string, CollectionData> | null>(null);
    const [amm_data, setAMMData] = useState<Map<string, AMMData> | null>(null);
    const [listing_data, setListingData] = useState<Map<string, ListingData> | null>(null);

    const [mintData, setMintData] = useState<Map<String, MintData> | null>(null);

    const [user_data, setUserData] = useState<Map<string, UserData> | null>(new Map());
    const [join_data, setJoinData] = useState<Map<string, JoinData> | null>(null);
    const [mm_launch_data, setMMLaunchData] = useState<Map<string, MMLaunchData> | null>(null);
    const [mm_user_data, setMMUserData] = useState<Map<string, MMUserData> | null>(null);

    const [current_user_data, setCurrentUserData] = useState<UserData | null>(null);
    const [home_page_data, setHomePageData] = useState<Map<string, LaunchData> | null>(null);

    const [userSOLBalance, setUserSOLBalance] = useState<number>(0);
    const [solPrice, setSolPrice] = useState<number>(0);
    const [new_program_data, setNewProgramData] = useState<any>(null);
    const update_program_data = useRef<number>(0);

    const check_program_data = useRef<boolean>(true);
    const last_program_data_update = useRef<number>(0);

    const user_balance_ws_id = useRef<number | null>(null);
    const program_ws_id = useRef<number | null>(null);

    const newLaunchData = useRef<LaunchDataUserInput>({ ...defaultUserInput });
    const newCollectionData = useRef<CollectionDataUserInput>({ ...defaultCollectionInput });

    function closeFilterTable({ list }: { list: Map<string, LaunchData> }) {
        let current_time = new Date().getTime();
        let filtered: LaunchData[] = [];
        list.forEach((value, key) => {
            //console.log(new Date(bignum_to_num(item.launch_date)), new Date(bignum_to_num(item.end_date)))
            if (bignum_to_num(value.end_date) >= current_time) {
                filtered.push(value);
            }
        });

        return filtered;
    }

    useEffect(() => {
        if (update_program_data.current === 0 || new_program_data === null) return;

        console.log("update data", update_program_data.current);
        let wallet_bytes = PublicKey.default.toBytes();
        let have_wallet = false;
        // console.log("wallet", wallet !== null ? wallet.toString() : "null");
        if (wallet !== null && wallet.publicKey !== null) {
            wallet_bytes = wallet.publicKey.toBytes();
            have_wallet = true;
        }

        update_program_data.current -= 1;

        let event_data = Buffer.from(new_program_data.accountInfo.data);
        let account_key = new_program_data.accountId;

        if (event_data[0] === 0) {
            try {
                console.log("updating launch data from context");
                const [launch] = LaunchData.struct.deserialize(event_data);

                launch_data.set(launch.page_name, launch);
                setLaunchData(new Map(launch_data));
                return;
            } catch (error) {
                //console.log("bad launch data", data);
            }
        }

        if (event_data[0] === 2) {
            console.log("updating user data from context");

            const [user] = UserData.struct.deserialize(event_data);

            user_data.set(user.user_key.toString(), user);
            setUserData(new Map(user_data));
            if (wallet.publicKey !== null && user.user_key.equals(wallet.publicKey)) {
                setCurrentUserData(user);
            }
            return;
        }

        if (event_data[0] === 5) {
            console.log("updating mm launch data from context");

            const [mm] = MMLaunchData.struct.deserialize(event_data);
            //console.log("launch mm", program_data[i].pubkey.toString());
            mm_launch_data.set(mm.amm.toString() + "_" + mm.date, mm);
            return;
        }

        if (event_data[0] === 6) {
            console.log("updating amm data from context");

            try {
                const [amm] = AMMData.struct.deserialize(event_data);
                let amm_key = getAMMKey(amm, amm.provider);
                amm_data.set(amm_key.toString(), amm);
                setAMMData(new Map(amm_data));
            } catch (error) {
                console.log(error);
                //closeAccounts.push(program_data[i].pubkey)
            }

            return;
        }
        if (event_data[0] === 8) {
            console.log("updating collection data from context");

            const [collection] = CollectionData.struct.deserialize(event_data);

            collection_data.set(collection.page_name, collection);
            setCollectionData(new Map(collection_data));
            return;
        }

        if (event_data[0] === 11) {
            console.log("updating listing data from context");

            const [listing] = ListingData.struct.deserialize(event_data);
            listing_data.set(account_key.toString(), listing);
            setListingData(new Map(listing_data));

            return;
        }

        // other data depends on a wallet
        if (!have_wallet) return;

        // both join and MM user data have the user key in the same place
        let comp_wallet_bytes = new Uint8Array(event_data.slice(1, 33));

        let isEqual = true;
        for (let i = 0; i < wallet_bytes.length && isEqual; i++) {
            isEqual = wallet_bytes[i] === comp_wallet_bytes[i];
        }

        if (!isEqual) return;

        if (event_data[0] === 3) {
            const [join] = JoinData.struct.deserialize(event_data);
            //console.log("join", join);

            join_data.set(join.page_name, join);
            setJoinData(new Map(join_data));

            return;
        }

        if (event_data[0] === 4) {
            const [mm_user] = MMUserData.struct.deserialize(event_data);
            //console.log("user mm", mm_user);

            mm_user_data.set(mm_user.amm.toString() + "_" + mm_user.date, mm_user);
            setMMUserData(new Map(mm_user_data));

            return;
        }
    }, [
        new_program_data,
        wallet,
        user_data,
        launch_data,
        mm_launch_data,
        amm_data,
        collection_data,
        listing_data,
        join_data,
        mm_user_data,
    ]);

    const check_program_update = useCallback(async (result: any) => {
        update_program_data.current += 1;
        setNewProgramData(result);
    }, []);

    const checkUserBalance = useCallback(async () => {
        if (wallet === null || wallet.publicKey === null) {
            return;
        }

        let balance = await request_current_balance("", wallet.publicKey);
        setUserSOLBalance(balance);
    }, [wallet]);

    const check_user_balance = useCallback(async (result: any) => {
        //console.log(result);
        // if we have a subscription field check against ws_id

        try {
            let balance = result["lamports"] / 1e9;
            //console.log("have user balance event data", balance);
            setUserSOLBalance(balance);
        } catch (error) {}
    }, []);

    // launch account subscription handler
    useEffect(() => {
        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        if (user_balance_ws_id.current === null && wallet !== null && wallet.publicKey !== null) {
            checkUserBalance();
            user_balance_ws_id.current = connection.onAccountChange(wallet.publicKey, check_user_balance, "confirmed");
        }

        if (program_ws_id.current === null) {
            program_ws_id.current = connection.onProgramAccountChange(PROGRAM, check_program_update, "confirmed");
        }
    }, [wallet, check_user_balance, checkUserBalance, check_program_update]);

    const CloseAccount = useCallback(
        async ({ accounts }: { accounts: PublicKey[] }) => {
            if (wallet.publicKey === null || wallet.signTransaction === undefined) return;

            const instruction_data = serialise_basic_instruction(LaunchInstruction.close_account);

            var account_vector = [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: SYSTEM_KEY, isSigner: false, isWritable: true },
            ];

            for (let i = 0; i < accounts.length; i++) {
                account_vector.push({ pubkey: accounts[i], isSigner: false, isWritable: true });
            }

            const list_instruction = new TransactionInstruction({
                keys: account_vector,
                programId: PROGRAM,
                data: instruction_data,
            });

            let txArgs = await get_current_blockhash("");

            let transaction = new Transaction(txArgs);
            transaction.feePayer = wallet.publicKey;

            transaction.add(list_instruction);
            transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));

            try {
                let signed_transaction = await wallet.signTransaction(transaction);
                const encoded_transaction = bs58.encode(signed_transaction.serialize());

                var transaction_response = await send_transaction("", encoded_transaction);
                console.log(transaction_response);
            } catch (error) {
                console.log(error);
                return;
            }
        },
        [wallet],
    );

    useEffect(() => {
        if (program_data === null) return;

        //console.log("update data");
        let wallet_bytes = PublicKey.default.toBytes();
        let have_wallet = false;
        // console.log("wallet", wallet !== null ? wallet.toString() : "null");
        if (wallet !== null && wallet.publicKey !== null) {
            wallet_bytes = wallet.publicKey.toBytes();
            have_wallet = true;
        }

        let launch_data: Map<string, LaunchData> = new Map<string, LaunchData>();
        let user_data: Map<string, UserData> = new Map<string, UserData>();
        let join_data: Map<string, JoinData> = new Map<string, JoinData>();
        let mm_launch_data: Map<string, MMLaunchData> = new Map<string, MMLaunchData>();
        let mm_user_data: Map<string, MMUserData> = new Map<string, MMUserData>();
        let amm_data: Map<string, AMMData> = new Map<string, AMMData>();
        let collections: Map<string, CollectionData> = new Map<string, CollectionData>();
        let listings: Map<string, ListingData> = new Map<string, ListingData>();

        //console.log("program_data", program_data.length);
        let closeAccounts = [];
        for (let i = 0; i < program_data.length; i++) {
            let data = program_data[i].data;

            //closeAccounts.push(program_data[i].pubkey)
            //continue

            if (data[0] === 0) {
                try {
                    const [launch] = LaunchData.struct.deserialize(data);
                    // console.log("data ", i, launch.page_name);

                    launch_data.set(launch.page_name, launch);
                } catch (error) {
                    //console.log("bad launch data", data);
                }
                continue;
            }

            if (data[0] === 2) {
                const [user] = UserData.struct.deserialize(data);
                //console.log("user", user);
                user_data.set(user.user_key.toString(), user);
                continue;
            }

            if (data[0] === 5) {
                const [mm] = MMLaunchData.struct.deserialize(data);
                //console.log("launch mm", program_data[i].pubkey.toString());
                mm_launch_data.set(mm.amm.toString() + "_" + mm.date, mm);
                continue;
            }

            if (data[0] === 6) {
                try {
                    const [amm] = AMMData.struct.deserialize(data);
                    let amm_key = getAMMKey(amm, amm.provider);
                    amm_data.set(amm_key.toString(), amm);
                    //console.log(amm);
                } catch (error) {
                    console.log(error);
                    //closeAccounts.push(program_data[i].pubkey)
                }

                continue;
            }
            if (data[0] === 8) {
                const [collection] = CollectionData.struct.deserialize(data);

                collections.set(collection.page_name, collection);
                //console.log(collection);
                continue;
            }

            if (data[0] === 11) {
                const [listing] = ListingData.struct.deserialize(data);
               
                listings.set(program_data[i].pubkey.toString(), listing);
                continue;
            }

            // other data depends on a wallet
            if (!have_wallet) continue;

            // both join and MM user data have the user key in the same place
            let comp_wallet_bytes = new Uint8Array(data.slice(1, 33));

            let isEqual = true;
            for (let i = 0; i < wallet_bytes.length && isEqual; i++) {
                isEqual = wallet_bytes[i] === comp_wallet_bytes[i];
            }

            if (!isEqual) continue;

            if (data[0] === 3) {
                const [join] = JoinData.struct.deserialize(data);
                //console.log("join", join);

                join_data.set(join.page_name, join);
                continue;
            }

            if (data[0] === 4) {
                const [mm_user] = MMUserData.struct.deserialize(data);
                //console.log("user mm", mm_user);

                mm_user_data.set(mm_user.amm.toString() + "_" + mm_user.date, mm_user);
                continue;
            }
        }

        if (closeAccounts.length > 0) {
            let start = 0;
            while (start < closeAccounts.length) {
                let temp = [];
                for (let i = 0; i < 20; i++) {
                    if (start + i < closeAccounts.length) temp.push(closeAccounts[start + i]);
                }

                //CloseAccount({accounts : temp});
                start += 20;
            }
        }

        console.log("set user data", user_data);
        setLaunchData(launch_data);
        setUserData(user_data);
        setJoinData(join_data);
        setMMLaunchData(mm_launch_data);
        setMMUserData(mm_user_data);
        setAMMData(amm_data);
        setCollectionData(collections);
        setListingData(listings);

        if (have_wallet) {
            if (user_data.has(wallet.publicKey.toString())) {
                setCurrentUserData(user_data.get(wallet.publicKey.toString()));
            }
        }

        // set up the home page data
        let close_filtered: LaunchData[] = closeFilterTable({ list: launch_data });

        let home_page_data = new Map<string, LaunchData>();
        let home_page_map = new Map<number, LaunchData>();
        for (let i = 0; i < close_filtered.length; i++) {
            let date = Math.floor(bignum_to_num(close_filtered[i].end_date) / (24 * 60 * 60 * 1000));
            //console.log(close_filtered[i].symbol, new Date(bignum_to_num(close_filtered[i].end_date)), date);
            if (home_page_map.has(date)) {
                let current_entry: LaunchData = home_page_map.get(date);
                let current_listing: ListingData = listings.get(current_entry.listing.toString());
                let close_listing: ListingData = listings.get(close_filtered[i].listing.toString());

                let current_hype = current_listing.positive_votes - current_listing.negative_votes;
                let new_hype = close_listing.positive_votes - close_listing.negative_votes;
                if (new_hype > current_hype) {
                    home_page_map.set(date, close_filtered[i]);
                }
            } else {
                home_page_map.set(date, close_filtered[i]);
            }
        }

        home_page_map.forEach((value, key) => {
            home_page_data.set(value.page_name, value);
        });

        //console.log(home_page_data, bignum_to_num(home_page_data[0].total_supply));
        setHomePageData(home_page_data);

        // set up the map for the trade page
        let trade_mints: PublicKey[] = [];
        launch_data.forEach((launch, key) => {
            let listing: ListingData = listings.get(launch.listing.toString());
            trade_mints.push(listing.mint);
            // check if we have a whitelist token
            for (let p = 0; p < launch.plugins.length; p++) {
                if (launch.plugins[p]["__kind"] === "Whitelist") {
                    trade_mints.push(launch.plugins[p]["key"]);
                }
            }
        });

        collections.forEach((collection, key) => {
            //console.log("add ", collections[i].keys[CollectionKeys.MintAddress].toString());
            trade_mints.push(collection.keys[CollectionKeys.MintAddress]);
        });

        GetTradeMintData(trade_mints, setMintData);
    }, [program_data, wallet]);

    const ReGetProgramData = useCallback(async () => {
        check_program_data.current = true;
        GetProgramData(check_program_data, setProgramData, setIsLaunchDataLoading, setIsHomePageDataLoading);
    }, []);

    useEffect(() => {
        let current_time = new Date().getTime();
        if (current_time - last_program_data_update.current < 1000) return;

        last_program_data_update.current = current_time;

        GetProgramData(check_program_data, setProgramData, setIsLaunchDataLoading, setIsHomePageDataLoading);
        GetSOLPrice(setSolPrice);
    }, []);

    return (
        <AppRootContextProvider
            sidePanelCollapsed={sidePanelCollapsed}
            setSidePanelCollapsed={setSidePanelCollapsed}
            launchList={launch_data}
            homePageList={home_page_data}
            userList={user_data}
            currentUserData={current_user_data}
            joinData={join_data}
            mmLaunchData={mm_launch_data}
            mmUserData={mm_user_data}
            isLaunchDataLoading={isLaunchDataLoading}
            isHomePageDataLoading={isHomePageDataLoading}
            checkProgramData={ReGetProgramData}
            newLaunchData={newLaunchData}
            ammData={amm_data}
            userSOLBalance={userSOLBalance}
            SOLPrice={solPrice}
            mintData={mintData}
            newCollectionData={newCollectionData}
            collectionList={collection_data}
            setSelectedNetwork={setSelectedNetwork}
            selectedNetwork={selectedNetwork}
            listingData={listing_data}
        >
            {children}
        </AppRootContextProvider>
    );
};

export default ContextProviders;
