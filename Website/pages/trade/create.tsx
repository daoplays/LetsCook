import useResponsive from "../../hooks/useResponsive";
import Head from "next/head";
import LaunchAMM from "../../components/amm/launch";

const CreateAMM = () => {
    const { lg } = useResponsive();

    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Token</title>
            </Head>
            <main
                style={{
                    background: "linear-gradient(180deg, #292929 20%, #0B0B0B 100%)",
                    height: "100%",
                    paddingTop: lg ? "25px" : "50px",
                    position: "relative",
                }}
            >
                <LaunchAMM />
            </main>
        </>
    );
};

export default CreateAMM;
