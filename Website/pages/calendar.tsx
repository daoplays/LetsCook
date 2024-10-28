import {
    Button,
    Flex,
    HStack,
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
import GameTable from "../components/tables/gameTable";
import { LaunchTableFilters } from "../components/tables/gameTable";
import useAppRoot from "../context/useAppRoot";
import Head from "next/head";
import "react-datepicker/dist/react-datepicker.css";
import Loader from "../components/loader";
import EmptyLaunch from "../components/emptyLaunch";

const defaultCalendarFilters: LaunchTableFilters = {
    start_date: new Date(new Date().setHours(0, 0, 0, 0)),
    end_date: addDays(new Date(new Date().setHours(0, 0, 0, 0)), 1),
};

const CalenderPage = () => {
    const { sm, lg } = useResponsive();
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

    //console.log(launchList);

    if (!launchList) return <Loader />;

    // if (launchList.length <= 0) return <EmptyLaunch />;

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Calendar</title>
            </Head>
            <main>
                <Flex
                    py={18}
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
                        Calendar
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
                <GameTable launch_list={launchList} filters={filters} />

                {launchList.size <= 0 && (
                    <HStack w="100%" align="center" justify="center" mt={25}>
                        <Text fontSize={lg ? "large" : "x-large"} m={0} color={"white"} style={{ cursor: "pointer" }}>
                            No launches yet
                        </Text>
                    </HStack>
                )}
            </main>
        </>
    );
};

export default CalenderPage;
