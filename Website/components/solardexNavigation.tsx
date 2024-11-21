import { HStack, Show, Text } from "@chakra-ui/react";
import { ConnectWalletButton, DisconnectWalletButton } from "./Solana/wallet";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/router";
import { BsDiscord, BsTwitter } from "react-icons/bs";
import useResponsive from "../hooks/useResponsive";
import Link from "next/link";
import Image from "next/image";

function Navigation() {
    const router = useRouter();
    const wallet = useWallet();
    const { md } = useResponsive();

    return (
        <>
            <HStack
                backgroundSize="cover"
                py={3}
                px={4}
                alignItems="center"
                justify="space-between"
                position="fixed"
                top={0}
                left={0}
                right={0}
                zIndex={1000}
                className="relative flex w-full items-center border-b border-b-gray-600/25 bg-slate-950/25 bg-opacity-75 bg-clip-padding backdrop-blur-md backdrop-filter"
            >
                <div className="flex cursor-pointer items-center gap-2" onClick={() => router.push("/")}>
                    <Image
                        src={"https://delta-edge.ardata.tech/gw/bafybeidcffdgzthcbtukav7tv3haqf7y7lwbrtmtlbgdttizrz5vkb2vnm"}
                        alt="Solar Dex Logo"
                        width={35}
                        height={35}
                    />
                    <Text fontSize={md ? "medium" : "x-large"} className="font-bold" color="white">
                        Solar Dex
                    </Text>
                </div>

                <HStack gap={3}>
                    <Show breakpoint="(min-width: 1024px)">
                        <HStack>
                            <Link href="https://x.com/solar_dex" target="_blank">
                                <BsTwitter size={28} color="white" />
                            </Link>
                        </HStack>
                    </Show>

                    <Show breakpoint="(min-width: 1024px)">
                        <>
                            {wallet.publicKey && <DisconnectWalletButton />}
                            {wallet.publicKey === null && <ConnectWalletButton />}
                        </>
                    </Show>
                </HStack>
            </HStack>
        </>
    );
}

export default Navigation;
