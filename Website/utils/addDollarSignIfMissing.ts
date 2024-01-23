const addDollarSignIfMissing = (symbol: string) => {
    if (symbol.startsWith("$")) {
        return symbol;
    } else {
        return `$${symbol}`;
    }
};

export default addDollarSignIfMissing;
