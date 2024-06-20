const axios = require("axios");


exports.handler = async function (event, context) {

    //console.log(event);
    //console.log(context);
    
    let baseURL = "https://discord.com/api/channels/1091376581877973014/messages"
    //let baseURL = "https://discord.com/api/channels/1091376581877973014/messages"
    let bot_key = "Bot " + process.env.DISCORD_DUNGEON_BOT;
    let config = {
        timeout: 10000,
        headers: { 'authorization': bot_key}
    };


    try {
            const listing = JSON.parse(event.body);
            console.log(listing)
            var data = { 'content': JSON.stringify(listing)};

            const res = await axios.post(baseURL, data, config);

            console.log("DISCORD POST RESPONSE RECEIVED");
            return {
                statusCode: 200,
                body: JSON.stringify(res.data),
            };
       
    }
    catch (err) {
      console.log("AXIOS ERROR: ", err);

      return {
        statusCode: 404,
        body: JSON.stringify(err),
      };
    };
};
