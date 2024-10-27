import { useRouter } from "next/router";
import useResponsive from "../../hooks/useResponsive";
import Head from "next/head";
import CollectionInfo from "../../components/collection/info";
import NFTData from "../../components/collection/nftData";
import { useState } from "react";
import HybridInfo from "../../components/collection/hybridInfo";
import CollectionPage from "../../components/collection/collectionPage";

const CollectionLaunch = () => {
    const router = useRouter();
    const { lg } = useResponsive();
    const [screen, setScreen] = useState("step 1");

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Collection</title>
            </Head>
            <main
                style={{
                    height: "100%",
                    paddingTop: lg ? "25px" : "50px",
                }}
            >
                {screen === "step 1" && <CollectionInfo setScreen={setScreen} />}
                {screen === "step 2" && <NFTData setScreen={setScreen} />}
                {screen === "step 3" && <HybridInfo setScreen={setScreen} />}
                {screen === "step 4" && <CollectionPage setScreen={setScreen} />}
            </main>
        </>
    );
};

export default CollectionLaunch;
