// Myers diff algorithm — O((N+M)*D) where D is edit distance.
// Operates on character arrays; returns runs of equal/added/removed tokens.

export type DiffType = 'equal' | 'added' | 'removed';

export interface DiffToken {
  type: DiffType;
  text: string;
}

// ── Core Myers diff ────────────────────────────────────────────

function myersDiff(a: string[], b: string[]): DiffToken[] {
  const N = a.length;
  const M = b.length;
  const MAX = N + M;

  if (MAX === 0) return [];

  // v[k] = furthest x reached on diagonal k
  const v: number[] = new Array(2 * MAX + 1).fill(0);
  const trace: number[][] = [];

  outer:
  for (let d = 0; d <= MAX; d++) {
    trace.push([...v]);
    for (let k = -d; k <= d; k += 2) {
      const vi = k + MAX; // index into v
      let x: number;
      if (k === -d || (k !== d && v[vi - 1] < v[vi + 1])) {
        x = v[vi + 1]; // move down
      } else {
        x = v[vi - 1] + 1; // move right
      }
      let y = x - k;
      // follow snake (diagonal moves = matches)
      while (x < N && y < M && a[x] === b[y]) { x++; y++; }
      v[vi] = x;
      if (x >= N && y >= M) break outer;
    }
  }

  // Back-trace to recover the edit path
  const ops: Array<'insert' | 'delete' | 'equal'> = [];
  let x = N;
  let y = M;

  for (let d = trace.length - 1; d > 0; d--) {
    const prevV = trace[d - 1];
    const k    = x - y;
    const vi   = k + MAX;

    let prevK: number;
    if (k === -d || (k !== d && prevV[vi - 1] < prevV[vi + 1])) {
      prevK = k + 1; // came from down
    } else {
      prevK = k - 1; // came from right
    }

    const prevX = prevV[prevK + MAX];
    const prevY = prevX - prevK;

    // Diagonal (equal) moves
    while (x > prevX + 1 && y > prevY + 1) { x--; y--; ops.push('equal'); }

    if (d > 0) {
      if (x === prevX) {
        ops.push('insert');
        y--;
      } else {
        ops.push('delete');
        x--;
      }
    }
    // Any remaining diagonal
    while (x > prevX && y > prevY) { x--; y--; ops.push('equal'); }
  }
  // Remaining equals at the start
  while (x > 0 && y > 0) { x--; y--; ops.push('equal'); }

  ops.reverse();

  // Rebuild tokens by replaying ops
  const tokens: DiffToken[] = [];
  let ai = 0;
  let bi = 0;
  for (const op of ops) {
    if (op === 'equal')  { tokens.push({ type: 'equal',   text: a[ai++] }); bi++; }
    if (op === 'delete') { tokens.push({ type: 'removed', text: a[ai++] }); }
    if (op === 'insert') { tokens.push({ type: 'added',   text: b[bi++] }); }
  }

  return mergeRuns(tokens);
}

// Merge consecutive tokens of the same type
function mergeRuns(tokens: DiffToken[]): DiffToken[] {
  const out: DiffToken[] = [];
  for (const tok of tokens) {
    const last = out[out.length - 1];
    if (last && last.type === tok.type) {
      last.text += tok.text;
    } else {
      out.push({ ...tok });
    }
  }
  return out;
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Character-level diff of two strings.
 * Returns an array of DiffToken, each tagged equal/added/removed.
 */
export function computeDiff(oldText: string, newText: string): DiffToken[] {
  return myersDiff([...oldText], [...newText]);
}

/**
 * Word-level diff (splits on whitespace boundaries, preserving spaces).
 * Better for prose comparison.
 */
export function computeWordDiff(oldText: string, newText: string): DiffToken[] {
  const tokenize = (s: string) => s.split(/(\s+)/);
  return myersDiff(tokenize(oldText), tokenize(newText));
}

/**
 * Renders a diff array to an HTML string.
 * Safe: only wraps in <span> — does NOT inject raw text as HTML.
 */
export function renderDiff(diff: DiffToken[]): string {
  return diff
    .map(tok => {
      const escaped = tok.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
      if (tok.type === 'added')   return `<span class="diff-added">${escaped}</span>`;
      if (tok.type === 'removed') return `<span class="diff-removed">${escaped}</span>`;
      return escaped;
    })
    .join('');
}
