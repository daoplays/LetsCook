export const arweave_upload = async (b64string: string) => {
    var fixed_string = b64string.replaceAll("+", ".").replaceAll("/", "_").replaceAll("=", "-");

    // #2 Make a post request to our API. Obviously, update the URL to your own deployment.
    const response = await fetch("/.netlify/functions/arweave_png", {
        method: "POST",
        body: JSON.stringify({
            b64string: fixed_string,
        }),
        headers: {
            "Content-Type": "application/json",
        },
    });

    // #3 Get our Arweave URL, that's it!
    const result = await response.json();

    return result.body;
};

export const arweave_json_upload = async (name: string, symbol: string, image_url: string) => {
    var metadata = {
        name: name,
        symbol: symbol,
        description: "placeholder description",
        image: image_url,
    };

    const metaContentType = ["Content-Type", "application/json"];
    const metadataString = JSON.stringify(metadata);

    const response = await fetch("/.netlify/functions/arweave_json", {
        method: "POST",
        body: JSON.stringify({
            data: metadataString,
        }),
        headers: {
            "Content-Type": "application/json",
        },
    });

    // #3 Get our Arweave URL, that's it!
    const result = await response.json();

    return result.body;
};
