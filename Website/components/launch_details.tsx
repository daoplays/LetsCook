import {Dispatch, SetStateAction, MutableRefObject, useState, MouseEventHandler} from "react";
import { PieChart } from 'react-minimal-pie-chart';
import styles from "../styles/LaunchDetails.module.css"
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


export function LaunchDetails({newLaunch, ListGameOnArena, setScreen} : {newLaunch : MutableRefObject<LaunchDataUserInput>, ListGameOnArena: MouseEventHandler<HTMLParagraphElement>, setScreen: Dispatch<SetStateAction<Screen>>}) {

    const [name, setName] = useState<string>("")
    const [symbol, setSymbol] = useState<string>("")
    const [launch_date, setLaunchDate] = useState<Date | null>(null)
    const [icon, setIcon] = useState<string>(null)
    const [totalSupply,setTotalSupply]=useState("")
    const [decimal,setDecimal]=useState("")
    const [mints,setMints]=useState("")
    const [totalPrice,setTotalPrice]=useState("")
    const [liquidity,setLiquidity]=useState("")





    const isDesktopOrLaptop = useMediaQuery({
        query: '(max-width: 1000px)'
      })

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
             Launch - Page
            </Text>
            <div className={styles.launchBody}>
                <div  className={styles.launchBodyUpper}>

                    <div className={styles.launchBodyUpperFields}>

                        <div className={styles.eachField}>
                            <div className={`${styles.textLabel} font-face-kg`}>
                                Page Name:
                            </div>
                     
                                <input
                                placeholder="/"
                                className={styles.inputBox}
                                                            type="text"
                                                            value={name}
                                                            onChange={handleNameChange}
                                />
                        </div>

                                                
                        <div className={styles.eachField}>
                            <div className={`${styles.textLabel} font-face-kg`}>
                                Background:
                            </div>
                     
                            <div >

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
                <div className={styles.launchBodyLowerVertical}>

                <div className={`${styles.textLabel} font-face-kg`}>
                                DESCRIPTION:
                            </div>
                <div>
                    <textarea
                    style={{minHeight:200}}
                                            className={`${styles.inputBox} ${styles.inputTxtarea}`}
                                           
                                            value={totalSupply}
                                            onChange={(e)=>{setTotalSupply(e.target.value)}}
                    />
                </div>
                </div>

                <div className={styles.launchBodyLowerHorizontal}>


                <div className={styles.eachField}>
                    <img className={styles.mediaLogo} src="./images/web.png" alt=""/>

                    <div className= {styles.textLabelInput}>
                        <input
                                placeholder="URL"

                        className={styles.inputBox}
                                                    type="text"
                                                    value={totalSupply}
                                                    onChange={(e)=>{setTotalSupply(e.target.value)}}
                        />
                    </div>
                </div>

                </div>


                <div className={styles.launchBodyLowerHorizontal}>


                <div className={styles.eachField}>
                <img className={styles.mediaLogo} src="./images/tele.png" alt=""/>


                    <div className= {styles.textLabelInput}>
                        <input
                        className={styles.inputBox}
                        placeholder="URL"

                                                    type="text"
                                                    value={ mints}
                                                    onChange={(e)=>{setMints(e.target.value)}}
                        />
                    </div>
                </div>


                </div>
                <div className={styles.launchBodyLowerHorizontal}>
                <div className={styles.eachField}>
                <img className={styles.mediaLogo} src="./images/twt.png" alt=""/>


                    <div className= {styles.textLabelInput}>
                        <input
                        className={styles.inputBox}
                        placeholder="URL"

                                                    type="text"
                                                    value={liquidity}
                                                    onChange={(e)=>{setLiquidity(e.target.value)}}
                        />
                        

                    </div>
                </div>
                </div>

                <div className={styles.launchBodyLowerHorizontal}>
                <div className={styles.eachField}>
                <img className={styles.mediaLogo} src="./images/discord.png" alt=""/>


                    <div className= {styles.textLabelInput}>
                        <input
                        className={styles.inputBox}
                        placeholder="URL"

                                                    type="text"
                                                    value={liquidity}
                                                    onChange={(e)=>{setLiquidity(e.target.value)}}
                        />
                        

                    </div>
                </div>
                </div>


                 
                </div>
                <br></br>


                <div>
                <button

                        className={`${styles.nextBtn} font-face-kg `}
                        >   
                        PREVIEW
                        </button>
                </div>
                <div
                style={{
                    display:'flex',justifyContent:'center',alignItems:'center',gap:20
                }}
                >
                                    <button
                    onClick={() => setScreen(Screen.LAUNCH_SCREEN)}

                    className={`${styles.nextBtn} font-face-kg `}
                    >   
                    PREVIOUS
                    </button>
                    <button
                    onClick={() => setScreen(Screen.LAUNCH_BOOK)}

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