/** @type {import('next').NextConfig} */

const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: false,
});

const nextConfig = withBundleAnalyzer({
    reactStrictMode: true,
    swcMinify: true,
    compress: true,
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },
});

module.exports = nextConfig;
