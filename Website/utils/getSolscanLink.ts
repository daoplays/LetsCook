import { CollectionKeys, LaunchKeys, Config } from "../components/Solana/constants";
import { LaunchData } from "../components/Solana/state";
import { CollectionData } from "../components/collection/collectionState";

export const getSolscanLink = (launch: CollectionData | LaunchData, type: string) => {

    let network = Config.NETWORK === "devnet" ? `?cluster=devnet` : Config.NETWORK === "eclipse" ? `?cluster=custom&customUrl=https://staging-rpc.dev2.eclipsenetwork.xyz` : "";;


    if (type === "Token") {
        return `https://solscan.io/account/${
            launch && launch.keys && launch.keys[LaunchKeys.MintAddress] ? launch.keys[LaunchKeys.MintAddress].toString() : ""
        }${Config.PROD ? "" : network}`;
    }

    if (type === "Collection") {
        return `https://core.metaplex.com/explorer/collection/${
            launch && launch.keys && launch.keys[CollectionKeys.CollectionMint] ? launch.keys[CollectionKeys.CollectionMint].toString() : ""
        }${Config.PROD ? "" : `?env=devnet`}`;
    }
};
