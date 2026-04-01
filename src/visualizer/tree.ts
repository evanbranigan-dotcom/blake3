/**
 * Tree Visualization (Layer 3)
 * Canvas rendering of SHA-256's Merkle-Damgård chain vs BLAKE3's Merkle tree.
 * Shows WHY parallelism matters: a chain has sequential dependency,
 * a tree collapses in log(N) steps.
 */

interface Point { x: number; y: number }

// Colors
const AMBER = '#f59e0b';
const AMBER_LINE = 'rgba(245, 158, 11, 0.25)';
const AMBER_LINE_LIT = 'rgba(245, 158, 11, 0.7)';
const PURPLE = '#a78bfa';
const PURPLE_LINE = 'rgba(124, 58, 237, 0.25)';
const PURPLE_LINE_LIT = 'rgba(124, 58, 237, 0.7)';
const GREEN = '#22c55e';
const NODE_BG = '#1a1a22';
const NODE_BORDER = 'rgba(255,255,255,0.06)';
const TEXT_DIM = '#555';

// DOM refs
let shaCanvas: HTMLCanvasElement;
let blakeCanvas: HTMLCanvasElement;
let presetBtns: HTMLButtonElement[];
let btnAnimate: HTMLButtonElement;
let insightEl: HTMLElement;

// State
let count = 8;
let animating = false;
let animFrame: number | null = null;

function nodeRadius(n: number): number {
  if (n <= 4) return 14;
  if (n <= 8) return 10;
  if (n <= 16) return 7;
  return 5;
}

// ── SHA-256 chain layout (snake pattern) ──

function buildChain(n: number, w: number, h: number, pad: number): Point[] {
  const r = nodeRadius(n);
  const minGap = r * 3;
  const perRow = Math.min(n, Math.max(1, Math.floor((w - 2 * pad) / minGap)));
  const rows = Math.ceil(n / perRow);
  const colGap = perRow > 1 ? (w - 2 * pad) / (perRow - 1) : 0;
  const rowGap = rows > 1 ? (h - 2 * pad) / (rows - 1) : 0;

  const pts: Point[] = [];
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    // Snake: even rows L→R, odd rows R→L
    const xCol = row % 2 === 0 ? col : perRow - 1 - col;
    pts.push({
      x: pad + xCol * colGap,
      y: pad + row * rowGap + (rows === 1 ? (h - 2 * pad) / 2 : 0),
    });
  }
  return pts;
}

// ── BLAKE3 tree layout (leaves at bottom, root at top) ──

function buildTree(numLeaves: number, w: number, h: number, pad: number): Point[][] {
  const counts: number[] = [];
  let c = numLeaves;
  while (c >= 1) {
    counts.push(c);
    if (c === 1) break;
    c = Math.ceil(c / 2);
  }

  const numLevels = counts.length;
  const levelH = numLevels > 1 ? (h - 2 * pad) / (numLevels - 1) : 0;
  const levels: Point[][] = [];

  // Level 0 = leaves (bottom)
  levels[0] = [];
  const leafGap = numLeaves > 1 ? (w - 2 * pad) / (numLeaves - 1) : 0;
  for (let i = 0; i < numLeaves; i++) {
    levels[0].push({ x: pad + i * leafGap, y: h - pad });
  }

  // Internal levels (bottom-up, x = avg of children)
  for (let l = 1; l < numLevels; l++) {
    levels[l] = [];
    for (let i = 0; i < counts[l]; i++) {
      const c1 = levels[l - 1][i * 2];
      const c2 = levels[l - 1][i * 2 + 1];
      levels[l].push({
        x: c2 ? (c1.x + c2.x) / 2 : c1.x,
        y: h - pad - l * levelH,
      });
    }
  }

  return levels;
}

// ── Drawing ──

function drawChain(chain: Point[], litCount: number): void {
  const ctx = shaCanvas.getContext('2d')!;
  const dpr = window.devicePixelRatio || 1;
  const w = shaCanvas.width / dpr;
  const h = shaCanvas.height / dpr;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const r = nodeRadius(count);

  // Connections
  ctx.lineWidth = 1.5;
  for (let i = 0; i < chain.length - 1; i++) {
    ctx.strokeStyle = i < litCount - 1 ? AMBER_LINE_LIT : AMBER_LINE;
    ctx.beginPath();
    ctx.moveTo(chain[i].x, chain[i].y);
    ctx.lineTo(chain[i + 1].x, chain[i + 1].y);
    ctx.stroke();
  }

  // Nodes
  for (let i = 0; i < chain.length; i++) {
    const lit = i < litCount;
    ctx.beginPath();
    ctx.arc(chain[i].x, chain[i].y, r, 0, Math.PI * 2);
    ctx.fillStyle = lit ? AMBER : NODE_BG;
    ctx.fill();
    ctx.strokeStyle = lit ? AMBER : NODE_BORDER;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Labels
  ctx.fillStyle = TEXT_DIM;
  ctx.font = '9px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('IV', chain[0].x, chain[0].y - r - 5);
  const last = chain[chain.length - 1];
  ctx.fillText('hash', last.x, last.y + r + 12);

  ctx.restore();
}

function drawTree(levels: Point[][], litLevel: number): void {
  const ctx = blakeCanvas.getContext('2d')!;
  const dpr = window.devicePixelRatio || 1;
  const w = blakeCanvas.width / dpr;
  const h = blakeCanvas.height / dpr;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const r = nodeRadius(count);

  // Connections (parent → children)
  ctx.lineWidth = 1.5;
  for (let l = 1; l < levels.length; l++) {
    for (let i = 0; i < levels[l].length; i++) {
      const parent = levels[l][i];
      const c1 = levels[l - 1][i * 2];
      const c2 = levels[l - 1][i * 2 + 1];
      const lit = l <= litLevel && (l - 1) <= litLevel;

      ctx.strokeStyle = lit ? PURPLE_LINE_LIT : PURPLE_LINE;
      ctx.beginPath();
      ctx.moveTo(parent.x, parent.y);
      ctx.lineTo(c1.x, c1.y);
      ctx.stroke();

      if (c2) {
        ctx.beginPath();
        ctx.moveTo(parent.x, parent.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.stroke();
      }
    }
  }

  // Nodes (level by level)
  for (let l = 0; l < levels.length; l++) {
    const lit = l <= litLevel;
    const isRoot = l === levels.length - 1;
    for (const p of levels[l]) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = lit ? (isRoot ? GREEN : PURPLE) : NODE_BG;
      ctx.fill();
      ctx.strokeStyle = lit ? (isRoot ? GREEN : PURPLE) : NODE_BORDER;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Labels
  ctx.fillStyle = TEXT_DIM;
  ctx.font = '9px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  const root = levels[levels.length - 1][0];
  ctx.fillText('root', root.x, root.y - r - 5);
  ctx.fillText('chunks (parallel)', w / 2, levels[0][0].y + r + 12);

  ctx.restore();
}

// ── Canvas sizing ──

function sizeCanvas(canvas: HTMLCanvasElement): void {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
}

// ── Update & animate ──

function update(): void {
  sizeCanvas(shaCanvas);
  sizeCanvas(blakeCanvas);

  const dpr = window.devicePixelRatio || 1;
  const w = shaCanvas.width / dpr;
  const h = shaCanvas.height / dpr;
  const pad = 30;

  const chain = buildChain(count, w, h, pad);
  const tree = buildTree(count, w, h, pad);

  drawChain(chain, count);
  drawTree(tree, tree.length - 1);

  const treeLevels = tree.length;
  const ratio = Math.round(count / treeLevels);
  insightEl.innerHTML =
    `<em>${count} blocks:</em> SHA-256 chains them — block ${count} waits for all ${count - 1} before it. ` +
    `BLAKE3 processes all ${count} chunks at once, then merges in <em>${treeLevels - 1} tree levels</em>. ` +
    `<em>${ratio}× fewer steps.</em>`;

  presetBtns.forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.count || '0') === count);
  });
}

function animate(): void {
  if (animating) {
    stopAnim();
    update();
    return;
  }

  animating = true;
  btnAnimate.textContent = '⏹ Stop';

  const dpr = window.devicePixelRatio || 1;
  const w = shaCanvas.width / dpr;
  const h = shaCanvas.height / dpr;
  const pad = 30;

  const chain = buildChain(count, w, h, pad);
  const tree = buildTree(count, w, h, pad);
  const treeLevels = tree.length;

  const duration = 6000;
  const start = performance.now();
  let blake3Done = false;

  function frame(now: number): void {
    const t = Math.min(1, (now - start) / duration);

    // SHA-256: sequential, one node per tick
    const shaLit = Math.min(count, Math.ceil(t * count));
    drawChain(chain, shaLit);

    // BLAKE3: proportionally faster (treeLevels steps vs count steps)
    const blake3Frac = treeLevels / count;
    const blake3T = Math.min(1, t / blake3Frac);
    const litLevel = Math.min(treeLevels - 1, Math.floor(blake3T * treeLevels));
    drawTree(tree, litLevel);

    if (!blake3Done && blake3T >= 1) {
      blake3Done = true;
      insightEl.innerHTML =
        `<em>BLAKE3 tree complete.</em> SHA-256 chain: ${Math.round(t * 100)}% — ` +
        `block <em>${shaLit}</em> of ${count}.`;
    }

    if (t < 1) {
      animFrame = requestAnimationFrame(frame);
    } else {
      animating = false;
      btnAnimate.textContent = '▶ Animate';
      insightEl.innerHTML =
        `<em>Done.</em> BLAKE3 needed <em>${treeLevels} steps</em> (1 parallel + ${treeLevels - 1} merge). ` +
        `SHA-256 needed <em>${count} sequential steps</em>. ` +
        `The tree architecture is <em>${Math.round(count / treeLevels)}× faster</em>.`;
    }
  }

  animFrame = requestAnimationFrame(frame);
}

function stopAnim(): void {
  animating = false;
  btnAnimate.textContent = '▶ Animate';
  if (animFrame) {
    cancelAnimationFrame(animFrame);
    animFrame = null;
  }
}

export function initTree(): void {
  shaCanvas = document.getElementById('sha256-chain') as HTMLCanvasElement;
  blakeCanvas = document.getElementById('blake3-tree') as HTMLCanvasElement;
  presetBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('.tree-preset-btn'));
  btnAnimate = document.getElementById('btn-tree-animate') as HTMLButtonElement;
  insightEl = document.getElementById('tree-insight') as HTMLElement;

  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      count = parseInt(btn.dataset.count || '8');
      stopAnim();
      update();
    });
  });

  btnAnimate.addEventListener('click', animate);

  let resizeTimer: ReturnType<typeof setTimeout>;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(update, 150);
  });

  update();
}
