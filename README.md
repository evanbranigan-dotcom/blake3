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

## Tech stack

- **Vite** — build tool
- **hash-wasm** — BLAKE3 and SHA-256 via hand-tuned WebAssembly
- **Web Crypto API** — browser-native hardware-accelerated SHA-256
- **Web Workers** — parallel BLAKE3 hashing across CPU cores
- **Vanilla JS + CSS** — no framework, minimal bundle (~47 KB gzipped)
- **Vercel** — hosting (HTTPS)

## Benchmark methodology

- Random data generated via `crypto.getRandomValues()` (chunked to 64 KB for Safari compatibility)
- Small data sizes use batch timing (many ops per measurement) to overcome browser timer resolution limits (~0.1ms due to Spectre mitigations)
- Web Crypto API calls use `Promise.all()` batching to avoid per-call async bridge overhead
- Each algorithm reports median throughput across multiple batches
- Hash verification proves all implementations compute correct, matching results on the same input data

## Device detection

The app detects iPhone models via screen dimensions, pixel ratio, and core count, mapping to chip generation and SHA-2 hardware acceleration status. Covers iPhone SE (2nd gen) through iPhone 16 Pro Max. Detection is best-effort — some models share screen characteristics.

## Status

This is an alpha/MVP. Known limitations:
- Parallel BLAKE3 uses independent chunk hashing, not full Merkle tree assembly
- Device detection is approximate (Safari limits hardware fingerprinting for privacy)
- Benchmark variance can be high on mobile due to thermal throttling and background processes
- Timer resolution limits affect small-data accuracy despite batch mitigation

---

A [Loon Labs](https://loonlabs.dev) experiment.
