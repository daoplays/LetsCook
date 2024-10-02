import { HStack, Link, Text } from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";

import twitter from "../../public/socialIcons/new/XIcon.png";
import telegram from "../../public/socialIcons/new/telegramIcon.png";
import discord from "../../public/socialIcons/new/discordIcon.png";
import website from "../../public/socialIcons/new/websiteIcon.png";
import { Socials } from "../Solana/constants";
import { LaunchData } from "../Solana/state";
import addHttpsIfMissing from "../../utils/addHttpsIfMissing";

interface LinksProps {
    socials: string[] | null;
    isTradePage?: boolean;
}

const Links = ({ socials, isTradePage }: LinksProps) => {
    const { lg } = useResponsive();

    return (
        <HStack justify="center" gap={3} onClick={(e) => e.stopPropagation()}>
            {socials[Socials.Twitter] !== "" && (
                <Link href={socials !== null ? addHttpsIfMissing(socials[Socials.Twitter]) : "#"} target="_blank">
                    <Image src={twitter.src} alt="Twitter Icon" width={lg || isTradePage ? 30 : 35} height={lg || isTradePage ? 30 : 35} />
                </Link>
            )}
            {socials[Socials.Telegram] !== "" && (
                <Link href={socials !== null ? addHttpsIfMissing(socials[Socials.Telegram]) : "#"} target="_blank">
                    <Image
                        src={telegram.src}
                        alt="Telegram Icon"
                        width={lg || isTradePage ? 30 : 35}
                        height={lg || isTradePage ? 30 : 35}
                    />
                </Link>
            )}
            {socials[Socials.Discord] !== "" && (
                <Link href={socials !== null ? addHttpsIfMissing(socials[Socials.Discord]) : "#"} target="_blank">
                    <Image src={discord.src} alt="Discord Icon" width={lg || isTradePage ? 30 : 35} height={lg || isTradePage ? 30 : 35} />
                </Link>
            )}
            {socials[Socials.Website] !== "" && (
                <Link href={socials !== null ? addHttpsIfMissing(socials[Socials.Website]) : "#"} target="_blank">
                    <Image src={website.src} alt="Website Icon" width={lg || isTradePage ? 30 : 35} height={lg || isTradePage ? 30 : 35} />
                </Link>
            )}
        </HStack>
    );
};
export default Links;
