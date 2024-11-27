import { useState } from "react";
import { Box, Button, FormControl, FormLabel, VStack, useToast, Text } from "@chakra-ui/react";
import Papa from "papaparse";
import { RiUploadLine } from "react-icons/ri";
import styles from "../styles/Launch.module.css";

interface TokenHolder {
    address: string;
    balance: string;
    amount?: string;
    airdropAddress?: string;
}

interface CSVUploaderProps {
    onHoldersUpdate: (holders: TokenHolder[]) => void;
}

export const CSVUploader = ({ onHoldersUpdate }: CSVUploaderProps) => {
    const toast = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const processCSV = (file: File) => {
        setIsProcessing(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                // Validate CSV structure
                if (!results.meta.fields?.includes("address")) {
                    toast({
                        title: "Error",
                        description: "CSV must contain an 'address' column",
                        status: "error",
                    });
                    setIsProcessing(false);
                    return;
                }

                const hasAirdropQuantityColumn = results.meta.fields.includes("airdropQuantity");
                const hasAirdropAddressColumn = results.meta.fields.includes("airdropAddress");

                // Track unique addresses and duplicates
                const addressSet = new Set<string>();
                const duplicates = new Set<string>();
                const invalidAddresses: string[] = [];
                const invalidAirdropAddresses: string[] = [];
                const validHolders: TokenHolder[] = [];

                // Check for empty quantity values if quantity column exists
                if (hasAirdropQuantityColumn) {
                    const emptyQuantityRows = results.data.filter((row: any) => {
                        return row.address?.trim() && (!row.airdropQuantity || row.airdropQuantity.trim() === "");
                    });

                    if (emptyQuantityRows.length > 0) {
                        toast({
                            title: "Error",
                            description: `Found ${emptyQuantityRows.length} rows with empty airdropQuantity values. All quantity values must be filled when using the quantity column.`,
                            status: "error",
                        });
                        setIsProcessing(false);
                        return;
                    }
                }

                // Check for empty quantity values if quantity column exists
                if (hasAirdropAddressColumn) {
                    const emptyAddressRows = results.data.filter((row: any) => {
                        return row.address?.trim() && (!row.airdropAddress || row.airdropAddress.trim() === "");
                    });

                    if (emptyAddressRows.length > 0) {
                        toast({
                            title: "Error",
                            description: `Found ${emptyAddressRows.length} rows with empty airdropAddress values. All airdropAddress values must be filled when using the airdropAddress column.`,
                            status: "error",
                        });
                        setIsProcessing(false);
                        return;
                    }
                }

                // Process each row
                results.data.forEach((row: any) => {
                    if (!row.address?.trim()) return;

                    const address = row.address.trim();
                    const airdropAddress = row.airdropAddress?.trim();

                    // Check if address is valid Solana address
                    if (!address.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
                        invalidAddresses.push(address);
                        return;
                    }

                    // Check if airdrop address is valid when provided
                    if (airdropAddress && !airdropAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
                        invalidAirdropAddresses.push(airdropAddress);
                        return;
                    }

                    // Check for duplicates
                    if (addressSet.has(address)) {
                        duplicates.add(address);
                        return;
                    }

                    // Add to unique set and valid holders
                    addressSet.add(address);

                    // Always set balance to "1", but use quantity for airdrop amount if available
                    const balance = "1";
                    let airdropAmount: string | undefined;

                    if (hasAirdropQuantityColumn) {
                        const airdropQuantity = parseFloat(row.airdropQuantity);
                        if (!isNaN(airdropQuantity) && airdropQuantity > 0) {
                            airdropAmount = airdropQuantity.toString();
                        } else {
                            toast({
                                title: "Error",
                                description: `Invalid airdropQuantity value for address ${address}. AirdropQuantity must be a positive number.`,
                                status: "error",
                            });
                            setIsProcessing(false);
                            return;
                        }
                    }

                    validHolders.push({
                        address,
                        balance,
                        amount: airdropAmount,
                        airdropAddress: airdropAddress || undefined,
                    });
                });

                // Handle validation results
                if (invalidAddresses.length > 0) {
                    toast({
                        title: "Error",
                        description: `Found ${invalidAddresses.length} invalid Solana addresses`,
                        status: "error",
                    });
                    setIsProcessing(false);
                    return;
                }

                if (invalidAirdropAddresses.length > 0) {
                    toast({
                        title: "Error",
                        description: `Found ${invalidAirdropAddresses.length} invalid airdrop token addresses`,
                        status: "error",
                    });
                    setIsProcessing(false);
                    return;
                }

                if (duplicates.size > 0) {
                    toast({
                        title: "Warning",
                        description: `Removed ${duplicates.size} duplicate addresses`,
                        status: "warning",
                    });
                }

                // Pass processed data to parent component
                onHoldersUpdate(validHolders);

                toast({
                    title: "Success",
                    description: `Successfully processed ${validHolders.length} unique addresses`,
                    status: "success",
                });
                setIsProcessing(false);
            },
            error: (error) => {
                toast({
                    title: "Error",
                    description: "Error processing CSV: " + error.message,
                    status: "error",
                });
                setIsProcessing(false);
            },
        });
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".csv")) {
            toast({
                title: "Error",
                description: "Please upload a CSV file",
                status: "error",
            });
            return;
        }
        processCSV(file);
    };

    return (
        <Box className="w-full">
            <label className="w-full cursor-pointer">
                <div
                    className="border-1 flex cursor-pointer flex-col items-center justify-center rounded-lg p-6"
                    style={{ backgroundColor: "#454444" }}
                >
                    <div className="flex flex-col items-center justify-center">
                        <RiUploadLine className="mb-2 h-8 w-8 text-white" />
                        <Text className="text-center text-sm text-white">
                            {isProcessing ? "Processing..." : "Click to upload token / collection addresses CSV"}
                        </Text>
                        <Text className="mt-1 text-xs text-gray-500">
                            CSV must contain an "address" column and optional "airdropQuantity" and "airdropAddress"
                        </Text>
                    </div>
                    <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} disabled={isProcessing} />
                </div>
            </label>
        </Box>
    );
};

export default CSVUploader;
