import Image from "next/image";
import Link from "next/link";
import useResponsive from "../../hooks/useResponsive";
import twitter from "../../public/socialIcons/new/XIcon.png";
import telegram from "../../public/socialIcons/new/telegramIcon.png";
import discord from "../../public/socialIcons/new/discordIcon.png";
import website from "../../public/socialIcons/new/websiteIcon.png";
import { Socials } from "../Solana/constants";
import addHttpsIfMissing from "../../utils/addHttpsIfMissing";

interface LinksProps {
    socials: string[] | null;
    isTradePage?: boolean;
}

const Links = ({ socials, isTradePage }: LinksProps) => {
    const { lg } = useResponsive();
    const iconSize = lg || isTradePage ? 24 : 28;

    if (!socials || Object.values(Socials).every((key) => !socials[key])) {
        return <p className="text-md text-white opacity-25">No Socials</p>;
    }

    return (
        <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
            {socials[Socials.Twitter] && (
                <Link target="_blank" href={socials ? addHttpsIfMissing(socials[Socials.Twitter]) : "#"} passHref>
                    <Image src={twitter.src} alt="Twitter Icon" width={iconSize} height={iconSize} />
                </Link>
            )}
            {socials[Socials.Telegram] && (
                <Link target="_blank" href={socials ? addHttpsIfMissing(socials[Socials.Telegram]) : "#"} passHref>
                    <Image src={telegram.src} alt="Telegram Icon" width={iconSize} height={iconSize} />
                </Link>
            )}
            {socials[Socials.Discord] && (
                <Link target="_blank" href={socials ? addHttpsIfMissing(socials[Socials.Discord]) : "#"} passHref>
                    <Image src={discord.src} alt="Discord Icon" width={iconSize} height={iconSize} />
                </Link>
            )}
            {socials[Socials.Website] && (
                <Link target="_blank" href={socials ? addHttpsIfMissing(socials[Socials.Website]) : "#"} passHref>
                    <Image src={website.src} alt="Website Icon" width={iconSize} height={iconSize} />
                </Link>
            )}
        </div>
    );
};

export default Links;
