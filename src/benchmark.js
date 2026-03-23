import { blake3, sha256 } from 'hash-wasm'

const SIZES = [
  { label: '1 KB', bytes: 1024 },
  { label: '100 KB', bytes: 100 * 1024 },
  { label: '1 MB', bytes: 1024 * 1024 },
  { label: '10 MB', bytes: 10 * 1024 * 1024 },
]

// Target ~2 seconds of benchmarking per algorithm per size
// For small data: run large batches timed together to overcome timer resolution
// For large data: time individual ops
const BENCH_CONFIG = {
  1024:     { batchSize: 500, batches: 10 },   // 500 ops per timing, 10 timings
  102400:   { batchSize: 50,  batches: 10 },   // 50 ops per timing, 10 timings
  1048576:  { batchSize: 1,   batches: 30 },   // individual ops, 30 timings
  10485760: { batchSize: 1,   batches: 10 },   // individual ops, 10 timings
}

function generateData(bytes) {
  const data = new Uint8Array(bytes)
  // Safari limits crypto.getRandomValues() to 65536 bytes per call
  const chunk = 65536
  for (let offset = 0; offset < bytes; offset += chunk) {
    const size = Math.min(chunk, bytes - offset)
    crypto.getRandomValues(data.subarray(offset, offset + size))
  }
  return data
}

// Run a hash function in batches to overcome timer resolution limits.
// Times a batch of `batchSize` ops together, repeats `batches` times.
// Returns per-op median time in ms.
async function runBatched(fn, data, { batchSize, batches }) {
  // Warm-up
  await fn(data)
  await fn(data)

  const perOpTimes = []

  for (let b = 0; b < batches; b++) {
    const start = performance.now()
    for (let i = 0; i < batchSize; i++) {
      await fn(data)
    }
    const elapsed = performance.now() - start
    perOpTimes.push(elapsed / batchSize)
  }

  return perOpTimes
}

function computeStats(times, bytes, cfg) {
  const sorted = [...times].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  const mean = times.reduce((a, b) => a + b, 0) / times.length
  const throughputMBps = median > 0 ? (bytes / (1024 * 1024)) / (median / 1000) : 0
  const opsPerSec = median > 0 ? 1000 / median : 0
  const totalOps = cfg.batchSize * cfg.batches

  return { median, mean, throughputMBps, opsPerSec, samples: times.length, totalOps, batchSize: cfg.batchSize, batches: cfg.batches }
}

// Convert ArrayBuffer to hex string
function bufToHex(buf) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Verify all algorithms produce correct hashes on the same data
async function verifyHashes(data) {
  const b3Hash = await blake3(data)
  const sha256WasmHash = await sha256(data)

  const verification = {
    blake3: b3Hash.slice(0, 16) + '...',
    sha256wasm: sha256WasmHash.slice(0, 16) + '...',
    dataSize: data.length,
    // SHA-256 results should match between WASM and Web Crypto
    sha256Match: true,
  }

  if (hasWebCrypto) {
    const cryptoBuf = await crypto.subtle.digest('SHA-256', data)
    const sha256CryptoHash = bufToHex(cryptoBuf)
    verification.sha256crypto = sha256CryptoHash.slice(0, 16) + '...'
    verification.sha256Match = sha256WasmHash === sha256CryptoHash
  }

  return verification
}

// Web Crypto API requires a secure context (HTTPS or localhost)
const hasWebCrypto = typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'

export async function runBenchmark(onProgress) {
  const results = []
  const algCount = hasWebCrypto ? 3 : 2
  const totalSteps = SIZES.length * algCount
  let step = 0

  for (const size of SIZES) {
    const data = generateData(size.bytes)
    const cfg = BENCH_CONFIG[size.bytes]
    const sizeResults = { label: size.label, bytes: size.bytes, algorithms: {} }

    // Verify hashes match before benchmarking
    sizeResults.verification = await verifyHashes(data)

    // BLAKE3
    onProgress?.({ step: ++step, totalSteps, current: `BLAKE3 @ ${size.label}` })
    const blake3Times = await runBatched((d) => blake3(d), data, cfg)
    sizeResults.algorithms.blake3 = computeStats(blake3Times, size.bytes, cfg)

    // SHA-256 (WASM)
    onProgress?.({ step: ++step, totalSteps, current: `SHA-256 WASM @ ${size.label}` })
    const sha256WasmTimes = await runBatched((d) => sha256(d), data, cfg)
    sizeResults.algorithms.sha256wasm = computeStats(sha256WasmTimes, size.bytes, cfg)

    // SHA-256 (Web Crypto) — only available on HTTPS or localhost
    if (hasWebCrypto) {
      onProgress?.({ step: ++step, totalSteps, current: `SHA-256 WebCrypto @ ${size.label}` })
      const sha256CryptoTimes = await runBatched((d) => crypto.subtle.digest('SHA-256', d), data, cfg)
      sizeResults.algorithms.sha256crypto = computeStats(sha256CryptoTimes, size.bytes, cfg)
    }

    results.push(sizeResults)
  }

  return results
}

export { hasWebCrypto }

export { SIZES }
