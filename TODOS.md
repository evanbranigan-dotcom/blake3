# TODOs

## Main page color migration
**What:** Migrate `style.css` colors to unified palette (green BLAKE3 → purple `#7c3aed`, orange SHA-256 → amber `#f59e0b`).

**Why:** DESIGN.md specifies unified amber/purple across all dark-theme pages. The main page still uses the old green/orange colors, creating visual inconsistency when navigating between the main page and `/visualizer/`.

**Context:** The main page has `--blake3: #00ff88`, `--sha256: #ff8800` in `style.css:15-19`. These need to become `--blake3: #7c3aed` / `--blake3-bright: #a78bfa` and `--sha256: #f59e0b`. Also affects `--blake3-multi: #bf5af2` (multi-core purple) which may need to become a shade variant. The benchmark results bars, chart colors, and insight text all reference these variables. Needs visual QA after migration. See DESIGN.md "Color Unification Note" for full details.

**Depends on:** Nothing. Can be done independently of the visualizer polish work.
