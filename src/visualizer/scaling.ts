/**
 * Input-Size Scaling Visualizer (Layer 2)
 * Canvas-based visualization showing how SHA-256 and BLAKE3 handle growing data.
 * SHA-256: sequential block processing. BLAKE3: parallel chunks + Merkle tree.
 */

interface SizePreset {
  bytes: number;
  label: string;
  sha256Blocks: number;
  blake3Chunks: number;
}

const PRESETS: SizePreset[] = [
  { bytes: 1, label: '1 B', sha256Blocks: 1, blake3Chunks: 1 },
  { bytes: 64, label: '64 B', sha256Blocks: 1, blake3Chunks: 1 },
  { bytes: 1024, label: '1 KB', sha256Blocks: 16, blake3Chunks: 1 },
  { bytes: 8192, label: '8 KB', sha256Blocks: 128, blake3Chunks: 8 },
  { bytes: 65536, label: '64 KB', sha256Blocks: 1024, blake3Chunks: 64 },
  { bytes: 262144, label: '256 KB', sha256Blocks: 4096, blake3Chunks: 256 },
  { bytes: 1048576, label: '1 MB', sha256Blocks: 16384, blake3Chunks: 1024 },
  { bytes: 10485760, label: '10 MB', sha256Blocks: 163840, blake3Chunks: 10240 },
  { bytes: 104857600, label: '100 MB', sha256Blocks: 1638400, blake3Chunks: 102400 },
  { bytes: 1073741824, label: '1 GB', sha256Blocks: 16777216, blake3Chunks: 1048576 },
];

// Colors
const AMBER = '#f59e0b';
const AMBER_DIM = '#1a1610';
const PURPLE = '#a78bfa';
const PURPLE_DIM = '#14101e';
const CELL_BG = '#111118';

// DOM refs
let slider: HTMLInputElement;
let sizeDisplay: HTMLElement;
let sha256Canvas: HTMLCanvasElement;
let blake3Canvas: HTMLCanvasElement;
let sha256Stats: HTMLElement;
let blake3Stats: HTMLElement;
let btnAnimate: HTMLButtonElement;
let timelineSha: HTMLElement;
let timelineBlake: HTMLElement;
let scalingInsight: HTMLElement;
let sha256CountEl: HTMLElement;
let blake3CountEl: HTMLElement;

// State
let currentPreset = 0;
let animating = false;
let animFrame: number | null = null;

interface GridLayout {
  cols: number;
  rows: number;
  cellSize: number;
  gap: number;
  offsetX: number;
  offsetY: number;
}

function computeGrid(count: number, w: number, h: number): GridLayout {
  if (count <= 0) return { cols: 1, rows: 1, cellSize: w, gap: 0, offsetX: 0, offsetY: 0 };

  const gap = count > 512 ? 0 : count > 64 ? 1 : 2;
  const aspect = w / h;
  let cols = Math.max(1, Math.ceil(Math.sqrt(count * aspect)));
  let rows = Math.max(1, Math.ceil(count / cols));

  // Minimize empty cells
  while (cols > 1 && (cols - 1) * rows >= count) cols--;
  rows = Math.ceil(count / cols);

  const cellW = (w - (cols - 1) * gap) / cols;
  const cellH = (h - (rows - 1) * gap) / rows;
  const cellSize = Math.max(1, Math.floor(Math.min(cellW, cellH)));

  const totalW = cols * cellSize + (cols - 1) * gap;
  const totalH = rows * cellSize + (rows - 1) * gap;
  const offsetX = Math.floor((w - totalW) / 2);
  const offsetY = Math.floor((h - totalH) / 2);

  return { cols, rows, cellSize, gap, offsetX, offsetY };
}

function drawGrid(
  canvas: HTMLCanvasElement,
  count: number,
  litCount: number,
  color: string,
  dimColor: string,
): void {
  const ctx = canvas.getContext('2d')!;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;

  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  if (count === 0) { ctx.restore(); return; }

  const grid = computeGrid(count, w, h);

  for (let i = 0; i < count; i++) {
    const col = i % grid.cols;
    const row = Math.floor(i / grid.cols);
    const x = grid.offsetX + col * (grid.cellSize + grid.gap);
    const y = grid.offsetY + row * (grid.cellSize + grid.gap);

    ctx.fillStyle = i < litCount ? color : dimColor;

    if (grid.cellSize >= 4) {
      const r = Math.min(2, grid.cellSize / 4);
      ctx.beginPath();
      ctx.roundRect(x, y, grid.cellSize, grid.cellSize, r);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, grid.cellSize, grid.cellSize);
    }
  }
  ctx.restore();
}

function sizeCanvas(canvas: HTMLCanvasElement): void {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
}

function formatNum(n: number): string {
  return n.toLocaleString();
}

function updateDisplay(): void {
  const p = PRESETS[currentPreset];
  sizeDisplay.textContent = p.label;

  const sha256Rounds = p.sha256Blocks * 64;
  const blake3Rounds = p.blake3Chunks * 7;
  const treeLevels = p.blake3Chunks > 1 ? Math.ceil(Math.log2(p.blake3Chunks)) : 0;

  sha256CountEl.textContent = `${formatNum(p.sha256Blocks)} block${p.sha256Blocks !== 1 ? 's' : ''}`;
  blake3CountEl.textContent = `${formatNum(p.blake3Chunks)} chunk${p.blake3Chunks !== 1 ? 's' : ''}`;

  sha256Stats.innerHTML =
    `${formatNum(p.sha256Blocks)} × 64 = <em>${formatNum(sha256Rounds)}</em> rounds · sequential`;

  blake3Stats.innerHTML =
    `${formatNum(p.blake3Chunks)} × 7 = <em>${formatNum(blake3Rounds)}</em> rounds · parallel` +
    (treeLevels > 0 ? ` + ${treeLevels} tree levels` : '');

  // Draw full grids (all lit)
  drawGrid(sha256Canvas, p.sha256Blocks, p.sha256Blocks, AMBER, CELL_BG);
  drawGrid(blake3Canvas, p.blake3Chunks, p.blake3Chunks, PURPLE, CELL_BG);

  // Reset timeline
  timelineSha.style.width = '0%';
  timelineBlake.style.width = '0%';

  updateInsight(p, -1);

  // Enable/disable animate button
  btnAnimate.disabled = (p.sha256Blocks <= 1 && p.blake3Chunks <= 1);
}

function updateInsight(p: SizePreset, phase: number): void {
  if (phase === -1) {
    // Static state
    if (p.sha256Blocks === 1 && p.blake3Chunks === 1) {
      scalingInsight.innerHTML =
        `At <em>${p.label}</em>, both process a single block. Similar speed.`;
    } else {
      const treeLevels = p.blake3Chunks > 1 ? Math.ceil(Math.log2(p.blake3Chunks)) : 0;
      const seqWork = p.sha256Blocks * 64;
      const parWork = 7 + treeLevels;
      const speedup = Math.round(seqWork / parWork);
      scalingInsight.innerHTML =
        `At <em>${p.label}</em>: SHA-256 grinds through <em>${formatNum(p.sha256Blocks)}</em> blocks one by one. ` +
        `BLAKE3 runs <em>${formatNum(p.blake3Chunks)}</em> chunks simultaneously. ` +
        `With full parallelism: <em>~${formatNum(speedup)}×</em> architectural advantage.`;
    }
  }
}

function startAnimation(): void {
  if (animating) {
    stopAnimation();
    updateDisplay();
    return;
  }

  const p = PRESETS[currentPreset];
  if (p.sha256Blocks <= 1) return;

  animating = true;
  btnAnimate.textContent = '⏹ Stop';

  const treeLevels = p.blake3Chunks > 1 ? Math.ceil(Math.log2(p.blake3Chunks)) : 0;
  const blake3FinishTick = 1 + treeLevels; // 1 parallel pass + tree merge
  const sha256TotalTicks = p.sha256Blocks; // 1 tick per block

  // Animation runs for ~8 seconds
  const duration = 8000;
  const startTime = performance.now();
  let blake3DoneNotified = false;

  function frame(now: number): void {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);

    // SHA-256: linear sequential progress
    const sha256Lit = Math.min(p.sha256Blocks, Math.floor(t * p.sha256Blocks));
    drawGrid(sha256Canvas, p.sha256Blocks, sha256Lit, AMBER, CELL_BG);
    timelineSha.style.width = `${t * 100}%`;

    // BLAKE3: nearly instant (proportional to blake3FinishTick / sha256TotalTicks)
    const blake3Fraction = blake3FinishTick / sha256TotalTicks;
    const blake3T = Math.min(1, t / blake3Fraction);
    // Chunks all light up at once after the first proportional tick
    const blake3ChunkT = 1 / blake3FinishTick; // fraction where chunks are done
    const blake3Lit = (blake3T >= blake3ChunkT) ? p.blake3Chunks : 0;
    drawGrid(blake3Canvas, p.blake3Chunks, blake3Lit, PURPLE, CELL_BG);
    timelineBlake.style.width = `${Math.min(100, blake3T * 100)}%`;

    // Insight update when BLAKE3 finishes
    if (!blake3DoneNotified && blake3T >= 1) {
      blake3DoneNotified = true;
      const sha256Pct = Math.round(t * 100);
      const remaining = p.sha256Blocks - sha256Lit;
      scalingInsight.innerHTML =
        `<em>BLAKE3 is done.</em> SHA-256 is at ${sha256Pct}% — ` +
        `<em>${formatNum(remaining)}</em> blocks still to go.`;
    }

    if (t < 1) {
      animFrame = requestAnimationFrame(frame);
    } else {
      animating = false;
      btnAnimate.textContent = '▶ Animate';
      const blake3Ms = (blake3Fraction * duration / 1000);
      scalingInsight.innerHTML =
        `<em>Race over.</em> BLAKE3 finished in <em>${blake3Ms < 0.1 ? '<0.1' : blake3Ms.toFixed(1)}s</em> (proportional). ` +
        `SHA-256 took the full <em>${(duration / 1000).toFixed(0)}s</em>. ` +
        `That's the difference between sequential and parallel.`;
    }
  }

  animFrame = requestAnimationFrame(frame);
}

function stopAnimation(): void {
  animating = false;
  btnAnimate.textContent = '▶ Animate';
  if (animFrame) {
    cancelAnimationFrame(animFrame);
    animFrame = null;
  }
}

export function initScaling(): void {
  slider = document.getElementById('size-slider') as HTMLInputElement;
  sizeDisplay = document.getElementById('size-display') as HTMLElement;
  sha256Canvas = document.getElementById('sha256-grid') as HTMLCanvasElement;
  blake3Canvas = document.getElementById('blake3-grid') as HTMLCanvasElement;
  sha256Stats = document.getElementById('sha256-scale-stats') as HTMLElement;
  blake3Stats = document.getElementById('blake3-scale-stats') as HTMLElement;
  sha256CountEl = document.getElementById('sha256-block-count') as HTMLElement;
  blake3CountEl = document.getElementById('blake3-chunk-count') as HTMLElement;
  btnAnimate = document.getElementById('btn-animate') as HTMLButtonElement;
  timelineSha = document.getElementById('timeline-sha') as HTMLElement;
  timelineBlake = document.getElementById('timeline-blake') as HTMLElement;
  scalingInsight = document.getElementById('scaling-insight') as HTMLElement;

  // Size canvases for DPI
  sizeCanvas(sha256Canvas);
  sizeCanvas(blake3Canvas);

  slider.addEventListener('input', () => {
    currentPreset = parseInt(slider.value);
    stopAnimation();
    updateDisplay();
  });

  btnAnimate.addEventListener('click', startAnimation);

  // Handle resize
  let resizeTimer: ReturnType<typeof setTimeout>;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      sizeCanvas(sha256Canvas);
      sizeCanvas(blake3Canvas);
      updateDisplay();
    }, 150);
  });

  updateDisplay();
}
