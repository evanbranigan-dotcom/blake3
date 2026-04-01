/**
 * Educational SHA-256 implementation that captures intermediate state at every round.
 * NOT for cryptographic use — this is a visualization tool.
 *
 * SHA-256 processes a single 512-bit (64-byte) block through 64 rounds of compression.
 * Each round updates 8 working variables (a-h) using the message schedule, constants,
 * and bitwise operations (Ch, Maj, Σ0, Σ1).
 */

// Initial hash values (first 32 bits of fractional parts of square roots of first 8 primes)
const H0: readonly number[] = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

// Round constants (first 32 bits of fractional parts of cube roots of first 64 primes)
const K: readonly number[] = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

/** Right-rotate a 32-bit integer */
function rotr(x: number, n: number): number {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

/** SHA-256 Ch function: choose bits of y or z based on x */
function ch(x: number, y: number, z: number): number {
  return ((x & y) ^ (~x & z)) >>> 0;
}

/** SHA-256 Maj function: majority vote of x, y, z */
function maj(x: number, y: number, z: number): number {
  return ((x & y) ^ (x & z) ^ (y & z)) >>> 0;
}

/** SHA-256 Σ0 (big sigma 0) */
function sigma0(x: number): number {
  return (rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22)) >>> 0;
}

/** SHA-256 Σ1 (big sigma 1) */
function sigma1(x: number): number {
  return (rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25)) >>> 0;
}

/** SHA-256 σ0 (small sigma 0, for message schedule) */
function lsigma0(x: number): number {
  return (rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3)) >>> 0;
}

/** SHA-256 σ1 (small sigma 1, for message schedule) */
function lsigma1(x: number): number {
  return (rotr(x, 17) ^ rotr(x, 19) ^ (x >>> 10)) >>> 0;
}

export interface Sha256Registers {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  g: number;
  h: number;
}

export interface Sha256RoundState {
  round: number;
  registers: Sha256Registers;
  /** Which registers changed this round */
  changed: (keyof Sha256Registers)[];
  /** The message schedule word used this round */
  w: number;
  /** The round constant used */
  k: number;
  /** Intermediate values for annotation */
  intermediates: {
    ch: number;
    maj: number;
    sigma0: number;
    sigma1: number;
    t1: number;
    t2: number;
  };
  /** Human-readable annotation of what happened */
  annotation: string;
}

export interface Sha256Trace {
  /** The input text */
  input: string;
  /** Padded message block (64 bytes) */
  block: Uint8Array;
  /** Full 64-word message schedule */
  messageSchedule: number[];
  /** Initial hash values before compression */
  initialRegisters: Sha256Registers;
  /** State after each of the 64 rounds */
  rounds: Sha256RoundState[];
  /** Final hash (hex string) */
  hash: string;
}

/** Pad a UTF-8 message to a single SHA-256 block (512 bits / 64 bytes). Max 55 bytes input. */
function padMessage(input: string): Uint8Array {
  const encoder = new TextEncoder();
  const msg = encoder.encode(input);
  if (msg.length > 55) {
    throw new Error(`Input too long: ${msg.length} bytes (max 55 for single block)`);
  }

  const block = new Uint8Array(64);
  block.set(msg);
  // Append 1-bit
  block[msg.length] = 0x80;
  // Length in bits as 64-bit big-endian at end of block
  const bitLen = msg.length * 8;
  // For messages ≤ 55 bytes, bit length fits in last 4 bytes
  block[60] = (bitLen >>> 24) & 0xff;
  block[61] = (bitLen >>> 16) & 0xff;
  block[62] = (bitLen >>> 8) & 0xff;
  block[63] = bitLen & 0xff;

  return block;
}

/** Parse a 64-byte block into 16 big-endian 32-bit words */
function parseBlock(block: Uint8Array): number[] {
  const words: number[] = [];
  for (let i = 0; i < 16; i++) {
    const off = i * 4;
    words.push(
      ((block[off] << 24) | (block[off + 1] << 16) | (block[off + 2] << 8) | block[off + 3]) >>> 0
    );
  }
  return words;
}

/** Expand 16 message words into the full 64-word schedule */
function expandSchedule(words: number[]): number[] {
  const w = [...words];
  for (let i = 16; i < 64; i++) {
    w.push(((lsigma1(w[i - 2]) + w[i - 7] + lsigma0(w[i - 15]) + w[i - 16]) & 0xffffffff) >>> 0);
  }
  return w;
}

function regsToObj(r: number[]): Sha256Registers {
  return { a: r[0], b: r[1], c: r[2], d: r[3], e: r[4], f: r[5], g: r[6], h: r[7] };
}

function toHex(n: number): string {
  return (n >>> 0).toString(16).padStart(8, '0');
}

/** Detect which registers changed between two states */
function diffRegisters(prev: Sha256Registers, curr: Sha256Registers): (keyof Sha256Registers)[] {
  const keys: (keyof Sha256Registers)[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  return keys.filter(k => prev[k] !== curr[k]);
}

/**
 * Run SHA-256 on a single block and capture every round's state.
 * Returns a full trace for visualization.
 */
export function sha256Trace(input: string): Sha256Trace {
  const block = padMessage(input);
  const words = parseBlock(block);
  const messageSchedule = expandSchedule(words);

  // Initialize working variables
  const reg = [...H0];
  const initialRegisters = regsToObj(reg);
  const rounds: Sha256RoundState[] = [];

  for (let i = 0; i < 64; i++) {
    const prevRegs = regsToObj(reg);

    // Compute intermediate values
    const chVal = ch(reg[4], reg[5], reg[6]);
    const majVal = maj(reg[0], reg[1], reg[2]);
    const s0 = sigma0(reg[0]);
    const s1 = sigma1(reg[4]);
    const t1 = ((reg[7] + s1 + chVal + K[i] + messageSchedule[i]) & 0xffffffff) >>> 0;
    const t2 = ((s0 + majVal) & 0xffffffff) >>> 0;

    // Update registers
    reg[7] = reg[6];
    reg[6] = reg[5];
    reg[5] = reg[4];
    reg[4] = ((reg[3] + t1) & 0xffffffff) >>> 0;
    reg[3] = reg[2];
    reg[2] = reg[1];
    reg[1] = reg[0];
    reg[0] = ((t1 + t2) & 0xffffffff) >>> 0;

    const currRegs = regsToObj(reg);
    const changed = diffRegisters(prevRegs, currRegs);

    rounds.push({
      round: i,
      registers: currRegs,
      changed,
      w: messageSchedule[i],
      k: K[i],
      intermediates: { ch: chVal, maj: majVal, sigma0: s0, sigma1: s1, t1, t2 },
      annotation: `T1 = h + Σ1(e) + Ch(e,f,g) + K${i} + W${i} = ${toHex(t1)}  |  T2 = Σ0(a) + Maj(a,b,c) = ${toHex(t2)}`,
    });
  }

  // Compute final hash: add working variables to initial hash values
  const final = H0.map((h, i) => ((h + reg[i]) & 0xffffffff) >>> 0);
  const hash = final.map(toHex).join('');

  return {
    input,
    block,
    messageSchedule,
    initialRegisters,
    rounds,
    hash,
  };
}

export { toHex };
