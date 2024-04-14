export const route = (page: string, network: string | string[]) => {
    const targetNetwork = network === "devnet" ? network : "mainnet";
    const route = `${page}${targetNetwork === "devnet" ? "?network=devnet" : ""}`;
    return route;
};
