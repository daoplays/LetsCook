import { DefaultSeoProps } from "next-seo";

const config: DefaultSeoProps = {
    title: "Let's Cook",
    description:
        "Explore Let's Cook – your go-to platform for launching SPL Tokens / Memecoins. Our fully-automated and permissionless platform provides the lowest cost and best user experience for both degens and meme creators.",
    canonical: "https://letscook.wtf/",
    openGraph: {
        title: "Let's Cook",
        type: "website",
        url: "https://letscook.wtf/",
        description:
            "Explore Let's Cook – your go-to platform for launching SPL Tokens / Memecoins. Our fully-automated and permissionless platform provides the lowest cost and best user experience for both degens and meme creators.",
        siteName: "Let's Cook",
        images: [
            {
                url: "https://letscook.wtf/letscook-seo-image.png",
                width: 1500,
                height: 750,
                alt: "Let's Cook SEO Image",
            },
        ],
    },
    twitter: {
        handle: "@letscook_sol",
        site: "@letscook_sol",
        cardType: "summary_large_image",
    },
};

export default config;
