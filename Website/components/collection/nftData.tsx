import { Dispatch, SetStateAction, useState } from "react";
import { Center, VStack, Text, HStack, Input, chakra, Flex } from "@chakra-ui/react";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "../../styles/Launch.module.css";
import useResponsive from "../../hooks/useResponsive";
import styles2 from "../../styles/LaunchDetails.module.css";
import useAppRoot from "../../context/useAppRoot";
import { toast } from "react-toastify";

interface NFTDataProps {
    setScreen: Dispatch<SetStateAction<string>>;
}

const NFTData = ({ setScreen }: NFTDataProps) => {
    const router = useRouter();
    const { newCollectionData } = useAppRoot();

    const [nft_name, setNFTName] = useState<string>(newCollectionData.current.nft_name);

    const { sm, md, lg } = useResponsive();
    const [displayImg, setDisplayImg] = useState<string>("");

    function setLaunchData(e) {
        e.preventDefault();

        if (newCollectionData.current.nft_metadata === null ||  newCollectionData.current.nft_images === null) {
            toast.error("missing nft data");
            return;
        }

        if (newCollectionData.current.nft_metadata.length !== newCollectionData.current.nft_images.length) {
            toast.error("number of metadata and image files do not match");
            return;
        }


        if (newCollectionData.current.nft_metadata.length === 0) {
            toast.error("number of metadata and image files must be greater than zero");
            return;
        }

        let image_type = newCollectionData.current.nft_images[0].type;
        for (let i = 0; i < newCollectionData.current.nft_metadata.length; i++) {
            if (newCollectionData.current.nft_metadata[i].type !== "application/json") {
                toast.error("meta data must be of type json");
                console.log(newCollectionData.current.nft_metadata[i].type)
                return;
            }
            if (newCollectionData.current.nft_images[i].type !== image_type) {
                toast.error("all images must be of the same type");
                return;
            }
        }

        newCollectionData.current.collection_size = newCollectionData.current.nft_metadata.length;
        newCollectionData.current.total_supply = newCollectionData.current.nft_metadata.length;
        newCollectionData.current.nft_name = nft_name;

        setScreen("step 3");
    }

    const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];

        if (file) {
            console.log(e.target.files);
            newCollectionData.current.nft_images = e.target.files;
            setDisplayImg("images");
        }
    };

    const BrowseImages = () => (
        <HStack spacing={0} className={styles.eachField}>
            <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "132px" }}>
                Icons:
            </div>
            <div>
                <label className={styles.label}>
                    <input id="file" type="file" multiple={true} onChange={handleImagesChange} />
                    <span
                        className={styles.browse}
                        style={{ cursor: newCollectionData.current.edit_mode === true ? "not-allowed" : "pointer", padding: "5px 10px" }}
                    >
                        BROWSE
                    </span>
                </label>
            </div>
            <Text m={0} ml={5} className="font-face-rk" fontSize={lg ? "medium" : "lg"}>
                {newCollectionData.current.nft_images === null
                    ? "No Files Selected"
                    : newCollectionData.current.nft_images.length + " images selected"}
            </Text>
        </HStack>
    );

    const handleMetaDataChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files && e.target.files[0];

        if (file) {
            console.log(e.target.files);
            newCollectionData.current.nft_metadata = e.target.files;
            setDisplayImg("meta");
        }
    };

    const BrowseMetaData = () => (
        <HStack spacing={0} className={styles.eachField}>
            <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "132px" }}>
                MetaData:
            </div>
            <div>
                <label className={styles.label}>
                    <input id="file" type="file" multiple={true} onChange={handleMetaDataChange} />
                    <span
                        className={styles.browse}
                        style={{ cursor: newCollectionData.current.edit_mode === true ? "not-allowed" : "pointer", padding: "5px 10px" }}
                    >
                        BROWSE
                    </span>
                </label>
            </div>
            <Text m={0} ml={5} className="font-face-rk" fontSize={lg ? "medium" : "lg"}>
                {newCollectionData.current.nft_metadata === null
                    ? "No Files Selected"
                    : newCollectionData.current.nft_metadata.length + " files selected"}
            </Text>
        </HStack>
    );

    return (
        <Center style={{ background: "linear-gradient(180deg, #292929 0%, #0B0B0B 100%)" }} width="100%">
            <VStack w="100%" style={{ paddingBottom: md ? 35 : "300px" }}>
                <Text align="start" className="font-face-kg" color={"white"} fontSize="x-large">
                    Individual NFT info:
                </Text>
                <form onSubmit={setLaunchData} style={{ width: lg ? "100%" : "1200px" }}>
                    <VStack px={lg ? 4 : 12} spacing={25}>
                        <HStack w="100%" spacing={lg ? 10 : 12} style={{ flexDirection: lg ? "column" : "row" }}>
                            <VStack spacing={8} flexGrow={1} align="start" width="100%">
                                <HStack spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "132px" }}>
                                        Name:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            placeholder="Enter NFT Name, will be followed by #number"
                                            size={lg ? "md" : "lg"}
                                            maxLength={25}
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            value={nft_name}
                                            onChange={(e) => {setNFTName(e.target.value)}}
                                        />
                                    </div>
                                </HStack>

                                <BrowseImages />
                                <BrowseMetaData />
                            </VStack>
                        </HStack>

                        <HStack mt={md ? 0 : 30}>
                            <button
                                type="button"
                                className={`${styles.nextBtn} font-face-kg `}
                                onClick={() => {
                                    setScreen("step 1");
                                }}
                            >
                                Go Back
                            </button>
                            <button type="submit" className={`${styles.nextBtn} font-face-kg `}>
                                NEXT (2/4)
                            </button>
                        </HStack>
                    </VStack>
                </form>
            </VStack>
        </Center>
    );
};

export default NFTData;
