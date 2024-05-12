import { LaunchData, get_current_blockhash, myU64, send_transaction, serialise_BuyTickets_instruction } from "../components/Solana/state";
import { PublicKey, Transaction, TransactionInstruction, Connection, ComputeBudgetProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PROGRAM, Config, SYSTEM_KEY } from "../components/Solana/constants";
import { useCallback, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { LaunchKeys, LaunchFlags } from "../components/Solana/constants";
import { useDisclosure } from "@chakra-ui/react";
import { toast } from "react-toastify";
import bs58 from "bs58";

interface BuyTicketsProps {
    launchData: LaunchData;
    value: number;
}

const useBuyTickets = ({ launchData, value }: BuyTicketsProps) => {
    const wallet = useWallet();
    const { isOpen: isWarningOpened, onOpen: openWarning, onClose: closeWarning } = useDisclosure();

    const ticketLabel = value <= 1 ? "ticket" : "tickets";

    const [isLoading, setIsLoading] = useState(false);

    const signature_ws_id = useRef<number | null>(null);

    const check_signature_update = useCallback(async (result: any) => {
        console.log(result);
        signature_ws_id.current = null;
        setIsLoading(false);
        // if we have a subscription field check against ws_id
        if (result.err !== null) {
            toast.error("Transaction failed, please try again", {
                isLoading: false,
                autoClose: 3000,
            });
            return;
        }

        toast.success("Tickets Bought!", {
            type: "success",
            isLoading: false,
            autoClose: 3000,
        });
    }, []);

    const transaction_failed = useCallback(async () => {
        if (signature_ws_id.current == null) return;

        signature_ws_id.current = null;
        setIsLoading(false);

        toast.error("Transaction not processed, please try again", {
            type: "error",
            isLoading: false,
            autoClose: 3000,
        });
    }, []);

    const BuyTickets = async () => {
        if (wallet.signTransaction === undefined) return;

        if (launchData === null) {
            return;
        }

        if (signature_ws_id.current !== null) {
            alert("Transaction pending, please wait");
            return;
        }

        setIsLoading(true);

        const connection = new Connection(Config.RPC_NODE, { wsEndpoint: Config.WSS_NODE });

        if (wallet.publicKey.toString() == launchData.keys[LaunchKeys.Seller].toString()) {
            toast.error(`Launch creator cannot buy tickets`, {
                isLoading: false,
                autoClose: 3000,
            });
            setIsLoading(false);

            return;
        }

        toast.info(`Buying ${value} ${ticketLabel}`, {
            isLoading: false,
            autoClose: 3000,
        });

        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launchData.page_name), Buffer.from("Launch")], PROGRAM)[0];

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        const game_id = new myU64(launchData.game_id);
        const [game_id_buf] = myU64.struct.serialize(game_id);

        let user_join_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), game_id_buf, Buffer.from("Joiner")],
            PROGRAM,
        )[0];

        const instruction_data = serialise_BuyTickets_instruction(value);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_data_account, isSigner: false, isWritable: true },
            { pubkey: user_join_account, isSigner: false, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },
            { pubkey: launchData.keys[LaunchKeys.WSOLAddress], isSigner: false, isWritable: true },
            { pubkey: launchData.keys[LaunchKeys.TeamWallet], isSigner: false, isWritable: true },
        ];

        account_vector.push({ pubkey: SYSTEM_KEY, isSigner: false, isWritable: true });
        account_vector.push({ pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: true });

        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        //transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 100_000 }));
        transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000000 }));
        transaction.add(list_instruction);

        try {
            let signed_transaction = await wallet.signTransaction(transaction);
            const encoded_transaction = bs58.encode(signed_transaction.serialize());

            var transaction_response = await send_transaction("", encoded_transaction);

            let signature = transaction_response.result;

            signature_ws_id.current = connection.onSignature(signature, check_signature_update, "confirmed");
            setTimeout(transaction_failed, 20000);

            // console.log("join sig: ", signature);
        } catch (error) {
            console.log(error);
            toast.error(`Failed to buy ${ticketLabel}, please try again.`, {
                isLoading: false,
                autoClose: 3000,
            });
            setIsLoading(false);

            return;
        } finally {
            closeWarning();
        }
    };

    return { BuyTickets, isLoading, openWarning, isWarningOpened, closeWarning };
};

export default useBuyTickets;
