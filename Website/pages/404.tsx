import PageNotFound from "../components/pageNotFound";
import Head from "next/head";

const Custom404 = () => {
    return (
        <>
            <Head>
                <title>Let&apos;s Cook | 404</title>
            </Head>
            <PageNotFound />
        </>
    );
};

export default Custom404;
