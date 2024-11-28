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
    const toast = useToast();
    const [amount, setAmount] = useState("");

    const {WrapSOL} = useWrapSOL();
    const {UnWrapSOL} = useUnWrapSOL();

    return (
        <form className="mx-auto mt-5 flex w-full flex-col items-center justify-center bg-[#161616] bg-opacity-75 bg-clip-padding px-8 py-6 shadow-2xl backdrop-blur-sm backdrop-filter md:rounded-xl md:border-t-[3px] md:border-orange-700 md:px-12 md:py-8 lg:w-[1075px]">
            <div className="mb-4 flex flex-col gap-2">
                <Text className="text-center text-3xl font-semibold text-white lg:text-4xl">Wrap/UnWrap Tool</Text>
                {/* <p className="text-center transition-all cursor-pointer text-white/50 hover:text-white">Switch to Advance Mode</p> */}
            </div>

            <Box w={"100%"} mx="auto" className="mt-4">
                <VStack spacing={6} align="stretch">
                    {/* Input Section */}
                        <FormControl>
                            <HStack>
                              
                                <Button
                                    className="!bg-custom-gradient text-white"
                                    onClick={() => WrapSOL(0.0001 * 1e9)}
                                    isLoading={false}
                                    loadingText="Loading"
                                >
                                    Wrap
                                </Button>
                                <Button
                                    className="!bg-custom-gradient text-white"
                                    onClick={() => UnWrapSOL(0.0001 * 1e9)}
                                    isLoading={false}
                                    loadingText="Loading"
                                >
                                    UnWrap
                                </Button>
                            </HStack>
                        </FormControl>
                    
                </VStack>
            </Box>
        </form>
    );
};

export default WrapToken;
