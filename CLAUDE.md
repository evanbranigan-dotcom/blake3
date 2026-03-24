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
