const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const image = new Image();
            image.onload = () => {
                resolve({ width: image.width, height: image.height });
            };
            image.onerror = reject;
            image.src = e.target?.result as string;
        };

        reader.readAsDataURL(file);
    });
};

export default getImageDimensions;
