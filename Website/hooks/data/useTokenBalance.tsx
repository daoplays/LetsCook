import { useEffect, useState, useCallback, useRef } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { MintData, TokenAccount, bignum_to_num, request_token_amount } from "../../components/Solana/state";
import useAppRoot from "../../context/useAppRoot";
import { getMintData } from "../../components/amm/launch";

interface UseTokenBalanceProps {
    mintAddress?: PublicKey | null;
    mintData?: MintData | null;
    walletAddress?: PublicKey | null;
}

const useTokenBalance = (props: UseTokenBalanceProps | null) => {
    // State to store the token balance and any error messages
    const [tokenBalance, setTokenBalance] = useState<number | null>(null);
    const [tokenMint, setTokenMint] = useState<MintData | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Get the Solana connection and wallet
    const { connection } = useConnection();
    const wallet = useWallet();

    // Ref to store the subscription ID, persists across re-renders
    const subscriptionRef = useRef<number | null>(null);

    const haveMintData = useRef<boolean | null>(false);

    const mintAddress = props?.mintAddress || null;
    const mintData = props?.mintData || null;
    const walletAddress = props?.walletAddress || null;

    // Function to get mint data for the given mint address
    const fetchMintData = useCallback(async () => {
        if (haveMintData.current) return;

        if (!mintAddress && !mintData) {
            setError("Have neither address nor data");
            setTokenMint(null);
            return;
        }

        // if we have passed a mintData then just set it
        if (mintData) {
            setTokenMint(mintData);
            haveMintData.current = true;
            return;
        }

        if (!mintAddress) {
            setError("Mint data is not available");
            setTokenMint(null);
            return;
        }

        // fetch the mint data
        let newMintData = await getMintData(mintAddress.toString());
        if (newMintData) {
            setTokenMint(newMintData);
            haveMintData.current = true;
        }
        return;
    }, [mintData, mintAddress]);

    // Function to get the user's token account address
    const getUserTokenAccount = useCallback(() => {
        if (!wallet.publicKey && !walletAddress) return null;
        if (!tokenMint) return null;

        let userAddress = walletAddress || wallet.publicKey;

        return getAssociatedTokenAddressSync(tokenMint.mint.address, userAddress, true, tokenMint.token_program);
    }, [wallet.publicKey, walletAddress, tokenMint]);

    // Function to fetch the current token balance
    const fetchTokenBalance = useCallback(async () => {
        const userTokenAccount = getUserTokenAccount();
        if (!userTokenAccount) return;
        if (!tokenMint) return;

        try {
            const userAmount = await request_token_amount("", userTokenAccount);
            setTokenBalance(userAmount / Math.pow(10, tokenMint.mint.decimals));
            setError(null);
        } catch (err) {
            setError(`Failed to fetch token balance: ${err.message}`);
        }
    }, [getUserTokenAccount, tokenMint]);

    // Callback function to handle account changes
    const handleAccountChange = useCallback(
        (accountInfo: any) => {
            if (!tokenMint) return;
            const [tokenAccount] = TokenAccount.struct.deserialize(accountInfo.data);
            const amount = bignum_to_num(tokenAccount.amount);
            setTokenBalance(amount / Math.pow(10, tokenMint.mint.decimals));
        },
        [tokenMint],
    );

    // Effect to set up the subscription and fetch initial balance
    useEffect(() => {
        if (!mintAddress && !mintData) {
            setTokenBalance(0);
            setError(null);
            return;
        }

        if (!tokenMint) {
            fetchMintData();
            return;
        }
        // Fetch the initial token balance
        fetchTokenBalance();

        const userTokenAccount = getUserTokenAccount();
        if (!userTokenAccount) return;

        // Only set up a new subscription if one doesn't already exist
        if (subscriptionRef.current === null) {
            subscriptionRef.current = connection.onAccountChange(userTokenAccount, handleAccountChange);
        }

        // Cleanup function to remove the subscription when the component unmounts
        // or when the dependencies change
        return () => {
            if (subscriptionRef.current !== null) {
                connection.removeAccountChangeListener(subscriptionRef.current);
                subscriptionRef.current = null;
            }
        };
    }, [connection, tokenMint, fetchMintData, fetchTokenBalance, getUserTokenAccount, handleAccountChange]);

    // Return the current token balance and any error message
    return { tokenBalance, error };
};

export default useTokenBalance;
