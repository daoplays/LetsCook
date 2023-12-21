import {Dispatch, SetStateAction, MutableRefObject, useState, MouseEventHandler} from "react";
import { PieChart } from 'react-minimal-pie-chart';
import styles from "../styles/Launch.module.css"
import ImageUploading from 'react-images-uploading';
import { useMediaQuery } from 'react-responsive'
import {
    Center,
    VStack,
    Text,
    Box,
    HStack,
    FormControl,
    Input,
    NumberInput,
    NumberInputField
  } from "@chakra-ui/react";
  
import DatePicker from "react-datepicker";

import { DEFAULT_FONT_SIZE, DUNGEON_FONT_SIZE, Screen } from "./Solana/constants";
import { LaunchDataUserInput } from "./Solana/state";


export function LaunchScreen({newLaunch, ListGameOnArena, setScreen} : {newLaunch : MutableRefObject<LaunchDataUserInput>, ListGameOnArena: MouseEventHandler<HTMLParagraphElement>, setScreen: Dispatch<SetStateAction<Screen>>}) {
    const isDesktopOrLaptop = useMediaQuery({
        query: '(max-width: 1000px)'
      })
    const [name, setName] = useState<string>("")
    const [symbol, setSymbol] = useState<string>("")
    const [launch_date, setLaunchDate] = useState<Date | null>(null)
    const [icon, setIcon] = useState<string>(null)
    const [totalSupply,setTotalSupply]=useState("")
    const [decimal,setDecimal]=useState("")
    const [mints,setMints]=useState("")
    const [totalPrice,setTotalPrice]=useState("")
    const [liquidity,setLiquidity]=useState("")
    const [distribution1,setDistribution1]=useState("0")
    const [distribution2,setDistribution2]=useState("0")
    const [distribution3,setDistribution3]=useState("0")
    const [distribution4,setDistribution4]=useState("0")
    const [distribution5,setDistribution5]=useState("0")
    const [distribution6,setDistribution6]=useState("0")







    const handleNameChange = (e) => {setName(e.target.value);}
    const handleSymbolChange = (e) => {setSymbol(e.target.value);}

    const handleLaunchDateChange = (e) => {setLaunchDate(e);}

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const reader = new FileReader()
    
            reader.readAsDataURL(e.target.files[0])
        
            reader.onload = () => {
            console.log('called: ', reader)
            setIcon(reader.result.toString().replace('data:', '').replace(/^.+,/, ''))
        }
        }
      };


    function setLaunchData(e) {
        
        console.log(name, symbol, launch_date, icon)
        const new_input : LaunchDataUserInput = {
            name : name,
            symbol : symbol,
            launch_date : launch_date.getTime() / 1000,
            icon : icon,
            uri : ""
        }
        console.log(new_input)
        newLaunch.current = new_input
        console.log(e)
        ListGameOnArena(e)
    }
    const [images, setImages] =useState([]);
    const maxNumber = 1000;
  
    const onChange = (imageList, addUpdateIndex) => {
      // data for submit
      console.log(imageList, addUpdateIndex);
      setImages(imageList);
    };
  
    return(
        <Center
        
        style={{background: 'linear-gradient(180deg, #292929 0%, #0B0B0B 100%)'}} 
        pt="20px" width="100%">
            <img     onClick={() => setScreen(Screen.FAQ_SCREEN)} className={styles.help} src="./images/help.png" alt=""/>
           
   <VStack>
            <Text color="white" className="font-face-kg" textAlign={"center"} fontSize={DEFAULT_FONT_SIZE}>
             Launch - Token
            </Text>
            <div className={styles.launchBody}>
                <div  className={styles.launchBodyUpper}>
                {
                    images.length>0 ?
                    <>
                     {images.map((image, index) => (
                        <div key={index} className="image-item">
                            <img src={image['data_url']} alt="" className={styles.imgFrame} />
                            <div className="image-item__btn-wrapper">
                            </div>
                        </div>
                        ))}
                    </>
                    :
                    <img className={styles.imgFrame} src="./images/Frame 49 (1).png" alt=""/>

                }

                    <div className={styles.launchBodyUpperFields}>

                        <div className={styles.eachField}>
                            <div className={`${styles.textLabel} font-face-kg`}>
                                Name:
                            </div>
                     
                            <div className= {styles.textLabelInput}>
                                <input
                                className={styles.inputBox}

                                                            type="text"
                                                            value={name}
                                                            onChange={handleNameChange}
                                />
                            </div>
                        </div>

                                                
                        <div className={styles.eachField}>
                            <div className={`${styles.textLabel} font-face-kg`}>
                                Symbol:
                            </div>
                     
                            <div 
                                  style={{width:'50%'}}
                            className= {styles.textLabelInput}>
                                <input
                                className={styles.inputBox}
                          
                                                            type="text"
                                                            value={symbol}
                                                            onChange={handleSymbolChange}
                                />
                            </div>
                        </div>

                                                
                        <div className={styles.eachField}>
                            <div className={`${styles.textLabel} font-face-kg`}>
                                Image:
                            </div>
                     
                            <div >
                                {/* <input
                                style={{
                                    backgroundColor:'transparent',
                                    border:'none'
                                }}
                                className={styles.inputBox}
                                value={name}
                                id="file" type="file" onChange={handleFileChange}
                                /> */}

            <ImageUploading
                    multiple={false}
                    value={images}
                    onChange={onChange}
                    maxNumber={maxNumber}
                    dataURLKey="data_url"
                >
                    {({
                    imageList,
                    onImageUpload,
                    onImageRemoveAll,
                    onImageUpdate,
                    onImageRemove,
                    isDragging,
                    dragProps,
                    }) => (
                    // write your building UI
                    <div className="upload__image-wrapper">
                        <button
                        style={isDragging ? { color: 'red' } : undefined}
                        onClick={onImageUpload}
                        {...dragProps}
                        className={`${styles.browse} font-face-kg `}
                        >   
                        BROWSE
                        </button>

                    </div>
                    )}
                </ImageUploading>
                             
                            </div>
                       <div className= {styles.textLabelInput}>
                       <input
                        className={`${styles.inputBox} font-face-kg `}
                                                    type="text"
                                                    value={images.length>0 ? "File Selected" : "No File Selected"}
                                                    disabled
                        />
                       </div>


                        </div>

                    </div>

                </div>


                <div  className={styles.launchBodyLower}>

                <div className={styles.launchBodyLowerHorizontal}>


                <div className={styles.eachField}>
                    <div
                      style={{width:'40%'}}
                    className={`${styles.textLabel} font-face-kg`}>
                        TOTAL SUPPLY:
                    </div>

                    <div className= {styles.textLabelInput}>
                        <input
                        className={styles.inputBox}
                                                    type="text"
                                                    value={totalSupply}
                                                    onChange={(e)=>{setTotalSupply(e.target.value)}}
                        />
                    </div>
                </div>

            <div 
                 style={{width: isDesktopOrLaptop ? '100%':'40%'}}
            
            className={styles.eachField}>
                <div className={`${styles.textLabel} font-face-kg`}>
                    DECIMALS:
                </div>

                <div
                className= {styles.textLabelInput}>
                    <input
                    className={styles.inputBox}
                   
                                                type="text"
                                                value={decimal}
                                                onChange={(e)=>{setDecimal(e.target.value)}}
                    />
                </div>
                </div>

                </div>


                <div className={styles.launchBodyLowerHorizontal}>


                <div className={styles.eachField}>
                    <div className={`${styles.textLabel} font-face-kg`}>
                        MINTS:
                    </div>

                    <div className= {styles.textLabelInput}>
                        <input
                        className={styles.inputBox}
                                                    type="text"
                                                    value={ mints}
                                                    onChange={(e)=>{setMints(e.target.value)}}
                        />
                    </div>
                </div>

                <div className={styles.eachField}>
                    <div className={`${styles.textLabel} font-face-kg`}>
                        TICKET PRICE:
                    </div>

                    <div 
                        style={{width: isDesktopOrLaptop ? '100%':'50%'}}
                    
                    className= {styles.textLabelInput}>
                        <input
                        
                        className={styles.inputBox}
                                                    type="text"
                                                    value={totalPrice}
                                                    onChange={(e)=>{setTotalPrice(e.target.value)}}
                        />
                        <img className={styles.sol} src="./images/sol.png" alt=""/>
                    </div>
                </div>

                </div>
                <div className={styles.launchBodyLowerHorizontal}>
                <div className={styles.eachField}>
                    <div className={`${styles.textLabel} font-face-kg`}>
                        MINIMUM LIQUIDITY:
                    </div>

                    <div
                          style={{width:isDesktopOrLaptop ? '100%':'50%'}}
                    className= {styles.textLabelInput}>
                        <input
                        className={styles.inputBox}
                                                    type="text"
                                                    value={liquidity}
                                                    onChange={(e)=>{setLiquidity(e.target.value)}}
                        />
                        <img className={styles.sol} src="./images/sol.png" alt=""/>

                    </div>
                </div>
                </div>


                 
                </div>
                <br></br>

                <div className={styles.distributionBox} >

                    <div className={styles.distributionBoxFields}>
                    <div className={`${styles.textLabel} font-face-kg`}>Distribution </div>

                    <div className={styles.distributionBoxEachFields}>
                        <div className={styles.colorBox1}></div>
                        <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                            LetsCookRaffle
                        </div>
                        <div className={styles.distributionField}>
                            <input
                            value={distribution1}
                            onChange={(e)=>{setDistribution1(e.target.value)}}
                            type="text" />
                        <img className={styles.percentage} src="./images/perc.png" alt=""/>

                        </div>
                        </div>

                        <div className={styles.distributionBoxEachFields}>
                        <div className={styles.colorBox2}></div>
                        <div className={`${styles.textLabel} ${styles.textLabel2}`}>
                            Liquidity Pool
                        </div>
                        <div className={styles.distributionField}>
                            <input 
                                                        value={distribution2}
                                                        onChange={(e)=>{setDistribution2(e.target.value)}}
                            type="text" />
                        <img className={styles.percentage} src="./images/perc.png" alt=""/>

                        </div>
                        </div>

                        <div className={styles.distributionBoxEachFields}>
                        <div className={styles.colorBox3}></div>
                        <div className={`${styles.textLabel} ${styles.textLabel2}`}>
                            LP Rewards
                        </div>
                        <div className={styles.distributionField}>
                            <input
                                   value={distribution3}
                                   onChange={(e)=>{setDistribution3(e.target.value)}}                     
                            type="text" />
                        <img className={styles.percentage} src="./images/perc.png" alt=""/>

                        </div>
                        </div>

                        <div className={styles.distributionBoxEachFields}>
                        <div className={styles.colorBox4}></div>
                        <div className={`${styles.textLabel} ${styles.textLabel2}`}>
                            Airdrops
                        </div>
                        <div className={styles.distributionField}>
                            <input
                                value={distribution4}
                                onChange={(e)=>{setDistribution4(e.target.value)}}                    
                            type="text" />
                        <img className={styles.percentage} src="./images/perc.png" alt=""/>

                        </div>
                        </div>

                        <div className={styles.distributionBoxEachFields}>
                        <div className={styles.colorBox5}></div>
                        <div className={`${styles.textLabel} ${styles.textLabel2} `}>
                            Team
                        </div>
                        <div className={styles.distributionField}>
                            <input
                             value={distribution5}
                             onChange={(e)=>{setDistribution5(e.target.value)}}                           
                            type="text" />
                        <img className={styles.percentage} src="./images/perc.png" alt=""/>

                        </div>
                        </div>

                        <div className={styles.distributionBoxEachFields}>
                        <div className={styles.colorBox6}></div>
                        <div className={`${styles.textLabel} ${styles.textLabel2}`}>
                       Other (See Website)
                        </div>
                        <div className={styles.distributionField}>
                            <input
                            value={distribution6}
                            onChange={(e)=>{setDistribution6(e.target.value)}}                            
                            type="text" />
                        <img className={styles.percentage} src="./images/perc.png" alt=""/>

                        </div>
                        </div>


                    </div>


                    <div className={styles.piechart}>
                    <PieChart
                        data={[
                            { title: 'LetsCookRaffle', value: parseInt(distribution1), color: '#FF5151' },
                            { title: 'Liquidity Pool', value:  parseInt(distribution2), color: '#489CFF' },
                            { title: 'LP Rewards', value:  parseInt(distribution3), color: '#74DD5A' },
                            { title: 'Airdrops', value:  parseInt(distribution4), color: '#FFEF5E' },
                            { title: 'Team', value:  parseInt(distribution5), color: '#B96CF6' },
                            { title: 'Other', value: parseInt(distribution6), color: '#FF994E' },
                        ]}
                        />
                    </div>

                </div>

                <div>
                <button
 onClick={() => setScreen(Screen.LAUNCH_DETAILS)}
                        className={`${styles.nextBtn} font-face-kg `}
                        >   
                        NEXT
                        </button>
                </div>
            </div>








            </VStack> 
        </Center>
    );

}