import { HStack, Divider, Text } from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";
import { LaunchData, bignum_to_num } from "../Solana/state";

interface TimespanProps {
    launchData?: LaunchData;
}

const Timespan = ({ launchData }: TimespanProps) => {
    const { sm, md, lg } = useResponsive();

    const local_date = new Date();
    var zone = new Date().toLocaleTimeString("en-us", { timeZoneName: "short" }).split(" ")[2];
    console.log(zone);

    let utc_launch_date = new Date(bignum_to_num(launchData.launch_date));
    let utc_end_date = new Date(bignum_to_num(launchData.end_date));

    let local_launch_date = new Date(utc_launch_date.setMinutes(utc_launch_date.getMinutes() - local_date.getTimezoneOffset()));
    let local_end_date = new Date(utc_end_date.setMinutes(utc_end_date.getMinutes() - local_date.getTimezoneOffset()));

    console.log(local_launch_date.toString());
    let splitLaunchDate = local_launch_date.toUTCString().split(" ");
    let launchDate = splitLaunchDate[0] + " " + splitLaunchDate[1] + " " + splitLaunchDate[2] + " " + splitLaunchDate[3];
    let splitLaunchTime = splitLaunchDate[4].split(":");
    let launchTime = splitLaunchTime[0] + ":" + splitLaunchTime[1] + " " + zone;

    let splitEndDate = local_end_date.toUTCString().split(" ");
    let endDate = splitEndDate[0] + " " + splitEndDate[1] + " " + splitEndDate[2] + " " + splitEndDate[3];
    let splitEndTime = splitEndDate[4].split(":");
    let endTime = splitEndTime[0] + ":" + splitEndTime[1] + " " + zone;

    return (
        <HStack spacing={sm ? 5 : 20} my={3}>
            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" align={"center"} fontSize={md ? "large" : "x-large"}>
                Opens: {launchDate}
                <br />
                {launchTime}
            </Text>
            <Divider orientation="vertical" height={md ? 50 : lg ? 75 : 50} color="rgba(134, 142, 150, 0.5)" />
            <Text m={0} color={"white"} fontFamily="ReemKufiRegular" align={"center"} fontSize={md ? "large" : "x-large"}>
                Closes: {endDate}
                <br />
                {endTime}
            </Text>
        </HStack>
    );
};
export default Timespan;
