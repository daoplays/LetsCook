import { useState, useCallback, useEffect } from "react";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction, ACCOUNT_SIZE } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { bignum_to_num, MintData, TokenAccount } from "@/components/Solana/state";
import { getMintData } from "@/components/amm/launch";
import { toast } from "react-toastify";
import { CollectionV1 } from "@metaplex-foundation/mpl-core";
import { getCollectionAssets } from "./data/useNFTBalance";
import { AssetWithMetadata } from "@/pages/collection/[pageName]";
import { CollectionWithMetadata } from "@/pages/airdrop";
import useSendTransaction from "./useSendTransaction";

interface TokenHolder {
    address: string;
    balance: string;
    amount?: string;
    airdropAddress?: string;
}

export interface AirdropRecipient {
    address: string;
    amount: string;
    airdropAddress?: string;
}

type DistributionType = "fixed" | "even" | "proRata";

export const useAirdrop = () => {
    const { connection } = useConnection();
    const wallet = useWallet();

    const {sendTransaction} = useSendTransaction();

    const [distributions, setDistributions] = useState<AirdropRecipient[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [holders, setHolders] = useState<TokenHolder[]>([]);
    const [filteredHolders, setFilteredHolders] = useState<TokenHolder[]>([]);
    const [snapshotMint, setSnapshotMint] = useState<MintData | null>(null);
    const [snapshotCollection, setSnapshotCollection] = useState<CollectionWithMetadata | null>(null);

    const [airdroppedMint, setAirdroppedMint] = useState<MintData | null>(null);

    const [threshold, setThreshold] = useState<number>(0);

    const mintDataCache = new Map<string, MintData>();

    const takeSnapshot = useCallback(
        async (
            snapshotMint: MintData | null,
            snapshotCollection: CollectionWithMetadata | null,
            minThreshold: number = 0,
        ): Promise<TokenHolder[]> => {
            setIsLoading(true);
            setError(null);

            try {
                // Get mint data using provided function
                setSnapshotMint(snapshotMint);
                setSnapshotCollection(snapshotCollection);

                if (!snapshotMint && !snapshotCollection) {
                    toast.error("Snapshot mint and collection not set.");
                    return [];
                }

                // Process accounts and aggregate balances by owner
                const holdersMap = new Map<string, number>();

                let accounts;
                if (snapshotMint) {
                    let mint_bytes = snapshotMint.mint.address.toBase58();

                    // Get all token accounts for this mint
                    accounts = await connection.getProgramAccounts(snapshotMint.token_program, {
                        filters: [
                            {
                                memcmp: {
                                    offset: 0,
                                    bytes: mint_bytes,
                                },
                            },
                        ],
                    });

                    for (const { account } of accounts) {
                        // Deserialize account data using provided TokenAccount struct
                        const [tokenAccount] = TokenAccount.struct.deserialize(account.data);

                        console.log(tokenAccount, tokenAccount.owner.toString());

                        // Skip closed or frozen accounts
                        if (tokenAccount.state !== 0) continue;

                        const ownerAddress = tokenAccount.owner.toString();
                        const scaled_balance = BigInt(tokenAccount.amount.toString()) / BigInt(Math.pow(10, snapshotMint.mint.decimals));
                        const balance = Number(scaled_balance);

                        if (balance === 0) continue;

                        holdersMap.set(ownerAddress, balance);
                    }
                }

                if (snapshotCollection) {
                    // Get collection assets
                    const assets: Map<string, AssetWithMetadata> = await getCollectionAssets(
                        new PublicKey(snapshotCollection.collection.publicKey.toString()),
                    );

                    // Process each asset and count NFTs per owner
                    assets.forEach((asset, _) => {
                        if (!asset.asset.owner) return; // Skip if no owner

                        const ownerAddress = asset.asset.owner.toString();

                        // Increment NFT count for this owner
                        const currentCount = holdersMap.get(ownerAddress) || 0;
                        holdersMap.set(ownerAddress, currentCount + 1);
                    });
                }

                // Convert map to array and filter by threshold
                const holdersArray: TokenHolder[] = Array.from(holdersMap.entries())
                    .map(([address, balance]) => ({
                        address,
                        balance: balance.toString(),
                    }))
                    .filter((holder) => parseFloat(holder.balance) >= minThreshold);

                setHolders(holdersArray);
                setFilteredHolders(holdersArray);

                return holdersArray;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
                setError(errorMessage);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [connection],
    );

    const filterHolders = useCallback(
        (thresholdInput: string): TokenHolder[] => {
            const threshold = parseFloat(thresholdInput);
            if (isNaN(threshold)) return holders;
            setThreshold(threshold);
        },
        [holders],
    );

    useEffect(() => {
        const filtered = holders.filter((holder) => parseFloat(holder.balance) >= threshold);

        setFilteredHolders(filtered);
    }, [holders, threshold]);

    const calculateAirdropAmounts = useCallback(
        (totalAmountInput: string, distributionType: DistributionType = "fixed"): AirdropRecipient[] => {
            if (filteredHolders.length === 0) return [];

            // Check if holders have predefined amounts from CSV
            const hasPresetAmounts = filteredHolders.some((holder) => holder.amount !== undefined);
            let newDistributions: AirdropRecipient[];

            if (hasPresetAmounts) {
                // If we have preset amounts from CSV, use those
                newDistributions = filteredHolders.map((holder) => ({
                    address: holder.address,
                    amount: holder.amount || totalAmountInput, // Fallback to totalAmountInput if amount not defined
                }));
            } else {
                const totalAmount = parseFloat(totalAmountInput);

                if (distributionType === "fixed") {
                    const amountPerHolder = totalAmount;
                    newDistributions = holders.map((holder) => ({
                        address: holder.address,
                        amount: amountPerHolder.toString(),
                    }));
                } else if (distributionType === "even") {
                    const amountPerHolder = totalAmount / filteredHolders.length;

                    newDistributions = filteredHolders.map((holder) => ({
                        address: holder.address,
                        amount: amountPerHolder.toString(),
                    }));
                } else {
                    // Pro rata distribution
                    const totalBalance = filteredHolders.reduce((acc, holder) => acc + parseFloat(holder.balance), 0);

                    newDistributions = filteredHolders.map((holder) => {
                        const share = (parseFloat(holder.balance) * parseFloat(totalAmountInput)) / totalBalance;
                        return {
                            address: holder.address,
                            amount: share.toString(),
                        };
                    });
                }
            }
            setDistributions(newDistributions);
            return newDistributions;
        },
        [filteredHolders],
    );

    const createTempAccount = async (recipients: AirdropRecipient[]) => {

        const tempKeypair = Keypair.generate();

        const rentExemptBalance = await connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZE);
        const estimatedFee = LAMPORTS_PER_SOL * 0.000005;  
        const reqBalance = (rentExemptBalance + estimatedFee) * (recipients.length + 1);

        const setupTx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: tempKeypair.publicKey,
                lamports: reqBalance
            })
        );
    
        const uniqueMints = Array.from(new Set(recipients.map(r => r.airdropAddress).filter(Boolean)));
    
        for (const mintAddress of uniqueMints) {
            const mintData = await getMintData(mintAddress);

            let totalAmount = 0;
            for (let i = 0; i < recipients.length; i++) {
                if (recipients[i].airdropAddress !== mintAddress)
                    continue;

                console.log("amount ", recipients[i].amount);
                totalAmount += parseFloat(recipients[i].amount) * Math.pow(10, mintData.mint.decimals);
            }
          
            const tempATA = await getAssociatedTokenAddress(
                mintData.mint.address,
                tempKeypair.publicKey,
                false,
                mintData.token_program
            );

            const userATA = await getAssociatedTokenAddress(
                mintData.mint.address,
                wallet.publicKey,
                false,
                mintData.token_program
            );
    
            setupTx.add(
                createAssociatedTokenAccountInstruction(
                    wallet.publicKey,
                    tempATA,
                    tempKeypair.publicKey,
                    mintData.mint.address,
                    mintData.token_program
                ),
                createTransferInstruction(
                    userATA,
                    tempATA,
                    wallet.publicKey,
                    totalAmount,
                    [],
                    mintData.token_program
                )
            );
        }
    
        sendTransaction({instructions: setupTx.instructions});
        return { keypair: tempKeypair };
    };

    type ProgressCallback = (progress: number, signature?: string, recipientAddresses?: string[]) => void;

    const executeAirdrop = useCallback(
        async (recipients: AirdropRecipient[], onProgress: ProgressCallback = () => {}, useTempAccount: boolean = true): Promise<boolean> => {
            if (!wallet || !wallet.publicKey) {
                toast.error("Wallet not connected");
                return;
            }

            if (!recipients.some((r) => r.airdropAddress)) {
                toast.error("No airdrop token address set");
                return false;
            }

            setIsLoading(true);
            setError(null);

            try {
                // Process in batches of 8 to avoid hitting transaction size limits
                const BATCH_SIZE = 8;
                const batches = [];

                for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
                    batches.push(recipients.slice(i, i + BATCH_SIZE));
                }

                let tempAccount = null;
                if (useTempAccount) {
                    tempAccount = await createTempAccount(recipients);
                }

                // Get or create associated token accounts

                for (let i = 0; i < batches.length; i++) {
                    const batch = batches[i];
                    const transaction = new Transaction();
                    const instructions: TransactionInstruction[] = [];

                    // Build transfer instructions for batch
                    for (const recipient of batch) {
                        // Determine which mint to use
                        const mintAddress = recipient.airdropAddress;
                        if (!mintAddress) {
                            toast.error(`No mint address available for recipient ${recipient.address}`);
                            return false;
                        }

                        // Get or fetch mint data
                        let mintData: MintData;
                        if (!mintDataCache.has(mintAddress)) {
                            mintData = await getMintData(mintAddress);
                            mintDataCache.set(mintAddress, mintData);
                        } else {
                            mintData = mintDataCache.get(mintAddress)!;
                        }

                        const recipientPubkey = new PublicKey(recipient.address);
                        const airdropAmount = Math.floor(parseFloat(recipient.amount) * Math.pow(10, mintData.mint.decimals));

                        const senderPubkey = tempAccount ? tempAccount.keypair.publicKey : wallet.publicKey;
                        
                        const senderATA = await getAssociatedTokenAddress(
                            mintData.mint.address,
                            senderPubkey,
                            false,
                            mintData.token_program,
                        );

                        const recipientATA = await getAssociatedTokenAddress(
                            mintData.mint.address,
                            recipientPubkey,
                            true,
                            mintData.token_program,
                        );

                        //console.log("recipientATA: ", recipientATA.toString());

                        // Check if recipient has an associated token account
                        const recipientAccount = await connection.getAccountInfo(recipientATA);
                        if (!recipientAccount) {
                            instructions.push(
                                createAssociatedTokenAccountInstruction(
                                    senderPubkey,
                                    recipientATA,
                                    recipientPubkey,
                                    mintData.mint.address,
                                    mintData.token_program,
                                ),
                            );
                        }

                        instructions.push(
                            createTransferInstruction(senderATA, recipientATA, senderPubkey, airdropAmount, [], mintData.token_program),
                        );
                    }

                    transaction.add(...instructions);

                    // Get latest blockhash
                    const blockhash = await connection.getLatestBlockhash();
                    transaction.recentBlockhash = blockhash.blockhash;

                    transaction.feePayer = tempAccount ? tempAccount.keypair.publicKey : wallet.publicKey;

                    let signature;
                    if (tempAccount) {
                        transaction.sign(tempAccount.keypair);
                        signature = await connection.sendRawTransaction(transaction.serialize(), { skipPreflight: true });
                    } else {
                        const signed = await wallet.signTransaction(transaction);
                        signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true });
                    }
                    
                    await connection.confirmTransaction(
                        {
                            blockhash: blockhash.blockhash,
                            lastValidBlockHeight: blockhash.lastValidBlockHeight,
                            signature,
                        },
                        "confirmed",
                    );
                    // Update progress
                    onProgress(
                        (i + 1) / batches.length,
                        signature,
                        batch.map((r) => r.address),
                    );
                }

                // At end of executeAirdrop:
                if (tempAccount) {
                    const balance = await connection.getBalance(tempAccount.keypair.publicKey);
                    const balance_post_fees = balance - LAMPORTS_PER_SOL * 0.000005;
                    
                    if (balance_post_fees > 0) {
                    const closeTx = new Transaction().add(
                        SystemProgram.transfer({
                            fromPubkey: tempAccount.keypair.publicKey,
                            toPubkey: wallet.publicKey, 
                            lamports: balance_post_fees
                        })
                    );
                    const blockhash = await connection.getLatestBlockhash();
                    closeTx.recentBlockhash = blockhash.blockhash;

                    closeTx.feePayer = tempAccount.keypair.publicKey;

                    closeTx.sign(tempAccount.keypair);
                    await connection.sendRawTransaction(closeTx.serialize());
                }
                }

                return true;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
                setError(errorMessage);
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [connection, wallet],
    );

    return {
        isLoading,
        error,
        holders,
        filteredHolders,
        snapshotMint,
        snapshotCollection,
        airdroppedMint,
        setHolders,
        takeSnapshot,
        filterHolders,
        calculateAirdropAmounts,
        executeAirdrop,
        setAirdroppedMint,
    };
};

export default useAirdrop;
