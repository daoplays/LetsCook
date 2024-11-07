import { use, useCallback, useEffect, useRef, useState} from "react";
import { TldParser, NameRecordHeader, NameAccountAndDomain } from "@onsol/tldparser";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

const useDomain = () => {
    
    const wallet = useWallet();
    const { connection } = useConnection();

    let MAX_RETRIES = 60;
    const currentTries = useRef<number>(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const haveDomain = useRef<boolean>(false);

    const [userDomain, setUserDomain] = useState<NameAccountAndDomain[] | null>(null);

    const fetchUserDomain = useCallback(async () => {
        return true;
        console.log("in get user domain", userDomain, haveDomain.current)
        if (!wallet || !wallet.publicKey) return false;

        console.log("in get user domain 2", userDomain, haveDomain.current)

        if (haveDomain.current) return true;

        console.log("in get user domain 3", userDomain, haveDomain.current)

        if (currentTries.current > MAX_RETRIES) {
            console.log("Max retries reached for Domain, giving up");
            return false;
        }

        console.log("try getting domain")
        // initialize a Tld Parser
        try {
            const parser = new TldParser(connection);

            // get all owned domains from turbo
            let ownedDomainsFromTld = await parser.getParsedAllUserDomainsFromTld(wallet.publicKey, "turbo");
            console.log("getting domains, ", ownedDomainsFromTld);
            setUserDomain(ownedDomainsFromTld);

        } catch (e) {
            console.log("error getting user domain", e);
            currentTries.current++;
            return false;
        }

        haveDomain.current = true;
        return true;
    }, [wallet]);

    const startFetchingDomain = useCallback(() => {
        const fetchAndRetry = async () => {
            const success = await fetchUserDomain();
            if (success) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                console.log("Domain fetched successfully, stopping retries");
            } else {
                console.log("Domain Fetch failed, will retry in 1 second");
            }
        };

        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        // Start the interval
        intervalRef.current = setInterval(fetchAndRetry, 1000);

        // Trigger the first fetch immediately
        fetchAndRetry();
    }, [fetchUserDomain]);


    useEffect(() => {
        if (!wallet || !wallet.publicKey) return;

        // then start fetching the price from jupiter
        startFetchingDomain();

        // Cleanup function to clear the interval when the component unmounts
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [wallet]);

    return { userDomain};
};

export default useDomain;
