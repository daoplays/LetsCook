import { useState, useMemo, useCallback } from "react";
import React from 'react';
import {
    Flex,
    Text,
    Button,
    useDisclosure,
    Modal,
    ModalBody,
    ModalContent,
    ModalOverlay,
    VStack,
    Input,
    HStack,
} from "@chakra-ui/react";
import { UserData } from "../components/Solana/state";
import useAppRoot from "../context/useAppRoot";
import Head from "next/head";
import useResponsive from "../hooks/useResponsive";
import { FaSort } from "react-icons/fa";
import styles from "../styles/Launch.module.css";
import useEditUser from "../hooks/useEditUserData";
import { MdEdit } from "react-icons/md";
import { useWallet } from "@solana/wallet-adapter-react";
import UseWalletConnection from "../hooks/useWallet";
import Image from "next/image";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import useCurrentUserData from "@/hooks/data/useCurrentUserData";

type SortableField = 'user_name' | 'total_points' | 'rank';

interface Header {
    text: string;
    field: SortableField | null;
}

// Memoized UserCard component
const UserCard = React.memo(({ rank, user, isEven, isCurrentUser }: { 
    rank: number; 
    user: UserData; 
    isEven: boolean;
    isCurrentUser: boolean;
}) => {
    return (
        <TableRow style={{ background: isEven ? "" : "rgba(255, 255, 255, 0.1)" }}>
            <TableCell>{rank}</TableCell>
            <TableCell>{user.user_name || user.user_key.toString()}</TableCell>
            <TableCell style={{ minWidth: "160px" }}>
                <div className="flex items-center justify-center gap-3 px-4">
                    <div className="h-10 w-10 overflow-hidden rounded-lg">
                        <Image 
                            alt="Sauce icon" 
                            src="/images/sauce.png" 
                            width={48} 
                            height={48} 
                            className="object-cover"
                        />
                    </div>
                    <span className="font-semibold">{user.total_points.toString()}</span>
                </div>
            </TableCell>
        </TableRow>
    );
});

UserCard.displayName = 'UserCard';

// Memoized LeaderboardTable component
const LeaderboardTable = React.memo(({ userVec, currentUserKey }: { 
    userVec: UserData[];
    currentUserKey: string | null;
}) => {
    const { sm } = useResponsive();
    const [sortedField, setSortedField] = useState<SortableField>('total_points');
    const [reverseSort, setReverseSort] = useState<boolean>(true);

    const tableHeaders: Header[] = useMemo(() => [
        { text: "RANK", field: "rank" },
        { text: "USER", field: "user_name" },
        { text: "SAUCE", field: "total_points" },
    ], []);

    const handleHeaderClick = useCallback((field: SortableField | null) => {
        if (!field) return;
        
        setSortedField(prev => {
            if (field === prev) {
                setReverseSort(r => !r);
                return prev;
            }
            setReverseSort(false);
            return field;
        });
    }, []);

    const sortedUsers = useMemo(() => {
        const sorted = [...userVec].sort((a, b) => {
            if (sortedField === "user_name") {
                const a_name = a.user_name || a.user_key.toString();
                const b_name = b.user_name || b.user_key.toString();
                return reverseSort ? b_name.localeCompare(a_name) : a_name.localeCompare(b_name);
            }
            if (sortedField === "total_points") {
                return reverseSort ? b.total_points - a.total_points : a.total_points - b.total_points;
            }
            return 0;
        });

        // Create array of rank entries and convert to Map
        const rankEntries: [string, number][] = [...userVec]
            .sort((a, b) => b.total_points - a.total_points)
            .map((user, index): [string, number] => [user.user_key.toString(), index + 1]);
        const ranks = new Map<string, number>(rankEntries);

        if (currentUserKey) {
            const currentUserIndex = sorted.findIndex(
                user => user.user_key.toString() === currentUserKey
            );
            if (currentUserIndex !== -1) {
                const [currentUser] = sorted.splice(currentUserIndex, 1);
                sorted.unshift(currentUser);
            }
        }

        return { sorted, ranks };
    }, [userVec, sortedField, reverseSort, currentUserKey]);

    if (userVec.length === 0) {
        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        {tableHeaders.map(i => (
                            <TableHead className="min-w-[140px] border-b" key={i.text}>
                                {i.field ? (
                                    <div className="flex cursor-pointer justify-center font-semibold">
                                        {i.text}
                                        {i.text === "RANK" ? null : <FaSort className="ml-2 h-4 w-4" />}
                                    </div>
                                ) : i.text}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow className="border-b h-[60px]">
                        <TableCell style={{ minWidth: "160px" }} colSpan={100} className="opacity-50">
                            No Leaderboard yet
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    {tableHeaders.map(i => (
                        <TableHead className="min-w-[140px] border-b" key={i.text}>
                            {i.field ? (
                                <div
                                    onClick={() => handleHeaderClick(i.field)}
                                    className="flex cursor-pointer justify-center font-semibold"
                                >
                                    {i.text}
                                    {i.text === "RANK" ? null : <FaSort className="ml-2 h-4 w-4" />}
                                </div>
                            ) : i.text}
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedUsers.sorted.map((user, index) => (
                    <UserCard
                        key={user.user_key.toString()}
                        rank={sortedUsers.ranks.get(user.user_key.toString()) || index + 1}
                        user={user}
                        isEven={index % 2 === 0}
                        isCurrentUser={user.user_key.toString() === currentUserKey}
                    />
                ))}
            </TableBody>
        </Table>
    );
});

LeaderboardTable.displayName = 'LeaderboardTable';

const LeaderboardPage = () => {
    const wallet = useWallet();
    const { handleConnectWallet } = UseWalletConnection();
    const { userList } = useAppRoot();
    const { userData } = useCurrentUserData({ user: wallet.publicKey });
    const { xs, sm, lg } = useResponsive();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [name, setName] = useState<string>("");
    const { EditUser } = useEditUser();

    const userVec = useMemo(() => (userList ? Array.from(userList, ([_, value]) => value) : []), [userList]);
    const currentUserKey = userData?.user_key.toString() || null;

    if (!wallet.connected) {
        return (
            <HStack w="100%" align="center" justify="center" mt={25}>
                <Text
                    fontSize={lg ? "large" : "x-large"}
                    m={0}
                    color="white"
                    onClick={handleConnectWallet}
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
            <main className="md:p-8">
                <Flex
                    gap={2}
                    alignItems="center"
                    justifyContent="end"
                    style={{ position: "relative", flexDirection: sm ? "column" : "row" }}
                    className="mb-3 w-full px-2"
                >
                    <Text
                        className="block text-center text-3xl font-semibold text-white lg:text-4xl"
                        style={{
                            position: sm ? "static" : "absolute",
                            left: 0,
                            bottom: 5,
                            right: 0,
                            margin: "auto",
                            marginTop: sm ? 16 : 0,
                        }}
                    >
                        Leaderboard
                    </Text>

                    {wallet.connected && (
                        <Button 
                            className="w-full md:w-fit" 
                            rightIcon={<MdEdit size={20} />} 
                            onClick={onOpen}
                        >
                            Username
                        </Button>
                    )}
                </Flex>

                <LeaderboardTable userVec={userVec} currentUserKey={currentUserKey} />
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
                        <VStack align="start" justify="center" h="100%" spacing={0} mt={xs ? -8 : 0}>
                            <Text className="font-face-kg" color="white" fontSize="x-large">
                                Edit Username
                            </Text>
                            <Input
                                placeholder={userData?.user_name || "Enter New Username"}
                                size={lg ? "md" : "lg"}
                                maxLength={25}
                                required
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                color="white"
                            />
                            <HStack mt={xs ? 6 : 10} justify="end" align="end" w="100%">
                                <Text
                                    mr={3}
                                    align="end"
                                    fontSize="medium"
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
                                    onClick={() => EditUser(name)}
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