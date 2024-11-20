import { useState } from "react";
import { Box, Button, FormControl, FormLabel, VStack, useToast, Text } from "@chakra-ui/react";
import Papa from "papaparse";
import { RiUploadLine } from "react-icons/ri";
import styles from "../styles/Launch.module.css";

interface CSVUploaderProps {
    onHoldersUpdate: (holders: { address: string; balance: string }[]) => void;
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

                const hasQuantityColumn = results.meta.fields.includes("quantity");


                // Track unique addresses and duplicates
                const addressSet = new Set<string>();
                const duplicates = new Set<string>();
                const invalidAddresses: string[] = [];
                const validHolders: { address: string; balance: string }[] = [];

                // Check for empty quantity values if quantity column exists
                if (hasQuantityColumn) {
                    const emptyQuantityRows = results.data.filter((row: any) => {
                        return row.address?.trim() && (!row.quantity || row.quantity.trim() === '');
                    });

                    if (emptyQuantityRows.length > 0) {
                        toast({
                            title: "Error",
                            description: `Found ${emptyQuantityRows.length} rows with empty quantity values. All quantity values must be filled when using the quantity column.`,
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

                    // Check if address is valid Solana address
                    if (!address.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
                        invalidAddresses.push(address);
                        return;
                    }

                    // Check for duplicates
                    if (addressSet.has(address)) {
                        duplicates.add(address);
                        return;
                    }

                    // Add to unique set and valid holders
                    addressSet.add(address);

                     // Use quantity if available and valid, otherwise default to "1"
                     let balance = "1";
                     if (hasQuantityColumn) {
                         const quantity = parseFloat(row.quantity);
                         if (!isNaN(quantity) && quantity > 0) {
                             balance = quantity.toString();
                         } else {
                             toast({
                                 title: "Error",
                                 description: `Invalid quantity value for address ${address}. Quantity must be a positive number.`,
                                 status: "error",
                             });
                             setIsProcessing(false);
                             return;
                         }
                     }

                    validHolders.push({
                        address,
                        balance
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
            <div
                className="border-1 flex cursor-pointer flex-col items-center justify-center rounded-lg p-6"
                style={{ backgroundColor: "#454444" }}
            >
                <div className="flex flex-col items-center justify-center">
                    <RiUploadLine className="mb-2 h-8 w-8 text-white" />
                    <Text className="text-center text-sm text-white">
                        {isProcessing ? "Processing..." : "Click to upload token / collection addresses CSV"}
                    </Text>
                    <Text className="mt-1 text-xs text-gray-500">CSV must contain an "address" column and optional "quantity"</Text>
                </div>
                <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} disabled={isProcessing} />
            </div>
        </Box>
    );
};

export default CSVUploader;
