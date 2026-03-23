# BLAKE3 vs SHA-256: Research Notes

## Purpose

Prove BLAKE3 is superior to SHA-256 and encourage widespread adoption, particularly on iPhones.

## Key Findings

### Hardware Acceleration on iPhone

- Apple A-series chips (A17 Pro, A18 Pro) include **ARM SHA-2 hardware extensions** (`FEAT_SHA256`)
- Native SHA-256 via CryptoKit or Web Crypto API gets hardware acceleration on iPhone
- BLAKE3 has **no dedicated hardware instructions** on any consumer chip — relies on SIMD (NEON on ARM)
- In a browser, `crypto.subtle.digest('SHA-256', ...)` likely taps into hardware via Safari's JavaScriptCore

### Pure Software Performance

- BLAKE3 is **4-14x faster** than SHA-256 in pure software
- BLAKE3: ~1.5M+ ops/s vs SHA-256: ~300K ops/s (Node.js, small inputs)
- BLAKE3: ~14x faster than SHA-256 for large file hashing
- On ARM without SHA extensions, SHA-256 drops to 500-800 MB/s while BLAKE3 maintains 3-4 GB/s

### BLAKE3 Architectural Advantages

1. **Parallelism** — Splits input into 1 KiB chunks, processes as binary tree. Scales linearly with cores. SHA-256 is inherently sequential (Merkle-Damgard construction).
2. **No length extension attacks** — SHA-256 is vulnerable; BLAKE3 is not
3. **Verified streaming** — Tree structure allows on-the-fly verification of partial data
4. **Incremental updates** — Can update a hash without rehashing everything
5. **Consistent performance** — Doesn't depend on hardware crypto extensions existing
6. **Smaller memory footprint** — More efficient memory utilization

### Browser-Specific Performance Data

WASM vs Web Crypto API for SHA-256 (from benchmark data):

| Data Size | WASM SHA-256 | Web Crypto API SHA-256 |
|-----------|-------------|----------------------|
| 100KB     | 3ms         | 8ms                  |
| 1MB       | 3ms         | 58ms                 |
| 10MB      | 27ms        | 479ms                |

Note: These numbers seem to favor WASM surprisingly heavily — our own benchmarks on iPhone will provide definitive data.

### The Adoption Gap

- The Web Crypto API (`SubtleCrypto`) only exposes SHA family hashes — there is **no `crypto.subtle.digest('BLAKE3')`**
- Apple CryptoKit only supports SHA-2 algorithms — **no native BLAKE3 support**
- This means BLAKE3 adoption requires third-party libraries (WASM in browsers, Rust/C in native apps)
- Most devices globally lack SHA hardware extensions, making BLAKE3's software speed advantage even more relevant

## Best Available Browser Libraries

| Package | Version | Notes |
|---------|---------|-------|
| `hash-wasm` | 4.12.0 | 30+ algorithms, hand-tuned WASM, consistent async API, actively maintained |
| `blake3` (connor4312) | 3.0.0 | Native Node bindings + WASM browser fallback, dependency issues noted |
| `@webbuf/blake3` | 3.5.0 | Rust/WASM optimized, most recently updated |
| `@earthbucks/blake3` | — | Inline sync WASM, no external .wasm files |

**Recommended: `hash-wasm`** — provides both BLAKE3 and SHA-256 with identical APIs for fair comparison.

## Benchmark Strategy

Test 3 methods to tell the full story:

| Method | What It Tests |
|--------|--------------|
| `crypto.subtle.digest('SHA-256')` | Web Crypto API (hardware-accelerated on iPhone) |
| `hash-wasm` SHA-256 | WASM SHA-256 (pure software, apples-to-apples) |
| `hash-wasm` BLAKE3 | WASM BLAKE3 (pure software) |

Test across multiple data sizes: 1KB, 100KB, 1MB, 10MB, 100MB

## The Compelling Story

Even if hardware-accelerated SHA-256 is competitive on iPhones *today*:

- BLAKE3 doesn't need special hardware to be fast
- BLAKE3's parallelism advantage grows with data size
- Most devices globally don't have SHA hardware extensions
- BLAKE3 is cryptographically stronger (no length extension attacks)
- BLAKE3 enables capabilities SHA-256 can't (verified streaming, incremental updates)

## Sources

- [SHA-256 Alternatives 2025: BLAKE3 vs SHA-3 vs xxHash3 Benchmarks](https://devtoolspro.org/articles/sha256-alternatives-faster-hash-functions-2025/)
- [BLAKE3 official repo](https://github.com/BLAKE3-team/BLAKE3)
- [hash-wasm — Lightning fast hash functions](https://github.com/Daninet/hash-wasm)
- [Exploring SHA-256 Performance on the Browser](https://medium.com/@ronantech/exploring-sha-256-performance-on-the-browser-browser-apis-javascript-libraries-wasm-webgpu-9d9e8e681c81)
- [hash-wasm vs Web Crypto API benchmark](https://www.measurethat.net/Benchmarks/Show/32592/1/hash-wasm-vs-web-crypto-api)
- [BLAKE3 vs SHA-256 comparison](https://ssojet.com/compare-hashing-algorithms/sha-256-vs-blake3)
- [Performance Evaluation of Hashing Algorithms](https://arxiv.org/html/2407.08284v1)
- [Reasons to Prefer BLAKE3 over SHA-256 (HN)](https://brianlovin.com/hn/38249473)
