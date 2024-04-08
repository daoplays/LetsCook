import Document, { Head, Html, Main, NextScript } from "next/document";

export default class _Document extends Document {
    render() {
        return (
            <Html lang="en">
                <Head>
                    <link rel="icon" href="/favicon.ico" />

                    <meta name="referrer" content="no-referrer" />
                    <meta
                        name="description"
                        content="Your go-to platform for launching Memecoins. Our fully-automated and permissionless platform provides the lowest cost and best user experience for both degens and meme creators."
                    />

                    <meta property="og:url" content="https://letscook.wtf/" />
                    <meta property="og:type" content="website" />
                    <meta property="og:title" content="Your go-to platform for launching Memecoins." />
                    <meta
                        property="og:description"
                        content="Our fully-automated and permissionless platform provides the lowest cost and best user experience for both degens and meme creators."
                    />
                    <meta property="og:image" content="https://letscook.wtf/letscook-seo-image.png" />

                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:site" content="@letscook_sol" />
                    <meta name="twitter:creator" content="@letscook_sol" />
                    <meta name="twitter:title" content="Your go-to platform for launching Memecoins." />
                    <meta
                        name="twitter:description"
                        content="Our fully-automated and permissionless platform provides the lowest cost and best user experience for both degens and meme creators."
                    />
                    <meta name="twitter:image" content="https://letscook.wtf/letscook-seo-image.png" />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}
