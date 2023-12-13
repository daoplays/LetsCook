import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "../chakra";
import Footer from "../components/Footer"
import Navigation from "../components/Navigation";

import 'bootstrap/dist/css/bootstrap.css';
import '../styles/fonts.css';

function MyApp({ Component, pageProps }) {
  //console.log({ theme });

  return (
    <ChakraProvider theme={theme}>
      <Navigation />
      <Component {...pageProps} />
      <Footer/>
    </ChakraProvider>
  );
}

export default MyApp;
