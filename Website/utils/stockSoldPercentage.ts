export const stockSoldPercentage = (availableNFT, nftTotal) => {
    return ((nftTotal - availableNFT) / nftTotal) * 100;
};
