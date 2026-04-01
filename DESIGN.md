# Design System — BLAKE3 vs SHA-256

## Product Context
- **What this is:** Educational benchmark site comparing BLAKE3 vs SHA-256 hash algorithms with interactive visualizations
- **Who it's for:** Developers, security engineers, and technically curious people
- **Space/industry:** Cryptography education, developer tools, data visualization
- **Project type:** Hybrid — editorial content (ELI5 guides) + interactive data visualization (benchmark, visualizers)

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian — function-first, data-dense, monospace accents, muted palette
- **Decoration level:** Minimal — typography and canvas visualizations do all the work
- **Mood:** An instrument, not a marketing site. The data tells the story. Clean, precise, credible.
- **Reference:** Observable notebooks, D3 gallery — functional elegance over flashy product design

## Typography
- **Display/Hero:** System sans-serif — `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif`
- **Body:** Same system stack — consistent, zero-latency
- **UI/Labels:** Same as body, uppercase + letter-spacing for category labels
- **Data/Code:** `'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace`
- **Loading:** No web fonts. Deliberate choice: zero font-loading latency on a site about speed.
- **Scale:**
  - Hero: 28-32px, weight 700, letter-spacing -0.5px
  - Section title: 20px, weight 700, letter-spacing -0.3px
  - Body: 16px, line-height 1.6
  - UI small: 13px
  - Labels: 10-11px, uppercase, letter-spacing 1px
  - Data/mono: 11-14px depending on context

## Color

### Approach: Restrained
One accent per algorithm, neutrals for everything else. Color is functional, not decorative.

### Dark Theme (benchmark + visualizer pages)

**Backgrounds:**
- `--bg-deep: #0a0a0f` — page background
- `--bg-surface: #0d0d14` — panels, cards
- `--bg-cell: #111118` — inputs, data cells, nested elements

**Borders:**
- `--border: #1e1e28` — primary borders
- `--border-light: #2a2a36` — subtle borders, hover states

**Text:**
- `--text-bright: #e0e0e8` — headings, emphasized content
- `--text: #c8c8d0` — body text
- `--text-dim: #666666` — secondary text, labels
- `--text-muted: #444444` — tertiary text, disabled states

**Algorithm Accents:**
- `--sha256: #f59e0b` — SHA-256 (amber — warm, legacy, "old guard")
- `--blake3: #7c3aed` — BLAKE3 primary (purple — modern, fast, "new")
- `--blake3-bright: #a78bfa` — BLAKE3 text on dark backgrounds

Each accent has dim/border/glow variants for backgrounds and interactive states:
- `--sha256-dim: rgba(245, 158, 11, 0.08)`
- `--sha256-border: rgba(245, 158, 11, 0.2)`
- `--sha256-glow: rgba(245, 158, 11, 0.15)`
- `--blake3-dim: rgba(124, 58, 237, 0.08)`
- `--blake3-border: rgba(124, 58, 237, 0.2)`
- `--blake3-glow: rgba(124, 58, 237, 0.15)`

**Semantic:**
- `--green: #22c55e` — success, "DONE" overlays, positive results
- `--blue: #4488ff` — WebCrypto accent, informational
- `--red: #ef4444` — error states

### Light Theme (ELI5 pages only)

Intentional departure. The ELI5 section is educational and approachable, aimed at a broader audience. Warm light theme says "this is for learning."

- `--bg: #fafbff` — page background
- `--bg-card: #ffffff` — cards
- `--text: #1a1a2e` — body text
- `--text-dim: #4a4a6a` — secondary text
- `--border: #e8eaf0` — borders
- `--radius: 16px` — slightly rounder than dark theme (friendlier)

ELI5 accents: `--accent-blue: #4a7cff`, `--accent-green: #22c55e`, `--accent-orange: #f59e0b`, `--accent-purple: #8b5cf6`

### Color Unification Note

The main page (`style.css`) currently uses green `#00ff88` for BLAKE3 and orange `#ff8800` for SHA-256. These should be migrated to the unified palette (purple BLAKE3, amber SHA-256) for brand consistency across all dark-theme pages.

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable
- **Scale:** 2xs(2px) xs(4px) sm(8px) md(16px) lg(24px) xl(32px) 2xl(48px) 3xl(64px)

## Layout
- **Approach:** Hybrid — editorial for narrative pages, grid-disciplined for visualizer
- **Editorial pages:** max-width 720px (main), 680px (ELI5). Single column, readable.
- **Visualizer page:** max-width 1200px. Side-by-side panels for algorithm comparison.
- **Border radius:** sm(5px) for cells/inputs, md(8px) for buttons/alerts, lg(12px) for panels/cards, full(9999px) for badges/pills

## Motion
- **Approach:** Intentional — animations serve comprehension, not decoration
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** CSS transition default `--td: 250ms`
- **Reduced motion:** `@media (prefers-reduced-motion: reduce) { :root { --td: 0ms; } }` — also respected in JS animations (render final state instantly)
- **Canvas animations:** Custom easing functions (easeOutQuad, easeInQuad, easeOutBack). No animation library dependencies.

## Component Patterns

### Buttons
- Default: `bg-cell` background, `border-light` border, `text` color
- Primary (BLAKE3): `blake3-dim` background, `blake3` border, `blake3-bright` text
- SHA-256: `sha256-dim` background, `sha256-border` border, `sha256` text
- Success: `green-dim` background, green border
- Min touch target: 44px height
- Border radius: md (8px) for standalone, sm (5px) for grouped

### Panels
- Background: `bg-surface`
- Border: 1px solid `border`
- Border radius: lg (12px)
- Padding: 18px

### Data Cells
- Background: `bg-cell`
- Border: 1px solid `border`
- Border radius: sm (5px)
- Font: monospace, 11-13px
- Active state: accent-dim background, accent-border border, accent color text

### Insight Bars
- Background: `bg-surface` (panels) or `bg-cell` (nested)
- Border: 1px solid `border`, border-radius md (8px)
- Text: `text-dim`, emphasized words in `text-bright`
- Center-aligned, max-width matches section

### Progress Bars
- Track: `#1a1a22`, 3-4px height, border-radius 2px
- Fill: algorithm accent color
- Transition: `width var(--td) ease-out`

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-01 | Initial design system created | Formalized implicit CSS patterns from 3 stylesheets into unified system via /design-consultation |
| 2026-04-01 | System fonts, no web fonts | Zero font-loading latency on a site about hash speed. Deliberate constraint. |
| 2026-04-01 | Unified amber/purple accents | SHA-256 = amber (#f59e0b), BLAKE3 = purple (#7c3aed) across all dark-theme pages. Previously inconsistent (green/orange on main page). |
| 2026-04-01 | Light ELI5 theme is intentional | Educational pages target broader audience. Warm light theme signals "this is for learning." |
| 2026-04-01 | 44px minimum touch targets | Already implemented. Formalized as a rule. |
