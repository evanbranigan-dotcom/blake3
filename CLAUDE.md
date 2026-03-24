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

Deployed at [blake3.loonlabs.dev](https://blake3.loonlabs.dev) via Vercel (free plan).

## Bandwidth Profile

Total first-visit transfer: ~110 KB gzipped. No external fonts, analytics, tracking, or API calls. All benchmark computation is client-side. Hashed filenames enable long browser caching. Comfortably within Vercel free tier (100 GB/month) for 900K+ unique visits/month. OG image uses WebP format (69 KB, converted from 140 KB PNG).

## Page Sections

The main page (`index.html`) flows as a narrative:

1. **Hero** — "Is your phone using a hash function from 2001?"
2. **Two Eras** — Side-by-side SHA-256 vs BLAKE3 comparison cards
3. **SHA-256 is Weak** — Six structural weaknesses (collapsible accordion)
4. **SHA-256 is Everywhere** — Ten real-world use cases (collapsible accordion)
5. **Your Device** — Auto-detected device/chip info
6. **The Benchmark** — Live BLAKE3 vs SHA-256 benchmark runner
7. **The Verdict** — Dynamic results summary
8. **Open Questions** — Research questions (collapsible)
9. **Future Directions** — Links to prototype mockups

Sections 3 and 4 use a seam-style `<details>` accordion — a horizontal rule with centered label text that reveals content on click. Inner cards are also individually expandable, with only-one-open behavior via JS.

## Responsive Breakpoints

Three breakpoints used throughout:
- **640px** — Tablet (reduced section padding, smaller titles, single-column story grid)
- **480px** — Mobile (compact padding, smaller card interiors, tighter gaps)
- Touch targets are minimum 44px on all interactive elements.

## Methodology & Sources

`methodology.html` is a standalone page documenting:
- Benchmark methodology (algorithms, timing, known limitations)
- Primary sources for every factual claim, organized by section
- Caveats and editorial choices (e.g., "more secure" framing, BLAKE3 as replacement)
- Correction log (errors found and fixed via fact-checking)

Linked from the footer and the Open Questions section. Uses the shared `style.css` but overrides `.section { opacity: 1 }` since it doesn't load `main.js` (which provides scroll-reveal animation).

## Inline Source Citations

Each of the 10 use case cards in the "SHA-256 is everywhere" section has a `<p class="usage-source">` with links to primary sources (RFCs, specs, official docs). Styled as subtle muted text with a thin top border.

## Fact-Check

`fact-check.md` is an internal reference document with 116 claims extracted from the site, each assessed and rated. Not deployed. Summary: 3 errors were found and corrected (TOTP default algorithm, WPA2 hash algorithm, iPhone 7 Plus chip).

## Prototype Directions

Three static HTML mockups exploring future directions for the site:

- **cryptobench.html** — "CryptoBench" encryption speed test (blue accent, composite score)
- **devicebench.html** — "DeviceBench" device diagnostic tool (teal accent, feature detection)
- **hashmeter.html** — "HashMeter" Speedtest.net of hashing (green accent, headline number)

These are UI/UX mockups with hardcoded data — not wired to the benchmark engine. Linked from the "Future directions" section of the main page.
