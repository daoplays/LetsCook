import { Dispatch, SetStateAction, MutableRefObject, useState, MouseEventHandler, useRef, useEffect } from "react";
import { PieChart } from "react-minimal-pie-chart";
import { useMediaQuery } from "react-responsive";
import {
    Center,
    VStack,
    Text,
    HStack,
    Input,
    InputRightElement,
    InputGroup,
    InputLeftElement,
    Spacer,
    Box,
    Checkbox,
    Tooltip,
} from "@chakra-ui/react";
import { Keypair, PublicKey } from "@solana/web3.js";
import { LaunchData, LaunchDataUserInput, bignum_to_num, Distribution } from "../../components/Solana/state";
import { DEFAULT_FONT_SIZE } from "../../components/Solana/constants";
import Image from "next/image";
import styles from "../../styles/Launch.module.css";
import WoodenButton from "../Buttons/woodenButton";
import useResponsive from "../../hooks/useResponsive";
import { useRouter } from "next/router";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import useAppRoot from "../../context/useAppRoot";
import { toast } from "react-toastify";
import { FaDollarSign } from "react-icons/fa";
import getImageDimensions from "../../utils/getImageDimension";
import { distributionLabels } from "../../constant/root";

interface TokenPageProps {
    setScreen: Dispatch<SetStateAction<string>>;
}

const TokenPage = ({ setScreen }: TokenPageProps) => {
    //console.log(newLaunchData.current)
    const router = useRouter();
    const { sm, md, lg } = useResponsive();
    const { newLaunchData } = useAppRoot();

    const [name, setName] = useState<string>(newLaunchData.current.name);
    const [symbol, setSymbol] = useState<string>(newLaunchData.current.symbol);
    const [displayImg, setDisplayImg] = useState<string>(newLaunchData.current.displayImg);
    const [tokenStart, setTokenStart] = useState<string>("");
    const [totalSupply, setTotalSupply] = useState<string>(newLaunchData.current.total_supply.toString());
    const [decimal, setDecimal] = useState<string>(newLaunchData.current.decimals.toString());
    const [mints, setMints] = useState<string>(newLaunchData.current.num_mints.toString());
    const [ticketPrice, setTotalPrice] = useState<string>(newLaunchData.current.ticket_price.toString());
    const [distribution, setDistribution] = useState<number[]>(newLaunchData.current.distribution);

    const [isCustomProgramId, setIsCustomProgramId] = useState(false);

    const handleNameChange = (e) => {
        setName(e.target.value);
    };
    const handleSymbolChange = (e) => {
        setSymbol(e.target.value);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];

        if (file) {
            if (file.size <= 1048576) {
                const dimensions = await getImageDimensions(file);

                if (dimensions.width === dimensions.height) {
                    newLaunchData.current.icon_file = file;
                    setDisplayImg(URL.createObjectURL(e.target.files[0]));
                } else {
                    toast.error("Please upload an image with equal width and height.");
                }
            } else {
                toast.error("File size exceeds 1MB limit.");
            }
        }
    };

    const handleDistributionChange = (e, idx) => {
        let new_dist = [...distribution];
        new_dist[idx] = isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value);
        console.log(new_dist);
        setDistribution(new_dist);
    };

    function getTotalPercentage(distribution: number[]) {
        let total = 0;
        for (let i = 0; i < distribution.length; i++) {
            total += distribution[i];
        }
        return total;
    }
    // Calculate the total sum of all percentages
    const totalPercentage = getTotalPercentage(distribution);

    function setLaunchData(e) {
        e.preventDefault();

        if (totalPercentage !== 100) {
            toast.error("The total percentage must add up to 100%.");
            return;
        }

        if (newLaunchData.current.icon_file === null) {
            toast.error("Please select an icon image.");
            return;
        }

        if (parseFloat(ticketPrice) < 0.00001) {
            toast.error("Minimum ticket price is 0.00001 SOL");
            return;
        }

        if (symbol.length > 10) {
            toast.error("Maximum symbol length is 10 characters");
            return;
        }

        if (name.length > 25) {
            toast.error("Maximum name length is 25 characters");
            return;
        }

        if (distribution[Distribution.LP] === 0) {
            toast.error("Liquidity pool allocation must be greater than zero");
            return;
        }

        if (distribution[Distribution.Raffle] === 0) {
            toast.error("Raffle allocation must be greater than zero");
            return;
        }

        if (Math.pow(10, parseInt(decimal)) * parseInt(totalSupply) * (distribution[Distribution.Raffle] / 100) < parseInt(mints)) {
            toast.error("Not enough tokens to support the raffle");
            return;
        }

        if (parseInt(totalSupply) < 10) {
            toast.error("Total supply of tokens must be over 10");
            return;
        }

        newLaunchData.current.token_keypair = Keypair.generate();
        if (tokenStart !== "") {
            let attempts = 0;
            while (newLaunchData.current.token_keypair.publicKey.toString().substring(0, tokenStart.length) !== tokenStart) {
                attempts += 1;
                newLaunchData.current.token_keypair = Keypair.generate();
            }

            console.log("Took ", attempts, "to get pubkey", newLaunchData.current.token_keypair.publicKey.toString());
        }

        newLaunchData.current.name = name;
        newLaunchData.current.symbol = symbol;
        newLaunchData.current.displayImg = displayImg;
        newLaunchData.current.total_supply = parseInt(totalSupply);

        newLaunchData.current.decimals = parseInt(decimal);

        newLaunchData.current.num_mints = parseInt(mints);
        newLaunchData.current.ticket_price = parseFloat(ticketPrice);
        newLaunchData.current.minimum_liquidity = Math.round(parseFloat(mints) * parseFloat(ticketPrice));
        newLaunchData.current.distribution = distribution;

        setScreen("details");
    }

    const Browse = () => (
        <HStack spacing={0} className={styles.eachField}>
            <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "132px" }}>
                Icon:
            </div>
            <div>
                <label className={styles.label}>
                    <input id="file" type="file" onChange={handleFileChange} />
                    <span
                        className={styles.browse}
                        style={{ cursor: newLaunchData.current.edit_mode === true ? "not-allowed" : "pointer", padding: "5px 10px" }}
                    >
                        BROWSE
                    </span>
                </label>
            </div>
            <Text m={0} ml={5} className="font-face-rk" fontSize={lg ? "medium" : "lg"}>
                {newLaunchData.current.icon_file !== null ? newLaunchData.current.icon_file.name : "No File Selected"}
            </Text>
        </HStack>
    );

    return (
        <Center style={{ background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)" }} width="100%">
            <VStack w="100%" style={{ paddingBottom: md ? 35 : "75px" }}>
                <Text color="white" className="font-face-kg" textAlign={"center"} fontSize={DEFAULT_FONT_SIZE}>
                    Launch - Token
                </Text>
                <form onSubmit={setLaunchData} style={{ width: lg ? "100%" : "1200px" }}>
                    <VStack px={lg ? 4 : 12} spacing={25}>
                        <HStack w="100%" spacing={lg ? 10 : 12} style={{ flexDirection: lg ? "column" : "row" }}>
                            <Image
                                src={displayImg ? displayImg : "/images/upload-image.png"}
                                width={lg ? 180 : 235}
                                height={lg ? 180 : 235}
                                alt="Image Frame"
                                style={{ backgroundSize: "cover" }}
                            />

                            <VStack spacing={8} flexGrow={1} align="start" width="100%">
                                {lg && <Browse />}

                                <HStack spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "132px" }}>
                                        Name:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            placeholder="Enter Token Name. (Ex. Solana)"
                                            disabled={newLaunchData.current.edit_mode === true}
                                            size={lg ? "md" : "lg"}
                                            maxLength={25}
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            value={name}
                                            onChange={handleNameChange}
                                        />
                                    </div>
                                </HStack>

                                <HStack spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "132px" }}>
                                        Symbol:
                                    </div>

                                    {/* <InputGroup style={{ position: "relative" }}> */}
                                    {/* <InputLeftElement>
                                            <FaDollarSign size={22} style={{ opacity: 0.5, marginTop: lg ? 0 : 8 }} />
                                        </InputLeftElement> */}
                                    <div className={styles.textLabelInput}>
                                        <Input
                                            // pl={9}
                                            bg="#494949"
                                            placeholder="Enter Token Ticker. (Ex. $SOL)"
                                            disabled={newLaunchData.current.edit_mode === true}
                                            size={lg ? "md" : "lg"}
                                            maxLength={8}
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            value={symbol}
                                            onChange={handleSymbolChange}
                                        />
                                    </div>
                                    {/* </InputGroup> */}
                                </HStack>

                                <HStack spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "120px" }}>
                                        Token Prefix:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            maxLength={3}
                                            disabled={newLaunchData.current.edit_mode === true}
                                            size={lg ? "md" : "lg"}
                                            required
                                            className={styles.inputBox}
                                            placeholder="Enter Token Prefix Grind (Max 3 Characters)"
                                            // value={}
                                            // onChange={(e) => {
                                            // }}
                                        />
                                    </div>
                                </HStack>

                                {!lg && <Browse />}
                            </VStack>
                        </HStack>

                        <VStack mt={lg ? 1 : 5} spacing={lg ? 8 : 10} w="100%">
                            <HStack w="100%" spacing={8} style={{ flexDirection: lg ? "column" : "row" }}>
                                <HStack spacing={15} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ width: "174px" }}>
                                        Transfer Hook Program ID:
                                    </div>

                                    <HStack spacing={5} style={{ flexDirection: lg ? "column" : "row", flexGrow: 1 }}>
                                        <div className={styles.textLabelInput}>
                                            <Input
                                                disabled={newLaunchData.current.edit_mode === true || isCustomProgramId}
                                                size={lg ? "md" : "lg"}
                                                required
                                                className={styles.inputBox}
                                                placeholder="Enter Transfer Hook Program ID"
                                                // value={}
                                                // onChange={(e) => {}}
                                            />
                                        </div>
                                        <HStack w="340px" spacing={3}>
                                            <Checkbox
                                                size="lg"
                                                onChange={() => {
                                                    setIsCustomProgramId(!isCustomProgramId);
                                                }}
                                            >
                                                Let&apos;s Cook Fees Hook
                                            </Checkbox>
                                            <Tooltip label="Explanation Here" hasArrow fontSize="large" offset={[0, 10]}>
                                                <Image width={25} height={25} src="/images/help.png" alt="Help" />
                                            </Tooltip>
                                        </HStack>
                                    </HStack>
                                </HStack>
                            </HStack>

                            <HStack spacing={8} w="100%" style={{ flexDirection: lg ? "column" : "row" }}>
                                <HStack spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "185px" }}>
                                        Total Supply:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            disabled={newLaunchData.current.edit_mode === true}
                                            size={lg ? "md" : "lg"}
                                            required
                                            className={styles.inputBox}
                                            placeholder="Enter Token Total Supply"
                                            value={totalSupply}
                                            onChange={(e) => {
                                                setTotalSupply(e.target.value);
                                            }}
                                        />
                                    </div>
                                </HStack>

                                <HStack spacing={lg ? 0 : 30} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "135px" }}>
                                        Decimals:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            disabled={newLaunchData.current.edit_mode === true}
                                            size={lg ? "md" : "lg"}
                                            required
                                            className={styles.inputBox}
                                            placeholder="1-9"
                                            value={decimal}
                                            onChange={(e) => {
                                                setDecimal(e.target.value);
                                            }}
                                        />
                                    </div>
                                </HStack>
                            </HStack>

                            <HStack spacing={8} w="100%" justify="space-between" style={{ flexDirection: lg ? "column" : "row" }}>
                                <HStack spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "185px" }}>
                                        WINNING TICKETS:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            placeholder={"Enter Total Number of Winning Tickets"}
                                            disabled={newLaunchData.current.edit_mode === true}
                                            size={lg ? "md" : "lg"}
                                            required
                                            className={styles.inputBox}
                                            value={mints}
                                            onChange={(e) => {
                                                setMints(e.target.value);
                                            }}
                                        />
                                    </div>
                                </HStack>

                                <HStack spacing={lg ? 0 : 8} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "135px" }}>
                                        Ticket Price:
                                    </div>

                                    <div style={{ width: "100%" }} className={styles.textLabelInput}>
                                        <Input
                                            placeholder={"Enter Price Per Ticket"}
                                            disabled={newLaunchData.current.edit_mode === true}
                                            size={lg ? "md" : "lg"}
                                            required
                                            className={styles.inputBox}
                                            value={ticketPrice}
                                            onChange={(e) => {
                                                setTotalPrice(e.target.value);
                                            }}
                                        />
                                        <Image className={styles.sol} src="/images/sol.png" height={30} width={30} alt="SOL" />
                                    </div>
                                </HStack>
                            </HStack>

                            {/* <div className={styles.launchBodyLowerHorizontal}> */}
                            <HStack spacing={lg ? 0 : 1} className={styles.eachField}>
                                <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "120px" }}>
                                    Minimum Liquidity:
                                </div>

                                <div className={styles.textLabelInput}>
                                    <Input
                                        size={lg ? "md" : "lg"}
                                        required
                                        className={styles.inputBox}
                                        value={
                                            !isNaN(parseFloat(mints) * parseFloat(ticketPrice))
                                                ? parseFloat(mints) * parseFloat(ticketPrice)
                                                : 0
                                        }
                                        disabled
                                        style={{ cursor: "not-allowed" }}
                                        readOnly
                                    />
                                    <Image className={styles.sol} src="/images/sol.png" height={30} width={30} alt="SOL" />
                                </div>
                            </HStack>
                            {/* </div> */}
                        </VStack>

                        <VStack mt={lg ? 2 : 5} spacing={5} w="100%" align="start">
                            <div style={{ color: "white" }} className={`${styles.textLabel} font-face-kg`}>
                                Distribution:
                            </div>
                            <HStack
                                justify="space-between"
                                align={"center"}
                                w="100%"
                                style={{ flexDirection: md ? "column" : "row" }}
                                spacing={5}
                            >
                                <VStack spacing={5} align="start" w={md ? "100%" : "fit-content"} className={styles.distributionBoxFields}>
                                    <HStack spacing={5} mt={md ? 0 : 5}>
                                        <Box w={35} h={30} bg={distributionLabels.headers[0].color} />
                                        <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                                            {distributionLabels.headers[0].title}
                                        </div>
                                    </HStack>

                                    <VStack
                                        pl={md ? 0 : 55}
                                        spacing={5}
                                        align="start"
                                        w={md ? "100%" : "530px"}
                                        className={styles.distributionBoxFields}
                                    >
                                        <HStack spacing={5} align="center" justify="space-between" w="100%">
                                            <HStack spacing={5}>
                                                <Box w={35} h={30} bg={distributionLabels.fields[Distribution.Raffle].color} />
                                                <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                                                    {distributionLabels.fields[Distribution.Raffle].title}
                                                </div>
                                            </HStack>
                                            <div className={styles.distributionField}>
                                                <Input
                                                    size={"lg"}
                                                    required
                                                    value={distribution[Distribution.Raffle].toFixed(0)}
                                                    onChange={(e) => {
                                                        handleDistributionChange(e, Distribution.Raffle);
                                                    }}
                                                    disabled={
                                                        totalPercentage === 100 && distribution[Distribution.Raffle] === 0 ? true : false
                                                    }
                                                />
                                                <Image
                                                    className={styles.percentage}
                                                    width={lg ? 15 : 20}
                                                    height={lg ? 15 : 20}
                                                    src="/images/perc.png"
                                                    alt="Percentage"
                                                />
                                            </div>
                                        </HStack>

                                        <HStack spacing={5} align="center" justify="space-between" w="100%">
                                            <HStack spacing={5}>
                                                <Box w={35} h={30} bg={distributionLabels.fields[Distribution.LP].color} />
                                                <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                                                    {distributionLabels.fields[Distribution.LP].title}
                                                </div>
                                            </HStack>
                                            <div className={styles.distributionField}>
                                                <Input
                                                    size="lg"
                                                    required
                                                    value={distribution[Distribution.LP].toFixed(0)}
                                                    onChange={(e) => {
                                                        handleDistributionChange(e, Distribution.LP);
                                                    }}
                                                    disabled={totalPercentage === 100 && distribution[Distribution.LP] === 0 ? true : false}
                                                />
                                                <Image
                                                    className={styles.percentage}
                                                    width={lg ? 15 : 20}
                                                    height={lg ? 15 : 20}
                                                    src="/images/perc.png"
                                                    alt="Percentage"
                                                />
                                            </div>
                                        </HStack>
                                    </VStack>

                                    <HStack spacing={5} mt={md ? 0 : 5}>
                                        <Box w={35} h={30} bg={distributionLabels.headers[1].color} />
                                        <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                                            {distributionLabels.headers[1].title}
                                        </div>
                                    </HStack>

                                    <VStack
                                        pl={md ? 0 : 55}
                                        spacing={5}
                                        align="start"
                                        w={md ? "100%" : "530px"}
                                        className={styles.distributionBoxFields}
                                    >
                                        <HStack spacing={5} align="center" justify="space-between" w="100%">
                                            <HStack spacing={5}>
                                                <Box w={35} h={30} bg={distributionLabels.fields[Distribution.MMRewards].color} />
                                                <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                                                    {distributionLabels.fields[Distribution.MMRewards].title}
                                                </div>
                                            </HStack>
                                            <div className={styles.distributionField}>
                                                {/* integrate MM Rewards  */}
                                                <Input
                                                    size="lg"
                                                    required
                                                    value={distribution[Distribution.MMRewards].toFixed(0)}
                                                    onChange={(e) => {
                                                        handleDistributionChange(e, Distribution.MMRewards);
                                                    }}
                                                    disabled={
                                                        totalPercentage === 100 && distribution[Distribution.MMRewards] === 0 ? true : false
                                                    }
                                                />
                                                <Image
                                                    className={styles.percentage}
                                                    width={lg ? 15 : 20}
                                                    height={lg ? 15 : 20}
                                                    src="/images/perc.png"
                                                    alt="Percentage"
                                                />
                                            </div>
                                        </HStack>
                                    </VStack>

                                    <HStack spacing={5} mt={md ? 0 : 5}>
                                        <Box w={35} h={30} bg={distributionLabels.headers[2].color} />
                                        <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                                            {distributionLabels.headers[2].title}
                                        </div>
                                    </HStack>

                                    <VStack
                                        pl={md ? 0 : 55}
                                        spacing={5}
                                        align="start"
                                        w={md ? "100%" : "530px"}
                                        className={styles.distributionBoxFields}
                                    >
                                        <HStack spacing={5} align="center" justify="space-between" w="100%">
                                            <HStack spacing={5}>
                                                <Box w={35} h={30} bg={distributionLabels.fields[Distribution.LPRewards].color} />
                                                <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                                                    {distributionLabels.fields[Distribution.LPRewards].title}
                                                </div>
                                            </HStack>
                                            <div className={styles.distributionField}>
                                                <Input
                                                    size="lg"
                                                    value={distribution[Distribution.LPRewards].toFixed(0)}
                                                    onChange={(e) => {
                                                        handleDistributionChange(e, Distribution.LPRewards);
                                                    }}
                                                    disabled={
                                                        totalPercentage === 100 && distribution[Distribution.LPRewards] === 0 ? true : false
                                                    }
                                                />
                                                <Image
                                                    className={styles.percentage}
                                                    width={lg ? 15 : 20}
                                                    height={lg ? 15 : 20}
                                                    src="/images/perc.png"
                                                    alt="Percentage"
                                                />
                                            </div>
                                        </HStack>

                                        <HStack spacing={5} align="center" justify="space-between" w="100%">
                                            <HStack spacing={5}>
                                                <Box w={35} h={30} bg={distributionLabels.fields[Distribution.Team].color} />
                                                <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                                                    {distributionLabels.fields[Distribution.Team].title}
                                                </div>
                                            </HStack>
                                            <div className={styles.distributionField}>
                                                <Input
                                                    size="lg"
                                                    value={distribution[Distribution.Team].toFixed(0)}
                                                    onChange={(e) => {
                                                        handleDistributionChange(e, Distribution.Team);
                                                    }}
                                                    disabled={
                                                        totalPercentage === 100 && distribution[Distribution.Team] === 0 ? true : false
                                                    }
                                                />
                                                <Image
                                                    className={styles.percentage}
                                                    width={lg ? 15 : 20}
                                                    height={lg ? 15 : 20}
                                                    src="/images/perc.png"
                                                    alt="Percentage"
                                                />
                                            </div>
                                        </HStack>

                                        <HStack spacing={5} align="center" justify="space-between" w="100%">
                                            <HStack spacing={5}>
                                                <Box w={35} h={30} bg={distributionLabels.fields[Distribution.Airdrops].color} />
                                                <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                                                    {distributionLabels.fields[Distribution.Airdrops].title}
                                                </div>
                                            </HStack>
                                            <div className={styles.distributionField}>
                                                <Input
                                                    size="lg"
                                                    value={distribution[Distribution.Airdrops].toFixed(0)}
                                                    onChange={(e) => {
                                                        handleDistributionChange(e, Distribution.Airdrops);
                                                    }}
                                                    disabled={
                                                        totalPercentage === 100 && distribution[Distribution.Airdrops] === 0 ? true : false
                                                    }
                                                />
                                                <Image
                                                    className={styles.percentage}
                                                    width={lg ? 15 : 20}
                                                    height={lg ? 15 : 20}
                                                    src="/images/perc.png"
                                                    alt="Percentage"
                                                />
                                            </div>
                                        </HStack>

                                        <HStack spacing={5} align="center" justify="space-between" w="100%">
                                            <HStack spacing={5}>
                                                <Box w={35} h={30} bg={distributionLabels.fields[6].color} />
                                                <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                                                    {distributionLabels.fields[6].title}
                                                </div>
                                            </HStack>

                                            <div className={styles.distributionField} style={{ marginLeft: "15px" }}>
                                                <Input
                                                    size="lg"
                                                    value={distribution[Distribution.Other].toFixed(0)}
                                                    onChange={(e) => {
                                                        handleDistributionChange(e, Distribution.Other);
                                                    }}
                                                    disabled={
                                                        totalPercentage === 100 && distribution[Distribution.Other] === 0 ? true : false
                                                    }
                                                />
                                                <Image
                                                    className={styles.percentage}
                                                    width={lg ? 15 : 20}
                                                    height={lg ? 15 : 20}
                                                    src="/images/perc.png"
                                                    alt="Percentage"
                                                />
                                            </div>
                                        </HStack>
                                    </VStack>
                                </VStack>

                                {/* Pie Chart  */}
                                <VStack
                                    spacing={6}
                                    flexGrow={1}
                                    justify="center"
                                    align="center"
                                    py={8}
                                    h="fit-content"
                                    style={{ position: "relative" }}
                                >
                                    <PieChart
                                        animate={true}
                                        totalValue={100}
                                        data={[
                                            {
                                                title: "Raffle (SOL)",
                                                value: distribution[Distribution.Raffle],
                                                color: "#FF6651",
                                            },
                                            { title: "$TOKEN", value: distribution[Distribution.LP], color: "#FF9548" },

                                            {
                                                title: "Market Maker Rewards",
                                                value: distribution[Distribution.MMRewards],
                                                color: "#66FFB6",
                                            }, // integrate MM Rewards
                                            {
                                                title: "Liquidity Provider Rewards",
                                                value: distribution[Distribution.LPRewards],
                                                color: "#61efff",
                                            },
                                            { title: "Airdrops / Marketing", value: distribution[Distribution.Airdrops], color: "#988FFF" },
                                            { title: "Team", value: distribution[Distribution.Team], color: "#8CB3FF" },
                                            { title: "Others", value: distribution[Distribution.Other], color: "#FD98FE" },
                                            { title: "Blank", value: 100 - totalPercentage, color: "transparent" },
                                        ]}
                                        style={{ width: md ? "100%" : "380px", position: "relative", zIndex: 2 }}
                                    />

                                    <PieChart
                                        animate={true}
                                        totalValue={100}
                                        data={[
                                            {
                                                title: distributionLabels.headers[0].title,
                                                value: distribution[Distribution.Raffle] + distribution[Distribution.LP],
                                                color: distributionLabels.headers[0].color,
                                            },
                                            {
                                                title: distributionLabels.headers[1].title,
                                                // integrate MM Rewards here
                                                value: distribution[Distribution.MMRewards],
                                                color: distributionLabels.headers[1].color,
                                            },
                                            {
                                                title: distributionLabels.headers[2].title,
                                                value:
                                                    distribution[Distribution.LPRewards] +
                                                    distribution[Distribution.Team] +
                                                    distribution[Distribution.Airdrops] +
                                                    distribution[Distribution.Other],
                                                color: distributionLabels.headers[2].color,
                                            },
                                        ]}
                                        style={{ width: md ? "120%" : "440px", position: "absolute", zIndex: 1 }}
                                    />
                                </VStack>
                            </HStack>
                        </VStack>
                        <HStack mt={md ? 0 : 30}>
                            <button type="button" className={`${styles.nextBtn} font-face-kg `} onClick={() => router.push("/dashboard")}>
                                Cancel
                            </button>
                            <button type="submit" className={`${styles.nextBtn} font-face-kg `}>
                                NEXT
                            </button>
                        </HStack>
                    </VStack>
                </form>
            </VStack>
        </Center>
    );
};

export default TokenPage;
