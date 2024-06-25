import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Center, HStack, Link, TableContainer, Text } from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";
import { useRouter } from "next/router";
import { Distribution, JoinedLaunch, LaunchData, bignum_to_num } from "../Solana/state";
import { LaunchKeys, LaunchFlags, Extensions, PROGRAM } from "../Solana/constants";
import { AMMData, MMLaunchData, MMUserData, getAMMKey, reward_schedule } from "../Solana/jupiter_state";
import { useWallet } from "@solana/wallet-adapter-react";
import useGetMMTokens from "../../hooks/jupiter/useGetMMTokens";
import { TfiReload } from "react-icons/tfi";
import useAppRoot from "../../context/useAppRoot";
import Launch from "../../pages/launch";
import { Mint } from "@solana/spl-token";
import ShowExtensions, { getExtensions } from "../Solana/extensions";
import { PublicKey } from "@solana/web3.js";
interface Header {
    text: string;
    field: string | null;
}

function filterTable(list: LaunchData[]) {
    if (list === null || list === undefined) return [];

    return list.filter(function (item) {
        //console.log(new Date(bignum_to_num(item.launch_date)), new Date(bignum_to_num(item.end_date)))
        return item.flags[LaunchFlags.LPState] == 2;
    });
}

interface AMMLaunch {
    amm_data: AMMData;
    mint: Mint;
}

const MarketMakingTable = () => {
    const wallet = useWallet();
    const { sm } = useResponsive();

    const { ammData, SOLPrice, mintData, listingData } = useAppRoot();

    const [sortedField, setSortedField] = useState<string>("end_date");
    const [reverseSort, setReverseSort] = useState<boolean>(false);

    const handleHeaderClick = (e) => {
        if (e == sortedField) {
            setReverseSort(!reverseSort);
        } else {
            setSortedField(e);
            setReverseSort(false);
        }
    };

    console.log(ammData, mintData);
    let amm_launches: AMMLaunch[] = [];
    if (mintData !== null) {
        ammData.forEach((amm, i) => {
            console.log("CHECK AMM IN TABLE", amm.base_mint.toString());
            if (bignum_to_num(amm.start_time) === 0) {
                return;
            }
            let mint_data = mintData.get(amm.base_mint.toString());
            console.log(amm.base_mint.toString(), mint_data);
            let listing_key = PublicKey.findProgramAddressSync([amm.base_mint.toBytes(), Buffer.from("Listing")], PROGRAM)[0];
            let listing = listingData.get(listing_key.toString());
            if (listing && mint_data) {
                //console.log("mint data", mint_data);
                let amm_launch: AMMLaunch = {
                    amm_data: amm,
                    mint: mintData !== null ? mintData.get(amm.base_mint.toString()).mint : null,
                };
                amm_launches.push(amm_launch);
            }
        });
    }

    const tableHeaders: Header[] = [
        { text: "TOKEN", field: null },
        { text: "PRICE", field: null },
        { text: "FDMC", field: "fdmc" },
        { text: "REWARDS (24H)", field: "rewards" },
        { text: "EXTENSIONS", field: null },
    ];

    return (
        <TableContainer>
            <table
                width="100%"
                className="custom-centered-table font-face-rk"
                style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 120%)" }}
            >
                <thead>
                    <tr
                        style={{
                            height: "50px",
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
                                    {/* {i.text === "LOGO" || i.text === "END" ? <></> : <FaSort />} */}
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
                    {amm_launches.map((launch, i) => (
                        <LaunchCard key={i} amm_launch={launch} SOLPrice={SOLPrice} />
                    ))}
                </tbody>
            </table>
        </TableContainer>
    );
};

const LaunchCard = ({ amm_launch, SOLPrice }: { amm_launch: AMMLaunch; SOLPrice: number }) => {
    const router = useRouter();
    const { sm, md, lg } = useResponsive();
    const { listingData } = useAppRoot();

    let listing_key = PublicKey.findProgramAddressSync([amm_launch.mint.address.toBytes(), Buffer.from("Listing")], PROGRAM)[0];
    let listing = listingData.get(listing_key.toString());
    let current_date = Math.floor((new Date().getTime() / 1000 - bignum_to_num(amm_launch.amm_data.start_time)) / 24 / 60 / 60);
    let mm_rewards = reward_schedule(current_date, amm_launch.amm_data);
    let last_price = Buffer.from(amm_launch.amm_data.last_price).readFloatLE(0);
    console.log(amm_launch);
    let total_supply =
        amm_launch.mint !== null && amm_launch.mint !== undefined ? Number(amm_launch.mint.supply) / Math.pow(10, listing.decimals) : 0;
    let market_cap = total_supply * last_price * SOLPrice;
    let amm_key = getAMMKey(amm_launch.amm_data, amm_launch.amm_data.provider);

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
            onClick={() => router.push(`/trade/` + amm_key.toString())}
        >
            <td style={{ minWidth: "160px" }}>
                <HStack m="0 auto" w={160} px={3} spacing={3} justify="start">
                    <Box w={45} h={45} borderRadius={10}>
                        <Image
                            alt="Launch icon"
                            src={listing.icon}
                            width={45}
                            height={45}
                            style={{ borderRadius: "8px", backgroundSize: "cover" }}
                        />
                    </Box>
                    <Text fontSize={"large"} m={0}>
                        {listing.symbol}
                    </Text>
                </HStack>
            </td>

            <td style={{ minWidth: "150px" }}>
                <HStack justify="center">
                    <Text fontSize={"large"} m={0}>
                        {last_price < 1e-3 ? last_price.toExponential(3) : last_price.toFixed(Math.min(listing.decimals, 3))}
                    </Text>
                    <Image src="/images/sol.png" width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                </HStack>
            </td>

            <td style={{ minWidth: "150px" }}>
                <HStack justify="center">
                    <Text fontSize={"large"} m={0}>
                        {market_cap.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </Text>
                    <Image src="/images/usdc.png" width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                </HStack>
            </td>

            <td style={{ minWidth: "200px" }}>
                <HStack justify="center">
                    <Text fontSize={"large"} m={0}>
                        {mm_rewards.toLocaleString()}
                    </Text>
                    <Image src={listing.icon} width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3, borderRadius: "5px" }} />
                </HStack>
            </td>

            <td style={{ minWidth: "140px" }}>
                <ShowExtensions extension_flag={getExtensions(amm_launch.mint)} />
            </td>
            <td style={{ minWidth: "100px" }}>
                <Button onClick={() => router.push(`/trade/` + amm_key.toString())} style={{ textDecoration: "none" }}>
                    View
                </Button>
            </td>
        </tr>
    );
};

export default MarketMakingTable;
