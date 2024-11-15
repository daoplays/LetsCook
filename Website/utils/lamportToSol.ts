export function lamportsToSol(lamports: string | number): string {
    const LAMPORTS_PER_SOL = 1_000_000_000;

    if (typeof lamports === "string") {
        const numericLamports = parseFloat(lamports);
        if (isNaN(numericLamports)) {
            return "N/A";
        }
        const sol = numericLamports / LAMPORTS_PER_SOL;
        return parseFloat(sol.toFixed(4)).toString();
    } else if (typeof lamports === "number") {
        const sol = lamports / LAMPORTS_PER_SOL;
        return parseFloat(sol.toFixed(4)).toString();
    } else {
        return "N/A";
    }
}