import { Center, Box } from "@chakra-ui/react";
import { UserData, RunUserDataGPA } from "../components/Solana/state";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import Table from "react-bootstrap/Table";

const LeaderboardPage = () => {
    const wallet = useWallet();
    const [current_user_data, setCurrentUserData] = useState<UserData | null>(null);
    const [user_data, setUserData] = useState<UserData[]>([]);

    const CheckCurrentUserData = useCallback(async () => {
        let user_list = await RunUserDataGPA("");
        console.log(user_list);
        setUserData(user_list);

        if (wallet.publicKey !== null) {
            for (let i = 0; i < user_list.length; i++) {
                if (user_list[i].user_key.toString() == wallet.publicKey.toString()) {
                    console.log("have current user", user_list[i]);
                    setCurrentUserData(user_list[i]);
                    break;
                }
            }
        }
    }, [wallet.publicKey]);

    useEffect(() => {
        CheckCurrentUserData();
    }, [CheckCurrentUserData]);

    const Card = ({ launch, index }: { launch: UserData; index: number }) => {
        return (
            <tr>
                <td>{launch.user_key.toString()}</td>
                <td>{launch.total_points.toString()}</td>
            </tr>
        );
    };

    const Listings = ({ launch_list }: { launch_list: UserData[] }) => {
        if (launch_list.length === 0) {
            return <></>;
        }

        return (
            <>
                {launch_list.map((item: UserData, index) => (
                    <Card key={index} launch={item} index={index} />
                ))}
            </>
        );
    };

    const GameTable = () => {
        return (
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
                            <Listings launch_list={user_data} />
                        </tbody>
                    </Table>
                </div>
            </Box>
        );
    };

    return (
        <main>
            <GameTable />
        </main>
    );
};

export default LeaderboardPage;
