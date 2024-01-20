export const make_tweet = async (page_name : string) => {
    
    // #2 Make a post request to our API. Obviously, update the URL to your own deployment.
    const response = await fetch("/.netlify/functions/twitter", {
        method: "POST",
        body: JSON.stringify({
            page_name: page_name,
        }),
        headers: {
            "Content-Type": "application/json",
        },
    });

    const result = await response.json();
    console.log(result)
    return result.body;
};