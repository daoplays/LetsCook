import {
    getRecentPrioritizationFees,
    request_raw_account_data,
    serialise_BuyTickets_instruction,
    uInt32ToLEBytes,
} from "../../components/Solana/state";
import { PublicKey, TransactionInstruction, ComputeBudgetProgram, Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { PROGRAM, Config, SYSTEM_KEY, SOL_ACCOUNT_SEED } from "../../components/Solana/constants";
import { useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { LaunchKeys } from "../../components/Solana/constants";
import { useDisclosure } from "@chakra-ui/react";
import { toast } from "react-toastify";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import useSendTransaction from "../useSendTransaction";
import { getMintData } from "@/components/amm/launch";
import { LaunchData } from "@letscook/sdk/dist/state/launch";
interface BuyTicketsProps {
    launchData: LaunchData;
    value: number;
}

export const GetBuyTicketsInstruction = async (user: PublicKey, launchData: LaunchData, value: number): Promise<TransactionInstruction> => {
    if (launchData === null) {
        return;
    }

    if (user.toString() == launchData.keys[LaunchKeys.Seller].toString()) {
        toast.error(`Launch creator cannot buy tickets`, {
            isLoading: false,
            autoClose: 3000,
        });

        return;
    }

    let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launchData.page_name), Buffer.from("Launch")], PROGRAM)[0];

    let user_data_account = PublicKey.findProgramAddressSync([user.toBytes(), Buffer.from("User")], PROGRAM)[0];

    let user_join_account = PublicKey.findProgramAddressSync(
        [user.toBytes(), Buffer.from(launchData.page_name), Buffer.from("Joiner")],
        PROGRAM,
    )[0];

    let program_sol_account = PublicKey.findProgramAddressSync([uInt32ToLEBytes(SOL_ACCOUNT_SEED)], PROGRAM)[0];

    let orao_program = PROGRAM;
    let randomKey = new Keypair();
    let key_bytes = randomKey.publicKey.toBytes();

    if (Config.NETWORK !== "eclipse") {
        orao_program = new PublicKey("VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y");
    }

    let orao_network = PublicKey.findProgramAddressSync([Buffer.from("orao-vrf-network-configuration")], orao_program)[0];
    let orao_random = PublicKey.findProgramAddressSync([Buffer.from("orao-vrf-randomness-request"), key_bytes], orao_program)[0];

    console.log("get orao network data");
    let orao_treasury: PublicKey = SYSTEM_KEY;
    if (Config.NETWORK !== "eclipse") {
        let orao_network_data = await request_raw_account_data("", orao_network);
        orao_treasury = new PublicKey(orao_network_data.slice(8, 40));
    }

    // check if we have the whitelist plugin
    let whitelist_mint = SYSTEM_KEY;
    let whitelist_account = SYSTEM_KEY;
    let whitelist_token_program = SYSTEM_KEY;

    for (let i = 0; i < launchData.plugins.length; i++) {
        if (launchData.plugins[i]["__kind"] === "Whitelist") {
            whitelist_mint = launchData.plugins[i]["key"];
            let whitelist = await getMintData(whitelist_mint.toString());

            whitelist_account = await getAssociatedTokenAddress(
                whitelist_mint, // mint
                user, // owner
                true, // allow owner off curve
                whitelist.token_program,
            );

            whitelist_token_program = whitelist.token_program;
        }
    }

    const instruction_data = serialise_BuyTickets_instruction(value, Array.from(key_bytes));

    var account_vector = [
        { pubkey: user, isSigner: true, isWritable: true },
        { pubkey: user_data_account, isSigner: false, isWritable: true },
        { pubkey: user_join_account, isSigner: false, isWritable: true },
        { pubkey: launch_data_account, isSigner: false, isWritable: true },
        { pubkey: launchData.keys[LaunchKeys.WSOLAddress], isSigner: false, isWritable: true },
        { pubkey: Config.COOK_FEES, isSigner: false, isWritable: true },
        { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: orao_random, isSigner: false, isWritable: true },
        { pubkey: orao_treasury, isSigner: false, isWritable: true },
        { pubkey: orao_network, isSigner: false, isWritable: true },
        { pubkey: orao_program, isSigner: false, isWritable: false },
        { pubkey: program_sol_account, isSigner: false, isWritable: true },
        { pubkey: whitelist_mint, isSigner: false, isWritable: true },
        { pubkey: whitelist_account, isSigner: false, isWritable: true },
        { pubkey: whitelist_token_program, isSigner: false, isWritable: false },
        { pubkey: launchData.listing, isSigner: false, isWritable: false },
    ];

    const list_instruction = new TransactionInstruction({
        keys: account_vector,
        programId: PROGRAM,
        data: instruction_data,
    });
    return list_instruction;
};
const useBuyTickets = ({ launchData, value }: BuyTicketsProps) => {
    const wallet = useWallet();

    const { isOpen: isWarningOpened, onOpen: openWarning, onClose: closeWarning } = useDisclosure();

    const { sendTransaction, isLoading } = useSendTransaction();

    const BuyTickets = async () => {
        let instruction = await GetBuyTicketsInstruction(wallet.publicKey, launchData, value);
        await sendTransaction({
            instructions: [instruction],
            onSuccess: () => {
                // Handle success
            },
            onError: (error) => {
                // Handle error
            },
        });
    };

    return { BuyTickets, isLoading, openWarning, isWarningOpened, closeWarning };
};

export default useBuyTickets;
