import type { SizeResult } from './benchmark'
import type { DeviceInfo } from './device'

interface AlgoConfig {
  label: string
  color: string
  class: string
}

const ALGO_CONFIG: Record<string, AlgoConfig> = {
  blake3: { label: 'BLAKE3', color: '#00ff88', class: 'bar-blake3' },
  blake3parallel: { label: 'BLAKE3 (multi-core)', color: '#bf5af2', class: 'bar-blake3-parallel' },
  sha256wasm: { label: 'SHA-256 (WASM)', color: '#ff8800', class: 'bar-sha256wasm' },
  sha256crypto: { label: 'SHA-256 (HW)', color: '#4488ff', class: 'bar-sha256crypto' },
}

function formatThroughput(mbps: number): string {
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)} GB/s`
  if (mbps >= 1) return `${mbps.toFixed(1)} MB/s`
  return `${(mbps * 1024).toFixed(0)} KB/s`
}

function formatTime(ms: number): string {
  if (ms < 0.01) return `${(ms * 1000).toFixed(1)} us`
  if (ms < 1) return `${ms.toFixed(2)} ms`
  return `${ms.toFixed(0)} ms`
}

function renderInsight(sizeResult: SizeResult): string {
  const algos = sizeResult.algorithms
  const b3 = algos.blake3.throughputMBps
  const b3p = algos.blake3parallel?.throughputMBps || 0
  const sw = algos.sha256wasm.throughputMBps
  const hw = algos.sha256crypto?.throughputMBps || 0

  const bytes = sizeResult.bytes
  const isSmall = bytes <= 102400  // 100KB or less
  const isMedium = bytes === 1048576
  const isLarge = bytes >= 10485760

  let text = ''

  if (isSmall && hw > b3) {
    text = `<strong>SHA-256 (HW) wins at ${sizeResult.label}</strong> — Apple's dedicated SHA-2 silicon has near-zero per-op overhead, which dominates at small sizes. BLAKE3's WASM implementation pays a fixed cost per call that matters more when the data is tiny.`
  } else if (isSmall && b3 > hw) {
    text = `<strong>BLAKE3 leads even at ${sizeResult.label}</strong> — impressive given SHA-256 has dedicated hardware.`
  }

  if (b3p > 0 && b3p < b3 && isSmall) {
    text += ` <strong>Multi-core is slower here</strong> — splitting ${sizeResult.label} across Web Workers costs more in message-passing overhead than it saves. Parallelism pays off at larger sizes.`
  } else if (b3p > 0 && b3p < b3 && !isSmall) {
    text += ` Multi-core overhead still outweighs the benefit at this size.`
  }

  if (isMedium && b3 > sw) {
    const ratio = (b3 / sw).toFixed(1)
    text += text ? ' ' : ''
    text += `BLAKE3 is ${ratio}x faster than SHA-256 in a fair software-vs-software comparison.`
  }

  if (isLarge && b3p > hw) {
    text += text ? ' ' : ''
    text += `<strong>Multi-core BLAKE3 overtakes hardware SHA-256</strong> — this is the parallelism advantage in action. SHA-256 is structurally sequential and can never scale this way.`
  } else if (isLarge && b3p > b3) {
    const speedup = (b3p / b3).toFixed(1)
    text += text ? ' ' : ''
    text += `Multi-core BLAKE3 achieves ${speedup}x over single-threaded — the tree-hashing architecture paying off at scale.`
  }

  if (!text) return ''

  return `<div class="result-insight">${text}</div>`
}

export function renderResults(results: SizeResult[]): void {
  const container = document.getElementById('results-container')
  if (!container) return

  let html = ''

  for (const sizeResult of results) {
    const algos = sizeResult.algorithms
    const throughputs = [algos.blake3.throughputMBps, algos.sha256wasm.throughputMBps]
    if (algos.sha256crypto) throughputs.push(algos.sha256crypto.throughputMBps)
    const maxThroughput = Math.max(...throughputs)

    // Determine winner
    const entries = Object.entries(algos)
    entries.sort((a, b) => b[1].throughputMBps - a[1].throughputMBps)
    const winnerKey = entries[0][0]

    html += `<div class="result-group">`
    html += `<h3 class="result-size">${sizeResult.label}</h3>`

    for (const [key, stats] of Object.entries(algos)) {
      const config = ALGO_CONFIG[key]
      const widthPct = (stats.throughputMBps / maxThroughput) * 100
      const isWinner = key === winnerKey

      html += `
        <div class="result-row ${isWinner ? 'winner' : ''}">
          <div class="result-label">${config.label}${isWinner ? ' <span class="winner-badge">fastest</span>' : ''}</div>
          <div class="result-bar-track">
            <div class="result-bar ${config.class}" style="--target-width: ${widthPct}%" data-animate></div>
          </div>
          <div class="result-value">${formatThroughput(stats.throughputMBps)}</div>
          <div class="result-time">${formatTime(stats.median)}/op</div>
          <div class="result-proof">${stats.totalOps} ops (${stats.batchSize}&times;${stats.batches} batches)${stats.workers ? ` &middot; ${stats.workers} workers` : ''}</div>
        </div>
      `
    }

    // Verification proof
    const v = sizeResult.verification
    if (v) {
      html += `<div class="verification">`
      html += `<span class="verify-label">Hash verification:</span> `
      html += `<span class="verify-hash">BLAKE3: ${v.blake3}</span> `
      html += `<span class="verify-hash">SHA-256: ${v.sha256wasm}</span>`
      if (v.sha256crypto) {
        html += ` <span class="verify-match ${v.sha256Match ? 'match-ok' : 'match-fail'}">${v.sha256Match ? 'WASM = HW' : 'MISMATCH'}</span>`
      }
      html += `</div>`
    }

    // Contextual insight for this size
    html += renderInsight(sizeResult)

    html += `</div>`
  }

  container.innerHTML = html

  // Trigger bar animations after DOM update
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      container.querySelectorAll<HTMLElement>('[data-animate]').forEach(bar => {
        bar.style.width = bar.style.getPropertyValue('--target-width')
      })
    })
  })
}

export function renderVerdict(results: SizeResult[], device: DeviceInfo): void {
  const verdict = document.getElementById('verdict-content')
  if (!verdict) return

  // Compute average speedups across all sizes
  let blake3VsSha256WasmSum = 0
  let blake3VsSha256CryptoSum = 0
  let parallelVsSha256CryptoSum = 0
  let parallelVsBlake3Sum = 0
  let cryptoCount = 0
  let count = 0

  for (const r of results) {
    const b3 = r.algorithms.blake3.throughputMBps
    const b3p = r.algorithms.blake3parallel?.throughputMBps || b3
    const sw = r.algorithms.sha256wasm.throughputMBps
    blake3VsSha256WasmSum += b3 / sw
    parallelVsBlake3Sum += b3p / b3
    count++
    if (r.algorithms.sha256crypto) {
      blake3VsSha256CryptoSum += b3 / r.algorithms.sha256crypto.throughputMBps
      parallelVsSha256CryptoSum += b3p / r.algorithms.sha256crypto.throughputMBps
      cryptoCount++
    }
  }

  const blake3VsSha256Wasm = (blake3VsSha256WasmSum / count).toFixed(1)
  const parallelVsBlake3 = (parallelVsBlake3Sum / count).toFixed(1)
  const hasCryptoResults = cryptoCount > 0
  const blake3VsSha256Crypto = hasCryptoResults ? (blake3VsSha256CryptoSum / cryptoCount).toFixed(1) : '0'
  const parallelVsSha256Crypto = hasCryptoResults ? (parallelVsSha256CryptoSum / cryptoCount).toFixed(1) : '0'

  const blake3Faster = hasCryptoResults ? parseFloat(blake3VsSha256Crypto) > 1 : true
  const numWorkers = results[0]?.algorithms.blake3parallel?.workers || '?'

  let deviceNote: string
  if (device.isIPhone && device.chip) {
    deviceNote = `Your ${device.deviceLabel} has <strong>${device.chip}</strong> with dedicated SHA-2 hardware acceleration — giving SHA-256 every possible advantage.`
  } else if (device.isAndroid && device.chip) {
    deviceNote = `Your ${device.deviceLabel} has <strong>${device.chip}</strong>${device.shaHW ? ' with SHA-2 hardware acceleration via ARMv8 Crypto Extensions' : ''}.`
  } else if (device.isAndroid) {
    deviceNote = `Your ${device.deviceLabel} (${device.cores} cores${device.memory ? `, ${device.memory} GB RAM` : ''}) was used for this test.`
  } else {
    deviceNote = `Your ${device.deviceLabel} was used for this test.`
  }

  const noHttpsNote = !hasCryptoResults
    ? `<p class="verdict-note">Note: Hardware-accelerated SHA-256 (Web Crypto API) requires HTTPS. Deploy to Vercel to see the full comparison.</p>`
    : ''

  verdict.innerHTML = `
    <div class="verdict-card">
      <h3 class="verdict-title">${blake3Faster ? 'BLAKE3 wins.' : 'A close fight.'}</h3>

      <div class="verdict-stats">
        <div class="verdict-stat">
          <span class="verdict-number" style="color: #00ff88">${blake3VsSha256Wasm}x</span>
          <span class="verdict-desc">faster than SHA-256<br><small>single-thread software vs software</small></span>
        </div>
        ${hasCryptoResults ? `
        <div class="verdict-stat">
          <span class="verdict-number" style="color: ${blake3Faster ? '#00ff88' : '#ff8800'}">${blake3VsSha256Crypto}x</span>
          <span class="verdict-desc">${blake3Faster ? 'faster than' : 'vs'} SHA-256 (HW)<br><small>BLAKE3 software vs SHA-256 hardware</small></span>
        </div>
        ` : ''}
        <div class="verdict-stat">
          <span class="verdict-number" style="color: #bf5af2">${parallelVsBlake3}x</span>
          <span class="verdict-desc">multi-core speedup<br><small>BLAKE3 across ${numWorkers} cores vs single-thread</small></span>
        </div>
        ${hasCryptoResults ? `
        <div class="verdict-stat">
          <span class="verdict-number" style="color: #bf5af2">${parallelVsSha256Crypto}x</span>
          <span class="verdict-desc">multi-core vs SHA-256 (HW)<br><small>BLAKE3 parallel vs hardware-accelerated SHA-256</small></span>
        </div>
        ` : ''}
      </div>

      ${noHttpsNote}
      <p class="verdict-context">${deviceNote}</p>

      ${blake3Faster ? `
        <p class="verdict-highlight">BLAKE3 is faster <em>even single-threaded without any hardware help</em>. With ${numWorkers} cores, it pulls further ahead — and SHA-256 can never parallelize.</p>
      ` : `
        <p class="verdict-highlight">SHA-256's hardware acceleration keeps it competitive single-threaded. But BLAKE3 with ${numWorkers} cores changes the equation — and SHA-256 has no parallel option.</p>
      `}

      <div class="verdict-why">
        <h4>Why BLAKE3 matters beyond speed</h4>
        <ul>
          <li><strong>Parallel by design</strong> — tree structure scales with every core; SHA-256 is forever single-threaded</li>
          <li><strong>No length extension attacks</strong> — a fundamental SHA-256 vulnerability BLAKE3 avoids entirely</li>
          <li><strong>Verified streaming</strong> — verify data integrity as it downloads, not after</li>
          <li><strong>Hardware independent</strong> — fast on every device, not just those with crypto extensions</li>
          <li><strong>Future-proof</strong> — more cores per device every year means BLAKE3 gets faster for free</li>
        </ul>
      </div>

      <div class="verdict-cta">
        <a href="https://github.com/BLAKE3-team/BLAKE3" target="_blank" rel="noopener" class="cta-button">Explore BLAKE3 on GitHub</a>
        <a href="https://blake3.io" target="_blank" rel="noopener" class="cta-link">blake3.io</a>
      </div>
    </div>
  `
}
