import React from 'react'
import Head from "next/head";
import { Card, CardBody, Flex, Heading, Stack, Text, Box, Button, HStack, Image } from '@chakra-ui/react';
import BadgerGIF from '../../public/curatedLaunches/badgers/badger.gif'
import ShroomButton from '../../public/curatedLaunches/badgers/shroombutton.png'
import { useRef, useState } from "react";
import { FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import Links from '../../components/Buttons/links';
import { WideBits } from '@raydium-io/raydium-sdk-v2';
const badgers = () => {
    const audioRef = useRef(null); // Reference to the audio element
    const [isMuted, setIsMuted] = useState(false); // State to manage mute/unmute

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted; // Toggle mute property
            setIsMuted(!isMuted); // Update state
        }
    };

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Pepemon</title>
            </Head>
            <audio
                ref={audioRef}
                src="/curatedLaunches/badgers/badger_loop.mp3"
                autoPlay
                loop
                muted={isMuted}
            />
            <Box position="absolute" right={0} padding={5}>
                <Button colorScheme="teal" variant="solid" onClick={toggleMute}>
                    {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                </Button>
            </Box>
            <Box
                bgImage="url('/curatedLaunches/badgers/badgerBackground.png')"
                bgSize="cover"
                bgPosition="center"
                bgRepeat="no-repeat"
                h={['auto', 'auto', 'auto', 'auto', '100%']}
                w="100%"
                display='flex'
                justifyContent='center'
                alignItems='center'
            >
                <Flex
                    gap={10}
                    style={{ width: "100%"}}
                    justifyContent={'center'}
                    alignItems={['center', 'center', 'center', 'stretch', 'stretch']}
                    padding={5}
                    fontFamily={'singlanguagefont'} letterSpacing='2px'
                    direction={['column', 'column', 'column', 'row', 'row']}
                >
                    <Flex>
                        <Card
                            maxH='2xl'
                            sx={{
                                background: 'linear-gradient(150deg, rgba(70,69,80,.98) 0%, rgba(6,29,34,.98) 86%)',
                                borderRadius: '10px', // Make sure to apply rounded corners as well
                                padding: '10px'
                            }}
                            textAlign="center"
                            height='100%'
                        >
                            <CardBody>
                                <Flex direction="column" alignItems="center" justifyContent="center" height="100%">
                                    <Image
                                        src='/curatedLaunches/badgers/badger.gif'
                                        alt='Green double couch with wooden legs'
                                        maxWidth={['2xs', '2xs', '3xs', '2xs', 'xs']}
                                        style={{ borderRadius: 10 }}
                                    />
                                    <Stack mt='1.25rem' spacing='3' align='center'>
                                        <Button
                                            variant="outline"
                                            colorScheme="teal"
                                            borderRadius="full"
                                            padding="0"
                                            onClick={() => alert("Button Clicked!")}
                                            _hover={{ boxShadow: "lg", transform: "scale(1.05)" }}
                                            height='9.375rem'
                                            position='relative'
                                        >
                                            <Image src='/curatedLaunches/badgers/shroombutton.png' alt='Mashroom Button' style={{ width: 'auto', height: '100%' }} />
                                            <Text fontSize='4xl' color='black' position='absolute' top='40%' fontWeight='bold' className='text-stroke'>MINT</Text>
                                        </Button>
                                    </Stack>
                                </Flex>
                            </CardBody>
                        </Card>
                    </Flex>
                    <Flex>
                        <Card
                            maxH='2xl'
                            color={'white'}
                            sx={{
                                background: 'linear-gradient(150deg, rgba(70,69,80,.98) 0%, rgba(6,29,34,.98) 86%)',
                                borderRadius: '10px', // Make sure to apply rounded corners as well
                                padding: '20px'
                            }}
                            textAlign="center"
                            fontFamily={'singlanguagefont'}
                        >
                            <CardBody>
                                <Flex direction="column" alignItems="center" justifyContent="center" height="100%">
                                    <Stack spacing='3'>

                                        <Text fontSize={['2xl', '2xl', '3xl', '4xl', '6xl']} color='white' mb={0} lineHeight='3.125rem'>BADGER BAGERS</Text>
                                        <Links socials={[]} />
                                        <Stack spacing={2} textAlign="left">
                                            <Text fontSize={['xl', 'xl', '2xl', '3xl', '4xl']} mb={0} lineHeight='50px'>Whitelist Phase</Text>
                                            <HStack spacing={[5, 5, "30px", "50px", "50px"]} ml={[0, 0, 5, 5, 5]}>
                                                <Text fontSize={['sm', 'sm', 'md', 'lg', '3xl']} fontWeight='thin' border={'1px solid white'} letterSpacing='5px' sx={{ borderRadius: '10px', padding: '5px 15px', background: 'linear-gradient(320deg, rgba(0,0,0,1) 0%, rgba(52,140,132,1) 100%)' }}>07 OCT 2024</Text>
                                                <Text fontSize={['sm', 'sm', 'md', 'lg', '3xl']} fontWeight='thin' border={'1px solid white'} letterSpacing='5px' sx={{ borderRadius: '10px', padding: '5px 15px', background: 'linear-gradient(320deg, rgba(0,0,0,1) 0%, rgba(52,140,132,1) 100%)' }}>18:00 UTC</Text>
                                            </HStack>
                                        </Stack>
                                        <Stack spacing={2} textAlign="left">
                                            <Text fontSize={['xl', 'xl', '2xl', '3xl', '4xl']} mb={0} lineHeight='50px'>Public Phase</Text>
                                            <HStack spacing={[5, 5, "30px", "50px", "50px"]} ml={[0, 0, 5, 5, 5]}>
                                                <Text fontSize={['sm', 'sm', 'md', 'lg', '3xl']} fontWeight='thin' border={'1px solid white'} letterSpacing='5px' sx={{ borderRadius: '10px', padding: '5px 15px', background: 'linear-gradient(320deg, rgba(0,0,0,1) 0%, rgba(52,140,132,1) 100%)' }}>07 OCT 2024</Text>
                                                <Text fontSize={['sm', 'sm', 'md', 'lg', '3xl']} fontWeight='thin' border={'1px solid white'} letterSpacing='5px' sx={{ borderRadius: '10px', padding: '5px 15px', background: 'linear-gradient(320deg, rgba(0,0,0,1) 0%, rgba(52,140,132,1) 100%)' }}>20:00 UTC</Text>
                                            </HStack>
                                        </Stack>
                                        <Stack spacing={2} textAlign="left">
                                            <Text fontSize={['xl', 'xl', '2xl', '3xl', '4xl']} mb={0} lineHeight='50px'>Price</Text>
                                            <HStack spacing={[5, 5, "30px", "50px", "50px"]} ml={[0, 0, 5, 5, 5]}>
                                                <Text fontSize={['sm', 'sm', 'md', 'lg', '3xl']} fontWeight='thin' border={'1px solid white'} letterSpacing='5px' sx={{ borderRadius: '10px', padding: '5px 15px', background: 'linear-gradient(320deg, rgba(0,0,0,1) 0%, rgba(52,140,132,1) 100%)' }}>1000</Text>
                                                <Text fontSize={['sm', 'sm', 'md', 'lg', '3xl']} fontWeight='thin' border={'1px solid white'} letterSpacing='5px' sx={{ borderRadius: '10px', padding: '5px 15px', background: 'linear-gradient(320deg, rgba(0,0,0,1) 0%, rgba(52,140,132,1) 100%)' }}>$BADGER</Text>
                                            </HStack>
                                        </Stack>
                                    </Stack>
                                </Flex>
                            </CardBody>
                        </Card>
                    </Flex>
                </Flex>
            </Box >
        </>
    )
}

export default badgers