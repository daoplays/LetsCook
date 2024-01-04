import { HStack, Text } from "@chakra-ui/react";
import GameTable from "../components/gameTable";

const CalenderPage = () => {
    return (
        <main>
            <HStack justify="center" h={100}>
                <Text m={0} fontSize={35} color="white" className="font-face-kg" style={{ wordBreak: "break-all" }} align={"center"}>
                    Mint Calendar
                </Text>
            </HStack>
            <GameTable />
        </main>
    );
};

export default CalenderPage;
