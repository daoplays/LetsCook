export const stockSoldPercentage = (nftTotal, availableNFT) => {
    return ((availableNFT - nftTotal) / nftTotal) * 100;
};