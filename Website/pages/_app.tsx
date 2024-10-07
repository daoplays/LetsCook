import { ChakraProvider } from "@chakra-ui/react";
import { WalletProvider, ConnectionProvider } from "@solana/wallet-adapter-react";
import { type ConnectionConfig } from "@solana/web3.js";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { Config } from "../components/Solana/constants";
import { theme } from "../chakra";
import { useEffect, useMemo } from "react";
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
import { usePathname, useSearchParams } from "next/navigation";
import useResponsive from "../hooks/useResponsive";
import AppRootPage from "./_layout";
import "../styles/global.css";
import * as NProgress from "nprogress";

function MyApp({ Component, pageProps }) {
    const { sm } = useResponsive();
    const pathname = usePathname();

    const wallets = useMemo(() => [], []);

    const connectionConfig: ConnectionConfig = { wsEndpoint: Config.WSS_NODE, commitment: "confirmed" };

    const searchParams = useSearchParams();

    useEffect(() => {
        NProgress.done();
    }, [pathname, searchParams]);

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
                <ConnectionProvider endpoint={Config.RPC_NODE} config={connectionConfig}>
                    <WalletProvider wallets={wallets} autoConnect>
                        <WalletModalProvider>
                            <ContextProviders>
                                <AppRootPage>
                                    <Component {...pageProps} />
                                </AppRootPage>
                            </ContextProviders>
                        </WalletModalProvider>
                    </WalletProvider>
                </ConnectionProvider>
            </ChakraProvider>
        </NoSSR>
    );
}

export default MyApp;
