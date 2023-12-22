import { Center, VStack, Text, Box, HStack } from "@chakra-ui/react";

import { FaTwitter, FaTwitch } from "react-icons/fa";

import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE } from "./Solana/constants";
import { LaunchData, UserData, bignum_to_num } from "./Solana/state";

import Table from "react-bootstrap/Table";

export function Leaderboard({ user_data }: { user_data: UserData[] }) {


const Card = ({
    launch,
    index,
}: {
    launch: UserData;
    index: number;
}) => {
   
    return (
        <tr
           
        >
           
            <td>{launch.user_key.toString()}</td>
            <td>
                {launch.total_points.toString()}
            </td>
           
        </tr>
    );
};

    const Listings = ({
        launch_list,
    }: {
        launch_list: UserData[];
    }) => {
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
                            <Listings launch_list={user_data}  />
                        </tbody>
                    </Table>
                </div>
            </Box>
        );
    };

    return (
        <Center width="100%" marginBottom="5rem">
                    <GameTable />
                </Center>
    );
}
