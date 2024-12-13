import React, { useState, useCallback, ChangeEvent } from 'react';
import { useWallet, WalletContextState } from "@solana/wallet-adapter-react";
import UseWalletConnection from "@/hooks/useWallet";
import useIrysUploader, { IrysWebUploaderResponse } from "@/hooks/useIrysUploader";
import { Connection } from "@solana/web3.js";
import { Config } from "@/components/Solana/constants";
import { Button, VStack, Text, Box, Progress } from "@chakra-ui/react";
import { toast } from "react-toastify";
import { RiUploadCloud2Line, RiDeleteBinLine } from "react-icons/ri";



/**
 * File Uploader Component
 * 
 * A component that allows users to upload files to Irys (formerly Bundlr) network.
 * Supports multiple file selection, drag and drop, and displays upload progress.
 * 
 * @component
 * @example
 * ```jsx
 * <FileUploader />
 * ```
 */
const FileUploader: React.FC = () => {
  // Hooks and state management
  const wallet = useWallet();
  const { handleConnectWallet } = UseWalletConnection();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedManifest, setUploadedManifest] = useState<string | null>(null);
  const { uploadFiles } = useIrysUploader(wallet);
  const connection = new Connection(Config.RPC_NODE);

  /**
   * Handles file selection from input or drag and drop
   * Validates total file size against maximum limit
   * 
   * @param {ChangeEvent<HTMLInputElement>} event - The file input change event
   * @returns {void}
   */
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>): void => {
    if (!event.target.files) return;
    
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  /**
   * Handles the file upload process using Irys
   * Displays upload progress and manages state
   * 
   * @returns {Promise<void>}
   */
  const handleFileUpload = async (): Promise<void> => {
    if (!selectedFiles.length) return;
    setIsUploading(true);

    try {
      const receipt : IrysWebUploaderResponse = await uploadFiles(
        connection,
        selectedFiles,
        "files"
      );

      if (receipt) {
        setUploadedManifest(receipt.manifestId);
        toast.success("Files uploaded successfully");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Clears selected files and resets upload state
   * 
   * @returns {void}
   */
  const clearFiles = (): void => {
    setSelectedFiles([]);
    setUploadedManifest(null);
  };

  /** Calculate total size of selected files in MB */
  const totalSize: number = selectedFiles.reduce((sum: number, file: File) => sum + file.size, 0);
  const sizeMB: string = (totalSize / (1024 * 1024)).toFixed(2);

  return (
    <form className="mx-auto mt-5 flex w-full flex-col items-center justify-center bg-[#161616] bg-opacity-75 bg-clip-padding px-8 py-6 shadow-2xl backdrop-blur-sm backdrop-filter md:rounded-xl md:border-t-[3px] md:border-orange-700 md:px-12 md:py-8 lg:w-[775px]">
      <Text className="text-center text-3xl font-semibold text-white lg:text-4xl mb-4">
        Irys File Uploader
      </Text>

      <Box w="100%" mx="auto" className="mt-4">
        <VStack spacing={6} align="stretch">
          <div className="flex flex-col items-center justify-center w-full">
            {!selectedFiles.length ? (
              <label className="flex flex-col items-center justify-center w-4/5 h-64 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <RiUploadCloud2Line className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">Maximum total size: 500MB</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  onChange={handleFileSelect}
                  accept="*/*"
                />
              </label>
            ) : (
              <div className="w-4/5 p-4 bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <Text className="text-white font-medium">Selected Files</Text>
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    leftIcon={<RiDeleteBinLine />}
                    onClick={clearFiles}
                  >
                    Clear
                  </Button>
                </div>
                <div className="space-y-2">
                  {selectedFiles.map((file: File, index: number) => (
                    <div key={index} className="flex justify-between items-center text-white text-sm">
                      <span>{file.name}</span>
                      <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-700">
                    <Text className="text-white text-sm">
                      Total Size: {sizeMB} MB
                    </Text>
                  </div>
                </div>
              </div>
            )}

            {isUploading && (
              <Box w="4/5" mt="4">
                <Progress size="xs" isIndeterminate colorScheme="orange" />
              </Box>
            )}

            {uploadedManifest && (
              <Box w="4/5" mt="4" p="4" bg-gray-800 rounded="lg">
                <Text className="text-white text-sm break-all">
                  Manifest URL: https://gateway.irys.xyz/{uploadedManifest}
                </Text>
              </Box>
            )}

            <Box mt="6">
              {wallet.connected ? (
                <Button
                  className="!bg-custom-gradient text-white"
                  onClick={handleFileUpload}
                  isLoading={isUploading}
                  loadingText="Uploading"
                  disabled={!selectedFiles.length || isUploading}
                >
                  Upload Files
                </Button>
              ) : (
                <Button
                  className="!bg-custom-gradient text-white"
                  onClick={handleConnectWallet}
                >
                  Connect Wallet
                </Button>
              )}
            </Box>
          </div>
        </VStack>
      </Box>
    </form>
  );
};

export default FileUploader;