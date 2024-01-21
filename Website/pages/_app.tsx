import { ChakraProvider } from "@chakra-ui/react";
import { WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { theme } from "../chakra";
import { useMemo } from "react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import NoSSR from "../utils/NoSSR";
import ContextProviders from "./_contexts";
import { ToastContainer } from "react-toastify";
import NextTopLoader from "nextjs-toploader";
import "bootstrap/dist/css/bootstrap.css";
import "react-toastify/dist/ReactToastify.css";
import "../styles/fonts.css";
import "../styles/table.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Let's Cook",
    icons: "/favicon.ico",
    description:
        "Your go-to platform for launching Solana Tokens / Memecoins. Our fully-automated and permissionless platform provides the lowest cost and best user experience for both degens and meme creators.",
    openGraph: {
        title: "Let's Cook",
        type: "website",
        url: "https://letscook.wtf/",
        description:
            "Your go-to platform for launching Solana Tokens / Memecoins. Our fully-automated and permissionless platform provides the lowest cost and best user experience for both degens and meme creators.",
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
};

function MyApp({ Component, pageProps }) {
    const wallets = useMemo(() => [], []);

    return (
        <NoSSR>
            <ToastContainer
                position="bottom-right"
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                pauseOnFocusLoss={false}
                pauseOnHover={false}
                rtl={false}
                draggable
                theme="light"
            />
            <ChakraProvider theme={theme}>
                <NextTopLoader />
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        <ContextProviders>
                            <Navigation />
                            <div style={{ minHeight: "90vh" }}>
                                <Component {...pageProps} />
                            </div>
                            <Footer />
                        </ContextProviders>
                    </WalletModalProvider>
                </WalletProvider>
            </ChakraProvider>
        </NoSSR>
    );
}

export default MyApp;
