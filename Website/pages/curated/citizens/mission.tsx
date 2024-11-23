import React, { useEffect, useRef, useState } from "react";
import { Modal, ModalOverlay, ModalContent, ModalBody } from "@chakra-ui/react";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FaSkull, FaCoins } from "react-icons/fa";
import { GiCrossedSwords } from "react-icons/gi";
import { Loader2Icon } from "lucide-react";

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
        reward: 500,
    },
    {
        name: "Medium",
        levelReq: 5,
        successRate: 50,
        deathRate: 50,
        reward: 1500,
    },
    {
        name: "Hard",
        levelReq: 10,
        successRate: 25,
        deathRate: 75,
        reward: 5000,
    },
];

interface MissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    mercenary: any;
    onSelectMission: (difficulty: string) => void;
    onCheckMission: () => void;
    userData: any;
    isLoading?: boolean;
}

export const MissionModal = ({ 
    isOpen, 
    onClose, 
    mercenary, 
    onSelectMission, 
    onCheckMission,
    userData,
    isLoading = false 
}: MissionModalProps) => {
    const [missionState, setMissionState] = useState('select'); // 'select', 'ongoing', 'success', 'failure'
    const [isSubmitting, setIsSubmitting] = useState(false);
    const prevStatusRef = useRef(null);
    const mercenaryLevel = parseInt(mercenary?.metadata?.attributes?.find((attr) => attr.trait_type === "Level")?.value || "1");
    const mercenaryName = mercenary?.metadata?.name || "Unknown Mercenary";
    const firstName = mercenaryName.split(' ')[0];

    useEffect(() => {
        const currentStatus = userData?.mission_status;
        
        if (prevStatusRef.current !== null && currentStatus !== null) {
            if (prevStatusRef.current === 1 && currentStatus === 2) {
                setMissionState('success');
            } else if (prevStatusRef.current === 1 && currentStatus === 3) {
                setMissionState('failure');
            } else if (currentStatus === 1) {
                setMissionState('ongoing');
            } else {
                setMissionState('select');
            }
        } else if (currentStatus === 1) {
            setMissionState('ongoing');
        } else {
            setMissionState('select');
        }

        prevStatusRef.current = currentStatus;
    }, [userData?.mission_status]);

    // Reset state when modal is closed
    useEffect(() => {
        if (!isOpen) {
            prevStatusRef.current = null;
        }
    }, [isOpen]);


    // Handler for mission selection
    const handleMissionSelect = async (difficulty: string) => {
        setIsSubmitting(true);
        try {
            await onSelectMission(difficulty);
            setMissionState('ongoing');
        } catch (error) {
            console.error('Error starting mission:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderContent = () => {
        switch (missionState) {
            case 'select':
                return (
                    <>
                        <h2 className="text-center font-serif text-2xl text-[#C4A484]">Select Mission Difficulty</h2>
                        <div className="grid gap-4">
                            {difficultyOptions.map((difficulty) => {
                                const isLocked = mercenaryLevel < difficulty.levelReq;
                                return (
                                    <TooltipProvider key={difficulty.name}>
                                        <Tooltip>
                                            <div className="w-full">
                                                <TooltipTrigger className="w-full">
                                                    <div
                                                        onClick={async () => {
                                                            if (!isLocked && !isSubmitting) {
                                                                await handleMissionSelect(difficulty.name);
                                                            }
                                                        }}
                                                        className={`w-full transform rounded-lg border-2 p-4 text-left transition-all ${
                                                            isLocked || isSubmitting
                                                                ? "cursor-not-allowed border-[#3A2618]/50 bg-[#1C1410]/50 opacity-50"
                                                                : "cursor-pointer border-[#3A2618] bg-[#1C1410] hover:bg-[#3A2618]/50"
                                                        }`}
                                                    >
                                                        {/* Existing difficulty option content */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <GiCrossedSwords
                                                                    className={`h-6 w-6 ${
                                                                        difficulty.name === "Easy"
                                                                            ? "text-green-500"
                                                                            : difficulty.name === "Medium"
                                                                            ? "text-yellow-500"
                                                                            : "text-red-500"
                                                                    }`}
                                                                />
                                                                <span className="text-lg font-bold text-[#C4A484]">{difficulty.name}</span>
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
                                            <TooltipContent side="right" className="z-[1500] w-64 rounded-lg border-2 border-[#3A2618] bg-[#1C1410]/95 p-4 shadow-xl">
                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="flex items-center justify-between text-sm text-[#C4A484]">
                                                            <span>Success Chance</span>
                                                            <span>{difficulty.successRate}%</span>
                                                        </div>
                                                        <ProgressBar value={difficulty.successRate} maxValue={100} color="bg-green-600" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center justify-between text-sm text-[#C4A484]">
                                                            <span>Death Risk</span>
                                                            <span>{difficulty.deathRate}%</span>
                                                        </div>
                                                        <ProgressBar value={difficulty.deathRate} maxValue={100} color="bg-red-600" />
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
                    </>
                );
            
            case 'ongoing':
                return (
                    <>
                        <h2 className="text-center font-serif text-2xl text-[#C4A484]">{mercenaryName} is on a Mission</h2>
                        <p className="text-center text-[#8B7355]">Your mercenary is currently away. Check their status to learn of their fate.</p>
                        <button
                            onClick={onCheckMission}
                            disabled={isLoading}
                            className="mx-auto mt-4 w-full transform rounded-lg border-2 border-[#3A2618] bg-gradient-to-b from-[#8B7355] to-[#3A2618] px-8 py-3 font-bold text-[#1C1410] transition-all hover:from-[#C4A484] hover:to-[#8B7355] active:scale-95"
                        >
                            {isLoading ? (
                                <Loader2Icon className="mx-auto animate-spin" />
                            ) : (
                                "Check Mission Status"
                            )}
                        </button>
                    </>
                );
            
            case 'success':
                return (
                    <>
                        <div className="relative h-48 w-full overflow-hidden rounded-xl border-2 border-[#3A2618]">
                            <Image
                                src="/curatedLaunches/citizens/mission-success.png"
                                layout="fill"
                                style={{ objectFit: 'cover' }}
                                alt="Mission Success"
                                className="opacity-80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1410] to-transparent" />
                        </div>
                        <h2 className="text-center font-serif text-2xl text-[#C4A484]">Mission Successful!</h2>
                        <p className="text-center text-[#8B7355]">
                            The mission was a success! {firstName} has earned {userData?.reward || 'their'} marks.
                        </p>
                    </>
                );
            
            case 'failure':
                return (
                    <>
                        <div className="relative h-48 w-full overflow-hidden rounded-xl border-2 border-[#3A2618]">
                            <Image
                                src="/curatedLaunches/citizens/mission-failure.png"
                                layout="fill"
                                style={{ objectFit: 'cover' }}
                                alt="Mission Failed"
                                className="opacity-80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1410] to-transparent" />
                        </div>
                        <h2 className="text-center font-serif text-2xl text-[#FF6B6B]">Mission Failed</h2>
                        <p className="text-center text-[#8B7355]">
                            {firstName} was set upon by bandits on the way back to Old Town and didnt survive.
                        </p>
                    </>
                );
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered motionPreset="none" size="2xl">
            <ModalOverlay className="backdrop-blur-sm" />
            <ModalContent className="bg-transparent">
                <ModalBody className="overflow-visible p-0">
                    <div className="relative flex flex-col gap-4 rounded-2xl border-2 border-[#3A2618] bg-[#1C1410]/95 p-8 shadow-2xl backdrop-blur-md">
                        {/* Header Image - only show for select state */}
                        {missionState === 'select' && (
                            <div className="relative h-48 w-full overflow-hidden rounded-xl border-2 border-[#3A2618]">
                                <Image
                                    src="/curatedLaunches/citizens/warroom.png"
                                    layout="fill"
                                    style={{ objectFit: 'cover' }}
                                    alt="Mission"
                                    className="opacity-80"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1410] to-transparent" />
                            </div>
                        )}

                        {/* Dynamic Content */}
                        {renderContent()}

                        {/* Close Button - show for success/failure states */}
                        {(missionState === 'success' || missionState === 'failure') && (
                            <button
                                onClick={onClose}
                                className="mx-auto mt-4 transform rounded-lg border-2 border-[#3A2618] bg-gradient-to-b from-[#8B7355] to-[#3A2618] px-8 py-2 font-bold text-[#1C1410] transition-all hover:from-[#C4A484] hover:to-[#8B7355] active:scale-95"
                            >
                                Close
                            </button>
                        )}

                        {/* Cancel Button - only show for select state */}
                        {missionState === 'select' && (
                            <button
                                onClick={onClose}
                                className="mx-auto transform rounded-lg border-2 border-[#3A2618] bg-gradient-to-b from-[#8B7355] to-[#3A2618] px-8 py-2 font-bold text-[#1C1410] transition-all hover:from-[#C4A484] hover:to-[#8B7355] active:scale-95"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

const ProgressBar = ({ value, maxValue, color }: { value: number; maxValue: number; color: string }) => (
    <div className="h-2 w-full rounded-full bg-[#3A2618]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(value / maxValue) * 100}%` }} />
    </div>
);

export default MissionModal;