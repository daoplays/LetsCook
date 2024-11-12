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
} from '@chakra-ui/react';
import { useAirdrop } from '../hooks/useAirdrop';
import { PublicKey } from '@solana/web3.js';


export const AirdropPage = () => {
  const toast = useToast();
  const [mintAddress, setMintAddress] = useState('');
  const [distributionType, setDistributionType] = useState<'fixed' | 'proRata'>('fixed');
  const [amount, setAmount] = useState('');
  const [threshold, setThreshold] = useState('0');
  const [airdropProgress, setAirdropProgress] = useState(0);
  const [completedAirdrops, setCompletedAirdrops] = useState<Set<string>>(new Set());
  const [isAirdropping, setIsAirdropping] = useState(false);

  const {
    takeSnapshot,
    calculateAirdropAmounts,
    executeAirdrop,
    holders,
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
          <RadioGroup value={distributionType} onChange={(value: 'fixed' | 'proRata') => setDistributionType(value)}>
            <Stack direction="row">
              <Radio value="fixed">Fixed Amount Per Holder</Radio>
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
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Status</Th>
                  <Th>Wallet</Th>
                  <Th isNumeric>Current Balance</Th>
                  <Th isNumeric>Will Receive</Th>
                </Tr>
              </Thead>
              <Tbody>
                {distributions.map(({ address, amount: airdropAmount }) => {
                  const holder = holders.find(h => h.address === address);
                  const isCompleted = completedAirdrops.has(address);
                  
                  return (
                    <Tr key={address} bg={isCompleted ? 'green.50' : undefined}>
                      <Td>
                        {isCompleted ? '✓' : ''}
                      </Td>
                      <Td>
                        <Text fontSize="sm" fontFamily="monospace">
                          {address.slice(0, 4)}...{address.slice(-4)}
                        </Text>
                      </Td>
                      <Td isNumeric>{holder?.balance || '0'}</Td>
                      <Td isNumeric>{airdropAmount}</Td>
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