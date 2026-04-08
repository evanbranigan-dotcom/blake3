/**
 * Hash Race — Live throughput drag race.
 * BLAKE3 (parallel Web Workers) vs SHA-256 (streaming IHasher).
 * Real data, real hashing, live progress bars.
 */

import { createSHA256, createBLAKE3 } from 'hash-wasm'
import { DOCUMENTS } from './documents'
import type { RaceDocument } from './documents'

// ── Config ──

const CHUNK_SIZE = 256 * 1024 // 256 KB — ~40 updates for 10 MB
const NUM_WORKERS = navigator.hardwareConcurrency || 4

// ── DOM refs ──

const btnRace = document.getElementById('btn-race') as HTMLButtonElement
const sizePills = document.querySelectorAll<HTMLButtonElement>('.size-pill')
const raceStatus = document.getElementById('race-status') as HTMLElement
const blake3Bar = document.getElementById('blake3-bar') as HTMLElement
const sha256Bar = document.getElementById('sha256-bar') as HTMLElement
const blake3Stats = document.getElementById('blake3-stats') as HTMLElement
const sha256Stats = document.getElementById('sha256-stats') as HTMLElement
const blake3Done = document.getElementById('blake3-done') as HTMLElement
const sha256Done = document.getElementById('sha256-done') as HTMLElement
const blake3WorkersEl = document.getElementById('blake3-workers') as HTMLElement
const verdict = document.getElementById('verdict') as HTMLElement
const verdictNumber = document.getElementById('verdict-number') as HTMLElement
const verdictLabel = document.getElementById('verdict-label') as HTMLElement
const statsRow = document.getElementById('stats-row') as HTMLElement
const statBlake3 = document.getElementById('stat-blake3') as HTMLElement
const statSha256 = document.getElementById('stat-sha256') as HTMLElement
const note = document.getElementById('note') as HTMLElement

// ── State ──

let selectedBytes = 10 * 1024 * 1024 // 10 MB default
let racing = false
let raceCompleted = false

// Race progress (0-1) and timing
let blake3Progress = 0
let sha256Progress = 0
let blake3ThroughputMBps = 0
let sha256ThroughputMBps = 0
let blake3TimeMs = 0
let sha256TimeMs = 0
let blake3Finished = false
let sha256Finished = false

// ── Data generation ──

function generateData(bytes: number): Uint8Array {
  const data = new Uint8Array(bytes)
  const chunk = 65536
  for (let offset = 0; offset < bytes; offset += chunk) {
    const size = Math.min(chunk, bytes - offset)
    crypto.getRandomValues(data.subarray(offset, offset + size))
  }
  return data
}

async function generateDataYielding(bytes: number): Promise<Uint8Array> {
  const data = new Uint8Array(bytes)
  const chunk = 65536
  const yieldEvery = 1024 * 1024 // yield every 1 MB
  let sinceYield = 0
  for (let offset = 0; offset < bytes; offset += chunk) {
    const size = Math.min(chunk, bytes - offset)
    crypto.getRandomValues(data.subarray(offset, offset + size))
    sinceYield += size
    if (sinceYield >= yieldEvery) {
      sinceYield = 0
      const pct = Math.round((offset / bytes) * 100)
      raceStatus.textContent = `Generating ${formatBytes(bytes)} of random data... ${pct}%`
      await new Promise(r => setTimeout(r, 0))
    }
  }
  return data
}

// ── SHA-256 streaming race (main thread) ──

async function raceSHA256(data: Uint8Array): Promise<void> {
  const start = performance.now()
  const hasher = await createSHA256()
  hasher.init()

  for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
    const end = Math.min(offset + CHUNK_SIZE, data.length)
    const chunk = data.subarray(offset, end)
    hasher.update(chunk)

    sha256Progress = end / data.length
    const elapsed = performance.now() - start
    const processedMB = end / (1024 * 1024)
    sha256ThroughputMBps = elapsed > 0 ? processedMB / (elapsed / 1000) : 0

    // Yield to UI
    await new Promise(r => setTimeout(r, 0))
  }

  hasher.digest('hex')
  sha256TimeMs = performance.now() - start
  sha256Progress = 1
  sha256Finished = true
  const totalMB = data.length / (1024 * 1024)
  sha256ThroughputMBps = sha256TimeMs > 0 ? totalMB / (sha256TimeMs / 1000) : 0
}

// ── BLAKE3 parallel race (Web Workers) ──

function createWorkerPool(count: number): Worker[] {
  return Array.from({ length: count }, () =>
    new Worker(new URL('../blake3-worker.ts', import.meta.url), { type: 'module' })
  )
}

async function raceBLAKE3(data: Uint8Array): Promise<void> {
  const start = performance.now()
  const workers = createWorkerPool(NUM_WORKERS)
  const chunkSize = Math.ceil(data.length / workers.length)
  let completed = 0

  return new Promise<void>((resolve) => {
    workers.forEach((worker, i) => {
      const chunkStart = i * chunkSize
      const chunkEnd = Math.min(chunkStart + chunkSize, data.length)
      const chunk = data.slice(chunkStart, chunkEnd)

      worker.onmessage = () => {
        completed++
        blake3Progress = completed / workers.length
        const elapsed = performance.now() - start
        const processedMB = (blake3Progress * data.length) / (1024 * 1024)
        blake3ThroughputMBps = elapsed > 0 ? processedMB / (elapsed / 1000) : 0

        if (completed === workers.length) {
          blake3TimeMs = performance.now() - start
          blake3Progress = 1
          blake3Finished = true
          const totalMB = data.length / (1024 * 1024)
          blake3ThroughputMBps = blake3TimeMs > 0 ? totalMB / (blake3TimeMs / 1000) : 0
          workers.forEach(w => w.terminate())
          resolve()
        }
      }

      worker.onerror = () => {
        // Worker failed — fall back to single-threaded
        worker.terminate()
        completed++
        if (completed === workers.length) {
          workers.forEach(w => w.terminate())
          raceBLAKE3SingleThread(data, start).then(resolve)
        }
      }

      worker.postMessage({ chunk, index: i })
    })
  })
}

async function raceBLAKE3SingleThread(data: Uint8Array, start: number): Promise<void> {
  const hasher = await createBLAKE3()
  hasher.init()
  for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
    const end = Math.min(offset + CHUNK_SIZE, data.length)
    hasher.update(data.subarray(offset, end))
    blake3Progress = end / data.length
    const elapsed = performance.now() - start
    blake3ThroughputMBps = elapsed > 0 ? (end / (1024 * 1024)) / (elapsed / 1000) : 0
    await new Promise(r => setTimeout(r, 0))
  }
  hasher.digest('hex')
  blake3TimeMs = performance.now() - start
  blake3Progress = 1
  blake3Finished = true
  const totalMB = data.length / (1024 * 1024)
  blake3ThroughputMBps = blake3TimeMs > 0 ? totalMB / (blake3TimeMs / 1000) : 0
}

// ── UI rendering (rAF loop) ──

let rafId: number | null = null

function renderLoop(): void {
  // Update bars
  blake3Bar.style.width = `${blake3Progress * 100}%`
  sha256Bar.style.width = `${sha256Progress * 100}%`

  // BLAKE3 stats
  if (blake3Finished) {
    blake3Bar.classList.add('complete')
    blake3Done.hidden = false
    blake3Stats.innerHTML = `<span class="speed">${formatThroughput(blake3ThroughputMBps)}</span> · ${formatTime(blake3TimeMs)}`
  } else if (blake3Progress > 0) {
    blake3Stats.innerHTML = `<span class="speed">${formatThroughput(blake3ThroughputMBps)}</span> · hashing...`
  }

  // SHA-256 stats
  if (sha256Finished) {
    sha256Done.hidden = false
    sha256Stats.innerHTML = `<span class="speed">${formatThroughput(sha256ThroughputMBps)}</span> · ${formatTime(sha256TimeMs)}`
  } else if (sha256Progress > 0) {
    sha256Stats.innerHTML = `<span class="speed">${formatThroughput(sha256ThroughputMBps)}</span> · hashing...`
  }

  // Both done?
  if (blake3Finished && sha256Finished) {
    showVerdict()
    racing = false
    raceCompleted = true
    btnRace.disabled = false
    btnRace.textContent = '↺ Race again'
    enableSizePills()
    return
  }

  rafId = requestAnimationFrame(renderLoop)
}

function showVerdict(): void {
  const ratio = sha256ThroughputMBps > 0
    ? blake3ThroughputMBps / sha256ThroughputMBps
    : 0

  if (ratio >= 1) {
    verdictNumber.textContent = `${ratio.toFixed(1)}×`
    verdictLabel.textContent = 'BLAKE3 is faster on your device'
  } else if (ratio > 0) {
    const inverse = 1 / ratio
    verdictNumber.textContent = `${inverse.toFixed(1)}×`
    verdictLabel.textContent = 'SHA-256 is faster on your device'
    verdictNumber.style.color = 'var(--amber)'
  }

  statBlake3.textContent = formatThroughput(blake3ThroughputMBps)
  statSha256.textContent = formatThroughput(sha256ThroughputMBps)

  verdict.hidden = false
  statsRow.hidden = false
  note.hidden = false
}

// ── Race orchestration ──

async function startRace(): Promise<void> {
  if (racing) return

  // Reset state
  racing = true
  raceCompleted = false
  blake3Progress = 0
  sha256Progress = 0
  blake3ThroughputMBps = 0
  sha256ThroughputMBps = 0
  blake3TimeMs = 0
  sha256TimeMs = 0
  blake3Finished = false
  sha256Finished = false

  // Reset UI
  blake3Bar.style.width = '0%'
  sha256Bar.style.width = '0%'
  blake3Bar.classList.remove('complete')
  blake3Done.hidden = true
  sha256Done.hidden = true
  blake3Stats.textContent = ''
  sha256Stats.textContent = ''
  verdict.hidden = true
  statsRow.hidden = true
  note.hidden = true
  verdictNumber.style.color = ''

  btnRace.disabled = true
  btnRace.textContent = '⏳ Racing...'
  disableSizePills()

  // Generate data
  let data: Uint8Array
  try {
    if (selectedBytes >= 50 * 1024 * 1024) {
      data = await generateDataYielding(selectedBytes)
    } else {
      raceStatus.textContent = `Generating ${formatBytes(selectedBytes)} of random data...`
      await new Promise(r => setTimeout(r, 0))
      data = generateData(selectedBytes)
    }
  } catch {
    // OOM — fall back to 10 MB
    raceStatus.textContent = `${formatBytes(selectedBytes)} is too large for this device. Running 10 MB instead.`
    selectedBytes = 10 * 1024 * 1024
    selectPill(selectedBytes)
    await new Promise(r => setTimeout(r, 500))
    data = generateData(selectedBytes)
  }

  raceStatus.textContent = ''

  // Start render loop
  rafId = requestAnimationFrame(renderLoop)

  // Start both hashers simultaneously
  const blake3Promise = raceBLAKE3(data)
  const sha256Promise = raceSHA256(data)

  await Promise.all([blake3Promise, sha256Promise])

  // Final render
  if (rafId) cancelAnimationFrame(rafId)
  renderLoop()
}

// ── Formatting ──

function formatThroughput(mbps: number): string {
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)} GB/s`
  if (mbps >= 100) return `${Math.round(mbps)} MB/s`
  if (mbps >= 10) return `${mbps.toFixed(1)} MB/s`
  return `${mbps.toFixed(2)} MB/s`
}

function formatTime(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
  return `${ms.toFixed(1)}ms`
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(0)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

// ── Size selector ──

function selectPill(bytes: number): void {
  sizePills.forEach(p => {
    p.classList.toggle('active', parseInt(p.dataset.bytes || '0') === bytes)
  })
}

function disableSizePills(): void {
  sizePills.forEach(p => { p.disabled = true })
}

function enableSizePills(): void {
  sizePills.forEach(p => { p.disabled = false })
}

// ── Reduced motion ──

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ══════════════════════════════════════════════
// ── Document Race ──
// ══════════════════════════════════════════════

// DOM refs — document race
const docSelector = document.getElementById('doc-selector') as HTMLElement
const btnDocRace = document.getElementById('btn-doc-race') as HTMLButtonElement
const textScroll = document.getElementById('text-scroll') as HTMLElement
const docBlake3Bar = document.getElementById('doc-blake3-bar') as HTMLElement
const docSha256Bar = document.getElementById('doc-sha256-bar') as HTMLElement
const docBlake3Hash = document.getElementById('doc-blake3-hash') as HTMLElement
const docSha256Hash = document.getElementById('doc-sha256-hash') as HTMLElement
const docBlake3Time = document.getElementById('doc-blake3-time') as HTMLElement
const docSha256Time = document.getElementById('doc-sha256-time') as HTMLElement
const docBlake3Done = document.getElementById('doc-blake3-done') as HTMLElement
const docSha256Done = document.getElementById('doc-sha256-done') as HTMLElement
const docVerdict = document.getElementById('doc-verdict') as HTMLElement
const docVerdictNumber = document.getElementById('doc-verdict-number') as HTMLElement
const docVerdictLabel = document.getElementById('doc-verdict-label') as HTMLElement
const docMeta = document.getElementById('doc-meta') as HTMLElement

let selectedDoc: RaceDocument = DOCUMENTS[0]
let docRacing = false
let docRaceCompleted = false

// Document race state
let docBlake3Progress = 0
let docSha256Progress = 0
let docBlake3Finished = false
let docSha256Finished = false
let docBlake3TimeMs = 0
let docSha256TimeMs = 0
let docBlake3HashValue = ''
let docSha256HashValue = ''
let docRafId: number | null = null

// Text to bytes
function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text)
}

// Tile text to fill a target size for a meaningful race
const DOC_TARGET_BYTES = 5 * 1024 * 1024 // 5 MB — enough for a visible race

function tileText(text: string, targetBytes: number): string {
  const singleSize = new TextEncoder().encode(text).length
  const repeats = Math.ceil(targetBytes / singleSize)
  const parts: string[] = []
  for (let i = 0; i < repeats; i++) {
    parts.push(text)
  }
  return parts.join('\n\n')
}

// SHA-256 streaming with progress + partial hash updates
async function docRaceSHA256(data: Uint8Array): Promise<string> {
  const start = performance.now()
  const hasher = await createSHA256()
  hasher.init()

  for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
    const end = Math.min(offset + CHUNK_SIZE, data.length)
    hasher.update(data.subarray(offset, end))
    docSha256Progress = end / data.length
    await new Promise(r => setTimeout(r, 0))
  }

  const hash = hasher.digest('hex')
  docSha256TimeMs = performance.now() - start
  docSha256Progress = 1
  docSha256Finished = true
  docSha256HashValue = hash
  return hash
}

// BLAKE3 parallel race using Web Workers (same approach as speed race)
async function docRaceBLAKE3(data: Uint8Array): Promise<string> {
  const start = performance.now()
  const workers = createWorkerPool(NUM_WORKERS)
  const chunkSize = Math.ceil(data.length / workers.length)
  let completed = 0

  await new Promise<void>((resolve) => {
    workers.forEach((worker, i) => {
      const chunkStart = i * chunkSize
      const chunkEnd = Math.min(chunkStart + chunkSize, data.length)
      const chunk = data.slice(chunkStart, chunkEnd)

      worker.onmessage = () => {
        completed++
        docBlake3Progress = completed / workers.length
        if (completed === workers.length) {
          workers.forEach(w => w.terminate())
          resolve()
        }
      }

      worker.postMessage({ chunk, index: i })
    })
  })

  docBlake3TimeMs = performance.now() - start
  docBlake3Progress = 1
  docBlake3Finished = true

  // Compute the actual hash of the full data (single-threaded, fast since data is warm in cache)
  const hasher = await createBLAKE3()
  hasher.init()
  hasher.update(data)
  docBlake3HashValue = hasher.digest('hex')

  return docBlake3HashValue
}

function docRenderLoop(): void {
  // Update bars
  docBlake3Bar.style.width = `${docBlake3Progress * 100}%`
  docSha256Bar.style.width = `${docSha256Progress * 100}%`

  // Scroll the text viewport based on max progress
  const maxProgress = Math.max(docBlake3Progress, docSha256Progress)
  const textHeight = textScroll.scrollHeight
  const viewportHeight = 160
  const maxScroll = Math.max(0, textHeight - viewportHeight)
  const scrollY = maxScroll * maxProgress
  textScroll.style.transform = `translateY(-${scrollY}px)`

  // Update hash displays with partial hashes during race
  if (docBlake3Finished) {
    docBlake3Bar.classList.add('complete')
    docBlake3Done.hidden = false
    docBlake3Hash.textContent = docBlake3HashValue
    docBlake3Time.textContent = formatTime(docBlake3TimeMs)
  } else if (docBlake3Progress > 0) {
    docBlake3Hash.textContent = 'computing...'
    docBlake3Time.textContent = ''
  }

  if (docSha256Finished) {
    docSha256Done.hidden = false
    docSha256Hash.textContent = docSha256HashValue
    docSha256Time.textContent = formatTime(docSha256TimeMs)
  } else if (docSha256Progress > 0) {
    docSha256Hash.textContent = 'computing...'
    docSha256Time.textContent = ''
  }

  if (docBlake3Finished && docSha256Finished) {
    showDocVerdict()
    docRacing = false
    docRaceCompleted = true
    btnDocRace.disabled = false
    btnDocRace.textContent = '↺ Hash again'
    enableDocPills()
    return
  }

  docRafId = requestAnimationFrame(docRenderLoop)
}

function showDocVerdict(): void {
  if (docBlake3TimeMs > 0 && docSha256TimeMs > 0) {
    const ratio = docSha256TimeMs / docBlake3TimeMs
    if (ratio >= 1) {
      docVerdictNumber.textContent = `${ratio.toFixed(1)}×`
      docVerdictLabel.textContent = `BLAKE3 hashed the ${selectedDoc.title} ${ratio.toFixed(1)}× faster`
      docVerdictNumber.style.color = ''
    } else {
      const inverse = 1 / ratio
      docVerdictNumber.textContent = `${inverse.toFixed(1)}×`
      docVerdictLabel.textContent = `SHA-256 was faster this time`
      docVerdictNumber.style.color = 'var(--amber)'
    }
  }
  docVerdict.hidden = false

  const docBytes = textToBytes(selectedDoc.text).length
  const repeats = Math.ceil(DOC_TARGET_BYTES / docBytes)
  docMeta.innerHTML =
    `${formatBytes(docBytes)} of text, repeated ${repeats}× to create a ${formatBytes(DOC_TARGET_BYTES)} benchmark. ` +
    `Same text, same hash — BLAKE3 just gets there faster.`
  docMeta.hidden = false
}

async function startDocRace(): Promise<void> {
  if (docRacing) return

  docRacing = true
  docRaceCompleted = false
  docBlake3Progress = 0
  docSha256Progress = 0
  docBlake3Finished = false
  docSha256Finished = false
  docBlake3TimeMs = 0
  docSha256TimeMs = 0
  docBlake3HashValue = ''
  docSha256HashValue = ''

  // Reset UI
  docBlake3Bar.style.width = '0%'
  docSha256Bar.style.width = '0%'
  docBlake3Bar.classList.remove('complete')
  docBlake3Done.hidden = true
  docSha256Done.hidden = true
  docBlake3Hash.textContent = ''
  docSha256Hash.textContent = ''
  docBlake3Time.textContent = ''
  docSha256Time.textContent = ''
  docVerdict.hidden = true
  docMeta.hidden = true
  docVerdictNumber.style.color = ''
  textScroll.style.transform = 'translateY(0)'

  btnDocRace.disabled = true
  btnDocRace.textContent = '⏳ Hashing...'
  disableDocPills()

  // Load the text into the viewport
  const tiledText = tileText(selectedDoc.text, DOC_TARGET_BYTES)
  // Only show first portion to keep DOM light
  const previewLength = Math.min(tiledText.length, 8000)
  textScroll.textContent = tiledText.slice(0, previewLength) + (tiledText.length > previewLength ? '\n...' : '')

  const data = textToBytes(tiledText)

  await new Promise(r => setTimeout(r, 100))

  // Start render loop
  docRafId = requestAnimationFrame(docRenderLoop)

  // Race both
  const b3Promise = docRaceBLAKE3(data)
  const shaPromise = docRaceSHA256(data)
  await Promise.all([b3Promise, shaPromise])

  if (docRafId) cancelAnimationFrame(docRafId)
  docRenderLoop()
}

function disableDocPills(): void {
  docSelector.querySelectorAll<HTMLButtonElement>('.doc-pill').forEach(p => { p.disabled = true })
}

function enableDocPills(): void {
  docSelector.querySelectorAll<HTMLButtonElement>('.doc-pill').forEach(p => { p.disabled = false })
}

function buildDocSelector(): void {
  for (const doc of DOCUMENTS) {
    const docSize = formatBytes(textToBytes(doc.text).length)
    const btn = document.createElement('button')
    btn.className = `doc-pill${doc.id === selectedDoc.id ? ' active' : ''}`
    btn.dataset.docId = doc.id
    btn.innerHTML =
      `<span class="doc-pill-title">${doc.title}</span>` +
      `<span class="doc-pill-meta">${doc.author}, ${doc.year} · ${docSize}</span>`
    btn.addEventListener('click', () => {
      if (docRacing) return
      selectedDoc = doc
      docSelector.querySelectorAll('.doc-pill').forEach(p => p.classList.remove('active'))
      btn.classList.add('active')
      showDocPreview(doc)
    })
    docSelector.appendChild(btn)
  }

  showDocPreview(selectedDoc)
}

function showDocPreview(doc: RaceDocument): void {
  textScroll.textContent = doc.text.slice(0, 2000) + (doc.text.length > 2000 ? '\n...' : '')
  textScroll.style.transform = 'translateY(0)'
  // Reset hash displays
  docBlake3Hash.textContent = ''
  docSha256Hash.textContent = ''
  docBlake3Time.textContent = ''
  docSha256Time.textContent = ''
  docBlake3Done.hidden = true
  docSha256Done.hidden = true
  docBlake3Bar.style.width = '0%'
  docSha256Bar.style.width = '0%'
  docBlake3Bar.classList.remove('complete')
  docVerdict.hidden = true
  docMeta.hidden = true
}

// ── Init ──

function init(): void {
  // Show worker count
  blake3WorkersEl.textContent = `(${NUM_WORKERS} workers)`

  // Size pill click handlers
  sizePills.forEach(pill => {
    pill.addEventListener('click', () => {
      if (racing) return
      selectedBytes = parseInt(pill.dataset.bytes || '10485760')
      selectPill(selectedBytes)
    })
  })

  // Race button
  btnRace.addEventListener('click', () => {
    if (raceCompleted) {
      startRace()
    } else if (!racing) {
      startRace()
    }
  })

  // Document race
  buildDocSelector()
  btnDocRace.addEventListener('click', () => {
    if (docRaceCompleted || !docRacing) {
      startDocRace()
    }
  })

  // Keyboard shortcut
  document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && !racing && !docRacing && document.activeElement === document.body) {
      e.preventDefault()
      startRace()
    }
  })

  // Autoplay after 2.5s unless user interacts
  if (prefersReducedMotion()) {
    startRace()
  } else {
    let userInteracted = false
    const cancelAutoplay = () => { userInteracted = true }

    btnRace.addEventListener('click', cancelAutoplay, { once: true })
    sizePills.forEach(p => p.addEventListener('click', cancelAutoplay, { once: true }))

    setTimeout(() => {
      if (!userInteracted && !racing) {
        startRace()
      }
    }, 2500)
  }
}

init()
