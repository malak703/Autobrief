/**
 * Word-level diff utility.
 * Compares an original string with a modified string and produces
 * an array of segments tagged as "same", "added", or "removed".
 */

export type DiffSegment = {
  type: "same" | "added" | "removed";
  text: string;
};

/**
 * Tokenize text into words while preserving whitespace.
 * Each token is either a word or a whitespace run.
 */
function tokenize(text: string): string[] {
  return text.match(/\S+|\s+/g) ?? [];
}

/**
 * Compute a simple LCS (Longest Common Subsequence) table for two token arrays.
 */
function lcsTable(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }
  return dp;
}

/**
 * Given two strings, return an array of DiffSegments
 * showing what was removed, added, or kept the same.
 */
export function computeWordDiff(
  original: string,
  modified: string
): DiffSegment[] {
  if (original === modified) {
    return [{ type: "same", text: original }];
  }
  if (!original.trim()) {
    return [{ type: "added", text: modified }];
  }
  if (!modified.trim()) {
    return [{ type: "removed", text: original }];
  }

  const a = tokenize(original);
  const b = tokenize(modified);
  const dp = lcsTable(a, b);

  const segments: DiffSegment[] = [];
  let i = 0;
  let j = 0;

  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      // Same token
      segments.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (j < b.length && (i >= a.length || dp[i][j + 1] >= dp[i + 1][j])) {
      // Added in modified
      segments.push({ type: "added", text: b[j] });
      j++;
    } else if (i < a.length) {
      // Removed from original
      segments.push({ type: "removed", text: a[i] });
      i++;
    }
  }

  // Merge consecutive segments of the same type
  const merged: DiffSegment[] = [];
  for (const seg of segments) {
    const last = merged[merged.length - 1];
    if (last && last.type === seg.type) {
      last.text += seg.text;
    } else {
      merged.push({ ...seg });
    }
  }

  return merged;
}

/**
 * Check if there are any actual changes between original and modified.
 */
export function hasChanges(original: string, modified: string): boolean {
  return original.trim() !== modified.trim();
}
