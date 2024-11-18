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

                // Track unique addresses and duplicates
                const addressSet = new Set<string>();
                const duplicates = new Set<string>();
                const invalidAddresses: string[] = [];
                const validHolders: { address: string; balance: string }[] = [];

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
                    validHolders.push({
                        address,
                        balance: "1", // Set balance to 1 for all addresses
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
            <div className="flex flex-col items-center justify-center p-6 rounded-lg cursor-pointer border-1" style={{backgroundColor: "#454444"}}>
                <div className="flex flex-col items-center justify-center">
                    <RiUploadLine className="w-8 h-8 mb-2 text-white" />
                    <Text className="text-sm text-center text-white">
                        {isProcessing ? "Processing..." : "Click to upload token / collection addresses CSV"}
                    </Text>
                    <Text className="mt-1 text-xs text-gray-500">
                        CSV must contain an "address" column
                    </Text>
                </div>
                <input
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                />
            </div>
        </Box>
    );
};

export default CSVUploader;
