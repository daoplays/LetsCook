import { Box, Text, VStack } from "@chakra-ui/react";
import styles from "../header.module.css";
import useResponsive from "../../hooks/useResponsive";

interface WoodenButtonProps {
    action?: () => void;
    label: string;
    size: number;
    width?: number | string;
}

const WoodenButton = ({ action, label, size, width }: WoodenButtonProps) => {
    const { lg } = useResponsive();
    return (
        <Box
            bg="url(/images/Wood\ Panel.png)"
            backgroundSize="cover"
            borderRadius={10}
            px={5}
            onClick={action}
            style={{ cursor: "pointer" }}
        >
            <VStack h="100%" align="center" justify="center">
                <Text
                    w={lg ? "fit-content" : !width ? "310px" : width}
                    align={"center"}
                    my={lg ? 2 : 4}
                    fontSize={lg ? "medium" : size}
                    color="#683309"
                    className="font-face-kg"
                >
                    {label}
                </Text>
            </VStack>
        </Box>
    );
};
export default WoodenButton;
