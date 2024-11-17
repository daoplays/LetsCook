import { useState, useCallback, useRef } from "react";
import {
    Connection,
    PublicKey,
    Keypair,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
    ComputeBudgetProgram,
} from "@solana/web3.js";
import {
    createInitializeMintInstruction,
    createAssociatedTokenAccountInstruction,
    createMintToInstruction,
    getAssociatedTokenAddress,
    ExtensionType,
    getMintLen,
    TOKEN_2022_PROGRAM_ID,
    createInitializeMetadataPointerInstruction,
    createInitializeInstruction,
} from "@solana/spl-token";
import { pack, TokenMetadata } from "@solana/spl-token-metadata";

import { getRecentPrioritizationFees, get_current_blockhash, send_transaction } from "@/components/Solana/state";
import { toast } from "react-toastify";
import { Config, TIMEOUT } from "@/components/Solana/constants";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";
import useIrysUploader from "./useIrysUploader";

export const useCreateToken2022 = () => {
    const wallet = useWallet();
    const { connection } = useConnection();
    const { uploadFiles } = useIrysUploader(wallet);


    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        signature_ws_id.current = null;
        setIsLoading(false);
        // if we have a subscription field check against ws_id
        if (result.err !== null) {
            toast.error("Transaction failed, please try again", {
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }

        toast.success("Transaction Successfull!", {
            type: "success",
            isLoading: false,
            autoClose: 3000,
        });
    }, []);

    const transaction_failed = useCallback(async () => {
        if (signature_ws_id.current == null) return;

        signature_ws_id.current = null;
        setIsLoading(false);

        toast.error("Transaction not processed, please try again", {
            type: "error",
            isLoading: false,
            autoClose: 3000,
        });
    }, []);

    const CreateToken = async (name: string, symbol: string, decimals: number, initialSupply: number, icon_file : File, description : string) => {
        setIsLoading(true);
        setError(null);

        try {
          let icon_url = ""
          
          try {
              let receipt = await uploadFiles(connection, [icon_file], "Images");

              console.log(receipt, "https://gateway.irys.xyz/" + receipt.manifest.paths[icon_file.name].id);

              icon_url =
                  "https://gateway.irys.xyz/" + receipt.manifest.paths[icon_file.name].id;
          } catch (e) {
              console.log(e);
              setIsLoading(false);
              return;
          }
      

            var metadata = {
                name: name,
                symbol: symbol,
                description: description,
                image: icon_url,
            };
            let uri = ""
            const jsn = JSON.stringify(metadata);
            const blob = new Blob([jsn], { type: "application/json" });
            const json_file = new File([blob], "metadata.json");

            try {
                let receipt = await uploadFiles(connection, [json_file], "Metadata");

                console.log("json recipet", receipt, "https://gateway.irys.xyz/" + receipt.manifest.paths[json_file.name].id);

                uri = "https://gateway.irys.xyz/" + receipt.manifest.paths[json_file.name].id;
            } catch (e) {
                console.log(e);
                setIsLoading(false);
                return;
            }
       

            // Generate a new mint address
            const mintKeypair = Keypair.generate();
            const mintAuthority = wallet.publicKey;
            const freezeAuthority = wallet.publicKey;

            // Calculate space for the mint with metadata extension
            const extensionTypes = [ExtensionType.MetadataPointer];
            const mintLen = getMintLen(extensionTypes);

            // Get the token account address for the creator
            const tokenAccount = await getAssociatedTokenAddress(mintKeypair.publicKey, wallet.publicKey, false, TOKEN_2022_PROGRAM_ID);

            let tokenMetadata : TokenMetadata = {
                name: name,
                symbol: symbol,
                uri: uri,
                updateAuthority: wallet.publicKey,
                mint: mintKeypair.publicKey,
                additionalMetadata: [],
            };

            const metadataBuffer = pack(tokenMetadata);

            // Calculate rent
            let lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metadataBuffer.length + 8);


            // Create instructions array
            const instructions = [
                // Create mint account
                SystemProgram.createAccount({
                    fromPubkey: wallet.publicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    space: mintLen,
                    lamports,
                    programId: TOKEN_2022_PROGRAM_ID,
                }),

                // Initialize metadata extension
                createInitializeMetadataPointerInstruction(
                    mintKeypair.publicKey,
                    wallet.publicKey,
                    mintKeypair.publicKey,
                    TOKEN_2022_PROGRAM_ID,
                ),

                // Initialize mint
                createInitializeMintInstruction(mintKeypair.publicKey, decimals, mintAuthority, freezeAuthority, TOKEN_2022_PROGRAM_ID),

                createInitializeInstruction({
                    programId: TOKEN_2022_PROGRAM_ID,
                    mint: mintKeypair.publicKey,
                    metadata: mintKeypair.publicKey,
                    name: name,
                    symbol: symbol,
                    uri: uri,
                    mintAuthority: wallet.publicKey,
                    updateAuthority: wallet.publicKey,
                }),

                

                // Create token account for creator
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey, // payer
                    tokenAccount, // ata
                    wallet.publicKey, // owner
                    mintKeypair.publicKey, // mint
                    TOKEN_2022_PROGRAM_ID,
                ),

                // Mint initial supply to creator
                createMintToInstruction(
                    mintKeypair.publicKey, // mint
                    tokenAccount, // destination
                    mintAuthority, // authority
                    initialSupply * 10 ** decimals, // amount (adjusted for decimals)
                    [], // signer array
                    TOKEN_2022_PROGRAM_ID,
                ),
            ];

            let list_txArgs = await get_current_blockhash("");

            let list_transaction = new Transaction(list_txArgs);
            list_transaction.feePayer = wallet.publicKey;
            let feeMicroLamports = await getRecentPrioritizationFees(Config.PROD);
            list_transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: feeMicroLamports }));

            list_transaction.add(...instructions);

            list_transaction.partialSign(mintKeypair);

            let signed_transaction = await wallet.signTransaction(list_transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            let signature = transaction_response.result;
            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
            setTimeout(transaction_failed, TIMEOUT);

            console.log("new token sig: ", signature);
        } catch (error) {
            console.log(error);
            return;
        }
    };

    return {
        CreateToken,
        isLoading,
        error,
    };
};

export default useCreateToken2022;
