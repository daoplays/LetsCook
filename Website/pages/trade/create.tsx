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
