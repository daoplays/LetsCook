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

    const LeaderboardTable = ({ user_data }: { user_data: UserData[] }) => {
        const { sm } = useResponsive();
        const { checkProgramData } = useAppRoot();

        const [sortedField, setSortedField] = useState<string | null>("sauce");
        const [reverseSort, setReverseSort] = useState<boolean>(true);

        const tableHeaders: Header[] = [
            { text: "RANK", field: "rank" },
            { text: "USER", field: "user" },
            { text: "SAUCE", field: "sauce" },
        ];

        const handleHeaderClick = (field: string | null) => {
            if (field === sortedField) {
                setReverseSort(!reverseSort);
            } else {
                setSortedField(field);
                setReverseSort(false);
            }
        };

        const sortedUsers = [...user_data].sort((a, b) => {
            if (sortedField === "user") {
                let a_name = a.user_name !== "" ? a.user_name : a.user_key.toString();
                let b_name = b.user_name !== "" ? b.user_name : b.user_key.toString();
                return reverseSort ? b_name.localeCompare(a_name) : a_name.localeCompare(b_name);
            } else if (sortedField === "sauce") {
                return reverseSort ? b.total_points - a.total_points : a.total_points - b.total_points;
            }

            return 0;
        });

        const currentUserIndex = sortedUsers.findIndex((user) => user.user_key.equals(currentUserData?.user_key));

        if (currentUserIndex !== -1) {
            const currentUser = sortedUsers.splice(currentUserIndex, 1)[0];
            sortedUsers.unshift(currentUser);
        }

        return (
            <>
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
                                        <HStack
                                            gap={sm ? 1 : 2}
                                            justify="center"
                                            style={{ cursor: i.text === "LOGO" ? "" : "pointer" }}
                                            onClick={() => handleHeaderClick(i.field)}
                                        >
                                            <Text fontSize={sm ? "medium" : "large"} m={0}>
                                                {i.text}
                                            </Text>
                                            {i.text === "RANK" ? <></> : <FaSort />}
                                        </HStack>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {sortedUsers.map((user, i) => {
                                return <UserCard key={user.user_key.toString()} user={user} index={i} />;
                            })}
                        </tbody>
                    </table>
                </TableContainer>
            </>
        );
    };

    const UserCard = ({ user, index }: { user: UserData; index: number }) => {
        const isUser = user.user_key.equals(currentUserData?.user_key);
        const sortedUsers = [...userList].sort((a, b) => b.total_points - a.total_points);

        const rank = sortedUsers.findIndex((u) => u.user_key.equals(user.user_key)) + 1;

        return (
            <tr style={{ background: index % 2 == 0 ? "" : "rgba(255, 255, 255, 0.1)" }}>
                <td>
                    <Text fontSize={"large"} m={0} color={isUser ? "yellow" : "white"}>
                        {rank}
                    </Text>
                </td>
                <td>
                    <Text fontSize={"large"} my={6} color={isUser ? "yellow" : "white"}>
                        {user.user_name !== "" ? user.user_name : user.user_key.toString()}
                    </Text>
                </td>

                <td style={{ minWidth: "160px" }}>
                    <HStack m="0 auto" w={160} px={3} spacing={3} justify="start">
                        <Box w={35} h={35} borderRadius={10} style={{ minWidth: "35px" }}>
                            <Image
                                alt="Sauce icon"
                                src={"/images/sauce.png"}
                                width={35}
                                height={35}
                                style={{ borderRadius: "8px", backgroundSize: "cover" }}
                            />
                        </Box>
                        <Text fontSize={"large"} m={0} color={isUser ? "yellow" : "white"}>
                            {user.total_points.toString()}
                        </Text>
                    </HStack>
                </td>
            </tr>
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
                    px={4}
                    py={wallet.connected ? 18 : sm ? 22 : 37}
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
                        Leaderboard
                    </Text>

                    {wallet.connected && (
                        <Button rightIcon={<MdEdit size={20} />} onClick={onOpen}>
                            Username
                        </Button>
                    )}
                </Flex>

                <LeaderboardTable user_data={userList} />
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
                                    Go Back
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
