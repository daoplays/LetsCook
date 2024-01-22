const trimAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
};

export default trimAddress;
