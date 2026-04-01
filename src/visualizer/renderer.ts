/**
 * DOM renderer for the hash algorithm visualizer.
 * Race mode: both algorithms advance on every tick. BLAKE3 finishes first.
 * Round tower: vertical strip showing all rounds as blocks.
 */

import { sha256Trace } from './sha256-state';
import type { Sha256Trace, Sha256Registers } from './sha256-state';
import { blake3Trace } from './blake3-state';
import type { Blake3Trace } from './blake3-state';

// DOM references
let inputField: HTMLInputElement;
let btnPlay: HTMLButtonElement;
let btnReset: HTMLButtonElement;
let speedButtons: HTMLButtonElement[];
let sha256Regs: HTMLElement;
let sha256Round: HTMLElement;
let sha256Progress: HTMLElement;
let sha256Annotation: HTMLElement;
let sha256Tower: HTMLElement;
let sha256Panel: HTMLElement;
let sha256DoneOverlay: HTMLElement;
let blake3Matrix: HTMLElement;
let blake3Round: HTMLElement;
let blake3Progress: HTMLElement;
let blake3Annotation: HTMLElement;
let blake3Phase: HTMLElement;
let blake3Tower: HTMLElement;
let blake3Panel: HTMLElement;
let blake3DoneOverlay: HTMLElement;
let insightBar: HTMLElement;

// State
let sha256Data: Sha256Trace | null = null;
let blake3Data: Blake3Trace | null = null;
let currentSha256Round = -1;
let currentBlake3Round = -1;
let playing = false;
let playTimer: ReturnType<typeof setTimeout> | null = null;
let speed = 300;

function toHex(n: number): string {
  return (n >>> 0).toString(16).padStart(8, '0');
}

function computeTraces(): void {
  const text = inputField.value || 'hello';
  try {
    sha256Data = sha256Trace(text);
    blake3Data = blake3Trace(text);
    currentSha256Round = -1;
    currentBlake3Round = -1;
    buildTowers();
    renderAll();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    insightBar.textContent = `Error: ${msg}`;
  }
}

/** Build the round tower visualizations — one block per round */
function buildTowers(): void {
  // SHA-256: 64 round blocks
  sha256Tower.innerHTML = '';
  for (let i = 0; i < 64; i++) {
    const block = document.createElement('div');
    block.className = 'tower-block tower-block-sha';
    block.dataset.round = String(i);
    block.title = `Round ${i + 1}`;
    sha256Tower.appendChild(block);
  }

  // BLAKE3: 14 half-round blocks (7 rounds x 2 phases)
  blake3Tower.innerHTML = '';
  for (let i = 0; i < 14; i++) {
    const block = document.createElement('div');
    block.className = 'tower-block tower-block-blake';
    block.dataset.round = String(i);
    const roundNum = Math.floor(i / 2) + 1;
    const phase = i % 2 === 0 ? 'col' : 'diag';
    block.title = `Round ${roundNum} (${phase})`;
    blake3Tower.appendChild(block);
  }
}

function renderAll(): void {
  renderSha256State();
  renderBlake3State();
  updateTowers();
  updateInsight();
  updateControls();
  updateDoneOverlays();
}

function renderSha256State(): void {
  if (!sha256Data) return;

  const regs = currentSha256Round < 0
    ? sha256Data.initialRegisters
    : sha256Data.rounds[currentSha256Round].registers;

  const changed = currentSha256Round < 0
    ? []
    : sha256Data.rounds[currentSha256Round].changed;

  // Update register cells
  const cells = sha256Regs.querySelectorAll<HTMLElement>('.register');
  cells.forEach(cell => {
    const key = cell.dataset.reg as keyof Sha256Registers;
    if (!key) return;
    const valueEl = cell.querySelector<HTMLElement>('.reg-value');
    if (valueEl) valueEl.textContent = toHex(regs[key]);
    cell.classList.toggle('changed', changed.includes(key));
  });

  // Show operation flow — highlight which registers feed into the computation
  if (currentSha256Round >= 0) {
    const flowEls = sha256Regs.querySelectorAll<HTMLElement>('.register');
    flowEls.forEach(cell => {
      const key = cell.dataset.reg as keyof Sha256Registers;
      // Ch uses e,f,g — Maj uses a,b,c — both feed into new a and e
      const isSource = ['e', 'f', 'g', 'a', 'b', 'c', 'h'].includes(key);
      cell.classList.toggle('source', isSource && !changed.includes(key));
    });
  } else {
    sha256Regs.querySelectorAll<HTMLElement>('.register').forEach(c => c.classList.remove('source'));
  }

  const roundNum = currentSha256Round < 0 ? 0 : currentSha256Round + 1;
  sha256Round.innerHTML = `Round <span class="mono">${roundNum}</span> / 64`;

  const pct = (roundNum / 64) * 100;
  sha256Progress.style.width = `${pct}%`;

  if (currentSha256Round < 0) {
    sha256Annotation.innerHTML = '<span class="op-hint">Initial hash values (first 32 bits of √2, √3, √5, √7...)</span>';
  } else {
    const r = sha256Data.rounds[currentSha256Round];
    sha256Annotation.innerHTML =
      `<span class="op-flow"><span class="op-name sha">Ch</span>(e,f,g) → choose bits</span> ` +
      `<span class="op-flow"><span class="op-name sha">Maj</span>(a,b,c) → majority vote</span><br>` +
      `<span class="op-result">a ← T1+T2 = <span class="mono">${toHex(r.registers.a)}</span></span> ` +
      `<span class="op-result">e ← d+T1 = <span class="mono">${toHex(r.registers.e)}</span></span>`;
  }
}

function renderBlake3State(): void {
  if (!blake3Data) return;

  const matrix = currentBlake3Round < 0
    ? blake3Data.initialMatrix
    : blake3Data.rounds[currentBlake3Round].matrix;

  const changedCells: Set<number> = new Set();
  const sourceCells: Set<number> = new Set();
  if (currentBlake3Round >= 0) {
    const round = blake3Data.rounds[currentBlake3Round];
    for (const gApp of round.gApplications) {
      for (const idx of gApp.changedCells) changedCells.add(idx);
      // All 4 positions of each G application are involved
      for (const idx of gApp.positions) sourceCells.add(idx);
    }
    // Remove changed from source (they're outputs, not inputs this step)
    for (const idx of changedCells) sourceCells.delete(idx);
  }

  const cells = blake3Matrix.querySelectorAll<HTMLElement>('.matrix-cell');
  cells.forEach((cell, i) => {
    cell.textContent = toHex(matrix[i]);
    cell.classList.toggle('changed', changedCells.has(i));
    cell.classList.toggle('source', sourceCells.has(i));
  });

  // Show which positions are being mixed with a visual indicator
  if (currentBlake3Round >= 0) {
    const round = blake3Data.rounds[currentBlake3Round];
    const phase = round.phase;
    // Highlight column or diagonal pattern
    cells.forEach((cell, i) => {
      const row = Math.floor(i / 4);
      const col = i % 4;
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
    });
  }

  const totalHalfRounds = 14;
  const halfRoundNum = currentBlake3Round < 0 ? 0 : currentBlake3Round + 1;
  const roundNum = Math.ceil(halfRoundNum / 2);
  blake3Round.innerHTML = `Round <span class="mono">${roundNum}</span> / 7`;

  if (currentBlake3Round >= 0) {
    const phase = blake3Data.rounds[currentBlake3Round].phase;
    blake3Phase.textContent = phase === 'column' ? '↓ columns' : '⤡ diagonals';
    blake3Phase.className = `phase-badge phase-${phase}`;
  } else {
    blake3Phase.textContent = '';
  }

  const pct = (halfRoundNum / totalHalfRounds) * 100;
  blake3Progress.style.width = `${pct}%`;

  if (currentBlake3Round < 0) {
    blake3Annotation.innerHTML = '<span class="op-hint">Initial state: chaining value + IV + counter + flags</span>';
  } else {
    const r = blake3Data.rounds[currentBlake3Round];
    const phase = r.phase === 'column' ? 'Mixing 4 columns in parallel' : 'Mixing 4 diagonals in parallel';
    blake3Annotation.innerHTML =
      `<span class="op-flow"><span class="op-name blake">G</span> function × 4 → ${r.phase}s</span><br>` +
      `<span class="op-hint">${phase} (add, XOR, rotate)</span>`;
  }
}

function updateTowers(): void {
  // SHA-256 tower
  const shaBlocks = sha256Tower.querySelectorAll<HTMLElement>('.tower-block');
  shaBlocks.forEach((block, i) => {
    block.classList.toggle('completed', i <= currentSha256Round);
    block.classList.toggle('current', i === currentSha256Round);
  });

  // BLAKE3 tower
  const blakeBlocks = blake3Tower.querySelectorAll<HTMLElement>('.tower-block');
  blakeBlocks.forEach((block, i) => {
    block.classList.toggle('completed', i <= currentBlake3Round);
    block.classList.toggle('current', i === currentBlake3Round);
  });
}

function updateDoneOverlays(): void {
  const sha256Done = currentSha256Round >= 63;
  const blake3Done = currentBlake3Round >= 13;

  blake3DoneOverlay.classList.toggle('visible', blake3Done && !sha256Done);
  sha256DoneOverlay.classList.toggle('visible', sha256Done);

  if (blake3Done && !sha256Done && blake3Data) {
    blake3DoneOverlay.innerHTML = `<div class="done-text">DONE</div><div class="done-hash mono">${blake3Data.hash.slice(0, 16)}...</div>`;
  }
  if (sha256Done && sha256Data) {
    sha256DoneOverlay.innerHTML = `<div class="done-text">DONE</div><div class="done-hash mono">${sha256Data.hash.slice(0, 16)}...</div>`;
  }
}

function updateInsight(): void {
  if (!sha256Data || !blake3Data) return;

  const sha256Step = currentSha256Round < 0 ? 0 : currentSha256Round + 1;
  const blake3Step = currentBlake3Round < 0 ? 0 : currentBlake3Round + 1;
  const sha256Done = sha256Step >= 64;
  const blake3Done = blake3Step >= 14;

  if (sha256Done && blake3Done) {
    insightBar.innerHTML =
      `<em>Race over.</em> Same input, same security level. ` +
      `BLAKE3 finished in <em>7 rounds</em>. SHA-256 needed <em>64 rounds</em>. ` +
      `That's <em>9× fewer rounds</em> per block.`;
  } else if (blake3Done) {
    const sha256Remaining = 64 - sha256Step;
    const pctDone = Math.round((sha256Step / 64) * 100);
    insightBar.innerHTML =
      `<em>BLAKE3 is already done.</em> SHA-256 is at round ${sha256Step}/64 (${pctDone}%) — ` +
      `still <em>${sha256Remaining} rounds to go</em>.`;
  } else if (sha256Step === 0 && blake3Step === 0) {
    insightBar.innerHTML =
      `Press <em>Play</em> to race both algorithms. Watch how BLAKE3 finishes while SHA-256 is still working.`;
  } else {
    insightBar.innerHTML =
      `SHA-256: round <em>${sha256Step}</em>/64 — ` +
      `BLAKE3: round <em>${Math.ceil(blake3Step / 2)}</em>/7`;
  }
}

/**
 * Race step: advance BOTH algorithms each tick.
 * SHA-256 advances 1 round per tick.
 * BLAKE3 advances 1 half-round per tick.
 * Since BLAKE3 only has 14 half-rounds vs SHA-256's 64 rounds,
 * BLAKE3 finishes at tick 14 while SHA-256 keeps going to tick 64.
 */
function step(): void {
  if (!sha256Data || !blake3Data) return;

  const sha256Done = currentSha256Round >= 63;
  const blake3Done = currentBlake3Round >= 13;

  if (sha256Done && blake3Done) {
    pause();
    return;
  }

  // Both advance every tick — BLAKE3 just runs out of rounds first
  if (!sha256Done) currentSha256Round++;
  if (!blake3Done) currentBlake3Round++;

  renderAll();
}

function play(): void {
  if (playing) return;
  playing = true;
  updateControls();
  tick();
}

function tick(): void {
  if (!playing) return;
  step();

  if (currentSha256Round >= 63 && currentBlake3Round >= 13) {
    pause();
    return;
  }
  playTimer = setTimeout(tick, speed);
}

function pause(): void {
  playing = false;
  if (playTimer) {
    clearTimeout(playTimer);
    playTimer = null;
  }
  updateControls();
}

function reset(): void {
  pause();
  currentSha256Round = -1;
  currentBlake3Round = -1;
  renderAll();
}

function setSpeed(ms: number): void {
  speed = ms;
  speedButtons.forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.speed || '0') === ms);
  });
}

function updateControls(): void {
  const allDone = currentSha256Round >= 63 && currentBlake3Round >= 13;
  const notStarted = currentSha256Round < 0;

  btnPlay.disabled = allDone;
  btnPlay.textContent = playing ? '⏸ Pause' : (allDone ? '✓ Done' : (notStarted ? '▶ Race!' : '▶ Resume'));

  btnReset.disabled = notStarted;
}

function handleKeyboard(e: KeyboardEvent): void {
  if (e.target === inputField) return;
  switch (e.key) {
    case 'ArrowRight': e.preventDefault(); step(); break;
    case ' ': e.preventDefault(); playing ? pause() : play(); break;
    case 'r': reset(); break;
    case '1': setSpeed(300); break;
    case '2': setSpeed(150); break;
    case '3': setSpeed(60); break;
    case '4': setSpeed(20); break;
  }
}

function buildSha256Registers(container: HTMLElement): void {
  const grid = document.createElement('div');
  grid.className = 'registers';
  const pairs: [keyof Sha256Registers, keyof Sha256Registers][] = [
    ['a', 'e'], ['b', 'f'], ['c', 'g'], ['d', 'h']
  ];
  for (const [left, right] of pairs) {
    for (const key of [left, right]) {
      const cell = document.createElement('div');
      cell.className = 'register';
      cell.dataset.reg = key;
      cell.innerHTML = `<span class="reg-name">${key}</span><span class="reg-value mono">00000000</span>`;
      grid.appendChild(cell);
    }
  }
  container.appendChild(grid);
}

function buildBlake3Matrix(container: HTMLElement): void {
  const grid = document.createElement('div');
  grid.className = 'matrix';
  for (let i = 0; i < 16; i++) {
    const cell = document.createElement('div');
    cell.className = 'matrix-cell mono';
    cell.textContent = '00000000';
    grid.appendChild(cell);
  }
  container.appendChild(grid);
}

export function initVisualizer(): void {
  inputField = document.getElementById('viz-input') as HTMLInputElement;
  btnPlay = document.getElementById('btn-play') as HTMLButtonElement;
  btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
  speedButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.speed-btn'));

  sha256Regs = document.getElementById('sha256-registers') as HTMLElement;
  sha256Round = document.getElementById('sha256-round') as HTMLElement;
  sha256Progress = document.getElementById('sha256-progress') as HTMLElement;
  sha256Annotation = document.getElementById('sha256-annotation') as HTMLElement;
  sha256Tower = document.getElementById('sha256-tower') as HTMLElement;
  sha256Panel = document.querySelector('.sha256-panel') as HTMLElement;
  sha256DoneOverlay = document.getElementById('sha256-done') as HTMLElement;

  blake3Matrix = document.getElementById('blake3-matrix') as HTMLElement;
  blake3Round = document.getElementById('blake3-round') as HTMLElement;
  blake3Progress = document.getElementById('blake3-progress') as HTMLElement;
  blake3Annotation = document.getElementById('blake3-annotation') as HTMLElement;
  blake3Phase = document.getElementById('blake3-phase') as HTMLElement;
  blake3Tower = document.getElementById('blake3-tower') as HTMLElement;
  blake3Panel = document.querySelector('.blake3-panel') as HTMLElement;
  blake3DoneOverlay = document.getElementById('blake3-done') as HTMLElement;

  insightBar = document.getElementById('insight-bar') as HTMLElement;

  buildSha256Registers(sha256Regs);
  buildBlake3Matrix(blake3Matrix);

  inputField.addEventListener('input', () => { pause(); computeTraces(); });
  btnPlay.addEventListener('click', () => playing ? pause() : play());
  btnReset.addEventListener('click', reset);

  speedButtons.forEach(btn => {
    btn.addEventListener('click', () => setSpeed(parseInt(btn.dataset.speed || '300')));
  });

  document.addEventListener('keydown', handleKeyboard);
  computeTraces();
}
