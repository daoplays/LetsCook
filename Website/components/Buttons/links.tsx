import { HStack, Link } from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";
import Image from "next/image";

import twitter from "../../public/socialIcons/twitter.svg";
import telegram from "../../public/socialIcons/telegram.svg";
import discord from "../../public/socialIcons/discord.svg";
import website from "../../public/socialIcons/website.svg";
import { Socials } from "../Solana/constants";
import { LaunchData } from "../Solana/state";

interface LinksProps {
    featuredLaunch: LaunchData;
}

const Links = ({ featuredLaunch }: LinksProps) => {
    const { lg } = useResponsive();

    return (
        <HStack justify="center" gap={3} onClick={(e) => e.stopPropagation()}>
            {featuredLaunch.socials[Socials.Twitter] !== "" && (
                <Link href={featuredLaunch !== null ? featuredLaunch.socials[Socials.Twitter] : "#"} target="_blank">
                    <Image src={twitter.src} alt="Twitter Icon" width={lg ? 30 : 40} height={lg ? 30 : 40} />
                </Link>
            )}
            {featuredLaunch.socials[Socials.Telegram] !== "" && (
                <Link href={featuredLaunch !== null ? featuredLaunch.socials[Socials.Telegram] : "#"} target="_blank">
                    <Image src={telegram.src} alt="Telegram Icon" width={lg ? 30 : 40} height={lg ? 30 : 40} />
                </Link>
            )}
            {featuredLaunch.socials[Socials.Discord] !== "" && (
                <Link href={featuredLaunch !== null ? featuredLaunch.socials[Socials.Discord] : "#"} target="_blank">
                    <Image src={discord.src} alt="Discord Icon" width={lg ? 30 : 40} height={lg ? 30 : 40} />
                </Link>
            )}
            {featuredLaunch.socials[Socials.Website] !== "" && (
                <Link href={featuredLaunch !== null ? featuredLaunch.socials[Socials.Website] : "#"} target="_blank">
                    <Image src={website.src} alt="Website Icon" width={lg ? 30 : 40} height={lg ? 30 : 40} />
                </Link>
            )}
        </HStack>
    );
};
export default Links;
