import { Box } from "@chakra-ui/react";
import { UserData } from "../components/Solana/state";
import Table from "react-bootstrap/Table";
import useAppRoot from "../context/useAppRoot";
import Head from "next/head";

const LeaderboardPage = () => {
    const { userList } = useAppRoot();

    const Card = ({ user, index }: { user: UserData; index: number }) => {
        return (
            <tr key={index}>
                <td>{user.user_key.toString()}</td>
                <td>{user.total_points.toString()}</td>
            </tr>
        );
    };

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Leaderboard</title>
            </Head>
            <main>
                <Box width="100%">
                    <div className="font-face-rk" style={{ color: "white", fontSize: 14 }}>
                        <Table className="custom-centered-table">
                            <thead>
                                <tr>
                                    <th>KEY</th>
                                    <th>SCORE</th>
                                </tr>
                            </thead>
                            <tbody
                                style={{
                                    backgroundColor: "black",
                                }}
                            >
                                {userList.map((user: UserData, index) => (
                                    <Card key={index} user={user} index={index} />
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </Box>
            </main>
        </>
    );
};

export default LeaderboardPage;
