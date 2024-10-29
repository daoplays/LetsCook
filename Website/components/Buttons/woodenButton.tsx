import { Box, Spinner, Text, VStack } from "@chakra-ui/react";
import styles from "../header.module.css";
import useResponsive from "../../hooks/useResponsive";
import { isHomePageOnly } from "../../constant/root";

interface WoodenButtonProps {
    action?: () => void;
    label: string;
    size: number;
    width?: number | string;
    isLoading?: boolean;
}

const WoodenButton = ({ action, label, size, width, isLoading }: WoodenButtonProps) => {
    const { lg } = useResponsive();
    return (
        <Box
            className="rounded-full bg-custom-gradient"
            backgroundSize="cover"
            px={5}
            onClick={action}
            style={{
                cursor:
                    label === "Start Cooking" && isHomePageOnly ? "not-allowed" : label === "Waiting for LP" ? "not-allowed" : "pointer",
            }}
        >
            {isLoading ? (
                <Spinner />
            ) : (
                <VStack h="100%" align="center" justify="center">
                    <Text
                        w={lg ? "fit-content" : !width ? "310px" : width}
                        align={"center"}
                        my={lg ? 2 : 4}
                        fontSize={lg ? "medium" : size}
                        color="white"
                        className="font-face-kg"
                    >
                        {label}
                    </Text>
                </VStack>
            )}
        </Box>
    );
};
export default WoodenButton;
