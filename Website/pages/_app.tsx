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
import Head from "next/head";

function MyApp({ Component, pageProps }) {
    const wallets = useMemo(() => [], []);

    return (
        <>
            <Head>
                <title>Let&apos;s Cook</title>
            </Head>
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
        </>
    );
}

export default MyApp;
