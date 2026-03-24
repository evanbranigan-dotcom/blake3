# BLAKE3 Benchmark

## Package Manager

Use **bun** (not npm/yarn/pnpm) for all dependency and script commands:

```bash
bun install    # install dependencies
bun dev        # start dev server
bun run build  # production build
bun run preview # preview production build
```

## Tech Stack

- **Vite** — build tool
- **Vanilla JS + CSS** — no framework
- **hash-wasm** — BLAKE3 and SHA-256 via WebAssembly
- **Web Crypto API** — hardware-accelerated SHA-256
- **Web Workers** — parallel BLAKE3 hashing
- **Vercel** — hosting

## Deployment

Deployed at [blake3.loonlabs.dev](https://blake3.loonlabs.dev) via Vercel.

## Prototype Directions

Three static HTML mockups exploring future directions for the site:

- **cryptobench.html** — "CryptoBench" encryption speed test (blue accent, composite score)
- **devicebench.html** — "DeviceBench" device diagnostic tool (teal accent, feature detection)
- **hashmeter.html** — "HashMeter" Speedtest.net of hashing (green accent, headline number)

These are UI/UX mockups with hardcoded data — not wired to the benchmark engine. Linked from the "Future directions" section of the main page.
