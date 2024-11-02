import { useState } from "react";
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
} from "@chakra-ui/react";
import { UserData } from "../components/Solana/state";
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

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
interface Header {
    text: string;
    field: string | null;
}

const LeaderboardPage = () => {
    const wallet = useWallet();
    const { handleConnectWallet } = UseWalletConnection();
    const { userList, currentUserData } = useAppRoot();
    const { xs, sm, lg } = useResponsive();

    const { isOpen, onOpen, onClose } = useDisclosure();

    const [name, setName] = useState<string>("");
    const { EditUser } = useEditUser();

    const handleNameChange = (e) => {
        setName(e.target.value);
    };

    let userVec: UserData[] = [];
    if (userList !== null) {
        userList.forEach((user) => {
            userVec.push(user);
        });
    }

    const LeaderboardTable = () => {
        const { sm } = useResponsive();

        const [sortedField, setSortedField] = useState<string | null>("sauce");
        const [reverseSort, setReverseSort] = useState<boolean>(true);

        const tableHeaders: Header[] = [
            { text: "RANK", field: "rank" },
            { text: "USER", field: "user" },
            { text: "SAUCE", field: "sauce" },
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

        const sortedUsers = userVec.sort((a, b) => {
            if (sortedField === "user") {
                let a_name = a.user_name !== "" ? a.user_name : a.user_key.toString();
                let b_name = b.user_name !== "" ? b.user_name : b.user_key.toString();
                return reverseSort ? b_name.localeCompare(a_name) : a_name.localeCompare(b_name);
            } else if (sortedField === "sauce") {
                return reverseSort ? b.total_points - a.total_points : a.total_points - b.total_points;
            }

            return 0;
        });

        //console.log("sortedUsers", sortedUsers);

        const rank_sorted = [...userVec].sort((a, b) => b.total_points - a.total_points);

        let currentUserIndex = -1;
        if (sortedUsers && currentUserData)
            currentUserIndex = sortedUsers.findIndex((user) => user.user_key.equals(currentUserData?.user_key));

        if (currentUserIndex !== -1) {
            const currentUser = sortedUsers.splice(currentUserIndex, 1)[0];
            sortedUsers.unshift(currentUser);
        }

        return (
            <>
                <Table className="rounded-lg xl:w-[90%]">
                    <TableHeader>
                        <TableRow>
                            {tableHeaders.map((i) => (
                                <TableHead className="min-w-[140px] border-b" key={i.text}>
                                    {i.field ? (
                                        <div
                                            onClick={() => handleHeaderClick(i.field)}
                                            className="flex justify-center font-semibold cursor-pointer"
                                        >
                                            {i.text}
                                            {i.text === "RANK" ? <></> : <FaSort className="w-4 h-4 ml-2" />}
                                        </div>
                                    ) : (
                                        i.text
                                    )}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedUsers.length > 0 ? (
                            sortedUsers.map((user, i) => {
                                return <UserCard key={user.user_key.toString()} rank_sorted={rank_sorted} user={user} index={i} />;
                            })
                        ) : (
                            <TableRow
                                style={{
                                    cursor: "pointer",
                                    height: "60px",
                                    transition: "background-color 0.3s",
                                }}
                                className="border-b"
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = ""; // Reset to default background color
                                }}
                            >
                                <TableCell style={{ minWidth: "160px" }} colSpan={100} className="opacity-50">
                                    No Leaderboard yet
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </>
        );
    };

    const UserCard = ({ rank_sorted, user, index }: { rank_sorted: UserData[]; user: UserData; index: number }) => {
        let isUser = false;
        if (user && currentUserData) isUser = user.user_key.equals(currentUserData?.user_key);

        const rank = rank_sorted.findIndex((u) => u.user_key.equals(user.user_key)) + 1;

        return (
            <TableRow style={{ background: index % 2 == 0 ? "" : "rgba(255, 255, 255, 0.1)" }}>
                <TableCell>{rank}</TableCell>
                <TableCell>{user.user_name !== "" ? user.user_name : user.user_key.toString()}</TableCell>

                <TableCell style={{ minWidth: "160px" }}>
                    <div className="flex items-center justify-center gap-3 px-4">
                        <div className="w-10 h-10 overflow-hidden rounded-lg">
                            <Image alt="Sauce icon" src={"/images/sauce.png"} width={48} height={48} className="object-cover" />
                        </div>
                        <span className="font-semibold">{user.total_points.toString()}</span>
                    </div>
                </TableCell>
            </TableRow>
        );
    };

    if (!wallet.connected) {
        return (
            <HStack w="100%" align="center" justify="center" mt={25}>
                <Text
                    fontSize={lg ? "large" : "x-large"}
                    m={0}
                    color={"white"}
                    onClick={() => handleConnectWallet()}
                    style={{ cursor: "pointer" }}
                >
                    Sign in to view Leaderboard
                </Text>
            </HStack>
        );
    }

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Leaderboard</title>
            </Head>
            <main>
                <Flex
                    py={wallet.connected ? 18 : sm ? 22 : 37}
                    gap={2}
                    alignItems="center"
                    justifyContent="end"
                    style={{ position: "relative", flexDirection: sm ? "column" : "row" }}
                    className="xl:w-[95%]"
                >
                    <Text
                        fontSize={sm ? 25 : 35}
                        color="white"
                        className="font-face-kg"
                        style={{ position: sm ? "static" : "absolute", left: 0, right: 0, margin: "auto" }}
                        align={"center"}
                    >
                        Leaderboard
                    </Text>

                    {wallet.connected && (
                        <Button rightIcon={<MdEdit size={20} />} onClick={onOpen}>
                            Username
                        </Button>
                    )}
                </Flex>

                <LeaderboardTable />
            </main>

            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent
                    bg="url(/images/square-frame.png)"
                    bgSize="contain"
                    bgRepeat="no-repeat"
                    h={345}
                    py={xs ? 6 : 12}
                    px={xs ? 8 : 10}
                >
                    <ModalBody>
                        <VStack align="start" justify={"center"} h="100%" spacing={0} mt={xs ? -8 : 0}>
                            <Text className="font-face-kg" color="white" fontSize="x-large">
                                Edit Username
                            </Text>
                            <Input
                                placeholder={currentUserData?.user_name ? currentUserData?.user_name : "Enter New Username"}
                                size={lg ? "md" : "lg"}
                                maxLength={25}
                                required
                                type="text"
                                value={name}
                                onChange={handleNameChange}
                                color="white"
                            />
                            <HStack mt={xs ? 6 : 10} justify="end" align="end" w="100%">
                                <Text
                                    mr={3}
                                    align="end"
                                    fontSize={"medium"}
                                    style={{
                                        fontFamily: "KGSummerSunshineBlackout",
                                        color: "#fc3838",
                                        cursor: "pointer",
                                    }}
                                    onClick={onClose}
                                >
                                    GO BACK
                                </Text>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        await EditUser(name);
                                    }}
                                    className={`${styles.nextBtn} font-face-kg`}
                                >
                                    Save
                                </button>
                            </HStack>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
};

export default LeaderboardPage;
