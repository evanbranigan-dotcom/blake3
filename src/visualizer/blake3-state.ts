/**
 * Educational BLAKE3 implementation that captures intermediate state at every round.
 * NOT for cryptographic use — this is a visualization tool.
 *
 * BLAKE3 processes a single 64-byte chunk through 7 rounds.
 * Each round applies the G mixing function to columns then diagonals of a 4x4 state matrix.
 * Regular hashing mode only (no keyed hashing, no key derivation).
 *
 * Key differences from SHA-256 visible in the visualization:
 * - 4x4 state matrix (16 words) vs 8 working variables
 * - 7 rounds vs 64 rounds
 * - Column rounds + diagonal rounds (structured parallelism)
 * - Message word permutation between rounds
 */

// IV: same as SHA-256 initial hash values (BLAKE3 reuses these)
const IV: readonly number[] = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

// Message word permutation table — applied after each round
const MSG_PERMUTATION: readonly number[] = [2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8];

// Flags
const CHUNK_START = 1 << 0;
const CHUNK_END = 1 << 1;
const ROOT = 1 << 3;

/** Right-rotate a 32-bit integer */
function rotr(x: number, n: number): number {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

/** Add two 32-bit integers with wrapping */
function add(a: number, b: number): number {
  return ((a + b) & 0xffffffff) >>> 0;
}

/** XOR two 32-bit integers */
function xor(a: number, b: number): number {
  return (a ^ b) >>> 0;
}

/** The 4x4 state matrix as a flat array of 16 uint32 values */
export type StateMatrix = number[];

export interface Blake3GApplication {
  /** Which positions in the 4x4 matrix were mixed (a, b, c, d indices) */
  positions: [number, number, number, number];
  /** Position labels for display */
  labels: string;
  /** Message words used (mx, my) */
  messageWords: [number, number];
  /** State before this G application */
  stateBefore: number[];
  /** State after this G application */
  stateAfter: number[];
  /** Which matrix cells changed */
  changedCells: number[];
}

export interface Blake3RoundState {
  round: number;
  /** 'column' or 'diagonal' */
  phase: 'column' | 'diagonal';
  /** The 4 G-function applications in this half-round */
  gApplications: Blake3GApplication[];
  /** Full matrix state after this half-round */
  matrix: number[];
  /** Human-readable annotation */
  annotation: string;
}

export interface Blake3Trace {
  input: string;
  /** Padded chunk (64 bytes) */
  chunk: Uint8Array;
  /** 16 message words parsed from chunk */
  messageWords: number[];
  /** Initial 4x4 state matrix */
  initialMatrix: number[];
  /** State after each half-round (14 entries: 7 rounds x 2 phases) */
  rounds: Blake3RoundState[];
  /** Final hash output (first 8 words XORed with second 8) */
  hash: string;
  /** Flags used */
  flags: { chunkStart: boolean; chunkEnd: boolean; root: boolean };
}

/**
 * BLAKE3 G mixing function.
 * Mixes four words of the state matrix using two message words.
 * Rotation amounts: 16, 12, 8, 7 (fixed for BLAKE3, unlike BLAKE2).
 */
function g(state: number[], a: number, b: number, c: number, d: number, mx: number, my: number): void {
  state[a] = add(add(state[a], state[b]), mx);
  state[d] = rotr(xor(state[d], state[a]), 16);
  state[c] = add(state[c], state[d]);
  state[b] = rotr(xor(state[b], state[c]), 12);

  state[a] = add(add(state[a], state[b]), my);
  state[d] = rotr(xor(state[d], state[a]), 8);
  state[c] = add(state[c], state[d]);
  state[b] = rotr(xor(state[b], state[c]), 7);
}

/** Permute message words for the next round */
function permuteMessageWords(m: number[]): number[] {
  return MSG_PERMUTATION.map(i => m[i]);
}

/** Pad input to a 64-byte BLAKE3 chunk */
function padChunk(input: string): Uint8Array {
  const encoder = new TextEncoder();
  const msg = encoder.encode(input);
  if (msg.length > 64) {
    throw new Error(`Input too long: ${msg.length} bytes (max 64 for single chunk)`);
  }
  const chunk = new Uint8Array(64);
  chunk.set(msg);
  return chunk;
}

/** Parse a 64-byte chunk into 16 little-endian 32-bit words */
function parseChunk(chunk: Uint8Array): number[] {
  const words: number[] = [];
  for (let i = 0; i < 16; i++) {
    const off = i * 4;
    words.push(
      ((chunk[off + 3] << 24) | (chunk[off + 2] << 16) | (chunk[off + 1] << 8) | chunk[off]) >>> 0
    );
  }
  return words;
}

function toHex(n: number): string {
  return (n >>> 0).toString(16).padStart(8, '0');
}

/**
 * Initialize the BLAKE3 4x4 state matrix for a single-chunk hash.
 *
 * Layout:
 *   row 0: chaining value (IV for first chunk)
 *   row 1: chaining value continued
 *   row 2: IV constants
 *   row 3: counter_low, counter_high, block_len, flags
 */
function initState(blockLen: number, flags: number): number[] {
  return [
    // Row 0-1: chaining value (IV for first/only chunk)
    IV[0], IV[1], IV[2], IV[3],
    IV[4], IV[5], IV[6], IV[7],
    // Row 2: IV constants
    IV[0], IV[1], IV[2], IV[3],
    // Row 3: counter + block_len + flags
    0,          // counter low
    0,          // counter high
    blockLen,   // block length in bytes
    flags,      // flags
  ];
}

/** Column indices for the 4 column G applications */
const COLUMNS: [number, number, number, number][] = [
  [0, 4, 8, 12],   // column 0
  [1, 5, 9, 13],   // column 1
  [2, 6, 10, 14],  // column 2
  [3, 7, 11, 15],  // column 3
];

/** Diagonal indices for the 4 diagonal G applications */
const DIAGONALS: [number, number, number, number][] = [
  [0, 5, 10, 15],  // diagonal 0
  [1, 6, 11, 12],  // diagonal 1
  [2, 7, 8, 13],   // diagonal 2
  [3, 4, 9, 14],   // diagonal 3
];

function positionLabel(positions: [number, number, number, number]): string {
  return positions.map(p => `[${Math.floor(p / 4)},${p % 4}]`).join(', ');
}

/**
 * Run BLAKE3 compression on a single chunk and capture every round's state.
 * Returns a full trace for visualization.
 */
export function blake3Trace(input: string): Blake3Trace {
  const encoder = new TextEncoder();
  const msgBytes = encoder.encode(input);
  const blockLen = Math.min(msgBytes.length, 64);

  const chunk = padChunk(input);
  const messageWords = parseChunk(chunk);

  // Single chunk: CHUNK_START | CHUNK_END | ROOT
  const flags = CHUNK_START | CHUNK_END | ROOT;
  const state = initState(blockLen, flags);
  const initialMatrix = [...state];

  let m = [...messageWords];
  const rounds: Blake3RoundState[] = [];

  for (let round = 0; round < 7; round++) {
    // Column round
    const colGApps: Blake3GApplication[] = [];
    for (let col = 0; col < 4; col++) {
      const [a, b, c, d] = COLUMNS[col];
      const mx = m[2 * col];
      const my = m[2 * col + 1];
      const before = [...state];
      g(state, a, b, c, d, mx, my);
      const after = [...state];
      const changed = [a, b, c, d].filter(i => before[i] !== after[i]);
      colGApps.push({
        positions: COLUMNS[col],
        labels: positionLabel(COLUMNS[col]),
        messageWords: [mx, my],
        stateBefore: before,
        stateAfter: after,
        changedCells: changed,
      });
    }
    rounds.push({
      round,
      phase: 'column',
      gApplications: colGApps,
      matrix: [...state],
      annotation: `Round ${round + 1}/7 — column: G applied to 4 columns using m[0..7]`,
    });

    // Diagonal round
    const diagGApps: Blake3GApplication[] = [];
    for (let diag = 0; diag < 4; diag++) {
      const [a, b, c, d] = DIAGONALS[diag];
      const mx = m[2 * diag + 8];
      const my = m[2 * diag + 9];
      const before = [...state];
      g(state, a, b, c, d, mx, my);
      const after = [...state];
      const changed = [a, b, c, d].filter(i => before[i] !== after[i]);
      diagGApps.push({
        positions: DIAGONALS[diag],
        labels: positionLabel(DIAGONALS[diag]),
        messageWords: [mx, my],
        stateBefore: before,
        stateAfter: after,
        changedCells: changed,
      });
    }
    rounds.push({
      round,
      phase: 'diagonal',
      gApplications: diagGApps,
      matrix: [...state],
      annotation: `Round ${round + 1}/7 — diagonal: G applied to 4 diagonals using m[8..15]`,
    });

    // Permute message words for next round (skip after last round)
    if (round < 6) {
      m = permuteMessageWords(m);
    }
  }

  // Finalize: XOR first 8 state words with last 8 to produce output
  const output: number[] = [];
  for (let i = 0; i < 8; i++) {
    output.push(xor(state[i], state[i + 8]));
  }
  const hash = output.map(toHex).join('');

  return {
    input,
    chunk,
    messageWords,
    initialMatrix,
    rounds,
    hash,
    flags: {
      chunkStart: true,
      chunkEnd: true,
      root: true,
    },
  };
}

export { toHex };
