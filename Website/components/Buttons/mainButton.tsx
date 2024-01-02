import { Box, Text } from "@chakra-ui/react";
import styles from "../header.module.css";

interface MainButtonProps {
    action?: () => void;
    label: string;
}

const MainButton = ({ action, label }: MainButtonProps) => (
    <Box as="button" onClick={action}>
        <Text
            m="auto 0"
            align="center"
            className={styles.launch}
            style={{
                backgroundColor: "#683309",
                borderRadius: 20,
                padding: "5px 10px 2px 10px",
                position: "relative",
            }}
            color="white"
        >
            {label}
        </Text>
    </Box>
);

export default MainButton;
