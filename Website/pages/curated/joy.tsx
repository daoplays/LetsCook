import { useState } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { IoSwapVertical } from "react-icons/io5";
import { FaWallet } from "react-icons/fa";
import { useWallet } from "@solana/wallet-adapter-react";
import { Montserrat } from "next/font/google";
import { MdOutlineContentCopy } from "react-icons/md";
import trimAddress from "@/utils/trimAddress";
import UseWalletConnection from "@/hooks/useWallet";
import Image from "next/image";
import Link from "next/link";

const montserrat = Montserrat({
    weight: ["500", "600", "700", "800", "900"],
    subsets: ["latin"],
    display: "swap",
    fallback: ["Arial", "sans-serif"],
    variable: "--font-montserrat",
});

const Joy = () => {
    const wallet = useWallet();
    const { handleConnectWallet } = UseWalletConnection();

    const [isHomePage, setIsHomePage] = useState(true);
    const [isTokenToNFT, setIsTokenToNFT] = useState(true);

    return (
        <main
            className={`relative flex h-full w-full items-center justify-center text-white ${montserrat.className}`}
            style={{ background: "linear-gradient(180deg, #5DBBFF 0%, #0076CC 100%)" }}
        >
            {/* Header */}
            <div className="mt-15 absolute top-0 flex min-h-20 w-full items-center bg-[#00357A] xl:h-24">
                <p className="font-face-wc left-0 right-0 mx-auto mt-2 text-wrap text-center text-[1.75rem] text-white sm:text-3xl xl:text-6xl">
                    THE <span className="text-[#FFDD56]">JOY</span> TRANSMOGIFIER
                </p>
            </div>

            {isHomePage ? (
                <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                    <Image src={"/curatedLaunches/joy/bot.png"} width={750} height={750} alt="JOY BOT" />

                    <p
                        className="font-face-wc absolute cursor-pointer text-3xl text-white transition-all hover:text-[4rem] md:text-6xl"
                        style={{
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, 25%)",
                        }}
                        onClick={() => setIsHomePage(false)}
                    >
                        Start
                    </p>
                </div>
            ) : (
                <div className="mt-20 flex items-center justify-center gap-16 rounded-2xl bg-clip-padding md:p-8 xl:bg-[#00357A]/75 xl:px-16 xl:shadow-2xl xl:backdrop-blur-sm xl:backdrop-filter">
                    <div className="hidden flex-col items-center justify-center gap-2 xl:flex">
                        <p className="font-face-wc text-6xl">$JOY</p>
                        <Image
                            src={"https://snipboard.io/qUpIyG.jpg"}
                            width={225}
                            height={225}
                            alt="$JOY Icon"
                            className="rounded-full shadow-xl"
                        />

                        <p className="text-lg">Token Address: {trimAddress("73wCbc97KsKyuaVYhVkbVxbaxQTpVVcgUZ41WcpbZh6R")}</p>
                        <div className="flex gap-2">
                            <TooltipProvider>
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger>
                                        <div
                                            style={{ cursor: "pointer" }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navigator.clipboard.writeText("73wCbc97KsKyuaVYhVkbVxbaxQTpVVcgUZ41WcpbZh6R");
                                            }}
                                        >
                                            <MdOutlineContentCopy color="white" size={22} />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        <p>Copy Token Address</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger>
                                        <Link
                                            href={"https://eclipsescan.xyz/token/73wCbc97KsKyuaVYhVkbVxbaxQTpVVcgUZ41WcpbZh6R"}
                                            target="_blank"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Image
                                                src={"/curatedLaunches/joy/eclipsescan.jpg"}
                                                width={25}
                                                height={25}
                                                alt="Solscan icon"
                                                className="rounded-full"
                                            />
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        <p>Eclipse Scan</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger>
                                        <Link
                                            href={"https://www.validators.wtf/rugcheck?mint=73wCbc97KsKyuaVYhVkbVxbaxQTpVVcgUZ41WcpbZh6R"}
                                            target="_blank"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Image
                                                src={"/curatedLaunches/joy/validators.jpg"}
                                                width={25}
                                                height={25}
                                                alt="Validators icon"
                                                className="rounded-full"
                                            />
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        <p>Validators Rug Check</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                    <div className="w-full rounded-2xl border border-t-[3px] border-t-[#FFDD56] bg-[#00357A]/75 p-4 text-white shadow-2xl md:w-[400px] xl:bg-transparent">
                        <div className="mx-auto mb-3 flex w-fit flex-col items-center gap-1">
                            <p className="font-face-wc mx-auto w-fit text-3xl">Transmogify</p>

                            <div className="text-md flex items-center gap-1">
                                {isTokenToNFT ? <p>100,000 $JOY = 1 NFT </p> : <p>1 NFT = 98,000 $JOY </p>}
                                {isTokenToNFT && (
                                    <TooltipProvider>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger>
                                                <Info size={18} />
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom">
                                                <p>2% Swap-Back Fee Paid to Community Wallet</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        </div>

                        <div className={`flex ${isTokenToNFT ? "flex-col" : "flex-col-reverse"}`}>
                            {/* From Token Input */}
                            <div className={`${isTokenToNFT ? "" : "-mt-6 mb-3"}`}>
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="text-sm">{isTokenToNFT ? `You're Swapping` : "To Receive"}</div>

                                    <div className="flex items-center gap-1 opacity-75">
                                        <FaWallet size={12} />
                                        <p className="text-sm">120,000</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 rounded-xl bg-gray-800 p-3">
                                    <div className="flex flex-col gap-2">
                                        <button className="flex items-center gap-2 rounded-lg bg-gray-700 px-2.5 py-1.5">
                                            <div className="w-6">
                                                <Image
                                                    src={"https://snipboard.io/qUpIyG.jpg"}
                                                    width={25}
                                                    height={25}
                                                    alt="$JOY Icon"
                                                    className="rounded-full"
                                                />
                                            </div>
                                            <span>JOY</span>
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full bg-transparent text-right text-xl focus:outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Swap Icon */}
                            <div className="flex justify-center">
                                <button
                                    onClick={() => setIsTokenToNFT(!isTokenToNFT)}
                                    className="z-50 mx-auto my-2 cursor-pointer rounded-lg bg-gray-800 p-2 hover:bg-gray-700"
                                >
                                    <IoSwapVertical size={18} className="opacity-75" />
                                </button>
                            </div>

                            {/* To Token Input */}
                            <div className={`${!isTokenToNFT ? "" : "-mt-6 mb-3"}`}>
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="text-sm">{!isTokenToNFT ? `You're Swapping` : "To Receive"}</div>

                                    <div className="flex items-center gap-1 opacity-75">
                                        <FaWallet size={12} />
                                        <p className="text-sm">0</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 rounded-xl bg-gray-800 p-3">
                                    <button className="flex items-center gap-2 rounded-lg bg-gray-700 px-2.5 py-1.5">
                                        <div className="w-6">
                                            <Image
                                                src={"https://snipboard.io/L8X0Ao.jpg"}
                                                width={25}
                                                height={25}
                                                alt="BOY Icon"
                                                className="rounded-full"
                                            />
                                        </div>
                                        <span>BOYS</span>
                                    </button>
                                    <input
                                        type="text"
                                        className="w-full bg-transparent text-right text-xl focus:outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            className="w-full rounded-xl bg-[#FFE376] py-3 text-lg font-semibold text-[#BA6502] hover:bg-opacity-90"
                            onClick={() => {
                                if (!wallet.connected) {
                                    handleConnectWallet();
                                } else {
                                    // Swap Function
                                }
                            }}
                        >
                            {!wallet.connected ? "Connect Wallet" : "Swap"}
                        </button>

                        <div className="mt-4 flex flex-col gap-2 text-sm">
                            <div className="flex justify-between opacity-75">
                                <span>NFTs Available</span>
                                <span>1,983</span>
                            </div>

                            <div className="flex justify-between opacity-75">
                                <span>NFTs in Circulation</span>
                                <span>17</span>
                            </div>
                            <div className="flex justify-between opacity-75">
                                <span>Total NFT Supply</span>
                                <span>2,000</span>
                            </div>
                        </div>
                    </div>
                    <div className="hidden flex-col items-center justify-center gap-2 xl:flex">
                        <p className="font-face-wc text-6xl">BOYS</p>
                        <Image
                            src={"https://snipboard.io/HjUFgd.jpg"}
                            width={250}
                            height={250}
                            alt="BOY Icon"
                            className="rounded-full shadow-xl"
                        />
                        <p className="text-lg">Collection Address: {trimAddress("73wCbc97KsKyuaVYhVkbVxbaxQTpVVcgUZ41WcpbZh6R")}</p>
                        <div className="flex gap-2">
                            <TooltipProvider>
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger>
                                        <div
                                            style={{ cursor: "pointer" }}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navigator.clipboard.writeText("73wCbc97KsKyuaVYhVkbVxbaxQTpVVcgUZ41WcpbZh6R");
                                            }}
                                        >
                                            <MdOutlineContentCopy color="white" size={22} />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        <p>Copy Collection Address</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger>
                                        <Link
                                            href={"https://eclipsescan.xyz/token/73wCbc97KsKyuaVYhVkbVxbaxQTpVVcgUZ41WcpbZh6R"}
                                            target="_blank"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Image
                                                src={"/curatedLaunches/joy/eclipsescan.jpg"}
                                                width={25}
                                                height={25}
                                                alt="Solscan icon"
                                                className="rounded-full"
                                            />
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        <p>Eclipse Scan</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Joy;
