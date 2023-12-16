import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../chakra";

import { useMemo } from 'react';
import { WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";



import Footer from "../components/Footer"

import 'bootstrap/dist/css/bootstrap.css';
import '../styles/fonts.css';
import "../styles/table.css";

function MyApp({ Component, pageProps }) {
  //console.log({ theme });
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  return (
    <ChakraProvider theme={theme}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Component {...pageProps} />
          <Footer/>
          </WalletModalProvider>
            </WalletProvider>
    </ChakraProvider>
  );
}

export default MyApp;
