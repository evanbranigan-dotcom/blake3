# BLAKE3 vs SHA-256 Benchmark

> **Alpha / MVP** — This is an early experiment. The benchmark methodology is evolving and results should be treated as directional, not definitive. Contributions and feedback welcome.

A mobile-first webapp that benchmarks BLAKE3 against SHA-256 on your device, with narrative storytelling and real-time results.

## Hosted version

**[blake3.loonlabs.dev](https://blake3.loonlabs.dev)** — deployed on Vercel with HTTPS, so all four benchmark tests run including hardware-accelerated SHA-256.

## What it tests

| Algorithm | Implementation | What it measures |
|-----------|---------------|-----------------|
| BLAKE3 | hash-wasm (WebAssembly) | Pure software, single-threaded |
| BLAKE3 (multi-core) | hash-wasm + Web Workers | Parallel tree hashing across all CPU cores |
| SHA-256 (WASM) | hash-wasm (WebAssembly) | Pure software — apples-to-apples vs BLAKE3 |
| SHA-256 (HW) | Web Crypto API | Hardware-accelerated via ARM crypto extensions |

Tests run at 4 data sizes: 1 KB, 100 KB, 1 MB, 10 MB.

## Running locally

```bash
git clone https://github.com/evanbranigan-dotcom/blake3.git
cd blake3
bun install
bun dev
```

### HTTPS limitations

The Web Crypto API (`crypto.subtle`) requires a **secure context** — meaning HTTPS or `localhost`. This affects local development:

| Access method | BLAKE3 | BLAKE3 multi-core | SHA-256 WASM | SHA-256 HW |
|--------------|--------|-------------------|-------------|------------|
| `localhost:5173` (same machine) | Yes | Yes | Yes | Yes |
| `http://192.168.x.x:5173` (phone on LAN) | Yes | Yes | Yes | **No** |
| `https://blake3.loonlabs.dev` (hosted) | Yes | Yes | Yes | Yes |

When accessing over HTTP on a local network (e.g. from your phone), the app gracefully falls back to a 3-way comparison without the hardware-accelerated test. A notice is displayed explaining why.

Self-signed HTTPS via Vite's `@vitejs/plugin-basic-ssl` is included as a dev dependency but Safari on iOS rejects self-signed certs at the network level, so the hosted version is the most reliable way to get the full 4-way benchmark on a phone.

## Why

SHA-256 was designed in 2001 for single-core processors. BLAKE3 was designed in 2020 with parallelism, security, and modern hardware in mind. This benchmark lets you see the difference on your own device.

BLAKE3's advantages over SHA-256:
- **Parallel by design** — tree structure scales linearly with cores
- **No length extension attacks** — a fundamental SHA-256 vulnerability
- **Verified streaming** — verify data integrity during download, not after
- **Hardware independent** — fast everywhere, not just on chips with SHA extensions

## Bandwidth & hosting

Deployed on the **Vercel Free Plan** (100 GB/month). The site is extremely lean:

| Asset | Gzipped size |
|-------|-------------|
| HTML | ~7.3 KB |
| CSS | ~4.3 KB |
| JS (hash-wasm + app) | ~20.9 KB |
| Web Worker (loaded on demand) | ~8 KB |
| OG image (WebP) | ~69 KB |
| Favicon (SVG) | ~0.2 KB |
| **Total first visit** | **~110 KB** |

- No external fonts, analytics, tracking, or API calls — all computation is client-side
- Hashed filenames enable long browser caching; repeat visits transfer only ~7 KB (HTML)
- Approximately **900,000+ unique visits/month** before hitting the free tier limit

## Tech stack

- **Vite** — build tool
- **hash-wasm** — BLAKE3 and SHA-256 via hand-tuned WebAssembly
- **Web Crypto API** — browser-native hardware-accelerated SHA-256
- **Web Workers** — parallel BLAKE3 hashing across CPU cores
- **TypeScript** — strict mode, full type annotations across all source files
- **Vanilla TS + CSS** — no framework, minimal bundle (~21 KB gzipped JS)
- **Vercel** — hosting (HTTPS, free tier)

## Benchmark methodology

- Random data generated via `crypto.getRandomValues()` (chunked to 64 KB for Safari compatibility)
- Small data sizes use batch timing (many ops per measurement) to overcome browser timer resolution limits (~0.1ms due to Spectre mitigations)
- Web Crypto API calls use `Promise.all()` batching to avoid per-call async bridge overhead
- Each algorithm reports median throughput across multiple batches
- Hash verification proves all implementations compute correct, matching results on the same input data

## Device detection

The app detects iPhone models via screen dimensions, pixel ratio, and core count, mapping to chip generation and SHA-2 hardware acceleration status. Covers iPhone SE (2nd gen) through iPhone 16 Pro Max. Detection is best-effort — some models share screen characteristics.

## Future directions

We're exploring expanding the site beyond BLAKE3 vs SHA-256. Three prototype directions are linked from the main page:

- **[CryptoBench](/cryptobench.html)** — Encryption speed test across hashing, AES, HMAC, and key derivation
- **[DeviceBench](/devicebench.html)** — Full device diagnostic with hardware detection, browser feature matrix, and modular benchmarks
- **[HashMeter](/hashmeter.html)** — Speedtest.net for hashing — one big number, six algorithms from three decades

These are UI/UX mockups with hardcoded data, not yet wired to real benchmarks.

## Methodology & fact-checking

Every factual claim on the site has been [reviewed and sourced](/methodology.html). The methodology page documents:

- **Benchmark methodology** — algorithms, timing approach, known limitations
- **Primary sources** — RFCs, NIST publications, protocol specs for each claim
- **Editorial caveats** — where we make judgment calls (e.g., "structurally stronger" framing)
- **Correction log** — errors found and fixed, with dates and explanations

Corrections made after fact-checking (March 2026, second pass):
- Hero: "more secure" → "structurally stronger" (same security level; structural advantages, not raw strength)
- Weaknesses heading: "SHA-256 is Weak" → "SHA-256 is showing its age"; "weaknesses" → "limitations" with categorization
- SHA-256 card: "can't parallelize" → "can't parallelize a single message"; hardware framing softened
- Length extension: removed unverified "early AWS signature schemes" claim
- Quantum: fixed misleading longer-output/post-quantum claim
- Takeaway: added "Why it still dominates" counterpoint (25yr cryptanalysis, FIPS, hardware ubiquity)

Corrections (March 2026, first pass):
- TOTP section: default is HMAC-SHA-1, not SHA-256 (per RFC 6238)
- WPA2: uses PBKDF2-SHA-1, not PBKDF2-SHA-256 (per IEEE 802.11i)
- Bitcoin: "workaround" softened to "likely a defense" (unconfirmed by Satoshi)
- PDF signing: "every" changed to "most modern"
- iPhone 7 Plus: chip corrected from A11 to A10 Fusion / A11 Bionic

## Status

This is an alpha/MVP. Known limitations:
- Parallel BLAKE3 uses independent chunk hashing, not full Merkle tree assembly
- Device detection is approximate (Safari limits hardware fingerprinting for privacy)
- Benchmark variance can be high on mobile due to thermal throttling and background processes
- Timer resolution limits affect small-data accuracy despite batch mitigation

---

A [Loon Labs](https://loonlabs.dev) experiment.
