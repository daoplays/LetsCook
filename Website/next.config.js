/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: false,
});

const nextConfig = withBundleAnalyzer({
    reactStrictMode: true,
    swcMinify: true,

    images: {
        domains: [`www.arweave.net`, "gateway.irys.xyz", "snipboard.io"],
    },
});

module.exports = nextConfig;
