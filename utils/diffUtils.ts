
export const calculateDiffLines = (oldText: string, newText: string) => {
    if (!oldText) oldText = "";
    if (!newText) newText = "";

    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const N = oldLines.length;
    const M = newLines.length;
    
    // Simple Longest Common Subsequence (LCS) based diff
    // Note: For very large files, a Myers diff algorithm would be more performant,
    // but this O(N*M) DP approach is sufficient for typical spec files.
    const dp = Array(N + 1).fill(0).map(() => Array(M + 1).fill(0));
    for (let i = 1; i <= N; i++) {
        for (let j = 1; j <= M; j++) {
            if (oldLines[i - 1] === newLines[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
            else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }

    let i = N, j = M;
    const diff: {type: ' ' | '+' | '-', text: string}[] = [];
    
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
            diff.unshift({ type: ' ', text: oldLines[i - 1] });
            i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            diff.unshift({ type: '+', text: newLines[j - 1] });
            j--;
        } else {
            diff.unshift({ type: '-', text: oldLines[i - 1] });
            i--;
        }
    }
    return diff;
};
