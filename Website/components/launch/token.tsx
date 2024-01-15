import { Dispatch, SetStateAction, MutableRefObject, useState, MouseEventHandler, useRef, useEffect } from "react";
import { PieChart } from "react-minimal-pie-chart";
import { useMediaQuery } from "react-responsive";
import { Center, VStack, Text, HStack, Input } from "@chakra-ui/react";
import { LaunchData, LaunchDataUserInput, bignum_to_num, defaultUserInput } from "../../components/Solana/state";
import { DEFAULT_FONT_SIZE } from "../../components/Solana/constants";
import Image from "next/image";
import styles from "../../styles/Launch.module.css";
import WoodenButton from "../Buttons/woodenButton";
import useResponsive from "../../hooks/useResponsive";
import { useRouter } from "next/router";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import useAppRoot from "../../context/useAppRoot";
import { toast } from "react-toastify";

interface TokenPageProps {
    setScreen: Dispatch<SetStateAction<string>>;
}

const TokenPage = ({ setScreen }: TokenPageProps) => {
    //console.log(newLaunchData.current)
    const router = useRouter();
    const { md } = useResponsive();
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];

        if (file) {
            if (file.size <= 1048576) {
                newLaunchData.current.icon_file = file;
                setDisplayImg(URL.createObjectURL(e.target.files[0]));
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
            toast.error("LP allocation must be greater than zero");
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

    return (
        <Center style={{ background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)" }} width="100%">
            <VStack style={{ paddingBottom: md ? 0 : "75px" }}>
                <Text color="white" className="font-face-kg" textAlign={"center"} fontSize={DEFAULT_FONT_SIZE}>
                    Launch - Token
                </Text>
                <form onSubmit={setLaunchData} className={styles.launchBody}>
                    <div className={styles.launchBodyUpper}>
                        {displayImg ? (
                            <img src={displayImg} alt="" className={styles.imgFrame} />
                        ) : (
                            <Image className={styles.imgFrame} src="/images/upload-image.png" width={200} height={200} alt="Image Frame" />
                        )}

                        <div className={styles.launchBodyUpperFields}>
                            <div className={styles.eachField}>
                                <div className={`${styles.textLabel} font-face-kg`}>Name:</div>

                                <div className={styles.textLabelInput}>
                                    <Input
                                        disabled={newLaunchData.current.edit_mode === true}
                                        size="lg"
                                        maxLength={25}
                                        required
                                        className={styles.inputBox}
                                        type="text"
                                        value={name}
                                        onChange={handleNameChange}
                                    />
                                </div>
                            </div>

                            <div className={styles.eachField}>
                                <div className={`${styles.textLabel} font-face-kg`}>Symbol:</div>

                                <div style={{ width: "50%" }} className={styles.textLabelInput}>
                                    <Input
                                        disabled={newLaunchData.current.edit_mode === true}
                                        size="lg"
                                        maxLength={8}
                                        required
                                        className={styles.inputBox}
                                        type="text"
                                        value={symbol}
                                        onChange={handleSymbolChange}
                                    />
                                </div>
                            </div>

                            <div className={styles.eachField}>
                                <div className={`${styles.textLabel} font-face-kg`}>ICON:</div>

                                <div>
                                    <label className={styles.label}>
                                        <input id="file" type="file" onChange={handleFileChange} />
                                        <span
                                            className={styles.browse}
                                            style={{ cursor: newLaunchData.current.edit_mode === true ? "not-allowed" : "pointer" }}
                                        >
                                            BROWSE
                                        </span>
                                    </label>
                                </div>
                                <div className={styles.textLabelInput}>
                                    <Input
                                        readOnly
                                        disabled={newLaunchData.current.edit_mode === true}
                                        size="lg"
                                        className={`${styles.inputBox} font-face-kg `}
                                        type="text"
                                        value={newLaunchData.current.icon_file !== null ? newLaunchData.current.icon_file.name : "No File Selected"}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.launchBodyLower}>
                        <div className={styles.launchBodyLowerHorizontal}>
                            <div className={styles.eachField}>
                                <div style={{ width: "40%" }} className={`${styles.textLabel} font-face-kg`}>
                                    TOTAL SUPPLY:
                                </div>

                                <div className={styles.textLabelInput}>
                                    <Input
                                        disabled={newLaunchData.current.edit_mode === true}
                                        size="lg"
                                        required
                                        className={styles.inputBox}
                                        type="number"
                                        min="1"
                                        value={totalSupply}
                                        onChange={(e) => {
                                            setTotalSupply(e.target.value);
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ width: md ? "100%" : "40%" }} className={styles.eachField}>
                                <div className={`${styles.textLabel} font-face-kg`}>DECIMALS:</div>

                                <div className={styles.textLabelInput}>
                                    <Input
                                        disabled={newLaunchData.current.edit_mode === true}
                                        size="lg"
                                        required
                                        className={styles.inputBox}
                                        type="number"
                                        min="1"
                                        max="9"
                                        value={decimal}
                                        onChange={(e) => {
                                            setDecimal(e.target.value);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={styles.launchBodyLowerHorizontal}>
                            <div className={styles.eachField}>
                                <div className={`${styles.textLabel} font-face-kg`}>MINTS:</div>

                                <div className={styles.textLabelInput}>
                                    <Input
                                        disabled={newLaunchData.current.edit_mode === true}
                                        size="lg"
                                        required
                                        className={styles.inputBox}
                                        type="number"
                                        min="1"
                                        value={mints}
                                        onChange={(e) => {
                                            setMints(e.target.value);
                                        }}
                                    />
                                </div>
                            </div>

                            <div className={styles.eachField}>
                                <div className={`${styles.textLabel} font-face-kg`}>TICKET PRICE:</div>

                                <div style={{ width: md ? "100%" : "50%" }} className={styles.textLabelInput}>
                                    <Input
                                        disabled={newLaunchData.current.edit_mode === true}
                                        size="lg"
                                        required
                                        className={styles.inputBox}
                                        type="number"
                                        value={ticketPrice}
                                        onChange={(e) => {
                                            setTotalPrice(e.target.value);
                                        }}
                                    />
                                    <Image className={styles.sol} src="/images/sol.png" height={30} width={30} alt="SOL" />
                                </div>
                            </div>
                        </div>
                        <div className={styles.launchBodyLowerHorizontal}>
                            <div className={styles.eachField}>
                                <div className={`${styles.textLabel} font-face-kg`}>MINIMUM LIQUIDITY:</div>

                                <div style={{ width: md ? "100%" : "50%" }} className={styles.textLabelInput}>
                                    <Input
                                        size="lg"
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
                            </div>
                        </div>
                    </div>
                    <br></br>

                    <HStack justify="space-between" align="center" w="100%">
                        <div className={styles.distributionBoxFields}>
                            <div style={{ color: "white" }} className={`${styles.textLabel} font-face-kg`}>
                                Distribution{" "}
                            </div>

                            <div className={styles.distributionBoxEachFields}>
                                <div className={styles.colorBox1}></div>
                                <div className={`${styles.textLabel} ${styles.textLabel2} `}>LetsCookRaffle</div>
                                <div className={styles.distributionField}>
                                    <Input
                                        size="lg"
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
                                    <Image className={styles.percentage} width={20} height={20} src="/images/perc.png" alt="Percentage" />
                                </div>
                            </div>

                            <div className={styles.distributionBoxEachFields}>
                                <div className={styles.colorBox2}></div>
                                <div className={`${styles.textLabel} ${styles.textLabel2}`}>Liquidity Pool</div>
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
                                    <Image className={styles.percentage} width={20} height={20} src="/images/perc.png" alt="Percentage" />
                                </div>
                            </div>

                            <div className={styles.distributionBoxEachFields}>
                                <div className={styles.colorBox3}></div>
                                <div className={`${styles.textLabel} ${styles.textLabel2}`}>LP Rewards</div>
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
                                    <Image className={styles.percentage} width={20} height={20} src="/images/perc.png" alt="Percentage" />
                                </div>
                            </div>

                            <div className={styles.distributionBoxEachFields}>
                                <div className={styles.colorBox4}></div>
                                <div className={`${styles.textLabel} ${styles.textLabel2}`}>Airdrops</div>
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
                                    <Image className={styles.percentage} width={20} height={20} src="/images/perc.png" alt="Percentage" />
                                </div>
                            </div>

                            <div className={styles.distributionBoxEachFields}>
                                <div className={styles.colorBox5}></div>
                                <div className={`${styles.textLabel} ${styles.textLabel2} `}>Team</div>
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
                                    <Image className={styles.percentage} width={20} height={20} src="/images/perc.png" alt="Percentage" />
                                </div>
                            </div>

                            <div className={styles.distributionBoxEachFields}>
                                <div className={styles.colorBox6}></div>
                                <div className={`${styles.textLabel} ${styles.textLabel2}`}>Other (See Website)</div>
                                <div className={styles.distributionField}>
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
                                    <Image className={styles.percentage} width={20} height={20} src="/images/perc.png" alt="Percentage" />
                                </div>
                            </div>
                        </div>

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
                            style={{ width: "400px", height: "400px", marginRight: "150px" }}
                        />
                    </HStack>

                    <HStack mt={15}>
                        <button type="button" className={`${styles.nextBtn} font-face-kg `} onClick={() => router.push("/dashboard")}>
                            Cancel
                        </button>
                        <button type="submit" className={`${styles.nextBtn} font-face-kg `}>
                            NEXT
                        </button>
                    </HStack>
                </form>
            </VStack>
        </Center>
    );
};

export default TokenPage;
