import { getStore } from "@netlify/blobs";

interface Entry {
    validated: boolean;
    address: string;
    symbol: string;
}

//var csv is the CSV file with headers
export async function JupCSVToList() {
    let new_list_file = await fetch("https://raw.githubusercontent.com/jup-ag/token-list/main/validated-tokens.csv").then((response) =>
        response.text(),
    );
    var lines = new_list_file.split("\n");

    var result: Entry[] = [];

    // NOTE: If your columns contain commas in their values, you'll need
    // to deal with those before doing the next step
    // (you might convert them to &&& or something, then covert them back later)
    // jsfiddle showing the issue https://jsfiddle.net/
    var headers = lines[0].split(",");

    for (var i = 1; i < lines.length; i++) {
        var obj: Entry = { validated: false, address: "", symbol: "" };
        var currentline = lines[i].split(",");

        for (var j = 0; j < headers.length; j++) {
            if (headers[j] === "Community Validated") {
                obj.validated = currentline[j] === "true";
                continue;
            }

            if (headers[j] === "Mint") {
                obj.address = currentline[j];
                continue;
            }

            if (headers[j] === "Symbol") {
                obj.symbol = currentline[j];
                continue;
            }
        }

        if (obj.validated) result.push(obj);
    }

    let json = JSON.stringify(result);

    return json;
}
