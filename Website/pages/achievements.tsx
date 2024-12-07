import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Text } from "@chakra-ui/react";
import useResponsive from "@/hooks/useResponsive";

export interface IAchievement {
    id: number;
    title: string;
    description: string;
    badgeImage: string;
    sauce: number;
    tutorialVideoUrl?: string;
    completed: boolean;
}

export const ACHIEVEMENTS: IAchievement[] = [
    {
        id: 1,
        title: "Set a Username",
        description: "Set your unique username in the leaderboard",
        badgeImage: "/images/badge.png",
        sauce: 100,
        tutorialVideoUrl: "https://example.com/username-tutorial.mp4",
        completed: true,
    },
    {
        id: 2,
        title: "Hype Voting",
        description: "Submit your vote for token or collection launches",
        badgeImage: "/images/badge.png",
        sauce: 100,
        tutorialVideoUrl: "https://example.com/transaction-tutorial.mp4",
        completed: false,
    },
    {
        id: 1,
        title: "Set a Username",
        description: "Set your unique username in the leaderboard",
        badgeImage: "/images/badge.png",
        sauce: 100,
        tutorialVideoUrl: "https://example.com/username-tutorial.mp4",
        completed: true,
    },
    {
        id: 2,
        title: "Hype Voting",
        description: "Submit your vote for token or collection launches",
        badgeImage: "/images/badge.png",
        sauce: 100,
        tutorialVideoUrl: "https://example.com/transaction-tutorial.mp4",
        completed: false,
    },
    {
        id: 1,
        title: "Set a Username",
        description: "Set your unique username in the leaderboard",
        badgeImage: "/images/badge.png",
        sauce: 100,
        tutorialVideoUrl: "https://example.com/username-tutorial.mp4",
        completed: true,
    },
    {
        id: 2,
        title: "Hype Voting",
        description: "Submit your vote for token or collection launches",
        badgeImage: "/images/badge.png",
        sauce: 100,
        tutorialVideoUrl: "https://example.com/transaction-tutorial.mp4",
        completed: false,
    },
];

const TutorialDialog: React.FC<{ videoUrl?: string }> = ({ videoUrl }) => {
    if (!videoUrl) return null;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="-mt-1 ml-2">
                    <Video className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Achievement Tutorial</DialogTitle>
                </DialogHeader>
                <div className="aspect-video">
                    <video controls className="h-full w-full" src={videoUrl}>
                        Your browser does not support the video tag.
                    </video>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Main Achievements Screen
export const AchievementsScreen = () => {
    const { sm } = useResponsive();

    return (
        <main className="px-4 md:p-8">
            <div className="mb-4 flex flex-col gap-4 lg:gap-0" style={{ marginTop: sm ? 16 : 0 }}>
                <Text className="block text-center text-3xl font-semibold text-white lg:text-4xl" align={"center"}>
                    Quest Board
                </Text>
            </div>

            <div className="mx-auto w-full xl:w-[1200px]">
                {ACHIEVEMENTS.map((achievement, i) => (
                    <Card
                        key={i}
                        className={`mb-3 flex bg-[#161616] bg-opacity-75 bg-clip-padding ${sm ? "py-4" : "py-0"} shadow-2xl backdrop-blur-sm backdrop-filter transition-all duration-300 md:border-l-[3px] md:border-orange-700`}
                    >
                        <div className="p-4">
                            <img
                                src={achievement.badgeImage}
                                alt={achievement.title}
                                className={`h-20 w-20 rounded-lg object-cover md:h-24 md:w-24`}
                            />
                        </div>

                        <CardContent className={`my-auto h-fit flex-1 ${sm ? "flex-col" : "flex"} mr-4 items-center justify-between p-0`}>
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-1">
                                    <h3 className="text-xl font-semibold text-white md:text-2xl">{achievement.title}</h3>
                                    <TutorialDialog videoUrl={achievement.tutorialVideoUrl} />
                                </div>
                                <p className="text-muted-foreground text-white md:text-lg">{achievement.description}</p>
                            </div>

                            {achievement.completed ? (
                                <div className="mr-6 mt-2 flex items-center gap-2 md:mt-0">
                                    <Check size={sm ? 32 : 40} color="#90EE90" />
                                    <p className="-mt-1 text-xl text-white md:text-2xl">Completed</p>
                                </div>
                            ) : (
                                <div className="mr-6 mt-2 flex items-center gap-2 md:mt-0">
                                    <img
                                        src="/images/sauce.png"
                                        alt="Sauce"
                                        className={`h-6 w-6 rounded-lg object-cover md:h-12 md:w-12`}
                                    />
                                    <p className="text-lg text-white md:text-2xl"> {achievement.sauce}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </main>
    );
};

export default AchievementsScreen;