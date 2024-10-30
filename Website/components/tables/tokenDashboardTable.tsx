import { useEffect, useState, useCallback } from "react";
import {
    LaunchData,
    ListingData,
    UserData,
    bignum_to_num,
    create_LaunchDataInput,
    get_current_blockhash,
    send_transaction,
} from "../Solana/state";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Badge, Box, Button, Center, HStack, Link, TableContainer, Text, VStack } from "@chakra-ui/react";
import { TfiReload } from "react-icons/tfi";
import { FaSort } from "react-icons/fa";
import { useWallet } from "@solana/wallet-adapter-react";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";
import useAppRoot from "../../context/useAppRoot";
import useDetermineCookState, { CookState } from "../../hooks/useDetermineCookState";
import { useRouter } from "next/router";
import useInitAMM from "../../hooks/jupiter/useInitAMM";
import convertToBlob from "../../utils/convertImageToBlob";
import convertImageURLToFile from "../../utils/convertImageToBlob";
import { LaunchFlags, LaunchKeys, Config, Extensions } from "../Solana/constants";
import {
    getAssociatedTokenAddress,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    unpackAccount,
    getTransferFeeAmount,
    createWithdrawWithheldTokensFromAccountsInstruction,
} from "@solana/spl-token";
import { PublicKey, Transaction, TransactionInstruction, Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { toast } from "react-toastify";
import useCreateCP from "../../hooks/raydium/useCreateCP";
import * as NProgress from "nprogress";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
interface Header {
    text: string;
    field: string | null;
}

interface TransferAccount {
    pubkey: PublicKey;
    amount: number;
}

const TokenDashboardTable = ({ creatorLaunches }: { creatorLaunches: LaunchData[] }) => {
    const { sm } = useResponsive();
    const { checkProgramData, listingData } = useAppRoot();
    const wallet = useWallet();

    const [sortedField, setSortedField] = useState<string | null>("date");
    const [reverseSort, setReverseSort] = useState<boolean>(true);

    const tableHeaders: Header[] = [
        { text: "TOKEN", field: null },
        { text: "STATUS", field: null },
        { text: "LIQUIDITY", field: "liquidity" },
        { text: "DATE", field: "date" },
    ];

    const handleHeaderClick = (field: string | null) => {
        if (field === sortedField) {
            setReverseSort(!reverseSort);
        } else {
            setSortedField(field);
            setReverseSort(false);
        }
    };

    const sortedLaunches = [...creatorLaunches].sort((a, b) => {
        let listing_a = listingData.get(a.listing.toString());
        let listing_b = listingData.get(b.listing.toString());

        if (sortedField === "symbol") {
            return reverseSort ? listing_b.symbol.localeCompare(listing_a.symbol) : listing_a.symbol.localeCompare(listing_b.symbol);
        } else if (sortedField === "liquidity") {
            return reverseSort ? b.minimum_liquidity - a.minimum_liquidity : a.minimum_liquidity - b.minimum_liquidity;
        } else if (sortedField === "date") {
            return reverseSort ? b.launch_date - a.launch_date : a.launch_date - b.launch_date;
        }

        return 0;
    });

    const GetFeeAccounts = useCallback(async (listing: ListingData) => {
        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        const allAccounts = await connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
            commitment: "confirmed",
            filters: [
                {
                    memcmp: {
                        offset: 0,
                        bytes: listing.mint.toString(),
                    },
                },
            ],
        });

        const accountsToWithdrawFrom = [];
        for (const accountInfo of allAccounts) {
            const account = unpackAccount(accountInfo.pubkey, accountInfo.account, TOKEN_2022_PROGRAM_ID);
            const transferFeeAmount = getTransferFeeAmount(account);
            if (transferFeeAmount !== null && transferFeeAmount.withheldAmount > BigInt(0)) {
                let transfer_account: TransferAccount = {
                    pubkey: accountInfo.pubkey,
                    amount: parseInt(transferFeeAmount.withheldAmount.toString()) / Math.pow(10, listing.decimals),
                };
                accountsToWithdrawFrom.push(transfer_account);
            }
        }

        console.log(allAccounts);
        console.log(accountsToWithdrawFrom);
        return accountsToWithdrawFrom;
    }, []);

    const GetFees = useCallback(
        async (launch: LaunchData) => {
            if (wallet.publicKey === null) return;

            const collectToast = toast.loading("Collecting Fee Accounts...");

            let listing = listingData.get(launch.listing.toString());

            let feeAccounts: TransferAccount[] = await GetFeeAccounts(listing);

            let total_fees = 0;
            for (let i = 0; i < feeAccounts.length; i++) {
                total_fees += feeAccounts[i].amount;
            }

            if (total_fees === 0) {
                toast.update(collectToast, {
                    render: "No fees to collect",
                    type: "success",
                    isLoading: false,
                    autoClose: 3000,
                });
                return;
            }

            toast.update(collectToast, {
                render: "Collecting " + total_fees.toFixed(2) + " Fees",
                type: "success",
            });

            let user_token_key = await getAssociatedTokenAddress(
                listing.mint, // mint
                launch.keys[LaunchKeys.TeamWallet], // owner
                true, // allow owner off curve,
                TOKEN_2022_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID,
            );
            let current_idx = 0;
            let block_size = 20;
            while (current_idx < feeAccounts.length) {
                let end_idx = Math.min(current_idx + block_size, feeAccounts.length);

                let accountsToWithdrawFrom = [];
                for (let i = current_idx; i < end_idx; i++) {
                    accountsToWithdrawFrom.push(feeAccounts[i].pubkey);
                }

                let withdraw_idx = createWithdrawWithheldTokensFromAccountsInstruction(
                    listing.mint,
                    user_token_key,
                    wallet.publicKey,
                    [],
                    accountsToWithdrawFrom,
                    TOKEN_2022_PROGRAM_ID,
                );

                let txArgs = await get_current_blockhash("");

                let transaction = new Transaction(txArgs);
                transaction.feePayer = wallet.publicKey;

                transaction.add(withdraw_idx);

                try {
                    let signed_transaction = await wallet.signTransaction(transaction);
                    const encoded_transaction = bs58.encode(signed_transaction.serialize());

                    var transaction_response = await send_transaction("", encoded_transaction);

                    let signature = transaction_response.result;
                    console.log("get tokens", signature);

                    current_idx += block_size;
                } catch (error) {
                    console.log(error);

                    toast.update(collectToast, {
                        render: "Failed to collect fees, please try again later.",
                        type: "success",
                        isLoading: false,
                        autoClose: 3000,
                    });
                    break;
                }
            }

            toast.update(collectToast, {
                render: "Fees have been successfully collected!",
                type: "success",
                isLoading: false,
                autoClose: 3000,
            });
        },
        [wallet, GetFeeAccounts, listingData],
    );

    return (
        <Table className="rounded-lg xl:w-[90%]">
            <TableHeader>
                <TableRow>
                    {tableHeaders.map((i) => (
                        <TableHead key={i.text} className="min-w-[140px] border-b" style={{ minWidth: sm ? "90px" : "120px" }}>
                            <HStack
                                gap={sm ? 1 : 2}
                                justify="center"
                                style={{ cursor: i.text === "LOGO" ? "" : "pointer" }}
                                onClick={() => handleHeaderClick(i.field)}
                            >
                                <Text fontSize={sm ? "medium" : "large"} m={0}>
                                    {i.text}
                                </Text>
                                {i.text === "LOGO" ? <></> : <FaSort />}
                            </HStack>
                        </TableHead>
                    ))}

                    <TableHead>
                        <Box mt={1} as="button" onClick={checkProgramData}>
                            <TfiReload size={sm ? 18 : 20} />
                        </Box>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedLaunches.map((launch) => (
                    <LaunchCard key={launch.page_name} launch={launch} GetFees={GetFees} />
                ))}
            </TableBody>
        </Table>
    );
};

const LaunchCard = ({ launch, GetFees }: { launch: LaunchData; GetFees: (launch: LaunchData) => Promise<void> }) => {
    const router = useRouter();
    const { sm, md, lg } = useResponsive();
    const { newLaunchData, listingData } = useAppRoot();

    let listing = listingData.get(launch.listing.toString());
    const { InitAMM, isLoading: isInitMMLoading } = useInitAMM(launch);
    const { CreateCP, isLoading: initRaydiumLoading } = useCreateCP(listing, launch);

    const [isEditing, setIsEditing] = useState(false);

    let launchData = launch;

    let splitDate = new Date(bignum_to_num(launch.launch_date)).toUTCString().split(" ");
    let date = splitDate[0] + " " + splitDate[1] + " " + splitDate[2] + " " + splitDate[3];

    let current_time = new Date().getTime();

    const timeDifference = launchData.launch_date - current_time;
    const isEditable = timeDifference > 48 * 60 * 60 * 1000 || listing.description == ""; // 48 hours

    const cook_state = useDetermineCookState({ current_time, launchData, join_data: null });

    const ACTIVE = [CookState.ACTIVE_NO_TICKETS, CookState.ACTIVE_TICKETS].includes(cook_state);
    const MINTED_OUT = [
        CookState.MINT_SUCCEEDED_NO_TICKETS,
        CookState.MINT_SUCCEDED_TICKETS_TO_CHECK,
        CookState.MINT_SUCCEEDED_TICKETS_CHECKED_NO_LP,
        CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP,
        CookState.MINT_SUCCEEDED_TICKETS_CHECKED_LP_TIMEOUT,
    ].includes(cook_state);
    const MINT_FAILED = [CookState.MINT_FAILED_NOT_REFUNDED, CookState.MINT_FAILED_REFUNDED].includes(cook_state);

    //buttonClicked:
    const LaunchLPClicked = (e) => {
        e.stopPropagation();
        if (launch.flags[LaunchFlags.AMMProvider] == 0) {
            InitAMM();
        }
        if (launch.flags[LaunchFlags.AMMProvider] == 1) {
            CreateCP();
        }
    };

    const GetFeesClicked = (e) => {
        e.stopPropagation();
        GetFees(launch);
    };

    const EditClicked = async (e) => {
        e.stopPropagation();
        setIsEditing(true);
        newLaunchData.current = create_LaunchDataInput(launch, listing, true);

        let bannerFile = await convertImageURLToFile(listing.banner, `${listing.name} banner image`);
        let iconFile = await convertImageURLToFile(listing.icon, `${listing.name} icon image`);

        newLaunchData.current.banner_file = bannerFile;
        newLaunchData.current.icon_file = iconFile;

        setIsEditing(false);

        router.push("/launch");
    };

    return (
        <TableRow
            style={{
                cursor: "pointer",
                height: "60px",
                transition: "background-color 0.3s",
            }}
            className="border-b"
            onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = ""; // Reset to default background color
            }}
            onClick={() => {
                NProgress.start();
                router.push(`/launch/${launch.page_name}`);
            }}
        >
            <TableCell style={{ minWidth: "160px" }}>
                <HStack m="0 auto" w={160} px={3} spacing={3} justify="start">
                    <Box w={45} h={45} borderRadius={10}>
                        <Image
                            alt="Launch icon"
                            src={listing.icon}
                            width={45}
                            height={45}
                            style={{ borderRadius: "8px", backgroundSize: "cover" }}
                        />
                    </Box>
                    <Text fontSize={"large"} m={0}>
                        {listing.symbol}
                    </Text>
                </HStack>
            </TableCell>
            <TableCell style={{ minWidth: "120px" }}>
                <Badge
                    borderRadius="12px"
                    px={3}
                    py={1}
                    colorScheme={
                        cook_state === CookState.PRE_LAUNCH
                            ? "yellow"
                            : ACTIVE
                              ? "whatsapp"
                              : MINTED_OUT
                                ? "linkedin"
                                : MINT_FAILED
                                  ? "red"
                                  : "none"
                    }
                >
                    {cook_state === CookState.PRE_LAUNCH
                        ? "Warming Up"
                        : ACTIVE
                          ? "Cooking"
                          : MINTED_OUT
                            ? "Cook Out"
                            : MINT_FAILED
                              ? "Cook Failed"
                              : "Unknown"}
                </Badge>
            </TableCell>

            <TableCell style={{ minWidth: sm ? "170px" : "200px" }}>
                <VStack>
                    <Text fontSize={"large"} m={0}>
                        {(Math.min(launch.tickets_sold, launch.num_mints) * launch.ticket_price) / LAMPORTS_PER_SOL}/
                        {(launch.num_mints * launch.ticket_price) / LAMPORTS_PER_SOL} SOL
                    </Text>
                </VStack>
            </TableCell>
            <TableCell style={{ minWidth: sm ? "150px" : "200px" }}>
                <Text fontSize={"large"} m={0}>
                    {date}
                </Text>
            </TableCell>
            <TableCell style={{ minWidth: md ? "230px" : "" }}>
                <HStack justify="center" style={{ minWidth: "80px" }}>
                    {MINTED_OUT && launch.flags[LaunchFlags.LPState] < 2 && (
                        <Button onClick={(e) => LaunchLPClicked(e)} isLoading={isInitMMLoading}>
                            Launch LP
                        </Button>
                    )}

                    {/* editable only when it is less than 48hrs from launch date */}
                    {isEditable && (
                        <Button onClick={(e) => EditClicked(e)} isLoading={isEditing}>
                            Edit
                        </Button>
                    )}

                    {launch.flags[LaunchFlags.LPState] == 2 &&
                        launch.flags.length > LaunchFlags.Extensions &&
                        (launch.flags[LaunchFlags.Extensions] & Extensions.TransferFee) > 0 && (
                            <Button onClick={(e) => GetFeesClicked(e)}>Collect Fees</Button>
                        )}
                </HStack>
            </TableCell>
        </TableRow>
    );
};

export default TokenDashboardTable;
