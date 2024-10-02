import { HStack, Link, Text, Tooltip } from "@chakra-ui/react";
import useResponsive from "../../hooks/useResponsive";
import { Extensions } from "./constants";
import { Mint, getPermanentDelegate, getTransferFeeConfig, getTransferHook } from "@solana/spl-token";
export function getExtensions(mint: Mint) {
    let transfer_hook = getTransferHook(mint);
    let transfer_fee_config = getTransferFeeConfig(mint);
    let permanent_delegate = getPermanentDelegate(mint);

    let extensions =
        (Extensions.TransferFee * Number(transfer_fee_config !== null)) |
        (Extensions.PermanentDelegate * Number(permanent_delegate !== null)) |
        (Extensions.TransferHook * Number(transfer_hook !== null));

    return extensions;
}
const ShowExtensions = ({ extension_flag }: { extension_flag: number }) => {
    const { lg } = useResponsive();
    return (
        <HStack justify="center">
            {extension_flag && (
                <>
                    {(extension_flag & Extensions.TransferFee) > 0 && (
                        <Tooltip label="Transfer Fee" hasArrow fontSize="large" offset={[0, 10]}>
                            <div style={{ height: "20px", width: "20px", backgroundColor: "#7BFF70", borderRadius: "50%" }} />
                        </Tooltip>
                    )}
                    {(extension_flag & Extensions.PermanentDelegate) > 0 && (
                        <Tooltip label="Permanent Delegate" hasArrow fontSize="large" offset={[0, 10]}>
                            <div style={{ height: "20px", width: "20px", backgroundColor: "#FF7979", borderRadius: "50%" }} />
                        </Tooltip>
                    )}
                    {(extension_flag & Extensions.TransferHook) > 0 && (
                        <Tooltip label="Transfer Hook" hasArrow fontSize="large" offset={[0, 10]}>
                            <div style={{ height: "20px", width: "20px", backgroundColor: "#72AAFF", borderRadius: "50%" }} />
                        </Tooltip>
                    )}
                </>
            )}
        </HStack>
    );
};

export default ShowExtensions;
