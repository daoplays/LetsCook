import { Box, Button, Center, HStack, TableContainer, Text } from "@chakra-ui/react";
import { TfiReload } from "react-icons/tfi";
import { FaSort } from "react-icons/fa";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";
import useAppRoot from "../../context/useAppRoot";
import { useRouter } from "next/router";
import { JoinedLaunch, LaunchData, MintData, bignum_to_num } from "../Solana/state";
import { AMMData, MMLaunchData, MMUserData, getAMMKey } from "../Solana/jupiter_state";
import { LaunchKeys, LaunchFlags, PROGRAM } from "../Solana/constants";
import useGetMMRewards from "../../hooks/jupiter/useGetMMRewards";
import { PublicKey } from "@solana/web3.js";

interface Header {
    text: string;
    field: string | null;
}

interface MappedReward {
    launch_reward: MMLaunchData;
    user_reward: MMUserData;
    amm: AMMData;
    amm_provider: number;
    base_mint: MintData;
}

function filterLaunchRewards(list: Map<string, MMLaunchData>, amm: AMMData, amm_provider: number) {
    if (list === null || list === undefined) return [];
    if (amm === null) return [];
    let filtered: MMLaunchData[] = [];
    list.forEach((item) => {
        if (item.amm.equals(getAMMKey(amm, amm_provider))) {
            filtered.push(item);
        }
    });
    return filtered;
}

function filterUserRewards(list: Map<string, MMUserData>, amm: AMMData, amm_provider: number) {
    if (list === null || list === undefined) return [];
    if (amm === null) return [];
    let filtered: MMUserData[] = [];
    list.forEach((item) => {
        if (item.amm.equals(getAMMKey(amm, amm_provider))) {
            filtered.push(item);
        }
    });
    return filtered;
}

function getMappedRewards(
    user_rewards: Map<string, MMUserData>,
    launch_rewards: Map<string, MMLaunchData>,
    amm: AMMData,
    amm_provider: number,
    base_mint: MintData,
    mapped_rewards: MappedReward[],
) {
    let filtered_user_rewards = filterUserRewards(user_rewards, amm, amm_provider);
    let filtered_launch_rewards = filterLaunchRewards(launch_rewards, amm, amm_provider);

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

    for (let i = 0; i < filtered_user_rewards.length; i++) {
        for (let j = 0; j < filtered_launch_rewards.length; j++) {
            if (filtered_launch_rewards[j].date === filtered_user_rewards[i].date) {
                let m: MappedReward = {
                    launch_reward: filtered_launch_rewards[j],
                    user_reward: filtered_user_rewards[i],
                    amm: amm,
                    amm_provider: amm_provider,
                    base_mint: base_mint,
                };
                mapped_rewards.push(m);
                break;
            }
        }
    }
}
const MyRewardsTable = ({ amm }: { amm: AMMData | null }) => {
    const { sm } = useResponsive();
    const { mintData, mmLaunchData, mmUserData, ammData } = useAppRoot();

    const tableHeaders: Header[] = [
        { text: "REWARD DAY", field: "reward_day" },
        { text: "TOTAL REWARDS", field: "total_rewards" },
        { text: "TOTAL BOUGHT", field: "total_bought" },
        { text: "USER BOUGHT", field: "user_bought" },
        { text: "USER %", field: "user_percent" },
        { text: "USER REWARDS", field: "user_rewards" },
    ];

    if (amm === null) {
        tableHeaders.unshift({ text: "TOKEN", field: "token" });
    }

    let mapped_rewards: MappedReward[] = [];

    if (amm !== null) {
        getMappedRewards(mmUserData, mmLaunchData, amm, amm.provider, mintData.get(amm.base_mint.toString()), mapped_rewards);
    } else {
        ammData.forEach((amm, i) => {
            if (amm.start_time === 0) {
                return;
            }
            getMappedRewards(mmUserData, mmLaunchData, amm, amm.provider, mintData.get(amm.base_mint.toString()), mapped_rewards);
        });
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
                            <th key={i.text} style={{ minWidth: "120px" }}>
                                <HStack gap={sm ? 1 : 2} justify="center" style={{ cursor: i.text === "LOGO" ? "" : "pointer" }}>
                                    <Text fontSize={sm ? "medium" : "large"} m={0}>
                                        {i.text}
                                    </Text>
                                    {/* {i.text === "LOGO" || i.text === "ORDER" ? <></> : <FaSort />} */}
                                </HStack>
                            </th>
                        ))}

                        <th>
                            <Box mt={1} as="button">
                                <TfiReload size={sm ? 18 : 20} />
                            </Box>
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {mapped_rewards.map((r, i) => (
                        <RewardCard key={i} reward={r} show_icon={amm === null} />
                    ))}
                </tbody>
            </table>
        </TableContainer>
    );
};

const RewardCard = ({ reward, show_icon }: { reward: MappedReward; show_icon: boolean }) => {
    const router = useRouter();
    const { sm, md, lg } = useResponsive();
    const { GetMMRewards, isLoading: isMMRewardsLoading } = useGetMMRewards(reward.amm, reward.amm_provider);

    let days_rewards = bignum_to_num(reward.launch_reward.token_rewards);
    days_rewards /= Math.pow(10, reward.base_mint.mint.decimals);

    let total_traded = bignum_to_num(reward.launch_reward.buy_amount);
    total_traded /= Math.pow(10, reward.base_mint.mint.decimals);

    let user_traded = bignum_to_num(reward.user_reward.buy_amount);
    user_traded /= Math.pow(10, reward.base_mint.mint.decimals);

    let user_percent = (100 * user_traded) / total_traded;
    let user_amount = (days_rewards * user_percent) / 100;

    let current_date = Math.floor((new Date().getTime() / 1000 - bignum_to_num(reward.amm.start_time)) / 24 / 60 / 60);
    let time_left = (new Date().getTime() / 1000 - bignum_to_num(reward.amm.start_time)) / 24 / 60 / 60 - current_date;
    time_left *= 24;
    time_left = 24 - time_left;
    //console.log(current_date, time_left, days_rewards, total_traded, user_traded);

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
            {show_icon && (
                <td style={{ minWidth: "160px" }}>
                    <HStack m="0 auto" w={160} px={3} spacing={3} justify="start">
                        <Box w={45} h={45} borderRadius={10}>
                            <Image
                                alt="Launch icon"
                                src={reward.base_mint.icon}
                                width={45}
                                height={45}
                                style={{ borderRadius: "8px", backgroundSize: "cover" }}
                            />
                        </Box>
                        <Text fontSize={"large"} m={0}>
                            {reward.base_mint.symbol}
                        </Text>
                    </HStack>
                </td>
            )}
            <td style={{ minWidth: "150px" }}>
                <Text fontSize={"large"} m={0}>
                    {reward.launch_reward.date.toLocaleString()}
                </Text>
            </td>
            <td style={{ minWidth: "150px" }}>
                <Text fontSize={"large"} m={0}>
                    {days_rewards.toLocaleString()}
                </Text>
            </td>

            <td style={{ minWidth: "150px" }}>
                <Text fontSize={"large"} m={0}>
                    {total_traded.toLocaleString()}
                </Text>
            </td>

            <td style={{ minWidth: "150px" }}>
                <Text fontSize={"large"} m={0}>
                    {user_traded.toLocaleString()}
                </Text>
            </td>

            <td style={{ minWidth: "150px" }}>
                <Text fontSize={"large"} m={0}>
                    {user_percent.toFixed(2)}%
                </Text>
            </td>

            <td style={{ minWidth: "150px" }}>
                <Text fontSize={"large"} m={0}>
                    {user_amount.toLocaleString()}
                </Text>
            </td>

            <td style={{ minWidth: md ? "120px" : "" }}>
                {current_date === reward.launch_reward.date && (
                    <Text fontSize={"large"} m={0}>
                        Claim in {time_left.toFixed(1)}h
                    </Text>
                )}
                {current_date > reward.launch_reward.date && (
                    <Button onClick={() => GetMMRewards(reward.launch_reward.date)} isLoading={isMMRewardsLoading}>
                        Claim
                    </Button>
                )}
            </td>
        </tr>
    );
};

export default MyRewardsTable;
