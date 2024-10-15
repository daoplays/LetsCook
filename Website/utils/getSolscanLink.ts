import { PublicKey } from "@solana/web3.js";
import { CollectionKeys, LaunchKeys, Config } from "../components/Solana/constants";
import { LaunchData } from "../components/Solana/state";
import { CollectionData } from "../components/collection/collectionState";

export const getSolscanLink = (key: PublicKey, type: string) => {
    if (!key) {
        return "";
    }

    let network = "";
    if (Config.NETWORK === "devnet") {
        network = `?cluster=devnet`;
    }
    if (Config.NETWORK === "eclipse") {
        if (Config.PROD) {
            network = `?cluster=custom&customUrl=https://mainnetbeta-rpc.eclipse.xyz`;
        } else {
            network = `?cluster=custom&customUrl=https://devnet.dev2.eclipsenetwork.xyz`;
        }
    }

    if (type === "Token") {
        return `https://solscan.io/account/${key.toString()}${network}`;
    }

    if (type === "Collection") {
        if (Config.NETWORK === "eclipse") {
            return `https://solscan.io/account/${key.toString()}${network}`;
        }

        return `https://core.metaplex.com/explorer/collection/${key.toString()}${Config.PROD ? "" : `?env=devnet`}`;
    }
};
