import { Box, Button, Center, HStack, TableContainer, Text } from "@chakra-ui/react";
import { TfiReload } from "react-icons/tfi";
import { FaSort } from "react-icons/fa";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";
import useAppRoot from "../../context/useAppRoot";
import { useRouter } from "next/router";
import { JoinedLaunch, LaunchData, bignum_to_num } from "../Solana/state";
import { MMLaunchData, MMUserData } from "../Solana/jupiter_state";
import { LaunchKeys } from "../Solana/constants";
import useGetMMRewards from "../../hooks/jupiter/useGetMMRewards";

interface Header {
    text: string;
    field: string | null;
}

interface MappedReward {
    launch_reward: MMLaunchData;
    user_reward: MMUserData;
}

function filterLaunchRewards(list: MMLaunchData[], launch_data: LaunchData) {
    if (list === null || list === undefined) return [];
    if (launch_data === null) return [];

    return list.filter(function (item) {
        //console.log(new Date(bignum_to_num(item.launch_date)), new Date(bignum_to_num(item.end_date)))
        return item.mint_key.equals(launch_data.keys[LaunchKeys.MintAddress]);
    });
}

function filterUserRewards(list: MMUserData[], launch_data: LaunchData) {
    if (list === null || list === undefined) return [];
    if (launch_data === null) return [];

    return list.filter(function (item) {
        //console.log(new Date(bignum_to_num(item.launch_date)), new Date(bignum_to_num(item.end_date)))
        return item.mint_key.equals(launch_data.keys[LaunchKeys.MintAddress]);
    });
}

const MyRewardsTable = ({ launch_data }: { launch_data: LaunchData | null }) => {
    const { sm } = useResponsive();
    const { checkProgramData, mmLaunchData, mmUserData } = useAppRoot();

    const tableHeaders: Header[] = [
        { text: "REWARD DAY", field: "reward_day" },
        { text: "TOTAL REWARDS", field: "total_rewards" },
        { text: "TOTAL BOUGHT", field: "total_bought" },
        { text: "USER BOUGHT", field: "user_bought" },
        { text: "USER %", field: "user_percent" },
        { text: "USER REWARDS", field: "user_rewards" },
    ];

    let filtered_user_rewards = filterUserRewards(mmUserData, launch_data);
    let filtered_launch_rewards = filterLaunchRewards(mmLaunchData, launch_data);

    filtered_user_rewards.sort((a, b) => {
        if (a.date < b.date) {
            return -1;
        }
        if (a.date > b.date) {
            return 1;
        }
        return 0;
    });

    filtered_launch_rewards.sort((a, b) => {
        if (a.date < b.date) {
            return -1;
        }
        if (a.date > b.date) {
            return 1;
        }
        return 0;
    });

    let mapped_rewards: MappedReward[] = [];
    for (let i = 0; i < filtered_user_rewards.length; i++) {
        for (let j = 0; j < filtered_launch_rewards.length; j++) {
            if (filtered_launch_rewards[j].date === filtered_user_rewards[j].date) {
                let m: MappedReward = { launch_reward: filtered_launch_rewards[0], user_reward: filtered_user_rewards[i] };
                mapped_rewards.push(m);
                break;
            }
        }
    }

    return (
        <TableContainer w={"100%"}>
            <table
                width="100%"
                className="custom-centered-table font-face-rk"
                style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 120%)" }}
            >
                <thead>
                    <tr
                        style={{
                            height: "60px",
                            borderTop: "1px solid rgba(134, 142, 150, 0.5)",
                            borderBottom: "1px solid rgba(134, 142, 150, 0.5)",
                        }}
                    >
                        {tableHeaders.map((i) => (
                            <th key={i.text} style={{ minWidth: sm ? "90px" : "120px" }}>
                                <HStack gap={sm ? 1 : 2} justify="center" style={{ cursor: i.text === "LOGO" ? "" : "pointer" }}>
                                    <Text fontSize={sm ? "medium" : "large"} m={0}>
                                        {i.text}
                                    </Text>
                                    {/* {i.text === "LOGO" || i.text === "ORDER" ? <></> : <FaSort />} */}
                                </HStack>
                            </th>
                        ))}

                        <th style={{ minWidth: sm ? "90px" : "120px" }}>
                            <HStack gap={sm ? 1 : 2} justify="center" style={{ cursor: "pointer" }}></HStack>
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {mapped_rewards.map((r, i) => (
                        <RewardCard key={i} reward={r} launch={launch_data} />
                    ))}
                </tbody>
            </table>
        </TableContainer>
    );
};

const RewardCard = ({ reward, launch }: { reward: MappedReward; launch: LaunchData }) => {
    const router = useRouter();
    const { sm, md, lg } = useResponsive();
    const { GetMMRewards } = useGetMMRewards();

    let days_rewards = bignum_to_num(reward.launch_reward.token_rewards);
    days_rewards /= Math.pow(10, launch.decimals);

    let total_traded = bignum_to_num(reward.launch_reward.buy_amount);
    total_traded /= Math.pow(10, launch.decimals);

    let user_traded = bignum_to_num(reward.user_reward.buy_amount);
    user_traded /= Math.pow(10, launch.decimals);

    let user_percent = (100 * user_traded) / total_traded;
    let user_amount = (days_rewards * user_percent) / 100;

    console.log(days_rewards, total_traded, user_traded);

    return (
        <tr
            style={{
                cursor: "pointer",
                height: "60px",
                transition: "background-color 0.3s",
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = ""; // Reset to default background color
            }}
        >
            <td style={{ minWidth: "120px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {reward.launch_reward.date}
                </Text>
            </td>
            <td style={{ minWidth: "120px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {days_rewards}
                </Text>
            </td>

            <td style={{ minWidth: "150px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {total_traded}
                </Text>
            </td>

            <td style={{ minWidth: "150px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {user_traded}
                </Text>
            </td>

            <td style={{ minWidth: "150px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {user_percent}
                </Text>
            </td>

            <td style={{ minWidth: "150px" }}>
                <Text fontSize={lg ? "large" : "x-large"} m={0}>
                    {user_amount}
                </Text>
            </td>

            <td style={{ minWidth: md ? "120px" : "" }}>
                {/*
                <Button onClick={() => GetMMRewards(reward.launch_reward.date, launch)}>Claim</Button>
               */}
            </td>
        </tr>
    );
};

export default MyRewardsTable;
