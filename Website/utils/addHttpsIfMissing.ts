const addHttpsIfMissing = (url: string) => {
    if (url?.startsWith("http://") || url?.startsWith("https://")) {
        return url;
    } else {
        return `https://${url}`;
    }
};

export default addHttpsIfMissing;
