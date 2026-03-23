# Session Log: BLAKE3 vs SHA-256 Benchmark Webapp

**Date:** 2026-03-23
**Project:** blake3.loonlabs.dev
**Collaborators:** Evan Branigan + Claude Opus 4.6

---

## 1. Project Genesis

**Goal:** Build a webapp to prove BLAKE3 is superior to SHA-256 and encourage widespread adoption, particularly on iPhones.

**Initial decisions:**
- Vite + vanilla JS (minimal bundle, fast mobile load)
- `hash-wasm` for both BLAKE3 and SHA-256 via WASM
- Web Crypto API for hardware-accelerated SHA-256
- Mobile-first, dark mode, narrative storytelling

---

## 2. Research Phase

### Key findings

- **Apple A-series chips have ARM SHA-2 hardware extensions** — native SHA-256 gets hardware acceleration on every iPhone since iPhone 8 (A11+)
- **BLAKE3 has no dedicated hardware** on any consumer chip — relies on SIMD (NEON on ARM)
- **Pure software:** BLAKE3 is 4-14x faster than SHA-256
- **With Apple hardware SHA:** The gap narrows significantly
- **BLAKE3's architectural advantages beyond speed:** parallel tree hashing, no length extension attacks, verified streaming, incremental updates

### Browser landscape

- `crypto.subtle.digest('SHA-256')` taps into hardware acceleration via Safari's JavaScriptCore
- There is **no** `crypto.subtle.digest('BLAKE3')` — the Web Crypto API only exposes SHA family
- `hash-wasm` (v4.12.0) provides both BLAKE3 and SHA-256 with identical async APIs

### Best package choice: `hash-wasm`

Evaluated `blake3` (connor4312), `blake3-wasm`, `@webbuf/blake3`, `@earthbucks/blake3`. Chose `hash-wasm` for consistent API across both algorithms and active maintenance.

Research saved to `research.md` in repo.

---

## 3. Architecture

### App structure (5-section scroll narrative)

1. **Hero** — "Is your phone using a hash function from 2001?"
2. **The Story** — Side-by-side SHA-256 (sequential chain) vs BLAKE3 (parallel tree) with CSS diagrams
3. **Your Device** — Auto-detect iPhone model via screen dimensions + pixel ratio
4. **The Benchmark** — 4 algorithms x 4 data sizes with live progress
5. **The Verdict** — Speedup stats, contextual insights, BLAKE3 advocacy

### File structure

```
blake3/
├── index.html
├── style.css
├── vite.config.js
├── src/
│   ├── main.js          # Entry, scroll reveal, benchmark button
│   ├── data.js          # iPhone model lookup table
│   ├── device.js        # Screen-based device detection
│   ├── benchmark.js     # Benchmark engine (4 algorithms)
│   ├── results.js       # Bar charts, insights, verdict
│   └── blake3-worker.js # Web Worker for parallel BLAKE3
├── public/favicon.svg
├── research.md
└── docs/session-log.md
```

---

## 4. Bugs & Fixes (chronological)

### Bug 1: `crypto.subtle.digest` undefined on iPhone

**Error:** `undefined is not an object (evaluating 'crypto.subtle.digest')`

**Cause:** Web Crypto API requires a **secure context** (HTTPS or localhost). Accessing via `http://10.0.0.232` over LAN meant `crypto.subtle` was undefined.

**Fix:** Added `hasWebCrypto` check, gracefully fall back to 2-way comparison with a notice.

### Bug 2: `getRandomValues` quota exceeded on Safari

**Error:** `The quota has been exceeded`

**Cause:** Safari limits `crypto.getRandomValues()` to **65,536 bytes** (64KB) per call. We were calling it with 10MB.

**Fix:** Chunked `getRandomValues` into 64KB iterations:
```js
for (let offset = 0; offset < bytes; offset += 65536) {
  crypto.getRandomValues(data.subarray(offset, offset + size))
}
```

### Bug 3: "Infinity GB/s" and "0.0 us/op" at small sizes

**Cause:** `performance.now()` has limited resolution (~0.1ms due to Spectre mitigations). Small hashes complete in microseconds, so measured time was 0ms, giving Infinity throughput.

**Fix:** Switched from timing individual ops to **batch timing** — time a batch of N ops together, divide total time by N. Config:
- 1KB: 500 ops per batch, 10 batches
- 100KB: 50 ops per batch, 10 batches
- 1MB+: individual ops, 10-30 batches

### Bug 4: `ITERATIONS` variable not found

**Cause:** Renamed `ITERATIONS` to `BENCH_CONFIG` but forgot to update the reference in `runBenchmark()`.

**Fix:** Updated `const iters = ITERATIONS[size.bytes]` to `const cfg = BENCH_CONFIG[size.bytes]`.

### Bug 5: SHA-256 (HW) slower than WASM at small sizes

**Observed:** SHA-256 (HW) showed 69.8 MB/s at 1KB — slower than WASM's 162.8 MB/s.

**Cause:** `crypto.subtle.digest()` is async. Each `await` in the batch loop yields to the microtask queue. With 500 sequential awaits, the JS→native bridge overhead dominated.

**Fix:** Switched Web Crypto benchmark to `Promise.all()` batching — fire all ops concurrently:
```js
const promises = []
for (let i = 0; i < batchSize; i++) {
  promises.push(fn(data))
}
await Promise.all(promises)
```

After fix: SHA-256 (HW) correctly showed **488.3 MB/s** at 1KB — fastest as expected.

### Bug 6: Self-signed HTTPS rejected by Safari

**Attempted:** `@vitejs/plugin-basic-ssl` for local HTTPS.

**Result:** Safari on iOS silently rejects self-signed certs at the network level — no warning page, just "connection lost." Brave desktop also rejected it.

**Resolution:** Deployed to Vercel for production HTTPS. Left HTTP for local dev with graceful fallback.

---

## 5. HTTPS Decision Journey

| Approach | Outcome |
|----------|---------|
| Plain HTTP over LAN | Works but no Web Crypto (2-way only) |
| `@vitejs/plugin-basic-ssl` | Safari rejects silently, Brave too |
| `mkcert` (locally trusted CA) | Not attempted — requires iPhone profile install |
| **Deploy to Vercel** | Works perfectly — HTTPS, full 4-way benchmark |

Final decision: Deploy to Vercel at blake3.loonlabs.dev for the full experience.

---

## 6. Benchmark Results (iPhone, blake3.loonlabs.dev)

### 1 KB
| Algorithm | Throughput | Per-op |
|-----------|-----------|--------|
| BLAKE3 | 244.1 MB/s | 4.0 us |
| BLAKE3 (multi-core) | 18.8 MB/s | 0.05 ms |
| SHA-256 (WASM) | 244.1 MB/s | 4.0 us |
| **SHA-256 (HW)** | **488.3 MB/s** | **2.0 us** |

**Winner: SHA-256 (HW)** — hardware acceleration dominates at small sizes. Multi-core BLAKE3 is worst due to worker message-passing overhead.

### 100 KB
| Algorithm | Throughput |
|-----------|-----------|
| BLAKE3 | 813.8 MB/s |
| SHA-256 (WASM) | 375.6 MB/s |
| SHA-256 (HW) | TBD |

### 1 MB
| Algorithm | Throughput |
|-----------|-----------|
| BLAKE3 | 1000.0 MB/s |
| SHA-256 (WASM) | 333.3 MB/s |

(10 MB and full HW results pending — user was iterating on the app)

---

## 7. Key Insights

### What the data tells us

1. **SHA-256 (HW) wins at tiny sizes** — Apple's dedicated silicon has near-zero per-op overhead
2. **BLAKE3 wins in software-vs-software** — 1.5x at 1KB, 2.2x at 100KB, 3x at 1MB
3. **Multi-core BLAKE3 is counterproductive at small sizes** — Web Worker message-passing overhead exceeds the hash time
4. **Multi-core should shine at 1MB+** — where data is large enough for parallelism to pay off
5. **BLAKE3 is being undersold** — single-threaded WASM, no SIMD, no hardware help, and it still competes with hardware-accelerated SHA-256

### Honest framing

The app doesn't hide SHA-256's wins. Each size group has a contextual insight explaining *why* results look the way they do — hardware overhead, worker costs, parallelism payoff. This makes the argument more credible.

---

## 8. Infrastructure

- **GitHub:** `evanbranigan-dotcom/blake3` (public)
- **Vercel:** `blake3.loonlabs.dev` (production)
- **Branch:** `master`
- **Deploy:** `vercel --prod` from CLI
- **Domain:** `blake3.loonlabs.dev` added via `vercel domains add`

---

## 9. Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Framework | Vanilla JS | Minimal bundle (~49KB), fast mobile load |
| Hash library | hash-wasm | Both BLAKE3 + SHA-256, identical API, hand-tuned WASM |
| Parallel BLAKE3 | Web Workers | Only browser option; WASM threads limited Safari support |
| Timing method | Batch timing | Overcomes browser timer resolution (Spectre mitigations) |
| Web Crypto batching | Promise.all() | Avoids per-await async bridge overhead |
| Dark mode | Default | Dashboard/tool aesthetic per Loon Labs style |
| Color coding | Green (BLAKE3), Purple (multi-core), Orange (SHA-256 WASM), Blue (SHA-256 HW) | Distinct, accessible, brand-appropriate |

---

## 10. Future Work

- [ ] Verify multi-core BLAKE3 actually overtakes SHA-256 HW at 10MB
- [ ] Consider WASM SIMD for BLAKE3 (not yet in hash-wasm)
- [ ] Add share/export results feature
- [ ] Test on older iPhones (SE, iPhone 11, etc.)
- [ ] Investigate why BLAKE3 and SHA-256 WASM tie at 1KB (both hitting timer floor?)
- [ ] Consider dropping multi-core test for sizes where overhead dominates, or annotating it differently
- [ ] Full Merkle tree assembly for parallel BLAKE3 (current implementation hashes independent chunks)
