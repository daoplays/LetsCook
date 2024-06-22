import { useEffect, useState } from "react";
import {
    Box,
    Flex,
    Text,
    TableContainer,
    HStack,
    Input,
    Button,
    useDisclosure,
    Modal,
    ModalBody,
    ModalContent,
    ModalOverlay,
    VStack,
    Link,
} from "@chakra-ui/react";
import { ListingData, UserData, bignum_to_num } from "../components/Solana/state";
import useAppRoot from "../context/useAppRoot";
import Head from "next/head";
import useResponsive from "../hooks/useResponsive";
import { TfiReload } from "react-icons/tfi";
import { FaSort } from "react-icons/fa";
import styles from "../styles/Launch.module.css";
import useEditUser from "../hooks/useEditUserData";
import { MdEdit } from "react-icons/md";
import { useWallet } from "@solana/wallet-adapter-react";
import WoodenButton from "../components/Buttons/woodenButton";
import UseWalletConnection from "../hooks/useWallet";
import Image from "next/image";
import { HypeVote } from "../components/hypeVote";
import Links from "../components/Buttons/links";
import { getAMMKey, getAMMKeyFromMints } from "../components/Solana/jupiter_state";

interface Header {
    text: string;
    field: string | null;
}

const HotnessPage = () => {
    const wallet = useWallet();
    const { listingData, ammData } = useAppRoot();
    const { xs, sm, lg } = useResponsive();

    const [listings, setListings] = useState<ListingData[]>([]);
    const [sortedField, setSortedField] = useState<string | null>("hype");
    const [reverseSort, setReverseSort] = useState<boolean>(true);

    useEffect(() => {
        if (listingData === null) {
            return;
        }
        let listingVec: ListingData[] = [];
        listingData.forEach((listing) => {
            listingVec.push(listing);
        });

        const sortedListings = listingVec.sort((a, b) => {
            if (sortedField === "hype") {
                let hype_a = a.positive_votes - a.negative_votes;
                let hype_b = b.positive_votes - b.negative_votes;
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

        setListings(sortedListings);
    }, [listingData, sortedField, reverseSort]);

    const HotnessTable = () => {
        const { sm } = useResponsive();

        const tableHeaders: Header[] = [
            { text: "RANK", field: "rank" },
            { text: "TOKEN", field: null },
            { text: "SOCIALS", field: null },
            { text: "HYPE", field: "hype" },
            { text: "TRADE", field: "trade" },
        ];

        const handleHeaderClick = (field: string | null) => {
            console.log("field", field);
            if (field === sortedField) {
                setReverseSort(!reverseSort);
            } else {
                setSortedField(field);
                setReverseSort(false);
            }
        };

        const hype_sorted = [...listings].sort((a, b) => b.positive_votes - b.negative_votes - (a.positive_votes - a.negative_votes));

        return (
            <>
                <TableContainer>
                    <table
                        width="100%"
                        className="custom-centered-table font-face-rk"
                        style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)" }}
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
                                        <HStack
                                            gap={sm ? 1 : 2}
                                            justify="center"
                                            style={{ cursor: i.text === "LOGO" ? "" : "pointer" }}
                                            onClick={() => handleHeaderClick(i.field)}
                                        >
                                            <Text fontSize={sm ? "medium" : "large"} m={0}>
                                                {i.text}
                                            </Text>
                                            {i.text !== "HYPE" ? <></> : <FaSort />}
                                        </HStack>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {listings.map((listing, i) => {
                                return <ListingCard key={listing.mint.toString()} listing={listing} hype_ranked={hype_sorted} index={i} />;
                            })}
                        </tbody>
                    </table>
                </TableContainer>
            </>
        );
    };

    const ListingCard = ({ listing, hype_ranked, index }: { listing: ListingData; hype_ranked: ListingData[]; index: number }) => {
        const socialsExist = listing.socials.some((social) => social !== "");
        const rank = hype_ranked.findIndex((u) => u.mint.equals(listing.mint)) + 1;

        let cook_amm_address = getAMMKeyFromMints(listing.mint, 0)
        let raydium_amm_address = getAMMKeyFromMints(listing.mint, 1)

        let cook_amm = ammData.get(cook_amm_address.toString())
        let have_cook_amm = cook_amm && bignum_to_num(cook_amm.start_time) > 0

        
        let raydium_amm = ammData.get(raydium_amm_address.toString())
        let have_raydium_amm = raydium_amm && bignum_to_num(raydium_amm.start_time) > 0

        return (
            <tr
                style={{
                    background: index % 2 == 0 ? "" : "rgba(255, 255, 255, 0.1)",
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
                <td>
                    <Text fontSize={"large"} m={0} color={"white"}>
                        {rank}
                    </Text>
                </td>
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
                <td style={{ minWidth: "180px" }}>
                    {socialsExist ? (
                        <Links socials={listing.socials} />
                    ) : (
                        <Text fontSize={"large"} m={0}>
                            No Socials
                        </Text>
                    )}
                </td>
                <td style={{ minWidth: "150px" }}>
                    <HypeVote
                        launch_type={0}
                        launch_id={listing.id}
                        page_name={""}
                        positive_votes={listing.positive_votes}
                        negative_votes={listing.negative_votes}
                        isTradePage={false}
                        listing={listing}
                    />
                </td>
                <td style={{ minWidth: "150px" }}>
                <HStack justify="center" gap={3} >
                <Link href={"https://birdeye.so/token/"+listing.mint.toString()+"?chain=solana"} target="_blank">
                    <Image
                        src="/images/birdeye.png"
                        alt="Birdeye Icon"
                        width={lg ? 30 : 40}
                        height={lg  ? 30 : 40}
                    />
                </Link>
                {have_cook_amm &&
                <Link href={"/trade/" + cook_amm_address.toString()} target="_blank">
                <Image
                    src="/favicon.ico"
                    alt="Cook Icon"
                    width={lg ? 30 : 40}
                    height={lg  ? 30 : 40}
                />
                </Link>
                }
                {have_raydium_amm &&
                <Link href={"/trade/" + raydium_amm_address.toString()} target="_blank">
                <Image
                    src="/images/raydium.png"
                    alt="Raydium Icon"
                    width={lg ? 30 : 40}
                    height={lg  ? 30 : 40}
                />
                </Link>
                }
                </HStack>

                </td>
            </tr>
        );
    };

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Hotness</title>
            </Head>
            <main>
                <Flex
                    px={4}
                    py={sm ? 22 : 37}
                    gap={2}
                    alignItems="center"
                    justifyContent="end"
                    style={{ position: "relative", flexDirection: sm ? "column" : "row" }}
                >
                    <Text
                        fontSize={sm ? 25 : 35}
                        color="white"
                        className="font-face-kg"
                        style={{ position: sm ? "static" : "absolute", left: 0, right: 0, margin: "auto" }}
                        align={"center"}
                    >
                        Hotness
                    </Text>
                </Flex>

                <HotnessTable />
            </main>
        </>
    );
};

export default HotnessPage;
