import { useState, useCallback, useEffect } from 'react';
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
import { bignum_to_num, MintData, TokenAccount } from '@/components/Solana/state';
import { getMintData } from '@/components/amm/launch';
import { toast } from 'react-toastify';

interface TokenHolder {
  address: string;
  balance: string;
}

interface AirdropRecipient {
  address: string;
  amount: string;
}

type DistributionType = 'fixed' | 'even' | 'proRata';



export const useAirdrop = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  
  const [distributions, setDistributions] = useState<AirdropRecipient[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [holders, setHolders] = useState<TokenHolder[]>([]);
  const [filteredHolders, setFilteredHolders] = useState<TokenHolder[]>([]);
  const [snapshotMint, setSnapshotMint] = useState<MintData | null>(null);
  const [airdroppedMint, setAirdroppedMint] = useState<MintData | null>(null);

  const [threshold, setThreshold] = useState<number>(0);

  const takeSnapshot = useCallback(async (
    snapshotMint: MintData,
    minThreshold: number = 0
  ): Promise<TokenHolder[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get mint data using provided function
      setSnapshotMint(snapshotMint);

      let mint_bytes = snapshotMint.mint.address.toBase58();
      
      // Get all token accounts for this mint
      const accounts = await connection.getProgramAccounts(
        snapshotMint.token_program,
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
      const holdersMap = new Map<string, number>();
      
      for (const { account } of accounts) {
        // Deserialize account data using provided TokenAccount struct
        const [tokenAccount] = TokenAccount.struct.deserialize(account.data);

        console.log(tokenAccount, tokenAccount.owner.toString());
        
        // Skip closed or frozen accounts
        if (tokenAccount.state !== 0) continue;

        const ownerAddress = tokenAccount.owner.toString();
        const balance = bignum_to_num(tokenAccount.amount / Math.pow(10, snapshotMint.mint.decimals));

        if (balance === 0) continue;

        holdersMap.set(ownerAddress, balance);
      }

      // Convert map to array and filter by threshold
      
      const holdersArray: TokenHolder[] = Array.from(holdersMap.entries())
        .map(([address, balance]) => ({
          address,
          balance: balance.toString(),
        }))
        .filter(holder => parseFloat(holder.balance) >= minThreshold);

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
  }, [connection]);

  const filterHolders = useCallback((thresholdInput: string): TokenHolder[] => {
    const threshold = parseFloat(thresholdInput);
    if (isNaN(threshold)) return holders;
    setThreshold(threshold);
  }, [holders]);

  useEffect(() => {

    const filtered = holders.filter(holder =>
      parseFloat(holder.balance) >= threshold
    );

    setFilteredHolders(filtered);
    
}, [holders, threshold]);

  const calculateAirdropAmounts = useCallback((
    totalAmountInput: string,
    distributionType: DistributionType = 'fixed'
  ): AirdropRecipient[] => {

    if (filteredHolders.length === 0) return [];

    const totalAmount = parseFloat(totalAmountInput);
    let newDistributions: AirdropRecipient[];

    if (distributionType === 'fixed') {

      const amountPerHolder = totalAmount;
      newDistributions = holders.map(holder => ({
        address: holder.address,
        amount: amountPerHolder.toString()
      }));
    } else if (distributionType === 'even') {
      const amountPerHolder = totalAmount / filteredHolders.length;
      
      newDistributions = filteredHolders.map(holder => ({
        address: holder.address,
        amount: amountPerHolder.toString()
      }));
    }
    else {
      // Pro rata distribution
      const totalBalance = filteredHolders.reduce(
        (acc, holder) => acc + parseFloat(holder.balance),
        0
      );

      newDistributions = filteredHolders.map(holder => {
        const share = (parseFloat(holder.balance) * parseFloat(totalAmountInput)) / totalBalance;
        return {
          address: holder.address,
          amount: share.toString()
        };
      });
    }

    setDistributions(newDistributions);
    return newDistributions;
  }, [filteredHolders]);

  type ProgressCallback = (
    progress: number, 
    signature?: string, 
    recipientAddresses?: string[]
  ) => void;

  const executeAirdrop = useCallback(async (
    recipients: AirdropRecipient[],
    onProgress: ProgressCallback = () => {}
  ): Promise<boolean> => {
    if (!wallet || !wallet.publicKey ) {
      toast.error('Wallet not connected');
      return;
    }

    if (!airdroppedMint) {
      toast.error('Airdropped Mint data not set.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const mintPubkey = airdroppedMint.mint.address;
      
      // Process in batches of 8 to avoid hitting transaction size limits
      const BATCH_SIZE = 8;
      const batches = [];
      
      for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        batches.push(recipients.slice(i, i + BATCH_SIZE));
      }

                
      // Get or create associated token accounts
      const senderATA = await getAssociatedTokenAddress(
        mintPubkey,
        wallet.publicKey,
        false,
        airdroppedMint.token_program
      );

      console.log("senderATA: ", senderATA.toString());


      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const transaction = new Transaction();
        const instructions: TransactionInstruction[] = [];

        // Build transfer instructions for batch
        for (const { address, amount } of batch) {
          const recipientPubkey = new PublicKey(address);
          const airdropAmount = Math.floor(parseFloat(amount) * Math.pow(10, airdroppedMint.mint.decimals));

          
          const recipientATA = await getAssociatedTokenAddress(
            mintPubkey,
            recipientPubkey,
            true,
            airdroppedMint.token_program
          );

          console.log("recipientATA: ", recipientATA.toString());

          // Check if recipient has an associated token account
          const recipientAccount = await connection.getAccountInfo(recipientATA);
          if (!recipientAccount) {
            instructions.push(
              createAssociatedTokenAccountInstruction(
                wallet.publicKey,
                recipientATA,
                recipientPubkey,
                mintPubkey,
                airdroppedMint.token_program
              )
            );
          }

          instructions.push(
            createTransferInstruction(
              senderATA,
              recipientATA,
              wallet.publicKey,
              airdropAmount,
              [],
              airdroppedMint.token_program
            )
          );

        }

        transaction.add(...instructions);

        // Get latest blockhash
        const  blockhash = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash.blockhash;
        transaction.feePayer = wallet.publicKey;

        // Sign and send transaction
        let signed_transaction = await wallet.signTransaction(transaction);

        var signature = await connection.sendRawTransaction(signed_transaction.serialize(), { skipPreflight: true });
        await connection.confirmTransaction({
          blockhash: blockhash.blockhash,
          lastValidBlockHeight: blockhash.lastValidBlockHeight,
          signature
        },
        'confirmed' );
        // Update progress
        onProgress(
          (i + 1) / batches.length,
          signature,
          batch.map(r => r.address)
        );      
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connection, wallet, airdroppedMint]);

  return {
    isLoading,
    error,
    holders,
    filteredHolders,
    snapshotMint,
    airdroppedMint,
    setHolders,
    takeSnapshot,
    filterHolders,
    calculateAirdropAmounts,
    executeAirdrop,
    setAirdroppedMint
  };
};

export default useAirdrop;