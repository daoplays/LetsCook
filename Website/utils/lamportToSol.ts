export function lamportsToSol(lamports: string | number): string {
    const LAMPORTS_PER_SOL = 1_000_000_000;
  
    if (typeof lamports === 'string') {
      const numericLamports = parseFloat(lamports);
      if (isNaN(numericLamports)) {
        return 'N/A';
      }
      return (numericLamports / LAMPORTS_PER_SOL).toFixed(2);
    } else if (typeof lamports === 'number') {
      return (lamports / LAMPORTS_PER_SOL).toFixed(2);
    } else {
      return 'N/A';
    }
  }