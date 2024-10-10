import {
    Button,
    Center,
    Checkbox,
    Flex,
    HStack,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalOverlay,
    Progress,
    Tooltip,
    VStack,
} from "@chakra-ui/react";
import { MdClose } from "react-icons/md";
import { Text } from "@chakra-ui/react";
import { LaunchData, ListingData, bignum_to_num } from "../Solana/state";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import Image from "next/image";
import FeaturedBanner from "../../components/featuredBanner";
import useResponsive from "../../hooks/useResponsive";
import TokenDistribution from "./tokenDistribution";
import Timespan from "./timespan";
import { Config } from "../Solana/constants";

interface LaunchPreviewProps {
    isOpen: boolean;
    onClose: () => void;
    data?: [LaunchData, ListingData];
}

const LaunchPreviewModal = ({ isOpen, onClose, data }: LaunchPreviewProps) => {
    const { xs, sm, md, lg } = useResponsive();

    let launchData: LaunchData = data[0];
    let listingData: ListingData = data[1];

    let one_mint = (bignum_to_num(launchData.total_supply) * (launchData.distribution[0] / 100)) / launchData.num_mints;
    let one_mint_frac = (100 * one_mint) / bignum_to_num(launchData.total_supply);

    return (
        <Modal size="full" isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent p={0} m={0} style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)" }}>
                <HStack px={5} py={3} justify="space-between" align="center" color="white">
                    <Text m="0" color="white" className="font-face-kg" textAlign={"center"} fontSize={lg ? "x-large" : "xx-large"}>
                        Launch Preview
                    </Text>
                    <MdClose size={sm ? 35 : 45} onClick={onClose} style={{ cursor: "pointer" }} />
                </HStack>

                <ModalBody m={0} p={0}>
                    <main style={{ background: "linear-gradient(180deg, #292929 10%, #0B0B0B 100%)" }}>
                        <FeaturedBanner featuredLaunch={launchData} featuredListing={listingData} isHomePage={false} />
                        <Center>
                            <VStack spacing={5} my={3} px={5} width={sm ? "100%" : "80%"}>
                                <Timespan launchData={launchData} />

                                <VStack
                                    gap={50}
                                    p={md ? 25 : 50}
                                    bg="rgba(255, 255, 255, 0.20)"
                                    borderRadius={12}
                                    border="1px solid white"
                                    h="fit-content"
                                    style={{ maxWidth: "980px" }}
                                >
                                    <Flex w="100%" gap={xs ? 50 : lg ? 45 : 75} justify="space-between" direction={md ? "column" : "row"}>
                                        <VStack align="start" gap={xs ? 3 : 5}>
                                            <HStack>
                                                <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                                    Price per ticket: {bignum_to_num(launchData.ticket_price) / LAMPORTS_PER_SOL}
                                                </Text>
                                                <Image
                                                    src={Config.token_image}
                                                    width={30}
                                                    height={30}
                                                    alt="SOL Icon"
                                                    style={{ marginLeft: -3 }}
                                                />
                                            </HStack>

                                            <Text
                                                m="0"
                                                color="white"
                                                fontSize="x-large"
                                                fontFamily="ReemKufiRegular"
                                                align={md ? "center" : "start"}
                                            >
                                                Total Winning Tickets: {launchData.num_mints.toLocaleString()}
                                            </Text>

                                            <Text
                                                m="0"
                                                color="white"
                                                fontSize="x-large"
                                                fontFamily="ReemKufiRegular"
                                                align={md ? "center" : "start"}
                                            >
                                                Tokens Per Winning Ticket: {one_mint.toLocaleString()}
                                                <br />({one_mint_frac.toFixed(4)}% of total supply)
                                            </Text>

                                            <HStack align="center" gap={3}>
                                                <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                                    Auto Refund:
                                                </Text>
                                                <Checkbox size="lg" isChecked colorScheme="green" />
                                                <Tooltip
                                                    label="You will get a refund if liquidity threshhold is not reached."
                                                    hasArrow
                                                    w={270}
                                                    fontSize="large"
                                                    offset={[0, 10]}
                                                >
                                                    <Image width={25} height={25} src="/images/help.png" alt="Help" />
                                                </Tooltip>
                                            </HStack>
                                        </VStack>

                                        <VStack align="center" justify="center" gap={3}>
                                            <HStack>
                                                <Text
                                                    m="0"
                                                    color="white"
                                                    className="font-face-kg"
                                                    textAlign={"center"}
                                                    fontSize={lg ? "x-large" : "xxx-large"}
                                                >
                                                    Total: 0
                                                </Text>
                                                {true && <Image src={Config.token_image} width={40} height={40} alt="SOL Icon" />}
                                            </HStack>

                                            <HStack maxW="320px">
                                                <Button>-</Button>

                                                <Input
                                                    value={0}
                                                    size="lg"
                                                    fontSize="x-large"
                                                    color="white"
                                                    alignItems="center"
                                                    justifyContent="center"
                                                    readOnly
                                                />
                                                <Button>+</Button>
                                            </HStack>

                                            <Button size="lg" isDisabled={true}>
                                                Mint
                                            </Button>

                                            <VStack>
                                                <HStack>
                                                    <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                                        Platform fee: 0.01
                                                    </Text>
                                                    <Image
                                                        src={Config.token_image}
                                                        width={30}
                                                        height={30}
                                                        alt="SOL Icon"
                                                        style={{ marginLeft: -3 }}
                                                    />
                                                </HStack>
                                                {/* <Text m="0" mt={-3} color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                                    per ticket
                                                </Text> */}
                                            </VStack>
                                        </VStack>
                                    </Flex>

                                    <VStack w={xs ? "100%" : "85%"}>
                                        <Progress
                                            hasStripe={true}
                                            mb={2}
                                            w="100%"
                                            h={25}
                                            borderRadius={12}
                                            colorScheme={"whatsapp"}
                                            size="sm"
                                            value={0}
                                        />

                                        <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                            Tickets Sold: 0
                                        </Text>

                                        <Flex direction={md ? "column" : "row"}>
                                            <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                                Guaranteed Liquidity:
                                            </Text>
                                            <HStack justify="center">
                                                <Text m="0" color="white" fontSize="x-large" fontFamily="ReemKufiRegular">
                                                    &nbsp;
                                                    {(Math.min(launchData.num_mints, launchData.tickets_sold) * launchData.ticket_price) /
                                                        LAMPORTS_PER_SOL}
                                                    /{(launchData.num_mints * launchData.ticket_price) / LAMPORTS_PER_SOL}
                                                </Text>
                                                <Image
                                                    src={Config.token_image}
                                                    width={30}
                                                    height={30}
                                                    alt="SOL Icon"
                                                    style={{ marginLeft: -3 }}
                                                />
                                            </HStack>
                                        </Flex>
                                    </VStack>
                                </VStack>

                                <TokenDistribution launchData={launchData} />
                            </VStack>
                        </Center>
                    </main>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default LaunchPreviewModal;
