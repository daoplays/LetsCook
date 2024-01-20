import { Dispatch, SetStateAction, MutableRefObject, useState, MouseEventHandler, useRef, useEffect } from "react";
import { PieChart } from "react-minimal-pie-chart";
import { useMediaQuery } from "react-responsive";
import { Center, VStack, Text, HStack, Input, InputRightElement, InputGroup, InputLeftElement, Spacer, Box } from "@chakra-ui/react";
import { LaunchData, LaunchDataUserInput, bignum_to_num } from "../../components/Solana/state";
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
import getImageDimensions from "../../hooks/useGetImageDimension";

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
    const [totalSupply, setTotalSupply] = useState<string>(newLaunchData.current.total_supply.toString());
    const [decimal, setDecimal] = useState<string>(newLaunchData.current.decimals.toString());
    const [mints, setMints] = useState<string>(newLaunchData.current.num_mints.toString());
    const [ticketPrice, setTotalPrice] = useState<string>(newLaunchData.current.ticket_price.toString());
    const [distribution1, setDistribution1] = useState(newLaunchData.current.distribution[0].toString());
    const [distribution2, setDistribution2] = useState(newLaunchData.current.distribution[1].toString());
    const [distribution3, setDistribution3] = useState(newLaunchData.current.distribution[2].toString());
    const [distribution4, setDistribution4] = useState(newLaunchData.current.distribution[3].toString());
    const [distribution5, setDistribution5] = useState(newLaunchData.current.distribution[4].toString());
    const [distribution6, setDistribution6] = useState(newLaunchData.current.distribution[5].toString());

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

    const percentage1 = isNaN(parseInt(distribution1)) ? 0 : parseInt(distribution1);
    const percentage2 = isNaN(parseInt(distribution2)) ? 0 : parseInt(distribution2);
    const percentage3 = isNaN(parseInt(distribution3)) ? 0 : parseInt(distribution3);
    const percentage4 = isNaN(parseInt(distribution4)) ? 0 : parseInt(distribution4);
    const percentage5 = isNaN(parseInt(distribution5)) ? 0 : parseInt(distribution5);
    const percentage6 = isNaN(parseInt(distribution6)) ? 0 : parseInt(distribution6);

    // Calculate the total sum of all percentages
    const totalPercentage = percentage1 + percentage2 + percentage3 + percentage4 + percentage5 + percentage6;

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

        if (parseFloat(distribution2) === 0) {
            toast.error("Liquidity pool allocation must be greater than zero");
            return;
        }

        if (parseFloat(distribution1) === 0) {
            toast.error("Raffle allocation must be greater than zero");
            return;
        }

        if (Math.pow(10, parseInt(decimal)) * parseInt(totalSupply) * (percentage1 / 100) < parseInt(mints)) {
            toast.error("Not enough tokens to support the raffle");
            return;
        }

        if (parseInt(totalSupply) < 10) {
            toast.error("Total supply of tokens must be over 10");
            return;
        }

        newLaunchData.current.name = name;
        newLaunchData.current.symbol = symbol;
        newLaunchData.current.displayImg = displayImg;
        newLaunchData.current.total_supply = parseInt(totalSupply);

        newLaunchData.current.decimals = parseInt(decimal);

        newLaunchData.current.num_mints = parseInt(mints);
        newLaunchData.current.ticket_price = parseFloat(ticketPrice);
        newLaunchData.current.minimum_liquidity = Math.round(parseFloat(mints) * parseFloat(ticketPrice));
        newLaunchData.current.distribution[0] = parseFloat(distribution1);
        newLaunchData.current.distribution[1] = parseFloat(distribution2);
        newLaunchData.current.distribution[2] = parseFloat(distribution3);
        newLaunchData.current.distribution[3] = parseFloat(distribution4);
        newLaunchData.current.distribution[4] = parseFloat(distribution5);
        newLaunchData.current.distribution[5] = parseFloat(distribution6);
        setScreen("details");
    }

    const Browse = () => (
        <HStack spacing={0} className={styles.eachField}>
            <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "120px" }}>
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
                                width={lg ? 180 : 250}
                                height={lg ? 180 : 250}
                                alt="Image Frame"
                                style={{ backgroundSize: "cover" }}
                            />

                            <VStack spacing={lg ? 8 : 10} flexGrow={1} align="start" width="100%">
                                {lg && <Browse />}

                                <HStack spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "120px" }}>
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
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "120px" }}>
                                        Symbol:
                                    </div>

                                    <InputGroup style={{ position: "relative" }}>
                                        <InputLeftElement>
                                            <FaDollarSign size={22} style={{ opacity: 0.5, marginTop: lg ? 0 : 8 }} />
                                        </InputLeftElement>
                                        <Input
                                            pl={9}
                                            bg="#494949"
                                            placeholder="Enter Token Ticker. (Ex. SOL)"
                                            disabled={newLaunchData.current.edit_mode === true}
                                            size={lg ? "md" : "lg"}
                                            maxLength={8}
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            value={symbol}
                                            onChange={handleSymbolChange}
                                        />
                                    </InputGroup>
                                </HStack>

                                {!lg && <Browse />}
                            </VStack>
                        </HStack>
                        s
                        <VStack mt={lg ? 1 : 5} spacing={lg ? 8 : 10} w="100%">
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
                                            type="number"
                                            min="1"
                                            value={totalSupply !== "0" ? totalSupply : ""}
                                            onChange={(e) => {
                                                setTotalSupply(e.target.value);
                                            }}
                                        />
                                    </div>
                                </HStack>

                                <HStack spacing={lg ? 0 : 30} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "150px" }}>
                                        Decimals:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            disabled={newLaunchData.current.edit_mode === true}
                                            size={lg ? "md" : "lg"}
                                            required
                                            className={styles.inputBox}
                                            placeholder="1-9"
                                            type="number"
                                            min="1"
                                            max="9"
                                            value={decimal !== "0" ? decimal : ""}
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
                                            type="number"
                                            min="1"
                                            value={mints !== "0" ? mints : ""}
                                            onChange={(e) => {
                                                setMints(e.target.value);
                                            }}
                                        />
                                    </div>
                                </HStack>

                                <HStack spacing={lg ? 0 : 8} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "150px" }}>
                                        Ticket Price:
                                    </div>

                                    <div style={{ width: "100%" }} className={styles.textLabelInput}>
                                        <Input
                                            placeholder={"Enter Price Per Ticket"}
                                            disabled={newLaunchData.current.edit_mode === true}
                                            size={lg ? "md" : "lg"}
                                            required
                                            className={styles.inputBox}
                                            type="number"
                                            value={ticketPrice !== "0" ? ticketPrice : ""}
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
                                        type="number"
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
                                style={{ flexDirection: sm ? "column" : "row" }}
                                spacing={5}
                            >
                                <VStack spacing={5} align="start" w={sm ? "100%" : ""} className={styles.distributionBoxFields}>
                                    <HStack spacing={5} align="center" justify="space-between" w="100%">
                                        <HStack spacing={5}>
                                            <Box w={50} h={30} bg="#ff5151" />
                                            <div className={`${styles.textLabel} ${styles.textLabel2} `}>LetsCookRaffle</div>
                                        </HStack>
                                        <div className={styles.distributionField}>
                                            <Input
                                                size={"lg"}
                                                required
                                                value={parseInt(distribution1).toFixed(0)}
                                                onChange={(e) => {
                                                    setDistribution1(e.target.value);
                                                }}
                                                type="number"
                                                min="0"
                                                max="100"
                                                disabled={totalPercentage === 100 && parseInt(distribution1) === 0 ? true : false}
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
                                            <Box w={50} h={30} bg="#489cff" />
                                            <div className={`${styles.textLabel} ${styles.textLabel2}`}>Liquidity Pool</div>
                                        </HStack>
                                        <div className={styles.distributionField}>
                                            <Input
                                                size="lg"
                                                required
                                                value={parseInt(distribution2).toFixed(0)}
                                                onChange={(e) => {
                                                    setDistribution2(e.target.value);
                                                }}
                                                type="number"
                                                min="0"
                                                max="100"
                                                disabled={totalPercentage === 100 && parseInt(distribution2) === 0 ? true : false}
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
                                            <Box w={50} h={30} bg="#74dd5a" />
                                            <div className={`${styles.textLabel} ${styles.textLabel2}`}>LP Rewards</div>
                                        </HStack>
                                        <div className={styles.distributionField}>
                                            <Input
                                                size="lg"
                                                value={parseInt(distribution3).toFixed(0)}
                                                onChange={(e) => {
                                                    setDistribution3(e.target.value);
                                                }}
                                                type="number"
                                                min="0"
                                                max="100"
                                                disabled={totalPercentage === 100 && parseInt(distribution3) === 0 ? true : false}
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
                                            <Box w={50} h={30} bg="#ffef5e" />
                                            <div className={`${styles.textLabel} ${styles.textLabel2}`}>Airdrops</div>
                                        </HStack>
                                        <div className={styles.distributionField}>
                                            <Input
                                                size="lg"
                                                value={parseInt(distribution4).toFixed(0)}
                                                onChange={(e) => {
                                                    setDistribution4(e.target.value);
                                                }}
                                                type="number"
                                                min="0"
                                                max="100"
                                                disabled={totalPercentage === 100 && parseInt(distribution4) === 0 ? true : false}
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
                                            <Box w={50} h={30} bg="#b96cf6" />
                                            <div className={`${styles.textLabel} ${styles.textLabel2} `}>Team</div>
                                        </HStack>
                                        <div className={styles.distributionField}>
                                            <Input
                                                size="lg"
                                                value={parseInt(distribution5).toFixed(0)}
                                                onChange={(e) => {
                                                    setDistribution5(e.target.value);
                                                }}
                                                type="number"
                                                min="0"
                                                max="100"
                                                disabled={totalPercentage === 100 && parseInt(distribution5) === 0 ? true : false}
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
                                            <Box w={50} h={30} bg="#ff994e" />
                                            <div className={`${styles.textLabel} ${styles.textLabel2}`}>Other (See Website)</div>
                                        </HStack>

                                        <div className={styles.distributionField} style={{ marginLeft: "15px" }}>
                                            <Input
                                                size="lg"
                                                value={parseInt(distribution6).toFixed(0)}
                                                onChange={(e) => {
                                                    setDistribution6(e.target.value);
                                                }}
                                                type="number"
                                                min="0"
                                                max="100"
                                                disabled={totalPercentage === 100 && parseInt(distribution6) === 0 ? true : false}
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

                                {(distribution1 || distribution2 || distribution3 || distribution4 || distribution5 || distribution6) !==
                                    "0" && (
                                    <HStack flexGrow={1} justify="center" align="center" py={3}>
                                        <PieChart
                                            animate={true}
                                            totalValue={100}
                                            data={[
                                                { title: "LetsCookRaffle", value: percentage1, color: "#FF5151" },
                                                { title: "Liquidity Pool", value: percentage2, color: "#489CFF" },
                                                { title: "LP Rewards", value: percentage3, color: "#74DD5A" },
                                                { title: "Airdrops", value: percentage4, color: "#FFEF5E" },
                                                { title: "Team", value: percentage5, color: "#B96CF6" },
                                                { title: "Other", value: percentage6, color: "#FF994E" },
                                                { title: "Blank", value: 100 - totalPercentage, color: "transparent" },
                                            ]}
                                            style={{ width: sm ? "100%" : "380px" }}
                                        />
                                    </HStack>
                                )}
                            </HStack>
                        </VStack>
                        <HStack mt={sm ? 0 : 15}>
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
