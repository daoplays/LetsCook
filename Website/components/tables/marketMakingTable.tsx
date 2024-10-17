import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Center, HStack, Link, TableContainer, Text, Tooltip } from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";
import { useRouter } from "next/router";
import { Distribution, JoinedLaunch, LaunchData, ListingData, MintData, bignum_to_num } from "../Solana/state";
import { LaunchKeys, LaunchFlags, Extensions, PROGRAM, Config } from "../Solana/constants";
import { AMMData, MMLaunchData, MMUserData, getAMMKey, getAMMKeyFromMints, reward_schedule } from "../Solana/jupiter_state";
import { useWallet } from "@solana/wallet-adapter-react";
import useGetMMTokens from "../../hooks/jupiter/useGetMMTokens";
import { TfiReload } from "react-icons/tfi";
import useAppRoot from "../../context/useAppRoot";
import Launch from "../../pages/launch";
import { Mint } from "@solana/spl-token";
import ShowExtensions, { getExtensions } from "../Solana/extensions";
import { PublicKey } from "@solana/web3.js";
import { HypeVote } from "../hypeVote";
import Links from "../Buttons/links";
import formatPrice from "../../utils/formatPrice";
import { FaSort } from "react-icons/fa";
import Loader from "../loader";

interface Header {
    text: string;
    field: string | null;
}

function nFormatter(num, digits) {
    if (num < 1) {
        return formatPrice(num, digits);
    }
    const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "k" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "B" },
        { value: 1e12, symbol: "T" },
        { value: 1e15, symbol: "P" },
        { value: 1e18, symbol: "E" },
    ];
    const regexp = /\.0+$|(?<=\.[0-9]*[1-9])0+$/;
    const item = lookup.findLast((item) => num >= item.value);
    return item ? (num / item.value).toFixed(digits).replace(regexp, "").concat(item.symbol) : "0";
}

interface AMMLaunch {
    amm_data: AMMData;
    mint: MintData;
    listing: ListingData;
}

const MarketMakingTable = () => {
    const wallet = useWallet();
    const { sm } = useResponsive();

    const { ammData, SOLPrice, mintData, listingData, jupPrices } = useAppRoot();

    const [sortedField, setSortedField] = useState<string>("fdmc");
    const [reverseSort, setReverseSort] = useState<boolean>(true);
    const [rows, setRows] = useState<AMMLaunch[]>([]);

    const tableHeaders: Header[] = [
        { text: "Launch date", field: "lunchDate" },
        { text: "TOKEN", field: "symbol" },
        { text: "PRICE", field: "price" },
        { text: "MARKET CAP", field: "fdmc" },
        { text: "REWARDS (24H)", field: "rewards" },
        { text: "SOCIALS", field: null },
        { text: "HYPE", field: "hype" },
        { text: "TRADE", field: null },
    ];

    const handleHeaderClick = (e) => {
        console.log("click header,", e, sortedField);
        if (e == sortedField) {
            setReverseSort(!reverseSort);
        } else {
            setSortedField(e);
            setReverseSort(false);
        }
    };

    useEffect(() => {
        if (!mintData || !listingData || !ammData) {
            return;
        }

        let amm_launches: AMMLaunch[] = [];
        ammData.forEach((amm, i) => {
            //console.log("CHECK AMM IN TABLE", amm.base_mint.toString());
            if (bignum_to_num(amm.start_time) === 0) {
                return;
            }

            let listing_key = PublicKey.findProgramAddressSync([amm.base_mint.toBytes(), Buffer.from("Listing")], PROGRAM)[0];
            let listing = listingData.get(listing_key.toString());
            let mint = mintData.get(amm.base_mint.toString());
            if (listing && mint) {
                //console.log("mint data", mint_data);
                let amm_launch: AMMLaunch = {
                    amm_data: amm,
                    mint: mint,
                    listing: listing,
                };
                amm_launches.push(amm_launch);
            }
        });

        setRows([...amm_launches]);
    }, [mintData, listingData, ammData]);

    const sorted_rows = [...rows];

    sorted_rows.sort((a, b) => {
        if (sortedField === "lunchDate") {
            if (new Date(a.amm_data.start_time.toNumber() * 1000) < new Date(b.amm_data.start_time.toNumber() * 1000)) {
                return reverseSort ? 1 : -1;
            }
            if (new Date(a.amm_data.start_time.toNumber() * 1000) > new Date(b.amm_data.start_time.toNumber() * 1000)) {
                return reverseSort ? -1 : 1;
            }
        }

        if (sortedField === "symbol") {
            if (a.listing.symbol < b.listing.symbol) {
                return reverseSort ? 1 : -1;
            }
            if (a.listing.symbol > b.listing.symbol) {
                return reverseSort ? -1 : 1;
            }
            return 0;
        }

        if (sortedField === "price") {
            let price_a =
                a.amm_data.provider === 0
                    ? Buffer.from(a.amm_data.last_price).readFloatLE(0)
                    : jupPrices.get(a.amm_data.base_mint.toString());
            let price_b =
                b.amm_data.provider === 0
                    ? Buffer.from(b.amm_data.last_price).readFloatLE(0)
                    : jupPrices.get(b.amm_data.base_mint.toString());
            if (price_a < price_b) {
                return reverseSort ? 1 : -1;
            }
            if (price_a > price_b) {
                return reverseSort ? -1 : 1;
            }
            return 0;
        }

        if (sortedField === "fdmc") {
            let total_supply_a = Number(a.mint.mint.supply) / Math.pow(10, a.listing.decimals);
            let total_supply_b = Number(b.mint.mint.supply) / Math.pow(10, b.listing.decimals);
            let price_a =
                a.amm_data.provider === 0
                    ? Buffer.from(a.amm_data.last_price).readFloatLE(0)
                    : jupPrices.get(a.amm_data.base_mint.toString());
            let price_b =
                b.amm_data.provider === 0
                    ? Buffer.from(b.amm_data.last_price).readFloatLE(0)
                    : jupPrices.get(b.amm_data.base_mint.toString());
            let market_cap_a = total_supply_a * price_a * SOLPrice;
            let market_cap_b = total_supply_b * price_b * SOLPrice;
            if (market_cap_a < market_cap_b) {
                return reverseSort ? 1 : -1;
            }
            if (market_cap_a > market_cap_b) {
                return reverseSort ? -1 : 1;
            }
            return 0;
        }

        if (sortedField === "rewards") {
            let current_date = Math.floor((new Date().getTime() / 1000 - bignum_to_num(a.amm_data.start_time)) / 24 / 60 / 60);
            let mm_rewards_a = reward_schedule(current_date, a.amm_data);
            let mm_rewards_b = reward_schedule(current_date, b.amm_data);
            if (mm_rewards_a < mm_rewards_b) {
                return reverseSort ? 1 : -1;
            }
            if (mm_rewards_a > mm_rewards_b) {
                return reverseSort ? -1 : 1;
            }
            return 0;
        }

        if (sortedField === "hype") {
            let hype_a = a.listing.positive_votes - a.listing.negative_votes;
            let hype_b = b.listing.positive_votes - b.listing.negative_votes;
            if (hype_a < hype_b) {
                return reverseSort ? 1 : -1;
            }
            if (hype_a > hype_b) {
                return reverseSort ? -1 : 1;
            }
            return 0;
        }

        return 0;
    });

    if (!mintData || !listingData || !ammData) {
        return <Loader />;
    }

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
                                    <Text
                                        fontSize={sm ? "medium" : "large"}
                                        m={0}
                                        onClick={i.field !== null ? () => handleHeaderClick(i.field) : () => {}}
                                    >
                                        {i.text}
                                    </Text>
                                    {!i.field ? <></> : <FaSort />}
                                </HStack>
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {sorted_rows.map((launch, i) => (
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
    const { ammData, jupPrices } = useAppRoot();

    let current_date = Math.floor((new Date().getTime() / 1000 - bignum_to_num(amm_launch.amm_data.start_time)) / 24 / 60 / 60);
    let mm_rewards = reward_schedule(current_date, amm_launch.amm_data);

    let last_price =
        amm_launch.amm_data.provider === 0
            ? Buffer.from(amm_launch.amm_data.last_price).readFloatLE(0)
            : jupPrices.get(amm_launch.amm_data.base_mint.toString());
    //console.log(amm_launch);
    let total_supply =
        amm_launch.mint !== null && amm_launch.mint !== undefined
            ? Number(amm_launch.mint.mint.supply) / Math.pow(10, amm_launch.listing.decimals)
            : 0;
    let market_cap = total_supply * last_price * SOLPrice;

    let cook_amm_address = getAMMKeyFromMints(amm_launch.listing.mint, 0);
    let raydium_cpmm_address = getAMMKeyFromMints(amm_launch.listing.mint, 1);
    let raydium_amm_address = getAMMKeyFromMints(amm_launch.listing.mint, 2);

    let cook_amm = ammData.get(cook_amm_address.toString());
    let have_cook_amm = cook_amm && bignum_to_num(cook_amm.start_time) > 0;

    if (!have_cook_amm) {
        return <></>;
    }

    let raydium_cpmm = ammData.get(raydium_cpmm_address.toString());
    let have_raydium_cpmm = raydium_cpmm && bignum_to_num(raydium_cpmm.start_time) > 0;

    let raydium_amm = ammData.get(raydium_amm_address.toString());
    let have_raydium_amm = raydium_amm && bignum_to_num(raydium_amm.start_time) > 0;

    let show_birdeye = !have_raydium_amm && !have_raydium_cpmm && !have_cook_amm;

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
            onClick={() => {
                if (have_cook_amm) {
                    router.push("/trade/" + cook_amm_address);
                } else if (show_birdeye) {
                    router.push("https://birdeye.so/token/" + amm_launch.listing.mint.toString() + "?chain=solana");
                } else if (have_raydium_amm) {
                    router.push("/trade/" + raydium_amm_address.toString());
                } else if (have_raydium_cpmm) {
                    router.push("/trade/" + raydium_cpmm_address.toString());
                }
            }}
        >
            <td style={{ minWidth: "160px" }}>
                <Text fontSize={"large"} m={0}>
                    {new Date(amm_launch.amm_data.start_time * 1000).toLocaleString()}
                </Text>
            </td>
            <td style={{ minWidth: "160px" }}>
                <HStack m="0 auto" w={160} px={3} spacing={3} justify="start">
                    <Box w={45} h={45} borderRadius={10}>
                        <Image
                            alt="Launch icon"
                            src={amm_launch.mint.icon}
                            width={45}
                            height={45}
                            style={{ borderRadius: "8px", backgroundSize: "cover" }}
                        />
                    </Box>
                    <Text fontSize={"large"} m={0}>
                        {amm_launch.listing.symbol}
                    </Text>
                </HStack>
            </td>

            <td style={{ minWidth: "150px" }}>
                <HStack justify="center">
                    <Text fontSize={"large"} m={0}>
                        {last_price < 1e-3 ? last_price.toExponential(3) : last_price.toFixed(Math.min(amm_launch.listing.decimals, 3))}
                    </Text>
                    <Image src={Config.token_image} width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} />
                </HStack>
            </td>

            <td style={{ minWidth: "150px" }}>
                <HStack justify="center">
                    <Text fontSize={"large"} m={0}>
                        ${nFormatter(market_cap, 2)}
                    </Text>
                    {/* <Image src="/images/usdc.png" width={30} height={30} alt="SOL Icon" style={{ marginLeft: -3 }} /> */}
                </HStack>
            </td>

            <td style={{ minWidth: "200px" }}>
                <HStack justify="center" gap={2}>
                    <Text fontSize={"large"} m={0}>
                        {nFormatter(mm_rewards, 2)}
                    </Text>
                    <Image
                        src={amm_launch.listing.icon}
                        width={30}
                        height={30}
                        alt="SOL Icon"
                        style={{ marginLeft: -3, borderRadius: "5px" }}
                    />
                </HStack>
            </td>

            <td style={{ minWidth: "140px" }}>
                <Links socials={amm_launch.listing.socials} />
            </td>
            <td style={{ minWidth: "150px" }}>
                <HypeVote
                    launch_type={0}
                    launch_id={amm_launch.listing.id}
                    page_name={""}
                    positive_votes={amm_launch.listing.positive_votes}
                    negative_votes={amm_launch.listing.negative_votes}
                    isTradePage={false}
                    listing={amm_launch.listing}
                />
            </td>
            <td style={{ minWidth: "150px" }}>
                <HStack justify="center" gap={3}>
                    {show_birdeye && (
                        <Tooltip label="Trade on Birdeye" hasArrow fontSize="large" offset={[0, 15]}>
                            <Link href={"https://birdeye.so/token/" + amm_launch.listing.mint.toString() + "?chain=solana"} target="_blank">
                                <Image
                                    src="/images/birdeye.png"
                                    alt="Birdeye Icon"
                                    width={lg ? 30 : 40}
                                    height={lg ? 30 : 40}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </Link>
                        </Tooltip>
                    )}
                    {have_cook_amm && (
                        <Tooltip label="Trade on Let's Cook" hasArrow fontSize="large" offset={[0, 15]}>
                            <Link href={"/trade/" + cook_amm_address} target="_blank">
                                <Image
                                    src="/favicon.ico"
                                    alt="Cook Icon"
                                    width={lg ? 30 : 35}
                                    height={lg ? 30 : 35}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </Link>
                        </Tooltip>
                    )}
                    {have_raydium_amm && (
                        <Tooltip label="Trade on Raydium" hasArrow fontSize="large" offset={[0, 15]}>
                            {have_raydium_amm && (
                                <Link href={"/trade/" + raydium_amm_address.toString()} target="_blank">
                                    <Image
                                        src="/images/raydium.png"
                                        alt="Raydium Icon"
                                        width={lg ? 30 : 40}
                                        height={lg ? 30 : 40}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </Link>
                            )}
                        </Tooltip>
                    )}
                    {have_raydium_cpmm && (
                        <Tooltip label="Trade on Raydium" hasArrow fontSize="large" offset={[0, 15]}>
                            {have_raydium_amm && (
                                <Link href={"/trade/" + raydium_cpmm_address.toString()} target="_blank">
                                    <Image
                                        src="/images/raydium.png"
                                        alt="Raydium Icon"
                                        width={lg ? 30 : 40}
                                        height={lg ? 30 : 40}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </Link>
                            )}
                        </Tooltip>
                    )}
                </HStack>
            </td>
        </tr>
    );
};

export default MarketMakingTable;
