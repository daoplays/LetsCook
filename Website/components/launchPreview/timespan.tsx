import { HStack, Divider, Text } from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";
import { LaunchData, bignum_to_num } from "../Solana/state";

interface TimespanProps {
    launchData?: LaunchData;
}

const Timespan = ({ launchData }: TimespanProps) => {
    const { sm, md, lg } = useResponsive();

    let splitLaunchDate = new Date(bignum_to_num(launchData.launch_date)).toUTCString().split(" ");
    let launchDate = splitLaunchDate[0] + " " + splitLaunchDate[1] + " " + splitLaunchDate[2] + " " + splitLaunchDate[3];
    let splitLaunchTime = splitLaunchDate[4].split(":");
    let launchTime = splitLaunchTime[0] + ":" + splitLaunchTime[1] + " " + splitLaunchDate[5];

    let splitEndDate = new Date(bignum_to_num(launchData.end_date)).toUTCString().split(" ");
    let endDate = splitEndDate[0] + " " + splitEndDate[1] + " " + splitEndDate[2] + " " + splitEndDate[3];
    let splitEndTime = splitEndDate[4].split(":");
    let endTime = splitEndTime[0] + ":" + splitEndTime[1] + " " + splitEndDate[5];

    return (
        <HStack spacing={sm ? 5 : 20} my={3}>
            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" align={"center"} fontSize={md ? "large" : "x-large"}>
                Opens: {launchDate}
                <br />
                {launchTime}
            </Text>
            <Divider orientation="vertical" height={md ? 50 : lg ? 75 : 50} color="#868E96" />
            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" align={"center"} fontSize={md ? "large" : "x-large"}>
                Closes: {endDate}
                <br />
                {endTime}
            </Text>
        </HStack>
    );
};
export default Timespan;