import { Rocket, Gift, Shield } from "lucide-react";
import { Button } from "@chakra-ui/react";
import Image from "next/image";
import React from "react";
import Link from "next/link";

const AppRootPage = () => {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
            <main className="mx-auto mt-8 grid max-w-6xl md:grid-cols-2">
                <div className="relative mx-auto flex max-w-md flex-col items-center justify-center gap-3 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-4">
                    <div className="aspect-square w-full">
                        <Image src={"/images/solardex-badge.jpeg"} alt="Solar Dex Badge" width={400} height={400} className="rounded-xl" />
                    </div>

                    <div className="flex">
                        <h3 className="font-semibold">Total Minted: 0</h3>
                    </div>
                </div>

                <div className="flex w-[87.5%] flex-col justify-center space-y-6">
                    <div>
                        <div className="mb-3 flex items-center gap-3">
                            <h1 className="text-4xl font-bold">Solar Dex Badge NFT</h1>
                        </div>
                        <p className="text-gray-300">
                            Secure your position in the Solar Dex ecosystem by minting the exclusive Genesis Badge NFT.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                            <Shield className="mt-1 text-yellow-500" size={20} />
                            <div>
                                <h3 className="font-semibold">Early Adopter Status</h3>
                                <p className="text-gray-400">
                                    Your badge serves as proof of being among the first supporters of Solar Dex.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <Gift className="mt-1 text-yellow-500" size={20} />
                            <div>
                                <h3 className="font-semibold">Guaranteed Token Airdrop</h3>
                                <p className="text-gray-400">Badge holders will receive an exclusive airdrop of Solar Dex tokens at TGE.</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3">
                            <Rocket className="mt-1 text-yellow-500" size={20} />
                            <div>
                                <h3 className="font-semibold">Future Utility</h3>
                                <p className="text-gray-400">Hold your badge for potential future benefits and governance participation</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full">
                        <Button h={12} className="w-full">
                            Mint Badge ($1)
                        </Button>
                        <div className="mx-auto mt-2 w-fit text-sm text-gray-400">Unlimited supply • No maximum mint per wallet</div>
                    </div>
                </div>
            </main>

            <footer className="absolute bottom-4 right-4 mx-auto w-fit">
                <p className="mx-auto -mb-[6px] w-fit text-sm text-gray-400">Powered By</p>
                <Link href={"https://eclipse.letscook.wtf"} target="_blank">
                    <Image
                        src={"https://delta-edge.ardata.tech/gw/bafybeick5fyyhnnudr3h3fdud7icaq6pap4uxyfsfii2mw2mknn6cgabde"}
                        alt="Let's Cook"
                        width={120}
                        height={100}
                    />
                </Link>
            </footer>
        </div>
    );
};

export default AppRootPage;
