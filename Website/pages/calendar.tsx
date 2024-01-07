import {
    Button,
    Flex,
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverCloseButton,
    PopoverContent,
    PopoverHeader,
    PopoverTrigger,
    Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { addDays } from "date-fns";
import React from "react";
import DatePicker from "react-datepicker";
import useResponsive from "../hooks/useResponsive";
import GameTable from "../components/gameTable";
import "react-datepicker/dist/react-datepicker.css";

const CalenderPage = () => {
    const { sm } = useResponsive();
    const initialFocusRef = React.useRef();
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(null);

    const onChange = (dates) => {
        const [start, end] = dates;
        setStartDate(start);
        setEndDate(end);
    };

    return (
        <main>
            <Flex
                px={4}
                py={18}
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
                    Mint Calendar
                </Text>
                <Popover initialFocusRef={initialFocusRef} placement="bottom" closeOnBlur={false}>
                    <PopoverTrigger>
                        <Button w={sm ? "100%" : "fit-content"}>Filter By Date</Button>
                    </PopoverTrigger>
                    <PopoverContent width={268}>
                        <PopoverArrow />
                        <PopoverCloseButton />
                        <PopoverHeader>Select Date or Range</PopoverHeader>
                        <PopoverBody>
                            <DatePicker
                                selected={startDate}
                                onChange={onChange}
                                startDate={startDate}
                                endDate={endDate}
                                excludeDates={[addDays(new Date(), 1), addDays(new Date(), 5)]}
                                selectsRange
                                selectsDisabledDaysInRange
                                inline
                            />
                        </PopoverBody>
                    </PopoverContent>
                </Popover>
            </Flex>
            <GameTable />
        </main>
    );
};

export default CalenderPage;
