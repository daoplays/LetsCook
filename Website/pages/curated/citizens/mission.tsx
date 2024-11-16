import React from 'react';
import { Modal, ModalOverlay, ModalContent, ModalBody, useDisclosure } from "@chakra-ui/react";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FaSkull, FaCoins } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';

interface DifficultyOption {
    name: string;
    levelReq: number;
    successRate: number;
    deathRate: number;
    reward: number;
}

const difficultyOptions: DifficultyOption[] = [
    {
        name: "Easy",
        levelReq: 0,
        successRate: 75,
        deathRate: 25,
        reward: 500
    },
    {
        name: "Medium",
        levelReq: 5,
        successRate: 50,
        deathRate: 50,
        reward: 1500
    },
    {
        name: "Hard",
        levelReq: 10,
        successRate: 25,
        deathRate: 75,
        reward: 5000
    }
];

interface MissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    mercenary: any; // Replace with your mercenary type
    onSelectMission: (difficulty: string) => void;
}


export const MissionModal = ({ isOpen, onClose, mercenary, onSelectMission }: MissionModalProps) => {
    const mercenaryLevel = parseInt(mercenary?.metadata?.attributes?.find(attr => attr.trait_type === "Level")?.value || "1");

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="slideInBottom" size="2xl">
            <ModalOverlay className="backdrop-blur-sm" />
            <ModalContent className="bg-transparent">
                <ModalBody className="p-0 overflow-visible">
                    <div className="relative flex flex-col gap-4 rounded-2xl border-2 border-[#3A2618] bg-[#1C1410]/95 p-8 shadow-2xl backdrop-blur-md">
                        {/* Header Image */}
                        <div className="relative h-48 w-full overflow-hidden rounded-xl border-2 border-[#3A2618]">
                            <Image
                                src="/curatedLaunches/citizens/warroom.png"
                                layout="fill"
                                objectFit="cover"
                                alt="Mission"
                                className="opacity-80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1410] to-transparent" />
                        </div>

                        <h2 className="text-center font-serif text-2xl text-[#C4A484]">Select Mission Difficulty</h2>

                        {/* Difficulty Options */}
                        <div className="grid gap-4">
                            {difficultyOptions.map((difficulty) => {
                                const isLocked = mercenaryLevel < difficulty.levelReq;
                                
                                return (
                                    <TooltipProvider key={difficulty.name}>
                                        <Tooltip>
                                            <div className="w-full"> {/* Wrapper div */}
                                                <TooltipTrigger className="w-full">
                                                    <div
                                                        onClick={() => !isLocked && onSelectMission(difficulty.name)}
                                                        className={`w-full transform rounded-lg border-2 p-4 text-left transition-all
                                                            ${isLocked 
                                                                ? 'border-[#3A2618]/50 bg-[#1C1410]/50 opacity-50 cursor-not-allowed' 
                                                                : 'border-[#3A2618] bg-[#1C1410] hover:bg-[#3A2618]/50 cursor-pointer'}`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <GiCrossedSwords className={`h-6 w-6 ${
                                                                    difficulty.name === "Easy" ? "text-green-500" :
                                                                    difficulty.name === "Medium" ? "text-yellow-500" :
                                                                    "text-red-500"
                                                                }`} />
                                                                <span className="text-lg font-bold text-[#C4A484]">
                                                                    {difficulty.name}
                                                                </span>
                                                            </div>
                                                            {isLocked && (
                                                                <span className="text-sm text-[#8B7355]">
                                                                    Requires Level {difficulty.levelReq}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TooltipTrigger>
                                            </div>
                                            <TooltipContent 
                                                side="right" 
                                                className="z-[1500] w-64 rounded-lg border-2 border-[#3A2618] bg-[#1C1410]/95 p-4 shadow-xl"
                                                >
                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="flex items-center justify-between text-sm text-[#C4A484]">
                                                            <span>Success Chance</span>
                                                            <span>{difficulty.successRate}%</span>
                                                        </div>
                                                        <ProgressBar 
                                                            value={difficulty.successRate} 
                                                            maxValue={100} 
                                                            color="bg-green-600" 
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center justify-between text-sm text-[#C4A484]">
                                                            <span>Death Risk</span>
                                                            <span>{difficulty.deathRate}%</span>
                                                        </div>
                                                        <ProgressBar 
                                                            value={difficulty.deathRate} 
                                                            maxValue={100} 
                                                            color="bg-red-600" 
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 pt-2 text-[#C4A484]">
                                                        <FaCoins />
                                                        <span>{difficulty.reward} Tarnished Marks</span>
                                                    </div>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                );
                            })}
                        </div>

                        <button
                            onClick={onClose}
                            className="mx-auto mt-2 transform rounded-lg border-2 border-[#3A2618] bg-gradient-to-b from-[#8B7355] to-[#3A2618] px-8 py-2 font-bold text-[#1C1410] transition-all hover:from-[#C4A484] hover:to-[#8B7355] active:scale-95"
                        >
                            Cancel
                        </button>
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

const ProgressBar = ({ value, maxValue, color }: { value: number; maxValue: number; color: string }) => (
    <div className="h-2 w-full rounded-full bg-[#3A2618]">
        <div 
            className={`h-full rounded-full ${color}`}
            style={{ width: `${(value / maxValue) * 100}%` }}
        />
    </div>
);

export default MissionModal;