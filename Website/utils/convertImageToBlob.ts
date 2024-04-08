const convertImageURLToFile = async (url: string, FileName: string) => {
    const response = await fetch(url);
    const data = await response.blob();
    let metadata = {
        type: "image/jpeg",
    };
    let file = new File([data], FileName, metadata);
    return file;
};

export default convertImageURLToFile;
