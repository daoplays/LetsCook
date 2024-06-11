const formatPrice = (price: number, decimals: number) => {
    if (price === 0 || isNaN(price)) {
        return "0";
    }

    let priceString = Math.abs(price) <= 1e-3 ? price.toExponential(3) : price.toFixed(decimals);

    return priceString;
};

export default formatPrice;
