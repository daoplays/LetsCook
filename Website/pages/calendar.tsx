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
import { LaunchTableFilters } from "../components/gameTable";
import useAppRoot from "../context/useAppRoot";

import "react-datepicker/dist/react-datepicker.css";
import Loader from "../components/loader";
import EmptyLaunch from "../components/emptyLaunch";

const defaultCalendarFilters: LaunchTableFilters = {
    start_date: new Date(new Date().setHours(0, 0, 0, 0)),
    end_date: addDays(new Date(new Date().setHours(0, 0, 0, 0)), 1),
};

const CalenderPage = () => {
    const { sm } = useResponsive();
    const initialFocusRef = React.useRef();
    const [startDate, setStartDate] = useState(new Date(new Date().setHours(0, 0, 0, 0)));
    const [endDate, setEndDate] = useState(addDays(new Date(new Date().setHours(0, 0, 0, 0)), 1));
    const [filters, setFilters] = useState<LaunchTableFilters>(defaultCalendarFilters);
    const { launchList } = useAppRoot();

    const onChange = (dates) => {
        const [start, end] = dates;
        setStartDate(start);
        setEndDate(end);

        setFilters((previous) => ({ ...previous, start_date: start }));
        setFilters((previous) => ({ ...previous, end_date: end !== null ? addDays(end, 1) : null }));
    };

    if (!launchList) return <Loader />;

    if (launchList.length <= 0) return <EmptyLaunch />;

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
                                selectsRange
                                selectsDisabledDaysInRange
                                inline
                            />
                        </PopoverBody>
                    </PopoverContent>
                </Popover>
            </Flex>
            <GameTable launchList={launchList} filters={filters} />
        </main>
    );
};

export default CalenderPage;
