import { Box, Text, VStack } from "@chakra-ui/react";
import styles from "../header.module.css";
import useResponsive from "../../hooks/useResponsive";

interface WoodenButtonProps {
    action?: () => void;
    label: string;
    size: number;
}

const WoodenButton = ({ action, label, size }: WoodenButtonProps) => {
    const { md } = useResponsive();
    return (
        <Box
            mt={4}
            bg="url(/images/Wood\ Panel.png)"
            backgroundSize="cover"
            borderRadius={md ? 10 : 20}
            px={5}
            onClick={action}
            style={{ cursor: "pointer" }}
        >
            <VStack h="100%" align="center" justify="center">
                <Text
                    w={md ? "fit-content" : "310px"}
                    align={"center"}
                    my={md ? 3 : 5}
                    fontSize={md ? "medium" : size}
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
