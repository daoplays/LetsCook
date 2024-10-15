import { useState } from "react";
import { useRouter } from "next/router";
import useResponsive from "../hooks/useResponsive";
import Head from "next/head";
import CreateListing from "../components/listing/launch";

const Listing = () => {
    const router = useRouter();
    const { lg } = useResponsive();
    const [simpleLaunch, setSimpleLaunch] = useState(true);

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Listing</title>
            </Head>
            <main
                style={{
                    background: "linear-gradient(180deg, #292929 20%, #0B0B0B 100%)",
                    height: simpleLaunch && "100%",
                    paddingTop: lg ? "25px" : "50px",
                    position: "relative",
                }}
            >
                <CreateListing />
            </main>
        </>
    );
};

export default Listing;
