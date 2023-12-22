import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../chakra";

import { useMemo } from "react";
import {clusterApiUrl} from "@solana/web3.js";
import { WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import {  WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import "bootstrap/dist/css/bootstrap.css";
import "../styles/fonts.css";
import "../styles/table.css";

function MyApp({ Component, pageProps }) {
    //console.log({ theme });
    const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

    return (
        <ChakraProvider theme={theme}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>
                    <Component {...pageProps} />
                </WalletModalProvider>
            </WalletProvider>
        </ChakraProvider>
    );
}

export default MyApp;
