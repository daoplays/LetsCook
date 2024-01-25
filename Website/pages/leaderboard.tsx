import { useEffect, useState } from "react";
import { Box, Flex, Text, TableContainer, HStack, Input } from "@chakra-ui/react";
import { UserData } from "../components/Solana/state";
import Table from "react-bootstrap/Table";
import useAppRoot from "../context/useAppRoot";
import Head from "next/head";
import useResponsive from "../hooks/useResponsive";
import { TfiReload } from "react-icons/tfi";
import { FaSort } from "react-icons/fa";
import styles from "../styles/Launch.module.css";
import useEditUser from "../hooks/useEditUserData";

interface Header {
    text: string;
    field: string | null;
}

const LeaderboardPage = () => {
    const { userList } = useAppRoot();
    const { sm, lg } = useResponsive();

    const [name, setName] = useState<string>("");
    const { EditUser } = useEditUser();

    const handleNameChange = (e) => {
        setName(e.target.value);
    };

    const UserCard = ({ user }: { user: UserData}) => {
        return (
            <tr>
                <td>{user.user_name !== "" ? user.user_name : user.user_key.toString()}</td>
                <td>{user.total_points.toString()}</td>
            </tr>
        );
    };


    const MyBagsTable = ({ user_data }: { user_data: UserData[] }) => {
        const { sm } = useResponsive();
        const { checkUserData } = useAppRoot();

        const [sortedField, setSortedField] = useState<string | null>("sauce");
        const [reverseSort, setReverseSort] = useState<boolean>(true);

        const tableHeaders: Header[] = [
            { text: "NAME", field: "name" },
            { text: "SAUCE", field: "sauce" }
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
            if (sortedField === "name") {
                let a_name = a.user_name !== "" ? a.user_name : a.user_key.toString()
                let b_name = b.user_name !== "" ? b.user_name : b.user_key.toString()
                return reverseSort
                    ? b_name.localeCompare(a_name)
                    : a_name.localeCompare(b_name);
            } else if (sortedField === "sauce") {
                return reverseSort
                    ? b.total_points - a.total_points
                    : a.total_points - b.total_points;
            }

            return 0;
        });

        return (
            <TableContainer>
                <table
                    width="100%"
                    className="custom-centered-table font-face-rk"
                    style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 120%)" }}
                >
                    <thead>
                        <tr style={{ height: "50px", borderTop: "1px solid #868E96", borderBottom: "1px solid #868E96" }}>
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
                                        {i.text === "LOGO" ? <></> : <FaSort />}
                                    </HStack>
                                </th>
                            ))}

                            <th>
                                <Box mt={1} as="button" onClick={checkUserData}>
                                    <TfiReload size={sm ? 18 : 20} />
                                </Box>
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {sortedUsers.map((user) => (
                            <UserCard key={user.user_key.toString()} user={user} />
                        ))}
                    </tbody>
                </table>
            </TableContainer>
        );
    };





    return(

        <>
        <Head>
            <title>Let&apos;s Cook | Leaderboard</title>
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
                    Leaderboard
                </Text>
            </Flex>
            <HStack w="30%" spacing={10} className={styles.eachField} m="5">
                <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "120px" }}>
                    User Name:
                </div>

                <div className={styles.textLabelInput}>
                    <Input
                        placeholder="Enter User Name. "
                        size={lg ? "md" : "lg"}
                        maxLength={25}
                        required
                        className={styles.inputBox}
                        type="text"
                        value={name}
                        onChange={handleNameChange}
                    />
                </div>

                <button type="button" className={`${styles.nextBtn} font-face-kg `} onClick={() => EditUser(name)}>
                    SET
                </button>
            </HStack>
            <MyBagsTable user_data={userList} />
        </main>
    </>
    );

};

export default LeaderboardPage;
