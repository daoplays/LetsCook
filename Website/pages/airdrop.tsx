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

interface AirdropRecord {
    address: string; // wallet address
    currentBalance: string; // their token balance
    airdropAmount: string; // what they'll receive
    signature?: string; // transaction signature if airdrop completed
}

export const AirdropPage = () => {
    const { sm, md, lg } = useResponsive();
    const toast = useToast();
    const [mintAddress, setMintAddress] = useState("");
    const [distributionType, setDistributionType] = useState<"fixed" | "even" | "proRata">("fixed");
    const [amount, setAmount] = useState("");
    const [threshold, setThreshold] = useState("0");
    const [airdropProgress, setAirdropProgress] = useState(0);
    const [completedAirdrops, setCompletedAirdrops] = useState<Set<string>>(new Set());
    const [isAirdropping, setIsAirdropping] = useState(false);

    const { takeSnapshot, calculateAirdropAmounts, executeAirdrop, setHolders, holders, filteredHolders, mintData, isLoading, error } =
        useAirdrop();

    // Calculate airdrop distributions whenever relevant inputs change
    const distributions = useMemo(() => {
        if (!amount || !holders.length) return [];
        return calculateAirdropAmounts(amount, distributionType);
    }, [amount, holders, distributionType, calculateAirdropAmounts]);

    const handleMintInput = (value: string) => {
        setMintAddress(value);
        setCompletedAirdrops(new Set());
        setAirdropProgress(0);
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

            // Validate mint address
            try {
                new PublicKey(mintAddress);
            } catch {
                toast({
                    title: "Error",
                    description: "Invalid mint address",
                    status: "error",
                });
                return;
            }

            await takeSnapshot(mintAddress, threshold);

            toast({
                title: "Success",
                description: "Token holder snapshot completed",
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
            setCompletedAirdrops(new Set());

            await executeAirdrop(distributions, (progress) => {
                setAirdropProgress(progress * 100);
                // Mark recipients in the current batch as complete
                const batchSize = 8;
                const completedIndex = Math.floor((progress * distributions.length) / batchSize) * batchSize;
                const newCompleted = new Set(completedAirdrops);
                for (let i = 0; i < completedIndex; i++) {
                    newCompleted.add(distributions[i].address);
                }
                setCompletedAirdrops(newCompleted);
            });

            // Mark all as complete
            setCompletedAirdrops(new Set(distributions.map((d) => d.address)));

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

    console.log("holders", holders);
    return (
        <form className="mx-auto mt-5 flex w-full flex-col items-center justify-center bg-[#161616] bg-opacity-75 bg-clip-padding px-8 py-6 shadow-2xl backdrop-blur-sm backdrop-filter md:rounded-xl md:border-t-[3px] md:border-orange-700 md:px-12 md:py-8 lg:w-[1075px]">
            <div className="mb-4 flex flex-col gap-2">
                <Text className="text-center text-3xl font-semibold text-white lg:text-4xl">Airdrop</Text>
                {/* <p className="cursor-pointer text-center text-white/50 transition-all hover:text-white">Switch to Advance Mode</p> */}
            </div>
            <Box w={"100%"} mx="auto">
                <VStack spacing={6} align="stretch">
                    {/* Input Section */}
                    <FormControl>
                        <FormLabel className="min-w-[100px] text-lg text-white">Token Mint Address</FormLabel>
                        <HStack>
                            <div className={styles.textLabelInput}>
                                <Input
                                    className="text-white"
                                    placeholder="Enter token mint address"
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

                    {/* Threshold Input */}
                    <FormControl>
                        <FormLabel className="min-w-[100px] text-lg text-white">Minimum Balance Threshold</FormLabel>
                        <div className={styles.textLabelInput}>
                            <Input
                                className="text-white"
                                size={lg ? "md" : "lg"}
                                type="number"
                                value={threshold}
                                onChange={(e) => setThreshold(e.target.value)}
                                min={0}
                            />
                        </div>
                    </FormControl>

                    {/* Distribution Type Selection */}
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

                    {/* Amount Input */}
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

                    {/* Token Info */}
                    {mintData && (
                        <Box borderWidth={1} borderRadius="md" p={4} className={`${styles.textLabelInput} bg-[#454444] text-white`}>
                            <Text fontWeight="bold">Token Info</Text>
                            <Text>Decimals: {mintData.mint.decimals}</Text>
                            {mintData && (
                                <>
                                    <Text>Name: {mintData.name}</Text>
                                    <Text>Symbol: {mintData.symbol}</Text>
                                </>
                            )}
                        </Box>
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
                                        <TableHead className="min-w-[140px]">Status</TableHead>
                                        <TableHead className="min-w-[140px]">Wallet</TableHead>
                                        <TableHead className="min-w-[140px]">Current Balance</TableHead>
                                        <TableHead className="min-w-[140px]">Will Receive</TableHead>
                                        <TableHead className="min-w-[140px]">Signature</TableHead>
                                        <TableHead className="min-w-[140px]">Remove</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {holders.map((holder) => {
                                        const distribution = distributions.find((d) => d.address === holder.address);
                                        const isCompleted = completedAirdrops.has(holder.address);
                                        const signature = "aaaaaaaaaaaa"; // signatures.get(holder.address);

                                        return (
                                            <TableRow key={holder.address} className="hover:bg-muted/50 cursor-pointer transition-colors">
                                                <TableCell>{isCompleted ? "✓" : ""}</TableCell>
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
                            <div className="w-full flex justify-center">
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