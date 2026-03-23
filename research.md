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

---

## Android Implementation Research

> Three approaches for bringing the BLAKE3 benchmark to Android, ordered from lightest-lift to most ambitious.

### Option 1: Trusted Web Activity (TWA) Wrapper

**Concept**: Package the existing web app (blake3.loonlabs.dev) as a native Android app using a Trusted Web Activity. The TWA runs full-screen Chrome with no browser UI, served from your verified domain. Users install it from the Play Store but the benchmark code stays 100% web-based.

#### What You Get For Free
- All four benchmark tests (BLAKE3, BLAKE3 multi-core, SHA-256 WASM, SHA-256 HW) work identically since it's running in a full browser context with HTTPS
- Web Workers and WebAssembly work natively in the TWA's Chrome engine
- Web Crypto API is available (HTTPS via your Vercel domain)
- Zero code duplication — updates to the web app deploy instantly to TWA users
- Play Store distribution and discoverability

#### What You'd Need to Build
- An Android Studio project with the TWA launcher activity (~50 lines of boilerplate)
- `assetlinks.json` on blake3.loonlabs.dev for domain verification (links Play Store app to domain)
- A minimal `AndroidManifest.xml` with TWA intent filters
- Play Store listing assets (screenshots, icon, description)

#### What You'd Lose vs. Native
- No access to Android-specific hardware detection (Snapdragon model, Tensor chip identification)
- Can't use JNI/NDK for native BLAKE3 (stuck with WASM performance ceiling)
- Can't detect ARMv8 crypto extensions at the hardware level
- Limited device info — Android Chrome restricts `navigator.userAgent` and doesn't expose SoC model
- Slight overhead from Chrome rendering vs. native Compose UI

#### Effort: ~1-2 days

#### Best For: Getting on the Play Store fast, testing Android market interest before investing in native code

#### Key Resources
- [Android TWA Documentation](https://developer.android.com/develop/ui/views/layout/webapps/trusted-web-activities)
- [Fireship TWA Tutorial](https://fireship.io/lessons/pwa-to-play-store/)

---

### Option 2: Native Kotlin/Compose App with JNI BLAKE3

**Concept**: Build a native Android app in Kotlin + Jetpack Compose that mirrors the web app's storytelling benchmark flow, but uses native implementations for maximum performance. BLAKE3 runs via JNI bindings to the official Rust/C implementation. SHA-256 uses Android's `MessageDigest` which automatically leverages ARMv8 crypto extensions when available.

#### Architecture

```
UI Layer (Jetpack Compose)
  |
  +-- Device Detection Module
  |     +-- Build.SOC_MODEL / Build.HARDWARE (Snapdragon 8 Gen 3, Tensor G4, etc.)
  |     +-- /proc/cpuinfo parsing for "aes pmull sha1 sha2" features
  |     +-- Runtime.getRuntime().availableProcessors() for core count
  |
  +-- Benchmark Engine (Kotlin Coroutines)
  |     +-- BLAKE3 single-thread -> JNI call to blake3_hash()
  |     +-- BLAKE3 multi-core -> Dispatchers.Default coroutines splitting data across cores
  |     +-- SHA-256 (Java) -> MessageDigest.getInstance("SHA-256") (auto-uses HW if available)
  |     +-- SHA-256 (Bouncy Castle) -> pure software comparison baseline
  |
  +-- Results Renderer (Compose Canvas for bar charts, animated)
```

#### Android-Specific Device Detection (The Big Win)

This is where native Android dramatically outperforms the web version. Instead of guessing from screen dimensions like `data.js` does for iPhones:

```kotlin
// Exact SoC identification
val socModel = Build.SOC_MODEL        // e.g., "SM8650" (Snapdragon 8 Gen 3)
val socManufacturer = Build.SOC_MANUFACTURER  // e.g., "Qualcomm"
val hardware = Build.HARDWARE         // e.g., "taro", "tensor"
val model = Build.MODEL               // e.g., "Pixel 8 Pro"
val cores = Runtime.getRuntime().availableProcessors()

// ARMv8 Crypto Extensions detection
val cpuInfo = File("/proc/cpuinfo").readText()
val hasCryptoExtensions = cpuInfo.contains("sha2") && cpuInfo.contains("aes")
```

You could build a **lookup table for Android chips** equivalent to `data.js`:

| SoC Model | Marketing Name | Process | SHA-2 HW | Cores |
|-----------|---------------|---------|----------|-------|
| SM8650 | Snapdragon 8 Gen 3 | 4nm | Yes (ARMv9.2) | 8 |
| SM8550 | Snapdragon 8 Gen 2 | 4nm | Yes (ARMv9) | 8 |
| SM7550 | Snapdragon 7+ Gen 2 | 4nm | Yes | 8 |
| Tensor G4 | Google Tensor G4 | 4nm | Yes | 9 |
| Tensor G3 | Google Tensor G3 | 4nm | Yes | 9 |
| Dimensity 9300 | MediaTek Dimensity 9300 | 4nm | Yes | 8 |
| Exynos 2400 | Samsung Exynos 2400 | 4nm | Yes | 8 |

**Unlike iPhones, Android gives you exact chip identification** — no screen-dimension guessing needed.

#### BLAKE3 via JNI

Two approaches:

1. **[appmattus/crypto](https://github.com/appmattus/crypto)** — Pure Kotlin Multiplatform implementation of BLAKE3. No JNI needed, but won't be as fast as native C/Rust.
2. **BLAKE3 official C implementation + JNI wrapper** — Compile the [official BLAKE3 C code](https://github.com/BLAKE3-team/BLAKE3/tree/master/c) with Android NDK. This gets you **NEON SIMD intrinsics on ARM**, which the WASM version in the web app *cannot* access. This is "true" BLAKE3 performance.

The JNI approach would demonstrate something the web app structurally cannot: **BLAKE3 with ARM NEON SIMD**, which could be 2-5x faster than the WASM implementation.

#### Effort: ~2-3 weeks

#### Best For: A showcase of BLAKE3's real-world Android performance, accurate device detection, and a proper native benchmark that sidesteps browser overhead entirely

#### Key Resources
- [BLAKE3 C Implementation](https://github.com/BLAKE3-team/BLAKE3/tree/master/c)
- [Android NDK JNI Tips](https://developer.android.com/ndk/guides/jni-tips)
- [appmattus/crypto Kotlin Library](https://github.com/appmattus/crypto)
- [SMLBLAKE3.kt — Pure Kotlin BLAKE3](https://github.com/mahdisml/SMLBLAKE3.kt)
- [JNI Performance Analysis](https://medium.com/@akashcsanjeev/crossing-the-line-jni-basics-and-real-performance-838d5acc6d8c) — JNI crossing cost is ~36ns per call; for large compute-heavy hashing the overhead is negligible

---

### Option 3: Hybrid Compose Multiplatform + Shared Benchmark Core

**Concept**: Use Kotlin Multiplatform (KMP) with Compose Multiplatform to build a single codebase that compiles to both Android native and Kotlin/WASM for the web — replacing the current Vite web app entirely. One benchmark engine, two targets.

#### Architecture

```
Shared Module (commonMain)
  +-- BenchmarkEngine.kt          -- data sizes, batch config, stats computation
  +-- DeviceDetector.kt (expect)  -- platform-specific device detection
  +-- HashProvider.kt (expect)    -- platform-specific hash implementations
  +-- ResultsModel.kt             -- shared data classes for results

Android Module (androidMain)
  +-- DeviceDetector.kt (actual)  -- Build.SOC_MODEL, /proc/cpuinfo
  +-- HashProvider.kt (actual)    -- JNI BLAKE3 + MessageDigest SHA-256
  +-- App.kt                      -- Jetpack Compose UI

Web/WASM Module (wasmJsMain)
  +-- DeviceDetector.kt (actual)  -- navigator.userAgent, screen dimensions (existing logic)
  +-- HashProvider.kt (actual)    -- hash-wasm bindings via JS interop
  +-- App.kt                      -- Compose for Web UI
```

#### Why This Is Interesting

- **Apples-to-apples benchmark across platforms**: The same Kotlin benchmark engine runs on both Android native and web WASM, eliminating implementation differences as a variable. The *only* difference is the platform's hash implementation.
- **Kotlin/WASM is ~3x faster than JavaScript**: [Compose for Web benchmarks](https://www.kmpship.app/blog/kotlin-wasm-and-compose-web-2025) show Kotlin/WASM significantly outperforms JS in UI workloads. The web version could get faster just by switching from vanilla JS to Kotlin/WASM.
- **Shared storytelling**: The narrative sections (hero, story, device card, verdict) share the same Compose components across platforms.
- **One codebase to maintain**: Feature additions (new hash algorithms, new data sizes, SIMD experiments) automatically land on both platforms.

#### Trade-offs

- **Compose for Web is still maturing** — not production-stable for all use cases as of early 2026
- **Bundle size is larger** than vanilla JS (~200KB+ WASM module vs. ~47KB gzipped currently)
- **Significant rewrite** — the existing vanilla JS app would be rebuilt from scratch in Kotlin
- **Web Workers interop from Kotlin/WASM** is tricky — parallel BLAKE3 on the web target would need JS interop wrappers
- **Learning curve** if you're not already deep in KMP/Compose Multiplatform

#### What Makes It a Compelling Story

The BLAKE3 benchmark app is *about* demonstrating that technology from 2020 beats technology from 2001. Building it with Compose Multiplatform extends that argument: "Here's the same benchmark, running the same code, on native Android and in your browser — and BLAKE3 wins on both."

You could also add a **cross-platform results comparison**: "Your Pixel 8 Pro hashed 10 MB in X ms natively. The same code compiled to WASM ran in Y ms in Chrome. BLAKE3 was fastest either way."

#### Effort: ~4-6 weeks

#### Best For: Long-term investment if you want the benchmark to become *the* reference implementation for comparing BLAKE3 performance across Android and web

#### Key Resources
- [Compose Multiplatform](https://github.com/JetBrains/compose-multiplatform)
- [Kotlin/WASM Overview](https://kotlinlang.org/docs/wasm-overview.html)
- [Kotlin/WASM + Compose for Web in 2025/2026](https://www.kmpship.app/blog/kotlin-wasm-and-compose-web-2025)
- [KotlinCrypto/hash — Multiplatform Hash Library](https://github.com/KotlinCrypto/hash)

---

### Android Options Decision Matrix

| Factor | TWA Wrapper | Native Kotlin/Compose | KMP Hybrid |
|--------|------------|----------------------|------------|
| Effort | 1-2 days | 2-3 weeks | 4-6 weeks |
| Device detection accuracy | Low (browser-limited) | **Exact** (SoC model, crypto extensions) | Exact on Android, browser-limited on web |
| BLAKE3 performance ceiling | WASM only | **Native C + NEON SIMD** | Native on Android, WASM on web |
| SHA-256 HW detection | Guessed from user agent | **Runtime-verified** via /proc/cpuinfo | Runtime on Android, guessed on web |
| Parallel BLAKE3 quality | Web Workers (message-passing overhead) | **Coroutines** (zero-copy, same process) | Platform-specific |
| Code reuse with web app | 100% (same app) | 0% (full rewrite) | ~60% shared benchmark logic |
| Play Store distribution | Yes | Yes | Yes (Android target) |
| Maintenance burden | Near zero | Separate codebase | Single codebase, two targets |
| "Wow factor" | Low — feels like a website | **High** — real native benchmark with exact hardware info | Highest — same code, two platforms |

### Recommendation

**Start with Option 2 (Native Kotlin/Compose)** if you want to build something meaningfully different from the web app. The killer features are:

1. **Exact chip detection** — `Build.SOC_MODEL` gives you Snapdragon 8 Gen 3, Tensor G4, etc. No guessing.
2. **Native BLAKE3 with NEON SIMD** — demonstrates performance the web version structurally cannot reach
3. **ARMv8 crypto extension detection** — tells users definitively whether their SHA-256 is hardware-accelerated
4. **Coroutine-based parallelism** — cleaner and lower-overhead than Web Workers for multi-core BLAKE3

The Android chip ecosystem (Snapdragon, Tensor, Dimensity, Exynos) is far more diverse than Apple's A-series, making the benchmark results more interesting and varied across devices.

If you just want Play Store presence quickly, **Option 1 (TWA)** gets you there in a day. You can always build the native version later.

**Option 3 (KMP Hybrid)** is the most elegant long-term architecture but only makes sense if you plan to actively maintain both platforms and are comfortable with Compose Multiplatform's maturity level.

---

## Sources

- [SHA-256 Alternatives 2025: BLAKE3 vs SHA-3 vs xxHash3 Benchmarks](https://devtoolspro.org/articles/sha256-alternatives-faster-hash-functions-2025/)
- [BLAKE3 official repo](https://github.com/BLAKE3-team/BLAKE3)
- [hash-wasm — Lightning fast hash functions](https://github.com/Daninet/hash-wasm)
- [Exploring SHA-256 Performance on the Browser](https://medium.com/@ronantech/exploring-sha-256-performance-on-the-browser-browser-apis-javascript-libraries-wasm-webgpu-9d9e8e681c81)
- [hash-wasm vs Web Crypto API benchmark](https://www.measurethat.net/Benchmarks/Show/32592/1/hash-wasm-vs-web-crypto-api)
- [BLAKE3 vs SHA-256 comparison](https://ssojet.com/compare-hashing-algorithms/sha-256-vs-blake3)
- [Performance Evaluation of Hashing Algorithms](https://arxiv.org/html/2407.08284v1)
- [Reasons to Prefer BLAKE3 over SHA-256 (HN)](https://brianlovin.com/hn/38249473)
- [appmattus/crypto — Kotlin Multiplatform hashing](https://github.com/appmattus/crypto)
- [SMLBLAKE3.kt — Pure Kotlin BLAKE3](https://github.com/mahdisml/SMLBLAKE3.kt)
- [KotlinCrypto/hash — Multiplatform hash functions](https://github.com/KotlinCrypto/hash)
- [Android TWA Documentation](https://developer.android.com/develop/ui/views/layout/webapps/trusted-web-activities)
- [JNI Performance on Android](https://medium.com/@akashcsanjeev/crossing-the-line-jni-basics-and-real-performance-838d5acc6d8c)
- [Android NDK JNI Tips](https://developer.android.com/ndk/guides/jni-tips)
- [Hardware-accelerated disk encryption in Android](https://nelenkov.blogspot.com/2015/05/hardware-accelerated-disk-encryption-in.html)
- [ARM AArch64cryptolib](https://github.com/ARM-software/AArch64cryptolib)
- [Compose Multiplatform](https://github.com/JetBrains/compose-multiplatform)
- [Kotlin/WASM Overview](https://kotlinlang.org/docs/wasm-overview.html)
- [Kotlin/WASM + Compose for Web](https://www.kmpship.app/blog/kotlin-wasm-and-compose-web-2025)
- [Android Cryptography Guide](https://developer.android.com/privacy-and-security/cryptography)
