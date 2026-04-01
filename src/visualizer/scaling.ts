/**
 * Input-Size Scaling Visualizer (Layer 2)
 * Canvas-based visualization showing how SHA-256 and BLAKE3 handle growing data.
 * Includes a core count selector for realistic device modeling.
 *
 * Throughput model:
 *   SHA-256: ~4 GB/s single-threaded (ARM SHA2 hardware acceleration)
 *   BLAKE3:  ~1.5 GB/s per core (no hardware accel, but parallelizable)
 *
 * At 1 core, SHA-256 wins. At 6+ cores, BLAKE3 pulls ahead.
 * At ∞ cores, BLAKE3 is architecturally instant.
 */

import { sizeCanvas, drawWatermark, autoplayOnScroll, prefersReducedMotion } from './animation-utils';

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

// Throughput in bytes per second
const SHA256_GBps = 4;   // ~4 GB/s with hardware accel (ARM SHA2, Apple Silicon)
const BLAKE3_GBps = 1.5; // ~1.5 GB/s per core (no hardware accel)

// Colors
const AMBER = '#f59e0b';
const PURPLE = '#a78bfa';
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
let coreBtns: HTMLButtonElement[];

// State
let currentPreset = 0;
let currentCores = 0; // 0 = infinity (theoretical)
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
  drawWatermark(ctx, w, h);
  ctx.restore();
}

function fmt(n: number): string {
  return n.toLocaleString();
}

function fmtTime(seconds: number): string {
  if (seconds < 0.001) return '<1 ms';
  if (seconds < 1) return `${Math.round(seconds * 1000)} ms`;
  return `${seconds.toFixed(2)}s`;
}

/** Compute wall-clock time in seconds for SHA-256 (always single-threaded) */
function sha256Time(bytes: number): number {
  return bytes / (SHA256_GBps * 1024 * 1024 * 1024);
}

/** Compute wall-clock time in seconds for BLAKE3 with N cores */
function blake3Time(bytes: number, cores: number, chunks: number): number {
  const effectiveCores = Math.min(cores, chunks);
  return bytes / (BLAKE3_GBps * 1024 * 1024 * 1024 * effectiveCores);
}

function isInfinite(): boolean {
  return currentCores === 0;
}

function updateDisplay(): void {
  const p = PRESETS[currentPreset];
  sizeDisplay.textContent = p.label;

  const sha256Rounds = p.sha256Blocks * 64;
  const blake3Rounds = p.blake3Chunks * 7;
  const treeLevels = p.blake3Chunks > 1 ? Math.ceil(Math.log2(p.blake3Chunks)) : 0;

  sha256CountEl.textContent = `${fmt(p.sha256Blocks)} block${p.sha256Blocks !== 1 ? 's' : ''}`;
  blake3CountEl.textContent = `${fmt(p.blake3Chunks)} chunk${p.blake3Chunks !== 1 ? 's' : ''}`;

  if (isInfinite()) {
    // Theoretical / architectural mode
    sha256Stats.innerHTML =
      `${fmt(p.sha256Blocks)} × 64 = <em>${fmt(sha256Rounds)}</em> rounds · sequential`;
    blake3Stats.innerHTML =
      `${fmt(p.blake3Chunks)} × 7 = <em>${fmt(blake3Rounds)}</em> rounds · parallel` +
      (treeLevels > 0 ? ` + ${treeLevels} tree levels` : '');
  } else {
    // Realistic mode with core count
    const effCores = Math.min(currentCores, p.blake3Chunks);
    const shaT = sha256Time(p.bytes);
    const blakeT = blake3Time(p.bytes, currentCores, p.blake3Chunks);

    sha256Stats.innerHTML =
      `<em>${fmtTime(shaT)}</em> · single-threaded · ~${SHA256_GBps} GB/s (hardware accel)`;
    blake3Stats.innerHTML =
      `<em>${fmtTime(blakeT)}</em> · ${effCores} core${effCores !== 1 ? 's' : ''} · ~${(BLAKE3_GBps * effCores).toFixed(1)} GB/s effective`;
  }

  // Draw full grids (all lit)
  drawGrid(sha256Canvas, p.sha256Blocks, p.sha256Blocks, AMBER, CELL_BG);
  drawGrid(blake3Canvas, p.blake3Chunks, p.blake3Chunks, PURPLE, CELL_BG);

  // Reset timeline
  timelineSha.style.width = '0%';
  timelineBlake.style.width = '0%';

  updateInsight(p);

  btnAnimate.disabled = (p.sha256Blocks <= 1 && p.blake3Chunks <= 1);

  // Update active core button
  coreBtns.forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.cores || '0') === currentCores);
  });
}

function updateInsight(p: SizePreset): void {
  if (p.sha256Blocks === 1 && p.blake3Chunks === 1) {
    scalingInsight.innerHTML =
      `At <em>${p.label}</em>, both process a single block. Similar speed.`;
    return;
  }

  if (isInfinite()) {
    const treeLevels = p.blake3Chunks > 1 ? Math.ceil(Math.log2(p.blake3Chunks)) : 0;
    const seqWork = p.sha256Blocks * 64;
    const parWork = 7 + treeLevels;
    const speedup = Math.round(seqWork / parWork);
    scalingInsight.innerHTML =
      `<em>∞ cores (theoretical):</em> SHA-256 grinds through <em>${fmt(p.sha256Blocks)}</em> blocks sequentially. ` +
      `BLAKE3 runs <em>${fmt(p.blake3Chunks)}</em> chunks simultaneously. ` +
      `Architectural advantage: <em>~${fmt(speedup)}×</em>.`;
    return;
  }

  const shaT = sha256Time(p.bytes);
  const blakeT = blake3Time(p.bytes, currentCores, p.blake3Chunks);
  const ratio = shaT / blakeT;

  if (ratio >= 1) {
    scalingInsight.innerHTML =
      `<em>${currentCores} core${currentCores !== 1 ? 's' : ''}:</em> BLAKE3 is <em>${ratio.toFixed(1)}×</em> faster. ` +
      `SHA-256: ${fmtTime(shaT)} (single-threaded, hardware accel). ` +
      `BLAKE3: ${fmtTime(blakeT)} (${Math.min(currentCores, p.blake3Chunks)} cores).`;
  } else {
    const invRatio = blakeT / shaT;
    scalingInsight.innerHTML =
      `<em>${currentCores} core${currentCores !== 1 ? 's' : ''}:</em> SHA-256 is <em>${invRatio.toFixed(1)}×</em> faster here. ` +
      `Hardware acceleration (ARM SHA2) beats BLAKE3's single-core throughput. ` +
      `Add more cores to see BLAKE3 pull ahead.`;
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

  const duration = 8000;
  const startTime = performance.now();
  let winnerNotified = false;

  // Compute relative speeds
  let shaFraction: number; // fraction of duration SHA-256 takes
  let blakeFraction: number; // fraction of duration BLAKE3 takes

  if (isInfinite()) {
    // Theoretical: BLAKE3 nearly instant
    const treeLevels = p.blake3Chunks > 1 ? Math.ceil(Math.log2(p.blake3Chunks)) : 0;
    const blake3Ticks = 1 + treeLevels;
    shaFraction = 1; // SHA-256 takes full duration
    blakeFraction = blake3Ticks / p.sha256Blocks;
  } else {
    // Realistic: based on throughput
    const shaT = sha256Time(p.bytes);
    const blakeT = blake3Time(p.bytes, currentCores, p.blake3Chunks);
    const maxT = Math.max(shaT, blakeT);
    shaFraction = shaT / maxT;
    blakeFraction = blakeT / maxT;
  }

  function frame(now: number): void {
    const elapsed = now - startTime;
    const t = Math.min(1, elapsed / duration);

    // SHA-256 progress
    const shaProgress = Math.min(1, t / shaFraction);
    const sha256Lit = Math.min(p.sha256Blocks, Math.floor(shaProgress * p.sha256Blocks));
    drawGrid(sha256Canvas, p.sha256Blocks, sha256Lit, AMBER, CELL_BG);
    timelineSha.style.width = `${shaProgress * 100}%`;

    // BLAKE3 progress
    const blakeProgress = Math.min(1, t / blakeFraction);
    let blake3Lit: number;
    if (isInfinite()) {
      // Theoretical: all chunks light up at once early on
      const treeLevels = p.blake3Chunks > 1 ? Math.ceil(Math.log2(p.blake3Chunks)) : 0;
      const chunkFrac = 1 / (1 + treeLevels);
      blake3Lit = blakeProgress >= chunkFrac ? p.blake3Chunks : 0;
    } else {
      // Realistic: chunks fill linearly (N at a time)
      blake3Lit = Math.min(p.blake3Chunks, Math.floor(blakeProgress * p.blake3Chunks));
    }
    drawGrid(blake3Canvas, p.blake3Chunks, blake3Lit, PURPLE, CELL_BG);
    timelineBlake.style.width = `${blakeProgress * 100}%`;

    // Notify when the winner finishes
    if (!winnerNotified && (shaProgress >= 1 || blakeProgress >= 1)) {
      winnerNotified = true;
      const loserProgress = shaProgress >= 1
        ? Math.round(blakeProgress * 100)
        : Math.round(shaProgress * 100);
      const winner = shaProgress >= 1 ? 'SHA-256' : 'BLAKE3';
      const loser = shaProgress >= 1 ? 'BLAKE3' : 'SHA-256';
      scalingInsight.innerHTML =
        `<em>${winner} done.</em> ${loser}: ${loserProgress}%.`;
    }

    if (t < 1) {
      animFrame = requestAnimationFrame(frame);
    } else {
      animating = false;
      btnAnimate.textContent = '▶ Animate';

      if (isInfinite()) {
        const blake3Ms = blakeFraction * duration / 1000;
        scalingInsight.innerHTML =
          `<em>Race over.</em> BLAKE3 finished in <em>${blake3Ms < 0.1 ? '<0.1' : blake3Ms.toFixed(1)}s</em> (proportional). ` +
          `SHA-256 took the full <em>${(duration / 1000).toFixed(0)}s</em>.`;
      } else {
        const shaT = sha256Time(p.bytes);
        const blakeT = blake3Time(p.bytes, currentCores, p.blake3Chunks);
        const ratio = shaT / blakeT;
        if (ratio >= 1) {
          scalingInsight.innerHTML =
            `<em>Done.</em> BLAKE3 won — <em>${ratio.toFixed(1)}× faster</em> ` +
            `(${fmtTime(blakeT)} vs ${fmtTime(shaT)}).`;
        } else {
          scalingInsight.innerHTML =
            `<em>Done.</em> SHA-256 won — <em>${(1 / ratio).toFixed(1)}× faster</em> ` +
            `(${fmtTime(shaT)} vs ${fmtTime(blakeT)}). Hardware acceleration beats single-core BLAKE3.`;
        }
      }
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
  coreBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('.core-btn'));

  sizeCanvas(sha256Canvas);
  sizeCanvas(blake3Canvas);

  slider.addEventListener('input', () => {
    currentPreset = parseInt(slider.value);
    stopAnimation();
    updateDisplay();
  });

  coreBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentCores = parseInt(btn.dataset.cores || '0');
      stopAnimation();
      updateDisplay();
    });
  });

  btnAnimate.addEventListener('click', startAnimation);

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

  // Autoplay: trigger first animation when section scrolls into view
  const scalingSection = document.querySelector('.scaling-section') as HTMLElement;
  if (scalingSection) {
    autoplayOnScroll(scalingSection, (instant) => {
      if (instant) {
        // Reduced motion: show final state directly
        currentPreset = 4; // 64 KB — interesting comparison
        slider.value = '4';
        updateDisplay();
      } else {
        // Animate from a preset that shows the difference
        currentPreset = 4;
        slider.value = '4';
        updateDisplay();
        startAnimation();
      }
    });
  }
}
