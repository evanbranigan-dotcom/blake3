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

- **Bun** — package manager and runtime
- **Vite** — build tool
- **TypeScript** — strict mode, full type annotations
- **Vanilla TS + CSS** — no framework
- **hash-wasm** — BLAKE3 and SHA-256 via WebAssembly
- **Web Crypto API** — hardware-accelerated SHA-256
- **Web Workers** — parallel BLAKE3 hashing
- **Vercel** — hosting

## File Structure

```
blake3/
├── index.html              # Main page (narrative + benchmark)
├── methodology.html        # Methodology, sources, correction log
├── cryptobench.html        # Prototype: encryption speed test
├── devicebench.html        # Prototype: device diagnostic tool
├── hashmeter.html          # Prototype: Speedtest.net of hashing
├── style.css               # Main page styles
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.ts             # Entry, scroll reveal, benchmark button
│   ├── data.ts             # iPhone/Android model lookup tables
│   ├── device.ts           # Screen-based device detection
│   ├── benchmark.ts        # Benchmark engine (4 algorithms)
│   ├── results.ts          # Bar charts, insights, verdict
│   └── blake3-worker.ts    # Web Worker for parallel BLAKE3
├── eli5/
│   ├── index.html          # ELI5 guide hub (9 topic cards)
│   ├── eli5.ts             # Scroll-reveal animation
│   ├── eli5.css            # ELI5 shared styles
│   ├── sha-256.html        # SHA-256 intro
│   ├── how-sha256-works.html   # SHA-256 algorithm internals
│   ├── sha256-weaknesses.html  # Six structural limitations
│   ├── sha256-everywhere.html  # Ten real-world use cases with sources
│   ├── blake3.html         # BLAKE3 intro
│   ├── how-blake3-works.html   # BLAKE3 algorithm internals
│   ├── compliance.html     # Why gov can't use BLAKE3
│   ├── private-sector.html # Why private sector doesn't use BLAKE3
│   └── adoption.html       # Who's actually using BLAKE3
├── public/
│   ├── favicon.svg
│   └── og-image.webp       # Open Graph image (69 KB)
├── fact-check.md           # 116 claims assessed (internal reference)
├── research.md             # Research notes & Android options
├── CLAUDE.md               # This file
├── README.md               # Public repo documentation
└── docs/session-log.md     # Development session log
```

## Deployment

Deployed at [blake3.loonlabs.dev](https://blake3.loonlabs.dev) via Vercel (free plan).

## Bandwidth Profile

Total first-visit transfer: ~110 KB gzipped. No external fonts, analytics, tracking, or API calls. All benchmark computation is client-side. Hashed filenames enable long browser caching. Comfortably within Vercel free tier (100 GB/month) for 900K+ unique visits/month. OG image uses WebP format (69 KB, converted from 140 KB PNG).

## Main Page Sections

The main page (`index.html`) flows as a narrative:

1. **Hero** — "Is your phone using a hash function from 2001?"
2. **Two Eras** — Side-by-side SHA-256 vs BLAKE3 comparison cards
3. **Your Device** — Auto-detected device/chip info
4. **The Benchmark** — Live BLAKE3 vs SHA-256 benchmark runner
5. **The Verdict** — Dynamic results summary
6. **Open Questions** — Research questions (collapsible)
7. **Future Directions** — Links to prototype mockups

The "SHA-256 weaknesses" and "SHA-256 is everywhere" content has been moved to dedicated ELI5 pages.

## ELI5 Guide Section

The `/eli5/` path hosts 9 educational pages explaining hash functions for a general audience. Pages use their own shared CSS (`eli5.css`) and scroll-reveal JS (`eli5.ts`). Component patterns: `analogy-card`, `visual-demo`, `steps`, `fun-fact`, `data-flow`, `state-matrix`, `round-visual`, `xof-demo`.

All ELI5 HTML files must be listed in `vite.config.ts` `rollupOptions.input` to be included in the production build.

## Responsive Breakpoints

Three breakpoints used throughout:
- **640px** — Tablet (reduced section padding, smaller titles, single-column story grid)
- **480px** — Mobile (compact padding, smaller card interiors, tighter gaps)
- Touch targets are minimum 44px on all interactive elements.

## Methodology & Sources

`methodology.html` is a standalone page documenting:
- Benchmark methodology (algorithms, timing, known limitations)
- Primary sources for every factual claim, organized by section
- Caveats and editorial choices (e.g., "structurally stronger" framing, BLAKE3 as replacement)
- Correction log (errors found and fixed via fact-checking)

Linked from the footer and the Open Questions section. Uses the shared `style.css` but overrides `.section { opacity: 1 }` since it doesn't load `main.ts` (which provides scroll-reveal animation).

## Fact-Check

`fact-check.md` is an internal reference document with 116 claims extracted from the site, each assessed and rated. Not deployed. Summary: 3 errors were found and corrected (TOTP default algorithm, WPA2 hash algorithm, iPhone 7 Plus chip).

## Prototype Directions

Three static HTML mockups exploring future directions for the site:

- **cryptobench.html** — "CryptoBench" encryption speed test (blue accent, composite score)
- **devicebench.html** — "DeviceBench" device diagnostic tool (teal accent, feature detection)
- **hashmeter.html** — "HashMeter" Speedtest.net of hashing (green accent, headline number)

These are UI/UX mockups with hardcoded data — not wired to the benchmark engine. Linked from the "Future directions" section of the main page.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
