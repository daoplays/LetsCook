import { Dispatch, SetStateAction, useState } from "react";
import { Center, VStack, Text, HStack, Input, chakra, Flex, Button, CloseButton } from "@chakra-ui/react";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "../../styles/Launch.module.css";
import useResponsive from "../../hooks/useResponsive";
import styles2 from "../../styles/LaunchDetails.module.css";
import useAppRoot from "../../context/useAppRoot";
import { toast } from "react-toastify";
import { IoMdClose } from "react-icons/io";
import { OnChainAttributes } from "./collectionState";

interface NFTDataProps {
    setScreen: Dispatch<SetStateAction<string>>;
}

const NFTData = ({ setScreen }: NFTDataProps) => {
    const router = useRouter();
    const { newCollectionData } = useAppRoot();

    const [nft_name, setNFTName] = useState<string>(newCollectionData.current.nft_name);

    const { sm, md, lg, xl } = useResponsive();
    const [displayImg, setDisplayImg] = useState<string>("");

    const [attributes, setAttributes] = useState<OnChainAttributes[]>([]);

    const addRow = () => {
        if (attributes.length < 10) {
            setAttributes([...attributes, { name: "", min: "0", max: "0", saved: false, editMode: true }]);
        } else {
            alert("Attributes Limit Reached");
        }
    };

    const removeRow = (index: number) => {
        const newAttributes = [...attributes];
        newAttributes.splice(index, 1);
        setAttributes(newAttributes);
    };

    const handleChange = (index: number, field: string, value: string | number) => {
        const newAttributes = [...attributes];
        newAttributes[index][field] = value;
        setAttributes(newAttributes);
    };

    const toggleEditMode = (index: number) => {
        const newAttributes = [...attributes];
        newAttributes[index].editMode = !newAttributes[index].editMode;
        setAttributes(newAttributes);
    };

    const saveRow = (index: number) => {
        const { name, min, max } = attributes[index];
        if (name.trim() !== "" && !isNaN(parseFloat(min)) && !isNaN(parseFloat(max)) && parseFloat(max) >= parseFloat(min)) {
            const newAttributes = [...attributes];
            newAttributes[index].saved = true;
            newAttributes[index].editMode = false;
            setAttributes(newAttributes);
            console.log(attributes);
        } else {
            alert("Please fill all the fields before saving.");
        }
    };

    function setLaunchData(e) {
        e.preventDefault();

        if (newCollectionData.current.nft_metadata === null || newCollectionData.current.nft_images === null) {
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

        let meta_check = new Array(newCollectionData.current.nft_metadata.length).fill(0);
        let image_check = new Array(newCollectionData.current.nft_metadata.length).fill(0);

        let image_type = newCollectionData.current.nft_images[0].type;
        let split_name = newCollectionData.current.nft_images[0].name.split(".");
        let image_type_name = split_name[split_name.length - 1];
        console.log("image type: ", image_type_name);

        for (let i = 0; i < newCollectionData.current.nft_metadata.length; i++) {
            if (newCollectionData.current.nft_metadata[i].type !== "application/json") {
                toast.error("meta data must be of type json");
                console.log(newCollectionData.current.nft_metadata[i].type);
                return;
            }
            if (newCollectionData.current.nft_images[i].type !== image_type) {
                toast.error("all images must be of the same type");
                return;
            }

            let split_name = newCollectionData.current.nft_images[i].name.split(".");
            if (split_name[split_name.length - 1] !== image_type_name) {
                toast.error("all images must named the same type");
                return;
            }

            let meta_idx = parseInt(newCollectionData.current.nft_metadata[i].name);
            let img_idx = parseInt(newCollectionData.current.nft_images[i].name);

            meta_check[meta_idx] += 1;
            image_check[img_idx] += 1;
        }
        for (let i = 0; i < newCollectionData.current.nft_metadata.length; i++) {
            if (meta_check[i] == 0) {
                toast.error("missing meta data for index " + i);
                return;
            }
            if (meta_check[i] > 1) {
                toast.error("duplicate meta data for index " + i);
                return;
            }
            if (image_check[i] == 0) {
                toast.error("missing image data for index " + i);
                return;
            }
            if (image_check[i] > 1) {
                toast.error("duplicate image data for index " + i);
                return;
            }
        }

        newCollectionData.current.collection_size = newCollectionData.current.nft_metadata.length;
        newCollectionData.current.total_supply = newCollectionData.current.nft_metadata.length;
        newCollectionData.current.nft_name = nft_name;
        newCollectionData.current.nft_type = "." + image_type_name;
        newCollectionData.current.attributes = attributes;

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
                Images:
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

    const AddOnChainAttributes = () => (
        <HStack spacing={0} className={styles.eachField}>
            <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "132px" }}>
                Randomised On-Chain Attributes:
            </div>
            <div>
                <label className={styles.label}>
                    <span
                        className={styles.browse}
                        style={{
                            cursor: newCollectionData.current.edit_mode === true ? "not-allowed" : "pointer",
                            padding: "5px 10px",
                            marginLeft: "20px",
                        }}
                        onClick={addRow}
                    >
                        ADD
                    </span>
                </label>
            </div>
        </HStack>
    );

    return (
        <Center width="100%" h="100%">
            <VStack w="100%" h="100%" style={{ paddingBottom: md ? 35 : "300px" }}>
                <Text align="start" className="font-face-kg font-extrabold" color={"white"} fontSize="x-large">
                    Individual NFT info:
                </Text>
                <form onSubmit={setLaunchData} style={{ width: xl ? "100%" : "1200px" }} className="mt-4 rounded-md bg-[#303030] py-4">
                    <VStack px={lg ? 4 : 12} spacing={25}>
                        <HStack w="100%" spacing={lg ? 10 : 12} style={{ flexDirection: lg ? "column" : "row" }}>
                            <VStack spacing={8} flexGrow={1} align="start" width="100%">
                                <HStack spacing={0} className={styles.eachField}>
                                    <div className={`${styles.textLabel} font-face-kg`} style={{ minWidth: lg ? "100px" : "132px" }}>
                                        NFT Name:
                                    </div>

                                    <div className={styles.textLabelInput}>
                                        <Input
                                            placeholder="Enter NFT Name. It will be previewed as: Name #1, Name #2, and so on..."
                                            size={lg ? "md" : "lg"}
                                            maxLength={25}
                                            required
                                            className={styles.inputBox}
                                            type="text"
                                            value={nft_name}
                                            onChange={(e) => {
                                                setNFTName(e.target.value);
                                            }}
                                        />
                                    </div>
                                </HStack>

                                <BrowseImages />
                                <BrowseMetaData />
                                <AddOnChainAttributes />

                                {attributes.map((attribute, index) => (
                                    <VStack key={index}>
                                        <HStack gap={2} alignItems="center">
                                            <Text mr={2} mb={0} color="white" fontSize={24} fontWeight={"bold"} w={120}>
                                                #{index + 1}
                                            </Text>

                                            <HStack spacing={0} className={styles.eachField} gap={3}>
                                                <div className={`${styles.textLabel} font-face-kg`}>Name:</div>
                                                <div className={styles.textLabelInput}>
                                                    <Input
                                                        size={lg ? "md" : "lg"}
                                                        maxLength={25}
                                                        required
                                                        className={styles.inputBox}
                                                        type="text"
                                                        value={attribute.name}
                                                        onChange={(e) => handleChange(index, "name", e.target.value)}
                                                        disabled={!attribute.editMode && attribute.saved && attribute.name.trim() !== ""}
                                                    />
                                                </div>
                                            </HStack>

                                            <HStack spacing={0} className={styles.eachField} ml={3} gap={4}>
                                                <div className={`${styles.textLabel} font-face-kg`}>Min:</div>
                                                <div className={styles.textLabelInput}>
                                                    <Input
                                                        size={lg ? "md" : "lg"}
                                                        maxLength={25}
                                                        required
                                                        className={styles.inputBox}
                                                        value={attribute.min}
                                                        onChange={(e) => handleChange(index, "min", e.target.value)}
                                                        disabled={!attribute.editMode && attribute.saved}
                                                    />
                                                </div>
                                            </HStack>

                                            <HStack spacing={0} className={styles.eachField} ml={3} gap={4}>
                                                <div className={`${styles.textLabel} font-face-kg`}>Max:</div>
                                                <div className={styles.textLabelInput}>
                                                    <Input
                                                        size={lg ? "md" : "lg"}
                                                        maxLength={25}
                                                        required
                                                        className={styles.inputBox}
                                                        value={attribute.max}
                                                        onChange={(e) => handleChange(index, "max", e.target.value)}
                                                        disabled={!attribute.editMode && attribute.saved}
                                                    />
                                                </div>
                                            </HStack>

                                            <HStack ml={3}>
                                                <Button onClick={() => removeRow(index)}>Remove</Button>
                                            </HStack>
                                        </HStack>
                                    </VStack>
                                ))}
                            </VStack>
                        </HStack>

                        <HStack mt={md ? 0 : 30}>
                            <button
                                type="button"
                                className={`${styles.nextBtn} font-face-kg`}
                                onClick={() => {
                                    setScreen("step 1");
                                }}
                            >
                                GO BACK
                            </button>
                            <button type="submit" className={`${styles.nextBtn} font-face-kg`}>
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
