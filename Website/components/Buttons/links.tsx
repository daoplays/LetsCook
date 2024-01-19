import { HStack, Link, Text } from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";

import twitter from "../../public/socialIcons/new/XIcon.png";
import telegram from "../../public/socialIcons/new/telegramIcon.png";
import discord from "../../public/socialIcons/new/discordIcon.png";
import website from "../../public/socialIcons/new/websiteIcon.png";
import { Socials } from "../Solana/constants";
import { LaunchData } from "../Solana/state";

interface LinksProps {
    featuredLaunch: LaunchData;
}

const Links = ({ featuredLaunch }: LinksProps) => {
    const { lg } = useResponsive();

    function addHttpsIfMissing(url) {
        if (url.startsWith("http://") || url.startsWith("https://")) {
            return url;
        } else {
            return `https://${url}`;
        }
    }

    return (
        <HStack justify="center" gap={3} onClick={(e) => e.stopPropagation()}>
            {featuredLaunch.socials[Socials.Twitter] !== "" && (
                <Link href={featuredLaunch !== null ? addHttpsIfMissing(featuredLaunch.socials[Socials.Twitter]) : "#"} target="_blank">
                    <Image src={twitter.src} alt="Twitter Icon" width={lg ? 30 : 40} height={lg ? 30 : 40} />
                </Link>
            )}
            {featuredLaunch.socials[Socials.Telegram] !== "" && (
                <Link href={featuredLaunch !== null ? addHttpsIfMissing(featuredLaunch.socials[Socials.Telegram]) : "#"} target="_blank">
                    <Image src={telegram.src} alt="Telegram Icon" width={lg ? 30 : 40} height={lg ? 30 : 40} />
                </Link>
            )}
            {featuredLaunch.socials[Socials.Discord] !== "" && (
                <Link href={featuredLaunch !== null ? addHttpsIfMissing(featuredLaunch.socials[Socials.Discord]) : "#"} target="_blank">
                    <Image src={discord.src} alt="Discord Icon" width={lg ? 30 : 40} height={lg ? 30 : 40} />
                </Link>
            )}
            {featuredLaunch.socials[Socials.Website] !== "" && (
                <Link href={featuredLaunch !== null ? addHttpsIfMissing(featuredLaunch.socials[Socials.Website]) : "#"} target="_blank">
                    <Image src={website.src} alt="Website Icon" width={lg ? 30 : 40} height={lg ? 30 : 40} />
                </Link>
            )}
        </HStack>
    );
};
export default Links;
