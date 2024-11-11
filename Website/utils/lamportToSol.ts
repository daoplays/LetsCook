export function lamportsToSol(lamports) {
    const LAMPORTS_PER_SOL = 1_000_000_000;
    return lamports / LAMPORTS_PER_SOL;
}
