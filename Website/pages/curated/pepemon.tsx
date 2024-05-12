import {useCallback, useEffect, useRef, useState} from "react";
import useResponsive from "../../hooks/useResponsive";
import Head from "next/head";
import Image from "next/image";
import { Flex, VStack, Text } from "@chakra-ui/react";
import useMintRandom from "../../hooks/collections/useMintRandom";
import { findCollection } from "../../components/collection/utils";
import useAppRoot from "../../context/useAppRoot";
import { AssignmentData, CollectionData } from "../../components/collection/collectionState";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { CollectionKeys, Config } from "../../components/Solana/constants";
import {Key, getAssetV1GpaBuilder, updateAuthority, AssetV1, fetchAssetV1, deserializeAssetV1} from "@metaplex-foundation/mpl-core";
import type { RpcAccount, PublicKey as umiKey } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey } from '@metaplex-foundation/umi';
const Pepemon = () => {
    const { sm, lg } = useResponsive();
    const wallet = useWallet();
    const { connection } = useConnection();

    const { collectionList, mintData } = useAppRoot();
    const [launch, setCollectionData] = useState<CollectionData | null>(null);
    const [assigned_nft, setAssignedNFT] = useState<AssignmentData | null>(null);
    const [out_amount, setOutAmount] = useState<number>(0);
    const [nft_balance, setNFTBalance] = useState<number>(0);
    const [token_balance, setTokenBalance] = useState<number>(0);

    const [token_amount, setTokenAmount] = useState<number>(0);
    const [nft_amount, setNFTAmount] = useState<number>(0);
    const [isTokenToNFT, setIsTokenToNFT] = useState(false);

    const launch_account_ws_id = useRef<number | null>(null);
    const nft_account_ws_id = useRef<number | null>(null);
    const user_token_ws_id = useRef<number | null>(null);

    const mint_nft = useRef<boolean>(false);
    const check_initial_assignment = useRef<boolean>(true);
    const check_initial_collection = useRef<boolean>(true);

    const { MintRandom, isLoading: isMintRandomLoading } = useMintRandom(launch);

    const check_nft_balance = useCallback(async () => {
        if (launch === null || wallet === null || wallet.publicKey === null) return;

        console.log("CHECKING NFT BALANCE");

        const umi = createUmi(Config.RPC_NODE, "confirmed");

        let collection_umiKey = publicKey(launch.keys[CollectionKeys.CollectionMint].toString());

        const assets = await getAssetV1GpaBuilder(umi)
        .whereField('key', Key.AssetV1)
        .whereField('updateAuthority', updateAuthority('Collection', [collection_umiKey]))
        .getDeserialized()
    
        console.log(assets);
        let valid_lookups = 0;
        for (let i = 0; i < assets.length; i++) {
            if (assets[i].owner.toString() === wallet.publicKey.toString()) {
                valid_lookups += 1
            }
        }
        console.log("have ", valid_lookups, "addresses with balance");

        setNFTBalance(valid_lookups);
    }, [launch, wallet]);
    
    useEffect(() => {
        if (collectionList === null) return;

        let launch = findCollection(collectionList, "DM21_Random");

        if (launch === null) return;

        if (check_initial_collection.current) {
            setCollectionData(launch);
            check_initial_collection.current = false;
        }
        
        check_nft_balance();
        
    }, [collectionList, check_nft_balance]);


    return (
        <>
            <Head>
                <title>Let&apos;s Cook | Pepemon</title>
            </Head>
            <main
                style={{
                    height: "100vh",
                    background: 'url("/curatedLaunches/pepemon/BG.png")',
                    backgroundSize: "cover",
                    position: "relative",
                }}
            >
                <Flex h="100%" p={8} alignItems={"center"} justify={sm ? "start" : "center"} flexDirection="column">
                    <Image src={"/curatedLaunches/pepemon/PageTitle.png"} alt="Pepemon Title" width={800} height={400} />

                    <VStack gap={0} mt={sm && 70}>
                        <Image
                            src={"/curatedLaunches/pepemon/Grass.png"}
                            alt="Pepemon Grass"
                            width={sm ? 280 : 450}
                            height={sm ? 280 : 450}
                        />
                        <Image
                            src={"/curatedLaunches/pepemon/Pepeball.png"}
                            alt="Pepemon Ball"
                            width={sm ? 150 : 200}
                            height={sm ? 150 : 200}
                            style={{ cursor: "pointer" }}
                            onClick={() => {}}
                        />
                        <Text fontSize={sm ? 18 : 22} fontWeight={500} mt={-4}>
                            Mint
                        </Text>
                    </VStack>
                </Flex>

                <Image
                    src={"/curatedLaunches/pepemon/PepeTrainer.png"}
                    alt="Pepemon Trainer"
                    width={sm ? 200 : 400}
                    height={sm ? 400 : 600}
                    style={{ position: "absolute", bottom: 0, left: sm ? 0 : 100 }}
                />
            </main>
        </>
    );
};

export default Pepemon;
