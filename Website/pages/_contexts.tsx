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
import { Config, PROGRAM, LaunchFlags, SYSTEM_KEY, LaunchKeys, CollectionKeys, SOL_ACCOUNT_SEED } from "../components/Solana/constants";
import { CollectionDataUserInput, defaultCollectionInput, CollectionData } from "../components/collection/collectionState";
import { PublicKey, Connection, Keypair, TransactionInstruction, Transaction, ComputeBudgetProgram } from "@solana/web3.js";
import { useCallback, useEffect, useState, useRef, PropsWithChildren, SetStateAction, Dispatch } from "react";
import { AppRootContextProvider } from "../context/useAppRoot";
import bs58 from "bs58";
import "bootstrap/dist/css/bootstrap.css";
import { sleep } from "@irys/sdk/build/cjs/common/utils";
import { getMintData } from "../components/amm/launch";
import { useSOLPrice } from "../hooks/data/useSOLPrice";
import { getDatabase, ref, get, Database } from "firebase/database";
import { firebaseConfig } from "../components/Solana/constants";
import { initializeApp } from "firebase/app";
import { deserializeMintData, getTradeMintData } from "../utils/getTokenMintData";

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

async function getTokenPrices(mints: string[], setPriceMap: Dispatch<SetStateAction<Map<string, number>>>): Promise<void> {
    const priceMap = new Map<string, number>();

    // Don't bother doing this is not solana mainnet
    if (!(Config.NETWORK == "mainnet")) {
        mints.forEach((mint) => priceMap.set(mint, 0));
        setPriceMap(priceMap);
        return;
    }

    try {
        // Split mints into chunks of 100 (Jupiter API limit)
        const mintChunks = chunkArray(mints, 100);

        // Process each chunk
        await Promise.all(
            mintChunks.map(async (chunk) => {
                const mintString = chunk.join(",");
                const url = `https://price.jup.ag/v6/price?ids=${mintString}&vsToken=SOL`;

                try {
                    const response = await fetch(url, { method: "GET" });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();
                    const resultData = result.data;

                    // Process results for this chunk
                    chunk.forEach((mint) => {
                        const mintData = resultData[mint];
                        priceMap.set(mint, mintData?.price ?? 0);
                    });
                } catch (error) {
                    console.error(`Error fetching prices for chunk:`, error);
                    // Set default values for failed chunk
                    chunk.forEach((mint) => priceMap.set(mint, 0));
                }
            }),
        );

        setPriceMap(priceMap);
    } catch (error) {
        console.error("Error in getTokenPrices:", error);
        // Set default values on error
        mints.forEach((mint) => priceMap.set(mint, 0));
        setPriceMap(priceMap);
    }
}

const GetTradeMintData = async (trade_keys: String[], setMintMap) => {
    let mint_map = await getTradeMintData(trade_keys);
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
    const [sidePanelCollapsed, setSidePanelCollapsed] = useState(false);

    const [isLaunchDataLoading, setIsLaunchDataLoading] = useState(false);
    const [isHomePageDataLoading, setIsHomePageDataLoading] = useState(false);

    const [program_data, setProgramData] = useState<GPAccount[] | null>(null);

    const [launch_data, setLaunchData] = useState<Map<string, LaunchData> | null>(null);
    const [collection_data, setCollectionData] = useState<Map<string, CollectionData> | null>(null);
    const [amm_data, setAMMData] = useState<Map<string, AMMData> | null>(null);
    const [listing_data, setListingData] = useState<Map<string, ListingData> | null>(null);

    const [mintData, setMintData] = useState<Map<String, MintData> | null>(null);
    const [jup_prices, setJupPrices] = useState<Map<string, number> | null>(null);

    const [user_data, setUserData] = useState<Map<string, UserData> | null>(new Map());
    const [join_data, setJoinData] = useState<Map<string, JoinData> | null>(null);
    const [mm_launch_data, setMMLaunchData] = useState<Map<string, MMLaunchData> | null>(null);
    const [mm_user_data, setMMUserData] = useState<Map<string, MMUserData> | null>(null);

    const [current_user_data, setCurrentUserData] = useState<UserData | null>(null);
    const [home_page_data, setHomePageData] = useState<Map<string, LaunchData> | null>(null);

    const [userSOLBalance, setUserSOLBalance] = useState<number>(0);

    const check_program_data = useRef<boolean>(true);
    const last_program_data_update = useRef<number>(0);
    const [databaseLoaded, setDatabaseLoaded] = useState<boolean>(false);

    const user_balance_ws_id = useRef<number | null>(null);
    const program_ws_id = useRef<number | null>(null);

    const newLaunchData = useRef<LaunchDataUserInput>({ ...defaultUserInput });
    const newCollectionData = useRef<CollectionDataUserInput>({ ...defaultCollectionInput });
    const lastDBUpdate = useRef<number>(0);

    const { SOLPrice } = useSOLPrice();

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

    const check_program_update = useCallback(
        async (new_program_data: any) => {
            console.log("in program update", new_program_data);
            if (!new_program_data) return;

            let wallet_bytes = PublicKey.default.toBytes();
            let have_wallet = false;
            // console.log("wallet", wallet !== null ? wallet.toString() : "null");
            if (wallet !== null && wallet.publicKey !== null) {
                wallet_bytes = wallet.publicKey.toBytes();
                have_wallet = true;
            }

            let event_data = Buffer.from(new_program_data.accountInfo.data);
            let account_key = new_program_data.accountId;

            if (event_data[0] === 0) {
                try {
                    setLaunchData((currentData) => {
                        const [launch] = LaunchData.struct.deserialize(event_data);
                        const newData = new Map(currentData);
                        newData.set(launch.page_name, launch);
                        return newData;
                    });

                    return;
                } catch (error) {
                    //console.log("bad launch data", data);
                }
            }

            if (event_data[0] === 2) {
                const [user] = UserData.struct.deserialize(event_data);
                setUserData((currentData) => {
                    const newData = new Map(currentData);
                    newData.set(user.user_key.toString(), user);
                    return newData;
                });

                if (wallet.publicKey !== null && user.user_key.equals(wallet.publicKey)) {
                    setCurrentUserData(user);
                }

                return;
            }

            if (event_data[0] === 5) {
                setMMLaunchData((currentData) => {
                    const [mm_launch] = MMLaunchData.struct.deserialize(event_data);
                    const newData = new Map(currentData);
                    newData.set(mm_launch.amm.toString() + "_" + mm_launch.date, mm_launch);
                    return newData;
                });

                return;
            }

            if (event_data[0] === 6) {
                //console.log("updating amm data from context");

                try {
                    setAMMData((currentData) => {
                        const [amm] = AMMData.struct.deserialize(event_data);
                        let amm_key = getAMMKey(amm, amm.provider);
                        const newData = new Map(currentData);
                        newData.set(amm_key.toString(), amm);
                        return newData;
                    });
                } catch (error) {
                    console.log(error);
                }

                return;
            }

            if (event_data[0] === 8) {
                setCollectionData((currentData) => {
                    const [collection] = CollectionData.struct.deserialize(event_data);
                    console.log("collection update", collection);
                    const newData = new Map(currentData);
                    newData.set(collection.page_name, collection);
                    return newData;
                });

                return;
            }

            if (event_data[0] === 11) {
                setListingData((currentData) => {
                    const [listing] = ListingData.struct.deserialize(event_data);
                    const newData = new Map(currentData);
                    newData.set(account_key.toString(), listing);
                    return newData;
                });

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
                setJoinData((currentData) => {
                    const [join] = JoinData.struct.deserialize(event_data);
                    const newData = new Map(currentData);
                    newData.set(join.page_name, join);
                    return newData;
                });

                return;
            }

            if (event_data[0] === 4) {
                setMMUserData((currentData) => {
                    const [mm_user] = MMUserData.struct.deserialize(event_data);
                    const newData = new Map(currentData);
                    newData.set(mm_user.amm.toString() + "_" + mm_user.date, mm_user);
                    return newData;
                });

                return;
            }
        },
        [wallet],
    );

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
            let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

            var account_vector = [
                { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
                { pubkey: program_sol_account, isSigner: false, isWritable: true },
                { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
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
                const encoded_transaction = bs58.encode(Uint8Array.from(signed_transaction.serialize()));

                var transaction_response = await send_transaction("", encoded_transaction);
                console.log(transaction_response);
            } catch (error) {
                console.log(error);
                return;
            }
        },
        [wallet],
    );

    // Helper function to deserialize account data
    function deserializeGPAccount(serializedAccount: any): GPAccount {
        return {
            pubkey: new PublicKey(serializedAccount.pubkey),
            data: Buffer.from(serializedAccount.data, "base64"),
        };
    }

    const fetchInitialData = useCallback(async () => {
        if (lastDBUpdate.current > 0) return;

        const app = initializeApp(firebaseConfig);

        // Initialize Realtime Database and get a reference to the service
        const database = getDatabase(app);

        const accountsDB = await get(ref(database, Config.NETWORK + "/accounts/"));
        let accounts = accountsDB.val();
        if (!accounts) {
            return;
        }

        const tokensDB = await get(ref(database, Config.NETWORK + "/tokens/"));
        let tokens = tokensDB.val();
        if (!tokens) {
            return;
        }

        lastDBUpdate.current = accounts.timestamp;

        // Deserialize each account in the accounts array
        const listingAccounts: GPAccount[] = accounts.listingData.map((account: any) => deserializeGPAccount(account));

        // Deserialize each account in the accounts array
        const ammAccounts: GPAccount[] = accounts.ammData.map((account: any) => deserializeGPAccount(account));

        const tokenAccounts: MintData[] = tokens.mintData.map((mint: any) => deserializeMintData(mint));

        let ammData: Map<string, AMMData> = new Map<string, AMMData>();
        let listingData: Map<string, ListingData> = new Map<string, ListingData>();
        let tokenData: Map<string, MintData> = new Map<string, MintData>();

        for (let i = 0; i < ammAccounts.length; i++) {
            let data = ammAccounts[i].data;
            try {
                const [amm] = AMMData.struct.deserialize(data);
                let amm_key = getAMMKey(amm, amm.provider);
                ammData.set(amm_key.toString(), amm);
            } catch (error) {
                console.log(error);
            }
        }

        for (let i = 0; i < listingAccounts.length; i++) {
            let data = listingAccounts[i].data;
            try {
                const [listing] = ListingData.struct.deserialize(data);
                listingData.set(listingAccounts[i].pubkey.toString(), listing);
            } catch (error) {
                console.log(error);
            }
        }

        for (let i = 0; i < tokenAccounts.length; i++) {
            let token = tokenAccounts[i];
            tokenData.set(token.mint.address.toString(), token);
        }

        console.log("Setting initial data from DB");
        setAMMData(ammData);
        setListingData(listingData);
        setMintData(tokenData);
        setDatabaseLoaded(true);
    }, []);

    const UpdateDatabase = useCallback(async () => {
        await fetch("/.netlify/functions/updateProgramData", {
            method: "POST",
            body: JSON.stringify({}),
            headers: {
                "Content-Type": "application/json",
            },
        });
    }, []);

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
                    //console.log("AMM", amm.provider, amm.base_mint.toString());
                } catch (error) {
                    console.log("bad amm data", program_data[i].pubkey.toString());
                    //console.log(error);
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

        //console.log("set user data", user_data);
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

        // Create an array to store all launches with their hype scores
        let all_launches: { launch: LaunchData; hype: number }[] = [];

        for (let i = 0; i < close_filtered.length; i++) {
            let launch = close_filtered[i];
            let listing: ListingData = listings.get(launch.listing.toString());
            let hype = listing.positive_votes - listing.negative_votes;

            if (hype >= 0) all_launches.push({ launch, hype });
        }

        // Sort the launches by hype score in descending order
        all_launches.sort((a, b) => b.hype - a.hype);

        // Take the top 10 most hyped launches
        let top_10_launches = all_launches.slice(0, Math.min(10, all_launches.length));

        // Create the home_page_data Map with the top 10 launches
        let home_page_data = new Map<string, LaunchData>();
        for (let item of top_10_launches) {
            home_page_data.set(item.launch.page_name, item.launch);
        }

        //console.log(home_page_data, bignum_to_num(home_page_data[0].total_supply));
        setHomePageData(home_page_data);

        // set up the map for the trade page
        let trade_mints: String[] = [];
        let price_mints: string[] = [];
        listings.forEach((listing, key) => {
            trade_mints.push(listing.mint.toString());
            price_mints.push(listing.mint.toString());
        });

        launch_data.forEach((launch, key) => {
            // check if we have a whitelist token

            for (let p = 0; p < launch.plugins.length; p++) {
                if (launch.plugins[p]["__kind"] === "Whitelist") {
                    if (!trade_mints.includes(launch.plugins[p]["key"].toString())) trade_mints.push(launch.plugins[p]["key"]);
                }
            }
        });

        collections.forEach((collection, key) => {
            //console.log("add ", collections[i].keys[CollectionKeys.MintAddress].toString());

            if (!trade_mints.includes(collection.keys[CollectionKeys.MintAddress].toString()))
                trade_mints.push(collection.keys[CollectionKeys.MintAddress].toString());
            // check if we have a whitelist token
            for (let p = 0; p < collection.plugins.length; p++) {
                if (collection.plugins[p]["__kind"] === "Whitelist") {
                    trade_mints.push(collection.plugins[p]["key"]);
                }
            }
        });

        GetTradeMintData(trade_mints, setMintData);
        getTokenPrices(price_mints, setJupPrices);
        if (new Date().getTime() - lastDBUpdate.current > 60 * 60 * 1000) {
            UpdateDatabase();
        }
    }, [program_data, wallet, UpdateDatabase]);

    const ReGetProgramData = useCallback(async () => {
        check_program_data.current = true;
        GetProgramData(check_program_data, setProgramData, setIsLaunchDataLoading, setIsHomePageDataLoading);
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        if (!databaseLoaded) return;

        let current_time = new Date().getTime();
        if (current_time - last_program_data_update.current < 1000) return;

        last_program_data_update.current = current_time;

        GetProgramData(check_program_data, setProgramData, setIsLaunchDataLoading, setIsHomePageDataLoading);
    }, [databaseLoaded]);

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
            SOLPrice={SOLPrice}
            mintData={mintData}
            newCollectionData={newCollectionData}
            collectionList={collection_data}
            setSelectedNetwork={setSelectedNetwork}
            selectedNetwork={selectedNetwork}
            listingData={listing_data}
            setListingData={setListingData}
            setMintData={setMintData}
            jupPrices={jup_prices}
        >
            {children}
        </AppRootContextProvider>
    );
};

export default ContextProviders;
