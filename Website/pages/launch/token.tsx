import { Dispatch, SetStateAction, MutableRefObject, useState, MouseEventHandler, useRef } from "react";
import { PieChart } from "react-minimal-pie-chart";
import { useMediaQuery } from "react-responsive";
import { Center, VStack, Text } from "@chakra-ui/react";
import { LaunchDataUserInput, defaultUserInput } from "../../components/Solana/state";
import { DEFAULT_FONT_SIZE } from "../../components/Solana/constants";
import Image from "next/image";
import styles from "../../styles/Launch.module.css";

interface TokenPageProps {
    newLaunchData: MutableRefObject<LaunchDataUserInput>;
    setScreen: Dispatch<SetStateAction<string>>;
}

const TokenPage = ({ newLaunchData, setScreen }: TokenPageProps) => {
    const isDesktopOrLaptop = useMediaQuery({
        query: "(max-width: 1000px)",
    });

    const [name, setName] = useState<string>(newLaunchData.current.name);
    const [symbol, setSymbol] = useState<string>(newLaunchData.current.symbol);
    const [icon, setIcon] = useState<string>(newLaunchData.current.icon_data);
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
                const reader = new FileReader();
                setDisplayImg(URL.createObjectURL(e.target.files[0]));

                reader.readAsDataURL(file);

                reader.onload = () => {
                    console.log("called: ", reader);
                    setIcon(reader.result.toString().replace("data:", "").replace(/^.+,/, ""));
                };
            } else {
                alert("File size exceeds 1MB limit.");
            }
        }
    };

    const [images, setImages] = useState([]);
    const maxNumber = 1000;

    const onChange = (imageList, addUpdateIndex) => {
        // data for submit
        console.log(imageList, addUpdateIndex);
        setImages(imageList);
    };

    const percentage1 = parseFloat(distribution1);
    const percentage2 = parseFloat(distribution2);
    const percentage3 = parseFloat(distribution3);
    const percentage4 = parseFloat(distribution4);
    const percentage5 = parseFloat(distribution5);
    const percentage6 = parseFloat(distribution6);

    // Calculate the total sum of all percentages
    const totalPercentage =
        parseFloat(distribution1) +
        parseFloat(distribution2) +
        parseFloat(distribution3) +
        parseFloat(distribution4) +
        parseFloat(distribution5) +
        parseFloat(distribution6);

    function setLaunchData(e) {
        e.preventDefault();
        if (icon) {
            if (totalPercentage === 100) {
                newLaunchData.current.name = name;
                newLaunchData.current.symbol = symbol;
                newLaunchData.current.icon_data = icon;
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
            } else {
                alert("The percentages must add upto 100%");
            }
        } else {
            alert("Please select an icon image.");
        }
    }

    return (
        <Center style={{ background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)" }} pt="20px" width="100%">
            <VStack>
                <Text color="white" className="font-face-kg" textAlign={"center"} fontSize={DEFAULT_FONT_SIZE}>
                    Launch - Token
                </Text>
                <form onSubmit={setLaunchData} className={styles.launchBody}>
                    <div className={styles.launchBodyUpper}>
                        {displayImg ? (
                            <img src={displayImg} alt="" className={styles.imgFrame} />
                        ) : (
                            <Image className={styles.imgFrame} src="/images/Frame 49 (1).png" width={200} height={200} alt="Image Frame" />
                        )}

                        <div className={styles.launchBodyUpperFields}>
                            <div className={styles.eachField}>
                                <div className={`${styles.textLabel} font-face-kg`}>Name:</div>

                                <div className={styles.textLabelInput}>
                                    <input required className={styles.inputBox} type="text" value={name} onChange={handleNameChange} />
                                </div>
                            </div>

                            <div className={styles.eachField}>
                                <div className={`${styles.textLabel} font-face-kg`}>Symbol:</div>

                                <div style={{ width: "50%" }} className={styles.textLabelInput}>
                                    <input required className={styles.inputBox} type="text" value={symbol} onChange={handleSymbolChange} />
                                </div>
                            </div>

                            <div className={styles.eachField}>
                                <div className={`${styles.textLabel} font-face-kg`}>ICON:</div>

                                <div>
                                    <label className={styles.label}>
                                        <input id="file" type="file" onChange={handleFileChange} />
                                        <span className={styles.browse}>BROWSE</span>
                                    </label>
                                </div>
                                <div className={styles.textLabelInput}>
                                    <input
                                        className={`${styles.inputBox} font-face-kg `}
                                        type="text"
                                        value={icon ? "File Selected" : "No File Selected"}
                                        disabled
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
                                    <input
                                        required
                                        className={styles.inputBox}
                                        type="number"
                                        value={totalSupply}
                                        onChange={(e) => {
                                            setTotalSupply(e.target.value);
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ width: isDesktopOrLaptop ? "100%" : "40%" }} className={styles.eachField}>
                                <div className={`${styles.textLabel} font-face-kg`}>DECIMALS:</div>

                                <div className={styles.textLabelInput}>
                                    <input
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
                                    <input
                                        required
                                        className={styles.inputBox}
                                        type="number"
                                        value={mints}
                                        onChange={(e) => {
                                            setMints(e.target.value);
                                        }}
                                    />
                                </div>
                            </div>

                            <div className={styles.eachField}>
                                <div className={`${styles.textLabel} font-face-kg`}>TICKET PRICE:</div>

                                <div style={{ width: isDesktopOrLaptop ? "100%" : "50%" }} className={styles.textLabelInput}>
                                    <input
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

                                <div style={{ width: isDesktopOrLaptop ? "100%" : "50%" }} className={styles.textLabelInput}>
                                    <input
                                        required
                                        className={styles.inputBox}
                                        type="number"
                                        value={parseFloat(mints) * parseFloat(ticketPrice)}
                                        disabled
                                        // onChange={(e) => {
                                        //     setLiquidity(e.target.value);
                                        // }}
                                    />
                                    <Image className={styles.sol} src="/images/sol.png" height={30} width={30} alt="SOL" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <br></br>

                    <div className={styles.distributionBox}>
                        <div className={styles.distributionBoxFields}>
                            <div style={{ color: "white" }} className={`${styles.textLabel} font-face-kg`}>
                                Distribution{" "}
                            </div>

                            <div className={styles.distributionBoxEachFields}>
                                <div className={styles.colorBox1}></div>
                                <div className={`${styles.textLabel} ${styles.textLabel2} `}>LetsCookRaffle</div>
                                <div className={styles.distributionField}>
                                    <input
                                        required
                                        value={distribution1}
                                        onChange={(e) => {
                                            setDistribution1(e.target.value);
                                        }}
                                        type="number"
                                        min="0"
                                        max="100"
                                        disabled={totalPercentage === 100 && parseFloat(distribution1) === 0 ? true : false}
                                    />
                                    <Image className={styles.percentage} width={20} height={20} src="/images/perc.png" alt="Percentage" />
                                </div>
                            </div>

                            <div className={styles.distributionBoxEachFields}>
                                <div className={styles.colorBox2}></div>
                                <div className={`${styles.textLabel} ${styles.textLabel2}`}>Liquidity Pool</div>
                                <div className={styles.distributionField}>
                                    <input
                                        required
                                        value={distribution2}
                                        onChange={(e) => {
                                            setDistribution2(e.target.value);
                                        }}
                                        type="number"
                                        min="0"
                                        max="100"
                                        disabled={totalPercentage === 100 && parseFloat(distribution2) === 0 ? true : false}
                                    />
                                    <Image className={styles.percentage} width={20} height={20} src="/images/perc.png" alt="Percentage" />
                                </div>
                            </div>

                            <div className={styles.distributionBoxEachFields}>
                                <div className={styles.colorBox3}></div>
                                <div className={`${styles.textLabel} ${styles.textLabel2}`}>LP Rewards</div>
                                <div className={styles.distributionField}>
                                    <input
                                        value={distribution3}
                                        onChange={(e) => {
                                            setDistribution3(e.target.value);
                                        }}
                                        type="number"
                                        min="0"
                                        max="100"
                                        disabled={totalPercentage === 100 && parseFloat(distribution3) === 0 ? true : false}
                                    />
                                    <Image className={styles.percentage} width={20} height={20} src="/images/perc.png" alt="Percentage" />
                                </div>
                            </div>

                            <div className={styles.distributionBoxEachFields}>
                                <div className={styles.colorBox4}></div>
                                <div className={`${styles.textLabel} ${styles.textLabel2}`}>Airdrops</div>
                                <div className={styles.distributionField}>
                                    <input
                                        value={distribution4}
                                        onChange={(e) => {
                                            setDistribution4(e.target.value);
                                        }}
                                        type="number"
                                        min="0"
                                        max="100"
                                        disabled={totalPercentage === 100 && parseFloat(distribution4) === 0 ? true : false}
                                    />
                                    <Image className={styles.percentage} width={20} height={20} src="/images/perc.png" alt="Percentage" />
                                </div>
                            </div>

                            <div className={styles.distributionBoxEachFields}>
                                <div className={styles.colorBox5}></div>
                                <div className={`${styles.textLabel} ${styles.textLabel2} `}>Team</div>
                                <div className={styles.distributionField}>
                                    <input
                                        value={distribution5}
                                        onChange={(e) => {
                                            setDistribution5(e.target.value);
                                        }}
                                        type="number"
                                        min="0"
                                        max="100"
                                        disabled={totalPercentage === 100 && parseFloat(distribution5) === 0 ? true : false}
                                    />
                                    <Image className={styles.percentage} width={20} height={20} src="/images/perc.png" alt="Percentage" />
                                </div>
                            </div>

                            <div className={styles.distributionBoxEachFields}>
                                <div className={styles.colorBox6}></div>
                                <div className={`${styles.textLabel} ${styles.textLabel2}`}>Other (See Website)</div>
                                <div className={styles.distributionField}>
                                    <input
                                        value={distribution6}
                                        onChange={(e) => {
                                            setDistribution6(e.target.value);
                                        }}
                                        type="number"
                                        min="0"
                                        max="100"
                                        disabled={totalPercentage === 100 && parseFloat(distribution6) === 0 ? true : false}
                                    />
                                    <Image className={styles.percentage} width={20} height={20} src="/images/perc.png" alt="Percentage" />
                                </div>
                            </div>
                        </div>

                        <div className={styles.piechart}>
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
                            />
                        </div>
                    </div>

                    <div>
                        <button type="submit" className={`${styles.nextBtn} font-face-kg `}>
                            NEXT
                        </button>
                    </div>
                </form>
            </VStack>
        </Center>
    );
};

export default TokenPage;
