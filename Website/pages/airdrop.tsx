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

export const AirdropPage = () => {
    const { xs, sm, md, lg } = useResponsive();
    const toast = useToast();
    const [mintAddress, setMintAddress] = useState("");
    const [airdroppedToken, setAirdroppedToken] = useState("");

    const [distributionType, setDistributionType] = useState<"fixed" | "even" | "proRata">("fixed");
    const [activeTab, setActiveTab] = useState("Scan");
    const [amount, setAmount] = useState("");
    const [threshold, setThreshold] = useState("0");
    const [airdropProgress, setAirdropProgress] = useState(0);
    const [isAirdropping, setIsAirdropping] = useState(false);

    const [signatures, setSignatures] = useState<Map<string, string>>(new Map());

    const {
        takeSnapshot,
        calculateAirdropAmounts,
        executeAirdrop,
        setHolders,
        filterHolders,
        setAirdroppedMint,
        holders,
        filteredHolders,
        snapshotMint,
        snapshotCollection,
        airdroppedMint,
        isLoading,
        error,
    } = useAirdrop();

    // Modify this section in the distribution calculations
    const distributions = useMemo(() => {
        // If holders have CSV amounts, use those directly and disable the distribution controls
        const hasPresetAmounts = holders.some(holder => holder.amount !== undefined);
        if (hasPresetAmounts) {
            return holders.map(holder => ({
                address: holder.address,
                amount: holder.amount || "0"
            }));
        }
        
        // Otherwise use the original calculation
        if (!amount || !holders.length) return [];
        return calculateAirdropAmounts(amount, distributionType);
    }, [amount, holders, distributionType, calculateAirdropAmounts]);


    const handleMintInput = (value: string) => {
        setMintAddress(value);
        setAirdropProgress(0);
    };

    const handleAirdropInput = async () => {
        let airdroppedMint = await getMintData(airdroppedToken);
        setAirdroppedMint(airdroppedMint);
    };

    const handleThresholdChange = (value: string) => {
        setThreshold(value);
        let thresholdFloat = parseFloat(value);
        if (isFinite(thresholdFloat)) {
            filterHolders(value);
        }
    };

    const handleSnapshot = async (e) => {
        console.log(mintAddress, "mintAddress");
        try {
            if (!mintAddress) {
                toast({
                    title: "Error",
                    description: "Please enter a mint address",
                    status: "error",
                });
                return;
            }

            let snapshotCollection: CollectionV1 | null = null;
            let collectionWithMetadata: CollectionWithMetadata | null = null;

            try {
                const umi = createUmi(Config.RPC_NODE, "confirmed");
                let collection_umiKey = publicKey(mintAddress);
                snapshotCollection = await fetchCollectionV1(umi, collection_umiKey);
            } catch (error) {}
            if (snapshotCollection) {
                console.log(snapshotCollection, "snapshotCollection");
                let icon: string;
                let uri = snapshotCollection.uri;
                uri = uri.replace("https://cf-ipfs.com/", "https://gateway.moralisipfs.com/");

                collectionWithMetadata = { collection: snapshotCollection, metadata: "", icon: "" };

                try {
                    let uri_json = await fetchWithTimeout(uri, 3000).then((res) => res.json());
                    console.log(uri_json);
                    icon = uri_json["image"];
                    collectionWithMetadata.metadata = uri_json;
                    collectionWithMetadata.icon = icon;
                } catch (error) {
                    console.log("error getting uri, using SOL icon");
                    console.log(error);
                    collectionWithMetadata.icon = Config.token_image;
                }
            }

            let snapshotMint = null;
            if (!snapshotCollection) {
                snapshotMint = await getMintData(mintAddress);
            }

            if (!snapshotMint && !snapshotCollection) {
                toast({
                    title: "Error",
                    description: "Invalid mint address",
                    status: "error",
                });
                return;
            }

            const minThreshold = parseFloat(threshold);
            if (isNaN(minThreshold)) {
                toast({
                    title: "Error",
                    description: "Invalid Threshold",
                    status: "error",
                });
                return;
            }

            await takeSnapshot(snapshotMint, collectionWithMetadata, minThreshold);

            toast({
                title: "Success",
                description: "Snapshot completed",
                status: "success",
            });
        } catch (err) {
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to take snapshot",
                status: "error",
            });
        }
    };

    const handleAirdrop = async () => {
        try {
            setIsAirdropping(true);
            const newSignatures = new Map<string, string>();

            await executeAirdrop(distributions, (progress, signature, recipientAddresses) => {
                setAirdropProgress(progress * 100);

                if (signature && recipientAddresses) {
                    recipientAddresses.forEach((address) => {
                        newSignatures.set(address, signature);
                    });
                    setSignatures(new Map(newSignatures));
                }
            });

            toast({
                title: "Success",
                description: "Airdrop completed successfully",
                status: "success",
            });
        } catch (err) {
            toast({
                title: "Error",
                description: err instanceof Error ? err.message : "Failed to execute airdrop",
                status: "error",
            });
        } finally {
            setIsAirdropping(false);
        }
    };

    const handleDeleteHolder = (addressToDelete: string) => {
        // Update holders directly
        const newHolders = holders.filter((holder) => holder.address !== addressToDelete);
        setHolders(newHolders);
    };

    // The download handler function
    const handleDownloadCSV = () => {
        try {
            // 1. Create records from holders data
            const records: AirdropRecord[] = filteredHolders.map((holder) => {
                const distribution = distributions.find((d) => d.address === holder.address);
                return {
                    address: holder.address,
                    currentBalance: holder.balance,
                    airdropAmount: distribution?.amount || "0",
                    signature: "aaaaaaaa", //signatures.get(holder.address) || ''
                };
            });

            // 2. Create CSV header row and format data rows
            const csvRows = [
                // Header row
                ["Wallet Address", "Current Balance", "Airdrop Amount", "Transaction Signature"],
                // Data rows
                ...records.map((record) => [record.address, record.currentBalance, record.airdropAmount, record.signature]),
            ];

            // 3. Convert to CSV string (handle potential commas in data)
            const csvContent = csvRows
                .map((row) =>
                    row
                        .map((cell) =>
                            // Wrap in quotes if contains comma
                            cell.includes(",") ? `"${cell}"` : cell,
                        )
                        .join(","),
                )
                .join("\n");

            // 4. Create and trigger download
            const blob = new Blob([csvContent], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            // Use mint address and timestamp in filename
            link.setAttribute("download", `airdrop_${mintAddress.slice(0, 8)}_${new Date().toISOString().split("T")[0]}.csv`);

            // 5. Trigger download and cleanup
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to download CSV",
                status: "error",
            });
        }
    };

    const { tokenBalance: airdroppedMintTokenBalance } = useTokenBalance(airdroppedMint ? { mintData: airdroppedMint } : null);
    return (
        <form className="mx-auto mt-5 flex w-full flex-col items-center justify-center bg-[#161616] bg-opacity-75 bg-clip-padding px-8 py-6 shadow-2xl backdrop-blur-sm backdrop-filter md:rounded-xl md:border-t-[3px] md:border-orange-700 md:px-12 md:py-8 lg:w-[1075px]">
            <div className="mb-4 flex flex-col gap-2">
                <Text className="text-center text-3xl font-semibold text-white lg:text-4xl">Snapshot / Airdrop Tool</Text>
                {/* <p className="text-center transition-all cursor-pointer text-white/50 hover:text-white">Switch to Advance Mode</p> */}
            </div>
            <div className="-ml-1 flex w-full justify-center gap-1 rounded-md bg-gray-700 p-1 shadow-2xl backdrop-blur-sm backdrop-filter">
                <button
                    onClick={() => setActiveTab("Scan")}
                    className={`h-fit w-full rounded-md font-bold transition-all duration-200 md:text-lg ${
                        activeTab === "Scan" ? "bg-white text-black shadow-lg" : "text-white/70 hover:text-white"
                    } `}
                    type="button"
                >
                    Scan
                </button>
                <button
                    onClick={() => setActiveTab("Upload CSV")}
                    className={`h-fit w-full rounded-md font-bold transition-all duration-200 md:text-lg ${
                        activeTab === "Upload CSV" ? "bg-white text-black shadow-lg" : "text-white/70 hover:text-white"
                    } `}
                    type="button"
                >
                    Upload CSV
                </button>
            </div>
            <Box w={"100%"} mx="auto" className="mt-4">
                <VStack spacing={6} align="stretch">
                    {/* Input Section */}
                    {activeTab === "Scan" && (
                        <FormControl>
                            <HStack>
                                <div className={styles.textLabelInput}>
                                    <Input
                                        className="text-white"
                                        placeholder="Enter Token / Collection Address"
                                        size={lg ? "md" : "lg"}
                                        required
                                        type="text"
                                        value={mintAddress}
                                        onChange={(e) => handleMintInput(e.target.value)}
                                    />
                                </div>
                                <Button
                                    className="!bg-custom-gradient text-white"
                                    onClick={handleSnapshot}
                                    isLoading={isLoading}
                                    loadingText="Loading"
                                >
                                    Get Holders
                                </Button>
                            </HStack>
                        </FormControl>
                    )}

                    {/* Token Info */}
                    {snapshotMint && (
                        <Box>
                            <FormLabel className="min-w-[100px] text-lg text-white">Token Info</FormLabel>

                            <Box className="flex w-1/3 flex-col gap-y-2 rounded-md bg-gray-800 p-3 text-white">
                                {snapshotMint && (
                                    <>
                                        <div className="flex w-fit flex-col gap-2">
                                            <button className="flex items-center gap-2 rounded-lg bg-gray-700 px-2.5 py-1.5">
                                                <div className="">
                                                    <Image
                                                        src={snapshotMint.icon}
                                                        width={25}
                                                        height={25}
                                                        alt="Eth Icon"
                                                        className="rounded-full"
                                                    />
                                                </div>
                                                <span>{snapshotMint.name}</span>
                                            </button>
                                        </div>
                                        <span className="flex w-full justify-between">
                                            <b>Decimals:</b>
                                            <Text> {snapshotMint.mint.decimals}</Text>
                                        </span>
                                        <span className="flex w-full justify-between">
                                            <b>Symbol:</b>
                                            <Text> {snapshotMint.symbol}</Text>
                                        </span>
                                    </>
                                )}
                            </Box>
                        </Box>
                    )}
                    {snapshotCollection && (
                        <Box>
                            <FormLabel className="min-w-[100px] text-lg text-white">Collection Info</FormLabel>

                            <Box className="flex w-1/3 flex-col gap-y-2 rounded-md bg-gray-800 p-3 text-white">
                                {snapshotCollection && (
                                    <>
                                        <div className="flex w-fit flex-col gap-2">
                                            <button className="flex items-center gap-2 rounded-lg bg-gray-700 px-2.5 py-1.5">
                                                <div className="">
                                                    <Image
                                                        src={snapshotCollection.icon}
                                                        width={25}
                                                        height={25}
                                                        alt="Eth Icon"
                                                        className="rounded-full"
                                                    />
                                                </div>
                                                <span>{snapshotCollection.collection.name}</span>
                                            </button>
                                        </div>
                                        <span className="flex w-full justify-between">
                                            <b>Total Minted:</b>
                                            <Text> {snapshotCollection.collection.currentSize}</Text>
                                        </span>
                                    </>
                                )}
                            </Box>
                        </Box>
                    )}
                    {/* CSV Upload Section */}
                    {activeTab === "Upload CSV" && (
                        <FormControl>
                            <CSVUploader
                                onHoldersUpdate={(newHolders) => {
                                    setHolders(newHolders);
                                }}
                            />
                        </FormControl>
                    )}
                    {/* Threshold Input */}
                    {!holders.some(holder => holder.amount !== undefined) && (
                    <FormControl>
                        <FormLabel className="min-w-[100px] text-lg text-white">Minimum Balance Threshold</FormLabel>
                        <div className={styles.textLabelInput}>
                            <Input
                                className="text-white"
                                size={lg ? "md" : "lg"}
                                type="number"
                                value={threshold}
                                onChange={(e) => handleThresholdChange(e.target.value)}
                                min={0}
                            />
                        </div>
                    </FormControl>
                    )}

                    {/* Distribution Type Selection */}
                    {!holders.some(holder => holder.amount !== undefined) && (
                    <FormControl className="text-white">
                        <FormLabel className="min-w-[100px] text-lg text-white">Distribution Type</FormLabel>
                        <RadioGroup value={distributionType} onChange={(value: "fixed" | "even" | "proRata") => setDistributionType(value)}>
                            <Stack direction="row">
                                <Radio value="fixed">Fixed Amount Per Holder</Radio>
                                <Radio value="even">Even Split Per Holder</Radio>
                                <Radio value="proRata">Pro Rata Split</Radio>
                            </Stack>
                        </RadioGroup>
                    </FormControl>
                    )}


                    <FormControl>
                        <FormLabel className="min-w-[100px] text-lg text-white">Airdrop Mint Address</FormLabel>
                        <HStack>
                            <div className={styles.textLabelInput}>
                                <Input
                                    className="text-white"
                                    placeholder="Enter airdrop mint address"
                                    size={lg ? "md" : "lg"}
                                    required
                                    type="text"
                                    value={airdroppedToken}
                                    onChange={(e) => setAirdroppedToken(e.target.value)}
                                />
                            </div>
                            <Button
                                className="!bg-custom-gradient text-white"
                                onClick={() => handleAirdropInput()}
                                isLoading={isLoading}
                                loadingText="Loading"
                            >
                                Set
                            </Button>
                        </HStack>
                    </FormControl>

                    {/* Token Info */}

                    {airdroppedMint && (
                        <Box>
                            <FormLabel className="min-w-[100px] text-lg text-white">Token Info</FormLabel>

                            <Box className="flex w-1/3 flex-col gap-y-2 rounded-md bg-gray-800 p-3 text-white">
                                {airdroppedMint && (
                                    <>
                                        <div className="flex w-fit flex-col gap-2">
                                            <button className="flex items-center gap-2 rounded-lg bg-gray-700 px-2.5 py-1.5">
                                                <div className="">
                                                    <Image
                                                        src={airdroppedMint.icon}
                                                        width={25}
                                                        height={25}
                                                        alt="Eth Icon"
                                                        className="rounded-full"
                                                    />
                                                </div>
                                                <span>{airdroppedMint.name}</span>
                                            </button>
                                        </div>
                                        <span className="flex w-full justify-between">
                                            <b>Decimals:</b>
                                            <Text> {airdroppedMint.mint.decimals}</Text>
                                        </span>
                                        <span className="flex w-full justify-between">
                                            <b>Symbol:</b>
                                            <Text> {airdroppedMint.symbol}</Text>
                                        </span>
                                        <span className="flex w-full justify-between">
                                            <b>Token Balance:</b>
                                            <Text> {airdroppedMintTokenBalance}</Text>
                                        </span>
                                    </>
                                )}
                            </Box>
                        </Box>
                    )}

                    {/* Amount Input */}
                    {!holders.some(holder => holder.amount !== undefined) && (
                    <FormControl>
                        <FormLabel className="min-w-[100px] text-lg text-white">
                            {distributionType === "fixed" ? "Amount Per Holder" : "Total Amount to Distribute"}
                        </FormLabel>
                        <div className={styles.textLabelInput}>
                            <Input
                                className="text-white"
                                size={lg ? "md" : "lg"}
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min={0}
                            />
                        </div>
                    </FormControl>
                    )}
                    {/* Holders Table */}
                    {holders.length > 0 && (
                        <Box overflowX="auto">
                            <Button
                                leftIcon={<RiDownloadLine />} // Using react-icons
                                colorScheme="teal"
                                size="sm"
                                mb={4}
                                onClick={handleDownloadCSV}
                                disabled={holders.length === 0}
                            >
                                Download CSV
                            </Button>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="min-w-[140px]">Wallet</TableHead>
                                        <TableHead className="min-w-[140px]">Current Balance</TableHead>
                                        <TableHead className="min-w-[140px]">Will Receive</TableHead>
                                        <TableHead className="min-w-[140px]">Signature</TableHead>
                                        <TableHead className="min-w-[140px]">Remove</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredHolders
                                        .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance))
                                        .map((holder) => {
                                            const distribution = distributions.find((d) => d.address === holder.address);
                                            const signature = signatures.get(holder.address);

                                            return (
                                                <TableRow
                                                    key={holder.address}
                                                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                                                >
                                                    <TableCell className="font-mono text-sm">
                                                        {holder.address.slice(0, 4)}...{holder.address.slice(-4)}
                                                    </TableCell>
                                                    <TableCell>{holder.balance}</TableCell>
                                                    <TableCell>{distribution?.amount || "0"}</TableCell>
                                                    <TableCell>
                                                        {signature && (
                                                            <a
                                                                href={`https://solscan.io/tx/${signature}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="font-mono text-sm text-blue-500 hover:text-blue-600"
                                                            >
                                                                {signature.slice(0, 4)}...{signature.slice(-4)}
                                                            </a>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <IconButton
                                                            aria-label="Remove address"
                                                            icon={<RiDeleteBinLine />}
                                                            size="sm"
                                                            colorScheme="red"
                                                            variant="ghost"
                                                            onClick={() => handleDeleteHolder(holder.address)}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                </TableBody>
                            </Table>
                            {/* Airdrop Progress */}
                            {isAirdropping && (
                                <Box mt={4}>
                                    <Progress value={airdropProgress} />
                                </Box>
                            )}

                            {/* Airdrop Button */}
                            <div className="flex w-full justify-center">
                                <Button
                                    mt={4}
                                    colorScheme="green"
                                    onClick={handleAirdrop}
                                    isLoading={isAirdropping}
                                    loadingText="Airdropping"
                                    disabled={!distributions.length}
                                    className="!bg-custom-gradient"
                                >
                                    Start Airdrop
                                </Button>
                            </div>
                        </Box>
                    )}

                    {/* Error Display */}
                    {error && <Text color="red.500">{error}</Text>}
                </VStack>
            </Box>
        </form>
    );
};

export default AirdropPage;
