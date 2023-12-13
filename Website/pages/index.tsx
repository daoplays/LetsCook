import {
  Link,
  Center,
  VStack,
  Text,
  Box,
  HStack
} from "@chakra-ui/react";

import React from "react";
import {Col, Container} from 'react-bootstrap';
import Table from 'react-bootstrap/Table';

import { isMobile } from "react-device-detect";
import { FaDiscord, FaTwitter, FaGithub, FaTwitch } from 'react-icons/fa';
const ArenaGameCard = () => {

  let forfeit : boolean = false

  return (
      <tr>
          <td >RPS</td>
          <td >{0.1}</td>
          <td>{"Fast"}</td>
          <td>
              100%
          </td>
          <td >100 SOL</td>
          <td>
              THIS
          </td>
          <td>
            Now
          </td>
      </tr>
      
  );
}

const Listings = ({game_list} : {game_list : number[]}) => {
  return(
      <>{
          game_list.map((index) => 
              <ArenaGameCard key={index}/>
      )
      }
      </>
  );
}


const GameTable = () => {

  let waiting_games : number[] = [1,2,3,4,5,6,7,8,9,10]
  return(
      <Box width = "100%">
          <div className="font-face-rk" style={{color: "white", fontSize: 14}}>
              <Table className="custom-centered-table">
                  <thead>
                  <tr>
                  <th>LOGO</th>
                  <th>TICKER</th>
                  <th>SOCIALS</th>
                  <th>HYPE</th>
                  <th>MIN.LIQUIDITY</th>
                  <th>LAUNCH</th>
                  <th>
                  <Box as='button'>
                  <FaTwitter />
                  </Box>
                  </th>
                  </tr>
                  </thead>
                  <tbody style={{
                      backgroundColor: 'black'
                  }}>
                      <Listings game_list={waiting_games}/>
                  </tbody>
              </Table>
          </div>
      </Box>
  );
}

export default function Home() {
  return (
    <>
         <Center width="100%" marginBottom="5rem">
                    <VStack width="100%" alignItems="left">
                        <Box
                        as="button"
                        borderWidth="2px"
                        borderColor="white"
                        width="200px"
                        visibility="hidden"
                    >
                        <div className="font-face-sfpb">
                        <Text align="center" fontSize={14} color="white">
                        Create New Game
                        </Text>
                        </div>
                    </Box>
                        <GameTable/>
                    </VStack>
                </Center>
        </>
  );
}
