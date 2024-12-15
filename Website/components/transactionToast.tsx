import React, { useState, useEffect } from "react";
import { Box, VStack, Text, Progress, keyframes, Flex } from "@chakra-ui/react";
import { toast, ToastContent, ToastOptions } from "react-toastify";
import { FaSpinner, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const stages = ["Signing", "Sending", "Confirmed"];

// Define the spin animation
const spinAnimation = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const TransactionToast: React.FC<{
    transactionStatus: string;
    error: string | null;
}> = ({ transactionStatus, error }) => {
    const [currentStage, setCurrentStage] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const stageIndex = stages.indexOf(transactionStatus);
        if (stageIndex !== -1) {
            setCurrentStage(stageIndex);
            setProgress((stageIndex / (stages.length - 1)) * 100);
        }
    }, [transactionStatus]);

    let statusText = stages[currentStage];
    if (error) {
        statusText = error === "execution_failed" ? "Failed to execute" : error;
    }

    return (
        <Box p={3} bg="white" borderRadius="md" boxShadow="md" width="300px">
            <VStack align="stretch" spacing={6}>
                <Flex alignItems="center">
                    <Box width="24px" height="24px" display="flex" alignItems="center" justifyContent="center" marginRight="8px">
                        {error ? (
                            <FaTimesCircle color="red" size="24px" />
                        ) : currentStage === stages.length - 1 ? (
                            <FaCheckCircle color="green" size="24px" />
                        ) : (
                            <Box as={FaSpinner} animation={`${spinAnimation} 1s linear infinite`} size="24px" />
                        )}
                    </Box>
                    <Text m={0} fontWeight="bold" fontSize="md">
                        {error ? "Transaction Failed" : "Transaction Progress"}
                    </Text>
                </Flex>
                <Progress value={progress} size="sm" colorScheme="blue" />
                <Text m={0} fontSize="sm">
                    Status: {statusText}
                </Text>
            </VStack>
        </Box>
    );
};

export const showTransactionToast = () => {
    let toastId: ReturnType<typeof toast> | null = null;
    let currentStatus = "Signing";
    let currentError: string | null = null;

    const updateToast = (newStatus: string, error: string | null = null) => {
        currentStatus = newStatus;
        currentError = error;
        const toastContent: ToastContent = <TransactionToast transactionStatus={currentStatus} error={currentError} />;
        const toastOptions: ToastOptions = {
            position: "bottom-right",
            autoClose: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        };

        if (toastId === null) {
            toastId = toast(toastContent, toastOptions);
        } else {
            toast.update(toastId, {
                render: toastContent,
                ...toastOptions,
            });
        }

        // Auto-dismiss the toast after a delay if it's a final state
        if (newStatus === "Confirmed" || error !== null) {
            setTimeout(() => {
                if (toastId !== null) {
                    toast.dismiss(toastId);
                }
            }, 2000); // Dismiss after 2 seconds
        }
    };

    return {
        setStatus: (status: string) => updateToast(status),
        setError: (error: string) => updateToast(currentStatus, error),
        closeToast: () => {
            if (toastId !== null) {
                toast.dismiss(toastId);
            }
        },
    };
};

export default showTransactionToast;
