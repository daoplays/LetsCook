import {
    LaunchInstruction,
    getRecentPrioritizationFees,
    get_current_blockhash,
    request_raw_account_data,
    serialise_basic_instruction,
} from "../../components/Solana/state";
import { PublicKey, Transaction, TransactionInstruction, ComputeBudgetProgram } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { PROGRAM, Config, SYSTEM_KEY } from "../../components/Solana/constants";
import { LaunchKeys, LaunchFlags } from "../../components/Solana/constants";
import useInitAMM from "../jupiter/useInitAMM";
import useSendTransaction from "../useSendTransaction";
import { JoinData, LaunchData } from "@letscook/sdk/dist/state/launch";

const useCheckTickets = (launchData: LaunchData, updateData: boolean = false) => {
    const wallet = useWallet();
    const { GetInitAMMInstruction } = useInitAMM(launchData);
    const { sendTransaction, isLoading } = useSendTransaction();

    const CheckTickets = async () => {
        if (wallet.signTransaction === undefined) return;

        if (launchData === null) {
            return;
        }

        if (wallet.publicKey.toString() == launchData.keys[LaunchKeys.Seller].toString()) {
            alert("Launch creator cannot buy tickets");
            return;
        }

        let user_data_account = PublicKey.findProgramAddressSync([wallet.publicKey.toBytes(), Buffer.from("User")], PROGRAM)[0];

        let launch_data_account = PublicKey.findProgramAddressSync([Buffer.from(launchData.page_name), Buffer.from("Launch")], PROGRAM)[0];

        let user_join_account = PublicKey.findProgramAddressSync(
            [wallet.publicKey.toBytes(), Buffer.from(launchData.page_name), Buffer.from("Joiner")],
            PROGRAM,
        )[0];

        //console.log("get assignment data");
        let join_account_data = await request_raw_account_data("", user_join_account);

        if (join_account_data === null) {
            // console.log("no assignment data found");
            return;
        }
        const [join_data] = JoinData.struct.deserialize(join_account_data);

        const instruction_data = serialise_basic_instruction(LaunchInstruction.chcek_tickets);

        var account_vector = [
            { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
            { pubkey: user_data_account, isSigner: false, isWritable: true },
            { pubkey: user_join_account, isSigner: false, isWritable: true },
            { pubkey: launch_data_account, isSigner: false, isWritable: true },
            { pubkey: join_data.random_address, isSigner: false, isWritable: true },
            { pubkey: SYSTEM_KEY, isSigner: false, isWritable: false },
        ];

        let instructions: TransactionInstruction[] = [];
        const list_instruction = new TransactionInstruction({
            keys: account_vector,
            programId: PROGRAM,
            data: instruction_data,
        });

        let txArgs = await get_current_blockhash("");

        let transaction = new Transaction(txArgs);
        transaction.feePayer = wallet.publicKey;

        let computeUnits = 400_000;
        if (launchData.flags[LaunchFlags.AMMProvider] == 0 && launchData.flags[LaunchFlags.LPState] < 2) {
            let init_idx = await GetInitAMMInstruction();
            instructions.push(init_idx);
            computeUnits = 600_000;
        }

        instructions.push(list_instruction);

        await sendTransaction({
            instructions,
            onSuccess: () => {
                // Handle success
            },
            onError: (error) => {
                // Handle error
            },
            computeUnits,
        });
    };

    return { CheckTickets, isLoading };
};

export default useCheckTickets;
