import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Text } from "@chakra-ui/react";
import useResponsive from "@/hooks/useResponsive";
import useCurrentUserData from "@/hooks/data/useCurrentUserData";
import { useWallet } from "@solana/wallet-adapter-react";

export interface IAchievement {
    id: number;
    title: string;
    description: string;
    badgeImage: string;
    tutorialVideoUrl?: string;
}

export const ACHIEVEMENTS: IAchievement[] = [
    {
        id: 1,
        title: "Set a Username",
        description: "Set your unique username in the leaderboard",
        badgeImage: "/images/achievements/username.png",
        tutorialVideoUrl: "https://youtu.be/-vQLlnu7W6U",
    },
    {
        id: 2,
        title: "Hype Voting x1",
        description: "Submit your vote for token or collection launches",
        badgeImage: "/images/achievements/hype_1.png",
        tutorialVideoUrl: "https://youtu.be/GLlJyPepT00",
    },
    {
        id: 3,
        title: "Hype Voting x25",
        description: "Submit 25 votes for token or collection launches",
        badgeImage: "/images/achievements/hype_25.png",
        tutorialVideoUrl: "https://youtu.be/GLlJyPepT00",
    },
    {
        id: 4,
        title: "Hype Voting x50",
        description: "Submit 50 votes for token or collection launches",
        badgeImage: "/images/achievements/hype_50.png",
        tutorialVideoUrl: "https://youtu.be/GLlJyPepT00",
    },
    {
        id: 5,
        title: "Hype Voting x100",
        description: "Submit 100 votes for token or collection launches",
        badgeImage: "/images/achievements/hype_100.png",
        tutorialVideoUrl: "https://youtu.be/GLlJyPepT00",
    },
    {
        id: 6,
        title: "NFT Mint x1",
        description: "Mint an NFT from a collection on Let's Cook",
        badgeImage: "/images/achievements/wrap_1.png",
        tutorialVideoUrl: "https://youtu.be/QpEhv8TsKMA",
    },
    {
        id: 7,
        title: "NFT Mint x25",
        description: "Mint 25 NFTs from collections on Let's Cook",
        badgeImage: "/images/achievements/wrap_25.png",
        tutorialVideoUrl: "https://youtu.be/QpEhv8TsKMA",
    },
    {
        id: 8,
        title: "NFT Mint x50",
        description: "Mint 50 NFTs from collections on Let's Cook",
        badgeImage: "/images/achievements/wrap_50.png",
        tutorialVideoUrl: "https://youtu.be/QpEhv8TsKMA",
    },
    {
        id: 9,
        title: "NFT Mint x100",
        description: "Mint 100 NFTs from collections on Let's Cook",
        badgeImage: "/images/achievements/wrap_100.png",
        tutorialVideoUrl: "https://youtu.be/QpEhv8TsKMA",
    },
    {
        id: 10,
        title: "NFT Unwrap x1",
        description: "Unwrap an NFT from a hybrid collection on Let's Cook",
        badgeImage: "/images/achievements/unwrap_1.png",
        tutorialVideoUrl: "https://youtu.be/2JaXezDGmCM",
    },
    {
        id: 11,
        title: "NFT Unwrap x25",
        description: "Unwrap 25 NFTs from hybrid collections on Let's Cook",
        badgeImage: "/images/achievements/unwrap_25.png",
        tutorialVideoUrl: "https://youtu.be/2JaXezDGmCM",
    },
    {
        id: 12,
        title: "NFT Unwrap x50",
        description: "Unwrap 50 NFTs from hybrid collections on Let's Cook",
        badgeImage: "/images/achievements/unwrap_50.png",
        tutorialVideoUrl: "https://youtu.be/2JaXezDGmCM",
    },
    {
        id: 13,
        title: "NFT Unwrap x100",
        description: "Unwrap 100 NFTs from hybrid collections on Let's Cook",
        badgeImage: "/images/achievements/unwrap_100.png",
        tutorialVideoUrl: "https://youtu.be/2JaXezDGmCM",
    },
    {
        id: 14,
        title: "100 Sauce",
        description: "Earn 100 sauce on Let's Cook",
        badgeImage: "/images/achievements/sauce_100.png",
        tutorialVideoUrl: "https://www.youtube.com/watch?v=vqvECbcI_3A",
    },
    {
        id: 15,
        title: "500 Sauce",
        description: "Earn 500 sauce on Let's Cook",
        badgeImage: "/images/achievements/sauce_500.png",
        tutorialVideoUrl: "https://www.youtube.com/watch?v=vqvECbcI_3A",
    },
    {
        id: 16,
        title: "1000 Sauce",
        description: "Earn 1000 sauce on Let's Cook",
        badgeImage: "/images/achievements/sauce_1000.png",
        tutorialVideoUrl: "https://www.youtube.com/watch?v=vqvECbcI_3A",
    },
    {
        id: 17,
        title: "10000 Sauce",
        description: "Earn 10000 sauce on Let's Cook",
        badgeImage: "/images/achievements/sauce_10k.png",
        tutorialVideoUrl: "https://www.youtube.com/watch?v=vqvECbcI_3A",
    },
];

const TutorialDialog: React.FC<{ videoUrl?: string }> = ({ videoUrl }) => {
    if (!videoUrl) return null;

    return (
        <Dialog>
            <DialogTrigger asChild>
                {/* <Button variant="outline" size="icon" className="-mt-1 ml-2">
                    <Video className="h-4 w-4" />
                </Button> */}

                <Button className="py-6 text-lg">Watch Guide</Button>
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
    const wallet = useWallet();
    const { userData, achievements } = useCurrentUserData({ user: wallet?.publicKey });

    return (
        <main className="px-4 md:p-8">
            <div className="mb-4 flex flex-col gap-4 lg:gap-0" style={{ marginTop: sm ? 16 : 0 }}>
                <Text className="block text-center text-3xl font-semibold text-white lg:text-4xl" align={"center"}>
                    Achievements
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
                                    {/* <TutorialDialog videoUrl={achievement.tutorialVideoUrl} /> */}
                                </div>
                                <p className="text-muted-foreground text-white md:text-lg">{achievement.description}</p>
                            </div>

                            {achievements[i] ? (
                                <div className="mr-6 mt-2 flex items-center gap-2 md:mt-0">
                                    <Check size={sm ? 32 : 40} color="#90EE90" />
                                    <p className="-mt-1 text-xl text-white md:text-2xl">Completed</p>
                                </div>
                            ) : (
                                // <div className="mr-6 mt-2 flex items-center gap-2 md:mt-0">
                                //     <img
                                //         src="/images/sauce.png"
                                //         alt="Sauce"
                                //         className={`h-6 w-6 rounded-lg object-cover md:h-12 md:w-12`}
                                //     />
                                //     <p className="text-lg text-white md:text-2xl"> {achievement.sauce}</p>
                                // </div>
                                <div className="mr-6 mt-2 flex items-center gap-2 md:mt-0">
                                    <TutorialDialog videoUrl={achievement.tutorialVideoUrl} />
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
