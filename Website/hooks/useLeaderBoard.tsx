import { useState } from "react";

import useAppRoot from "@/context/useAppRoot";
import { UserData } from "@/components/Solana/state";

export const useLeaderBoard = () => {
    const { userList, currentUserData } = useAppRoot();

    let userVec: UserData[] = [];
    if (userList !== null) {
        userList.forEach((user) => {
            userVec.push(user);
        });
    }

    const [sortedField, setSortedField] = useState<string | null>("sauce");
    const [reverseSort, setReverseSort] = useState<boolean>(true);

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

    const rank_sorted = [...userVec].sort((a, b) => b.total_points - a.total_points);

    // let currentUserIndex = -1;
    // if (sortedUsers && currentUserData)
    //     currentUserIndex = sortedUsers.findIndex((user) => user.user_key.equals(currentUserData?.user_key));

    // if (currentUserIndex !== -1) {
    //     const currentUser = sortedUsers.splice(currentUserIndex, 1)[0];
    //     sortedUsers.unshift(currentUser);
    // }
    let currentUserIndex = -1;
        if (sortedUsers && currentUserData)
            currentUserIndex = sortedUsers.findIndex((user) => user.user_key.equals(currentUserData?.user_key));

        if (currentUserIndex !== -1) {
            const currentUser = sortedUsers.splice(currentUserIndex, 1)[0];
            sortedUsers.unshift(currentUser);
        }
    return {
        handleHeaderClick,
        sortedUsers,
        rank_sorted,
        sortedField,
        reverseSort,
        currentUserData,
    };
};

useLeaderBoard.propTypes = {};

export default useLeaderBoard;
