import { useState, useCallback } from 'react';
import { 
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
} from '@solana/spl-token';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { MintData, TokenAccount } from '@/components/Solana/state';
import { getMintData } from '@/components/amm/launch';

interface TokenHolder {
  address: string;
  balance: string;
}

interface AirdropRecipient {
  address: string;
  amount: string;
}

type DistributionType = 'fixed' | 'even' | 'proRata';

// First define the type for our row data
interface AirdropRecord {
  address: string;      // wallet address
  currentBalance: string;  // their token balance
  airdropAmount: string;   // what they'll receive
  signature?: string;    // transaction signature if airdrop completed
}


export const useAirdrop = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [holders, setHolders] = useState<TokenHolder[]>([]);
  const [filteredHolders, setFilteredHolders] = useState<TokenHolder[]>([]);
  const [mintData, setMintData] = useState<MintData | null>(null);


// The download handler function
const handleDownloadCSV = () => {
  try {
    // 1. Create records from holders data
    const records: AirdropRecord[] = holders.map(holder => {
      const distribution = distributions.find(d => d.address === holder.address);
      return {
        address: holder.address,
        currentBalance: holder.balance,
        airdropAmount: distribution?.amount || '0',
        signature: signatures.get(holder.address) || ''
      };
    });

    // 2. Create CSV header row and format data rows
    const csvRows = [
      // Header row
      ['Wallet Address', 'Current Balance', 'Airdrop Amount', 'Transaction Signature'],
      // Data rows
      ...records.map(record => [
        record.address,
        record.currentBalance,
        record.airdropAmount,
        record.signature
      ])
    ];

    // 3. Convert to CSV string (handle potential commas in data)
    const csvContent = csvRows
      .map(row => row.map(cell => 
        // Wrap in quotes if contains comma
        cell.includes(',') ? `"${cell}"` : cell
      ).join(','))
      .join('\n');

    // 4. Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    // Use mint address and timestamp in filename
    link.setAttribute(
      'download', 
      `airdrop_${mintAddress.slice(0,8)}_${new Date().toISOString().split('T')[0]}.csv`
    );
    
    // 5. Trigger download and cleanup
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (err) {
    toast({
      title: 'Error',
      description: 'Failed to download CSV',
      status: 'error',
    });
  }
};

  const takeSnapshot = useCallback(async (
    mintAddress: string,
    minThreshold: string = '0'
  ): Promise<TokenHolder[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get mint data using provided function
      const mintData = await getMintData(mintAddress);
      setMintData(mintData);

      let mint_bytes = mintData.mint.address.toBase58();
      
      // Get all token accounts for this mint
      const accounts = await connection.getProgramAccounts(
        mintData.token_program,
        {
          filters: [
            {
              memcmp: {
                offset: 0,
                bytes: mint_bytes,
              },
            },
          ],
        }
      );

      console.log(accounts);

      // Process accounts and aggregate balances by owner
      const holdersMap = new Map<string, bigint>();
      
      for (const { account } of accounts) {
        // Deserialize account data using provided TokenAccount struct
        const [tokenAccount] = TokenAccount.struct.deserialize(account.data);

        console.log(tokenAccount, tokenAccount.owner.toString());
        
        // Skip closed or frozen accounts
        if (tokenAccount.state !== 0) continue;

        const ownerAddress = tokenAccount.owner.toString();
        const balance = tokenAccount.amount;

        if (balance === BigInt(0)) continue;

        const currentBalance = holdersMap.get(ownerAddress) || BigInt(0);
        holdersMap.set(ownerAddress, currentBalance + balance);
      }

      // Convert map to array and filter by threshold
      const minThresholdBigInt = BigInt(minThreshold);
      const holdersArray: TokenHolder[] = Array.from(holdersMap.entries())
        .map(([address, balance]) => ({
          address,
          balance: balance.toString(),
        }))
        .filter(holder => BigInt(holder.balance) >= minThresholdBigInt);

      setHolders(holdersArray);
      setFilteredHolders(holdersArray);
      
      return holdersArray;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connection, getMintData]);

  const filterHolders = useCallback((threshold: string): TokenHolder[] => {
    const thresholdBigInt = BigInt(threshold);
    const filtered = holders.filter(holder =>
      BigInt(holder.balance) >= thresholdBigInt
    );
    setFilteredHolders(filtered);
    return filtered;
  }, [holders]);

  const calculateAirdropAmounts = useCallback((
    totalAmount: string,
    distributionType: DistributionType = 'fixed'
  ): AirdropRecipient[] => {
    if (filteredHolders.length === 0) return [];
    const totalAmountBigInt = BigInt(totalAmount);

    if (distributionType === 'fixed') {

      const amountPerHolder = totalAmountBigInt;
      return filteredHolders.map(holder => ({
        address: holder.address,
        amount: amountPerHolder.toString()
      }));
    } else if (distributionType === 'even') {
      const amountPerHolder = totalAmountBigInt / BigInt(filteredHolders.length);
      
      return filteredHolders.map(holder => ({
        address: holder.address,
        amount: amountPerHolder.toString()
      }));
    }
    else {
      // Pro rata distribution
      const totalBalance = filteredHolders.reduce(
        (acc, holder) => acc + BigInt(holder.balance),
        BigInt(0)
      );

      return filteredHolders.map(holder => {
        const share = (BigInt(holder.balance) * totalAmountBigInt) / totalBalance;
        
        return {
          address: holder.address,
          amount: share.toString()
        };
      });
    }
  }, [filteredHolders]);

  const executeAirdrop = useCallback(async (
    recipients: AirdropRecipient[],
    onProgress: (progress: number) => void = () => {}
  ): Promise<boolean> => {
    if (!publicKey || !signTransaction) {
      throw new Error('Wallet not connected');
    }

    if (!mintData) {
      throw new Error('Mint data not set. Take snapshot first.');
    }

    setIsLoading(true);
    setError(null);

    try {
      const mintPubkey = new PublicKey(mintData.mint.address);
      
      // Process in batches of 8 to avoid hitting transaction size limits
      const BATCH_SIZE = 8;
      const batches = [];
      
      for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        batches.push(recipients.slice(i, i + BATCH_SIZE));
      }

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const transaction = new Transaction();
        const instructions: TransactionInstruction[] = [];

        // Build transfer instructions for batch
        for (const { address, amount } of batch) {
          const recipientPubkey = new PublicKey(address);
          
          // Get or create associated token accounts
          const senderATA = await getAssociatedTokenAddress(
            mintPubkey,
            publicKey,
            false,
            mintData.token_program
          );
          
          const recipientATA = await getAssociatedTokenAddress(
            mintPubkey,
            recipientPubkey,
            false,
            mintData.token_program
          );

          // Check if recipient has an associated token account
          const recipientAccount = await connection.getAccountInfo(recipientATA);
          if (!recipientAccount) {
            instructions.push(
              createAssociatedTokenAccountInstruction(
                publicKey,
                recipientATA,
                recipientPubkey,
                mintPubkey,
                mintData.token_program
              )
            );
          }

          instructions.push(
            createTransferInstruction(
              senderATA,
              recipientATA,
              publicKey,
              BigInt(amount),
              [],
              mintData.token_program
            )
          );
        }

        transaction.add(...instructions);

        // Get latest blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        // Sign and send transaction
        const signed = await signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(signature);

        // Update progress
        onProgress((i + 1) / batches.length);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connection, publicKey, signTransaction, mintData]);

  return {
    isLoading,
    error,
    holders,
    filteredHolders,
    mintData,
    setHolders,
    takeSnapshot,
    filterHolders,
    calculateAirdropAmounts,
    executeAirdrop
  };
};

export default useAirdrop;