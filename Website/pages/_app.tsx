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
import "bootstrap/dist/css/bootstrap.css";
import "../styles/fonts.css";
import "../styles/table.css";
import { PagesProgressBar as ProgressBar } from "next-nprogress-bar";

function MyApp({ Component, pageProps }) {
    const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

    return (
        <NoSSR>
            <ChakraProvider theme={theme}>
                <ProgressBar options={{ showSpinner: false }} height="3px" />
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
