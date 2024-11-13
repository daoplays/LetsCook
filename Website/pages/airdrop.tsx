import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Input,
  Radio,
  RadioGroup,
  Stack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
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
} from '@chakra-ui/react';
import { useAirdrop } from '../hooks/useAirdrop';
import { PublicKey } from '@solana/web3.js';
import { RiDeleteBinLine, RiDownloadLine } from 'react-icons/ri';  // Import the icon

interface AirdropRecord {
  address: string;      // wallet address
  currentBalance: string;  // their token balance
  airdropAmount: string;   // what they'll receive
  signature?: string;    // transaction signature if airdrop completed
}

export const AirdropPage = () => {
  const toast = useToast();
  const [mintAddress, setMintAddress] = useState('');
  const [distributionType, setDistributionType] = useState<'fixed' | 'even' | 'proRata'>('fixed');
  const [amount, setAmount] = useState('');
  const [threshold, setThreshold] = useState('0');
  const [airdropProgress, setAirdropProgress] = useState(0);
  const [completedAirdrops, setCompletedAirdrops] = useState<Set<string>>(new Set());
  const [isAirdropping, setIsAirdropping] = useState(false);

  const {
    takeSnapshot,
    calculateAirdropAmounts,
    executeAirdrop,
    setHolders,
    holders,
    filteredHolders,
    mintData,
    isLoading,
    error,
  } = useAirdrop();

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

  const handleSnapshot = async () => {
    try {
      if (!mintAddress) {
        toast({
          title: 'Error',
          description: 'Please enter a mint address',
          status: 'error',
        });
        return;
      }

      // Validate mint address
      try {
        new PublicKey(mintAddress);
      } catch {
        toast({
          title: 'Error',
          description: 'Invalid mint address',
          status: 'error',
        });
        return;
      }

      await takeSnapshot(mintAddress, threshold);
      
      toast({
        title: 'Success',
        description: 'Token holder snapshot completed',
        status: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to take snapshot',
        status: 'error',
      });
    }
  };

  const handleAirdrop = async () => {
    try {
      setIsAirdropping(true);
      setCompletedAirdrops(new Set());
      
      await executeAirdrop(
        distributions,
        (progress) => {
          setAirdropProgress(progress * 100);
          // Mark recipients in the current batch as complete
          const batchSize = 8;
          const completedIndex = Math.floor(progress * distributions.length / batchSize) * batchSize;
          const newCompleted = new Set(completedAirdrops);
          for (let i = 0; i < completedIndex; i++) {
            newCompleted.add(distributions[i].address);
          }
          setCompletedAirdrops(newCompleted);
        }
      );

      // Mark all as complete
      setCompletedAirdrops(new Set(distributions.map(d => d.address)));
      
      toast({
        title: 'Success',
        description: 'Airdrop completed successfully',
        status: 'success',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to execute airdrop',
        status: 'error',
      });
    } finally {
      setIsAirdropping(false);
    }
  };

  const handleDeleteHolder = (addressToDelete: string) => {
    // Update holders directly
    const newHolders = holders.filter(holder => holder.address !== addressToDelete);
    setHolders(newHolders);
  };


// The download handler function
const handleDownloadCSV = () => {
  try {
    // 1. Create records from holders data
    const records: AirdropRecord[] = filteredHolders.map(holder => {
      const distribution = distributions.find(d => d.address === holder.address);
      return {
        address: holder.address,
        currentBalance: holder.balance,
        airdropAmount: distribution?.amount || '0',
        signature: "aaaaaaaa"//signatures.get(holder.address) || ''
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

  console.log("holders", holders);
  return (
    <Box p={8} maxW="1200px" mx="auto">
      <VStack spacing={6} align="stretch">
        {/* Input Section */}
        <FormControl>
          <FormLabel>Token Mint Address</FormLabel>
          <HStack>
            <Input
              placeholder="Enter token mint address"
              value={mintAddress}
              onChange={(e) => handleMintInput(e.target.value)}
            />
            <Button 
              colorScheme="blue"
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
          <FormLabel>Minimum Balance Threshold</FormLabel>
          <NumberInput
            value={threshold}
            onChange={(value) => setThreshold(value)}
            min={0}
          >
            <NumberInputField />
          </NumberInput>
        </FormControl>

        {/* Distribution Type Selection */}
        <FormControl>
          <FormLabel>Distribution Type</FormLabel>
          <RadioGroup value={distributionType} onChange={(value: 'fixed' | 'even' | 'proRata') => setDistributionType(value)}>
            <Stack direction="row">
              <Radio value="fixed">Fixed Amount Per Holder</Radio>
              <Radio value="even">Even Split Per Holder</Radio>
              <Radio value="proRata">Pro Rata Split</Radio>
            </Stack>
          </RadioGroup>
        </FormControl>

        {/* Amount Input */}
        <FormControl>
          <FormLabel>
            {distributionType === 'fixed' ? 'Amount Per Holder' : 'Total Amount to Distribute'}
          </FormLabel>
          <NumberInput
            value={amount}
            onChange={(value) => setAmount(value)}
            min={0}
          >
            <NumberInputField />
          </NumberInput>
        </FormControl>

        {/* Token Info */}
        {mintData && (
          <Box borderWidth={1} borderRadius="md" p={4}>
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
            leftIcon={<RiDownloadLine />}  // Using react-icons
            colorScheme="teal"
            size="sm"
            mb={4}
            onClick={handleDownloadCSV}
            disabled={holders.length === 0}
          >
            Download CSV
          </Button>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Status</Th>
                  <Th>Wallet</Th>
                  <Th isNumeric>Current Balance</Th>
                  <Th isNumeric>Will Receive</Th>
                  <Th> Signature </Th>
                  <Th> Remove</Th>
                </Tr>
              </Thead>
              <Tbody>
              {holders.map(holder => {
                const distribution = distributions.find(d => d.address === holder.address);
                const isCompleted = completedAirdrops.has(holder.address);
                const signature = "aaaaaaaaaaaa"//signatures.get(holder.address);
                
                return (
                  <Tr key={holder.address} bg={isCompleted ? 'green.50' : undefined}>
                    <Td>
                      {isCompleted ? '✓' : ''}
                    </Td>
                    <Td>
                      <Text fontSize="sm" fontFamily="monospace">
                        {holder.address.slice(0, 4)}...{holder.address.slice(-4)}
                      </Text>
                    </Td>
                    <Td isNumeric>{holder.balance}</Td>
                    <Td isNumeric>{distribution?.amount || '0'}</Td>
                    <Td>
                      {signature && (
                        <Link 
                          href={`https://solscan.io/tx/${signature}`}
                          isExternal
                          color="blue.500"
                          fontSize="sm"
                          fontFamily="monospace"
                        >
                          {signature.slice(0, 4)}...{signature.slice(-4)}
                        </Link>
                      )}
                    </Td>
                    <Td>
                      <IconButton
                        aria-label="Remove address"
                        icon={<RiDeleteBinLine />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDeleteHolder(holder.address)}
                      />
                    </Td>
                  </Tr>
                );
              })}
              </Tbody>
            </Table>

            {/* Airdrop Progress */}
            {isAirdropping && (
              <Box mt={4}>
                <Progress value={airdropProgress} />
              </Box>
            )}

            {/* Airdrop Button */}
            <Button
              mt={4}
              colorScheme="green"
              onClick={handleAirdrop}
              isLoading={isAirdropping}
              loadingText="Airdropping"
              disabled={!distributions.length}
            >
              Start Airdrop
            </Button>
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Text color="red.500">{error}</Text>
        )}
      </VStack>
    </Box>
  );
};

export default AirdropPage;