import { PublicKey } from "@solana/web3.js";
import { CollectionKeys, LaunchKeys, Config } from "../components/Solana/constants";
import { LaunchData } from "../components/Solana/state";
import { CollectionData } from "../components/collection/collectionState";

export const getSolscanLink = (key: PublicKey, type: string) => {
    let network =
        Config.NETWORK === "devnet"
            ? `?cluster=devnet`
            : Config.NETWORK === "eclipse"
              ? `?cluster=custom&customUrl=https://staging-rpc.dev2.eclipsenetwork.xyz`
              : "";

    if (type === "Token") {
        return `https://solscan.io/account/${key.toString()}${Config.PROD ? "" : network}`;
    }

    if (type === "Collection") {
        return `https://core.metaplex.com/explorer/collection/${key.toString()}${Config.PROD ? "" : `?env=devnet`}`;
    }
};
