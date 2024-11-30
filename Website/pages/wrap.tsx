import { useState, useMemo } from "react";
import {
    Box,
    Button,
    Input,
    Radio,
    RadioGroup,
    Stack,
    Text,
    FormControl,
    FormLabel,
    NumberInput,
    NumberInputField,
    VStack,
    HStack,
    useToast,
    Progress,
    IconButton,
    Link,
} from "@chakra-ui/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAirdrop } from "../hooks/useAirdrop";
import { PublicKey } from "@solana/web3.js";
import { RiDeleteBinLine, RiDownloadLine } from "react-icons/ri"; // Import the icon
import useResponsive from "@/hooks/useResponsive";
import styles from "../styles/Launch.module.css";
import { FaWallet } from "react-icons/fa";
import { IoSwapVertical } from "react-icons/io5";
import { getMintData } from "@/components/amm/launch";
import { MintData } from "@/components/Solana/state";
import { set } from "date-fns";
import useTokenBalance from "@/hooks/data/useTokenBalance";
import Image from "next/image";
import { CollectionV1, fetchCollectionV1 } from "@metaplex-foundation/mpl-core";
import { publicKey } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { Config } from "@/components/Solana/constants";
import { fetchWithTimeout } from "@/utils/fetchWithTimeout";
import CSVUploader from "@/utils/csvLoader";
import useWrapSOL from "@/hooks/useWrapSOL";
import useUnWrapSOL from "@/hooks/useUnWrapSOL";
import useGetUserBalance from "@/hooks/data/useGetUserBalance";

interface AirdropRecord {
    address: string; // wallet address
    currentBalance: string; // their token balance
    airdropAmount: string; // what they'll receive
    signature?: string; // transaction signature if airdrop completed
}

export interface CollectionWithMetadata {
    collection: CollectionV1;
    metadata: any;
    icon: string;
}

export const WrapToken = () => {
    const { xs, sm, md, lg } = useResponsive();
    const { userBalance: userSOLBalance } = useGetUserBalance();
    const toast = useToast();
    const [amount, setAmount] = useState("");
    const [isWrap, setIsWrap] = useState(true);

    const { WrapSOL } = useWrapSOL();
    const { UnWrapSOL } = useUnWrapSOL();

    return (
        <form className="mx-auto mt-5 flex w-full flex-col items-center justify-center bg-[#161616] bg-opacity-75 bg-clip-padding px-8 py-6 shadow-2xl backdrop-blur-sm backdrop-filter md:rounded-xl md:border-t-[3px] md:border-orange-700 md:px-12 md:py-8 lg:w-[775px]">
            <div className="flex flex-col gap-2 mb-4">
                <Text className="text-3xl font-semibold text-center text-white lg:text-4xl">{Config.token} Wrap/Unwrap Tool</Text>
                {/* <p className="text-center transition-all cursor-pointer text-white/50 hover:text-white">Switch to Advance Mode</p> */}
            </div>

            <Box w={"100%"} mx="auto" className="mt-4">
                <VStack spacing={6} align="stretch">
                    {/* Input Section */}
                    <FormControl className="flex flex-col items-center justify-center">
                        <div className={`flex w-4/5 flex-col text-white ${isWrap ? "flex-col" : "flex-col-reverse"}`}>
                            {/* From Token Input */}
                            <div className={`${isWrap ? "" : "-mt-6 mb-3"}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm">{isWrap ? `You're Swapping` : "To Receive"}</div>

                                    <div className="flex items-center gap-1 opacity-75">
                                        <FaWallet size={12} />
                                        <p className="text-sm">{userSOLBalance} {Config.token}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-xl">
                                    <div className="flex flex-col gap-2">
                                        <button className="flex items-center gap-2 rounded-lg bg-gray-700 px-2.5 py-1.5">
                                            <div className="w-6">
                                                <Image
                                                    src={Config.token_image}
                                                    width={25}
                                                    height={25}
                                                    alt="$JOY Icon"
                                                    className="rounded-full"
                                                />
                                            </div>
                                            <span>{Config.token}</span>
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        className={`w-full text-xl text-right text-gray-500 bg-transparent focus:outline-none ${isWrap? "text-white": "cursor-not-allowed text-gray-500"}`}
                                        placeholder="0"
                                        // value={
                                        //     isTokenToNFT
                                        //         ? formatPrice(
                                        //               bignum_to_num(collection.swap_price) /
                                        //                   Math.pow(10, collection.token_decimals),
                                        //               3,
                                        //           )
                                        //         : formatPrice(outAmount, 3)
                                        // }
                                        // onChange={(e) => {
                                        //     setTokenAmount(
                                        //         !isNaN(parseFloat(e.target.value)) || e.target.value === ""
                                        //             ? parseFloat(e.target.value)
                                        //             : token_amount,
                                        //     );
                                        // }}
                                        disabled={isWrap? false: true}
                                    />
                                </div>
                            </div>

                            {/* Swap Icon */}
                            <div className="flex justify-center">
                                <button
                                    // onClick={() => setIsTokenToNFT(!isTokenToNFT)}
                                    className="z-50 p-2 mx-auto my-2 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700"
                                    type="button"
                                    onClick={() => setIsWrap(!isWrap)}
                                >
                                    <IoSwapVertical size={18} className="opacity-75" />
                                </button>
                            </div>

                            {/* To Token Input */}
                            <div className={`${isWrap? "mb-3 -mt-6":""}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm">{!isWrap ? `You're Swapping` : "To Receive"}</div>

                                    <div className="flex items-center gap-1 opacity-75">
                                        <FaWallet size={12} />
                                        <p className="text-sm">
                                            {/* {nftBalance + userListedNFTs.length}
                                                        {collection.collection_symbol} */}
                                            999 WSOL
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-xl">
                                    <button className="flex items-center gap-2 rounded-lg bg-gray-700 px-2.5 py-1.5">
                                        <div className="w-6">
                                            <Image
                                                src={Config.token_image}
                                                width={25}
                                                height={25}
                                                alt="BOY Icon"
                                                className="rounded-full"
                                            />
                                        </div>
                                        <span className="text-nowrap">W{Config.token}</span>
                                    </button>
                                    <input
                                        type="text"
                                        className={`w-full text-xl text-right bg-transparent focus:outline-none ${!isWrap? "text-white": "cursor-not-allowed text-gray-500"}`}
                                        placeholder="0"
                                        disabled={isWrap? true: false}
                                    />
                                </div>
                            </div>
                        </div>

                        <HStack className="mt-3">
                            {isWrap ? (
                                <Button
                                    className="!bg-custom-gradient text-white"
                                    onClick={() => WrapSOL(0.0001 * 1e9)}
                                    isLoading={false}
                                    loadingText="Loading"
                                >
                                    Wrap
                                </Button>
                            ) : (
                                <Button
                                    className="!bg-custom-gradient text-white"
                                    onClick={() => UnWrapSOL(0.0001 * 1e9)}
                                    isLoading={false}
                                    loadingText="Loading"
                                >
                                    UnWrap
                                </Button>
                            )}
                        </HStack>
                    </FormControl>
                </VStack>
            </Box>
        </form>
    );
};

export default WrapToken;
