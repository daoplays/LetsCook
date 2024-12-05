
import {
    Box,
    Center,
    Text,
    HStack,
    VStack,
    Divider
} from '@chakra-ui/react';
import { isMobile } from "react-device-detect";

import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';



import { DUNGEON_FONT_SIZE } from '@/components/Solana/constants';
import { StaticImageData } from 'next/image';

export const enum Achievements {
    DungeonCrawler,
    DungeonExplorer,
    DungeonParagon,
    FirstBlood,
    GottaKillEmAll,
    Rookie,
    Adventurer,
    BatOutOfHell,
    JackOfAllTrades,
    LikeABoss,
    WeCouldHaveBeenFriends,
    YerrAWizardHarry,
    Scrounger,
    Scavenger,
    Unlucky,
    Cursed,
    TableThrow,
    Cautious,
    Coward,
    DailyDungeonI,
    DailyDungeonII,
    DailyDungeonIII,
    OnceYouPop,
    Spoderman,
    YouShallNotPass,
    Looter,
    Chicken,
    MasterOfNone,
    MasterOfAll,
    Fertilizer,
    DMSlayer
}

export interface Achievement {
    name: string;
    description: string;
    image: string;
    type: number;
    secret: boolean;
    percent: number;
}

export const AchievementMetaData : Achievement[] = [
    {name: "Dungeon Crawler", description: "Earn 100 XP", image: "images/cooks.jpeg", type: 0, secret: false, percent: 31.4},
    {name: "Dungeon Explorer", description: "Earn 1000 XP", image: "images/cooks.jpeg", type: 0, secret: false, percent: 4.9},
    {name: "Dungeon Paragon", description: "Earn 10000 XP", image: "images/cooks.jpeg", type: 0, secret: false, percent: 0.2},
    {name: "First Blood", description: "Kill your first enemy", image: "images/cooks.jpeg", type: 0, secret: false, percent: 92.4},
    {name: "Gotta Kill 'em All", description: "Kill 10 types of enemy", image: "images/cooks.jpeg", type: 0, secret: false, percent: 4.1},
    {name: "Rookie", description: "Kill a tier 1 boss", image: "images/cooks.jpeg", type: 0, secret: false, percent: 21.2},
    {name: "Adventurer", description: "Kill a tier 1 boss 10 times", image: "images/cooks.jpeg", type: 0, secret: false, percent: 7.1},
    {name: "Bat Out Of Hell", description: "Kill a tier 2 boss", image: "images/cooks.jpeg", type: 0, secret: false, percent: 2.3},
    {name: "Jack Of All Trades", description: "Kill a tier 2 boss with all 3 classes", image: "images/cooks.jpeg", type: 0, secret: false, percent: 1.2},
    {name: "Like A Boss", description: "Kill 6 different bosses", image: "images/cooks.jpeg", type: 0, secret: false, percent: 0},
    {name: "We Could Have Been Friends", description: "Defeat the Assassin as the Ranger", image: "images/cooks.jpeg", type: 0, secret: true, percent: 0.8},
    {name: "Yerr a Wizard, Harry", description: "Defeat the Dungeon Master as the Wizard", image: "images/cooks.jpeg", type: 0, secret: true, percent: 0.2},
    {name: "Scrounger", description: "Accumulate 10 SOL of loot", image: "images/cooks.jpeg", type: 1, secret: false, percent: 9.9},
    {name: "Scavenger", description: "Accumulate 100 SOL of loot", image: "images/cooks.jpeg", type: 1, secret: false, percent: 0.8},
    {name: "Unlucky", description: "Suffer a 3x losing streak", image: "images/cooks.jpeg", type: 0, secret: true, percent: 45.9},
    {name: "Cursed", description: "Suffer a 6x losing streak", image: "images/cooks.jpeg", type: 0, secret: true, percent: 5.7},
    {name: "(╯°□°）╯︵ ┻━┻", description: "Suffer a 10x losing streak", image: "images/cooks.jpeg", type: 0, secret: true, percent: 0},
    {name: "Cautious", description: "Escape level 1 10 times", image: "images/cooks.jpeg", type: 1, secret: false, percent: 5.3},
    {name: "Coward", description: "Escape level 1 100 times", image: "images/cooks.jpeg", type: 1, secret: false, percent: 0.3},
    {name: "Daily Dungeon I", description: "Enter the Dungeon on 5 consecutive days", image: "images/cooks.jpeg", type: 0, secret: false, percent: 5.4},
    {name: "Daily Dungeon II", description: "Enter the Dungeon on 20 consecutive days", image: "images/cooks.jpeg", type: 0, secret: false, percent: 0.3},
    {name: "Daily Dungeon III", description: "Enter the Dungeon on 100 consecutive days", image: "images/cooks.jpeg", type: 0, secret: false, percent: 0},
    {name: "Once You Pop...", description: "Play 100 rounds in a day", image: "images/cooks.jpeg", type: 0, secret: true, percent: 6.6},
    {name: "Spoderman", description: "Be defeated by Spiders 100 times", image: "images/cooks.jpeg", type: 0, secret: true, percent: 0.6},
    {name: "You Shall Not Pass!", description: "Be defeated by a Boss 50 times", image: "images/cooks.jpeg", type: 0, secret: true, percent: 1.1},
    {name: "Looter", description: "Accumulate 1000 SOL of loot", image: "images/cooks.jpeg", type: 0, secret: false, percent: 0},
    {name: "Chicken", description: "Escape Level 1 1000 times", image: "images/cooks.jpeg", type: 0, secret: false, percent: 0},
    {name: "Master Of None", description: "Kill a tier 2 boss with all 3 classes 10 times", image: "images/cooks.jpeg", type: 0, secret: false, percent: 0},
    {name: "Master Of All", description: "Kill a tier 2 boss with all 3 classes 100 times", image: "images/cooks.jpeg", type: 0, secret: false, percent: 0},
    {name: "Fertilizer", description: "Be defeated by Carnivines 10 times", image: "images/cooks.jpeg", type: 0, secret: true, percent: 0.5},
    {name: "DM Slayer", description: "Defeat a Dungeon Master", image: "images/cooks.jpeg", type: 0, secret: false, percent: 0.1}
]

export const AchievementCard = ({index, AchievementState, show_mint, ClaimAchievement} : {index : number, AchievementState: number[] | null, show_mint: boolean, ClaimAchievement: any}) => {

    let this_state = 1;
    if (AchievementState !== null && AchievementState !== undefined)
        this_state = AchievementState[index];

    let image_size = !isMobile ? "100px" : "50px";
    let divider_size = !isMobile ? "100px" : "70px";
    return (
        <div className="font-face-sfp" style={{color: "white", fontSize: DUNGEON_FONT_SIZE, width:"100%", marginBottom:"1rem"}}>
        <Card style={{ flexDirection: "row", borderWidth:'2px', borderColor: (this_state === 1) ? 'white': 'green', filter:  (this_state === 1 && AchievementMetaData[index].secret) ? "blur(7px)" : "blur(0px)" }} bg="dark">

            
            <Card.Img style={{width: image_size, objectFit: "scale-down", "imageRendering":"pixelated", filter:  (this_state === 1) ? "blur(7px)" : "blur(0px)" }} src={AchievementMetaData[index].image} alt="banner" />
            <Center height={divider_size}>
            <Divider orientation='vertical' />
            </Center>
  
            <Card.Body style={{paddingTop: "0.5rem", paddingBottom: "0.1rem"}} color="white"> 
                   <VStack alignItems={"left"} spacing="0.1rem">
                    <Text marginTop="0" style={{fontWeight:"bold"}}>{AchievementMetaData[index].name}</Text>
                    {show_mint && (this_state === 2 || this_state === 3) ?
                        <HStack>
                            <Text color="white">{AchievementMetaData[index].description}</Text>
                            
                            <Box as='button'  onClick={() => ClaimAchievement(index)}  borderWidth='2px' borderColor="white"   width="60px">
                                <Text  align="center" fontSize={DUNGEON_FONT_SIZE} color="white">Mint</Text>
                            </Box>
                            
                        </HStack>

                    :
                    <Text marginTop="0" marginBottom="0">{AchievementMetaData[index].description}</Text>
                    
                    }
                    <Text color="grey" fontSize="10px">{AchievementMetaData[index].percent}% of users unlocked this</Text>
                </VStack>
            </Card.Body>
            </Card>
        </div>
        
    );
  }

export default function AchievementsScreen({AchievementState, ClaimAchievement} : {AchievementState : number[] | null,  ClaimAchievement: any})
{
    return(
    <>
    <Container fluid style={{width:"80%", justifyContent: "center", marginBottom:"10rem"}}>
        <Col>
            <AchievementCard index={Achievements.DungeonCrawler} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.DungeonExplorer} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.DungeonParagon} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.FirstBlood} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.GottaKillEmAll} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Rookie} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Adventurer} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.BatOutOfHell} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.DMSlayer} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.JackOfAllTrades} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.MasterOfNone} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.MasterOfAll} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.WeCouldHaveBeenFriends} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.YerrAWizardHarry} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Scrounger} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Scavenger} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Looter} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Unlucky} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Cursed} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.TableThrow} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Cautious} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Coward} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Chicken} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.DailyDungeonI} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.DailyDungeonII} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.DailyDungeonIII} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.OnceYouPop} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Spoderman} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.YouShallNotPass} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
            <AchievementCard index={Achievements.Fertilizer} AchievementState={AchievementState} show_mint={true} ClaimAchievement={ClaimAchievement}/>
        </Col>
    </Container>

    </>
    );
}