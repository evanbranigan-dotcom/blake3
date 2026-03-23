const ALGO_CONFIG = {
  blake3: { label: 'BLAKE3', color: '#00ff88', class: 'bar-blake3' },
  sha256wasm: { label: 'SHA-256 (WASM)', color: '#ff8800', class: 'bar-sha256wasm' },
  sha256crypto: { label: 'SHA-256 (HW)', color: '#4488ff', class: 'bar-sha256crypto' },
}

function formatThroughput(mbps) {
  if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)} GB/s`
  if (mbps >= 1) return `${mbps.toFixed(1)} MB/s`
  return `${(mbps * 1024).toFixed(0)} KB/s`
}

function formatTime(ms) {
  if (ms < 0.01) return `${(ms * 1000).toFixed(1)} us`
  if (ms < 1) return `${ms.toFixed(2)} ms`
  return `${ms.toFixed(0)} ms`
}

export function renderResults(results) {
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
        </div>
      `
    }

    html += `</div>`
  }

  container.innerHTML = html

  // Trigger bar animations after DOM update
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      container.querySelectorAll('[data-animate]').forEach(bar => {
        bar.style.width = bar.style.getPropertyValue('--target-width')
      })
    })
  })
}

export function renderVerdict(results, device) {
  const verdict = document.getElementById('verdict-content')
  if (!verdict) return

  // Compute average speedup across all sizes
  let blake3VsSha256Wasm = 0
  let blake3VsSha256Crypto = 0
  let cryptoCount = 0
  let count = 0

  for (const r of results) {
    const b3 = r.algorithms.blake3.throughputMBps
    const sw = r.algorithms.sha256wasm.throughputMBps
    blake3VsSha256Wasm += b3 / sw
    count++
    if (r.algorithms.sha256crypto) {
      blake3VsSha256Crypto += b3 / r.algorithms.sha256crypto.throughputMBps
      cryptoCount++
    }
  }

  blake3VsSha256Wasm = (blake3VsSha256Wasm / count).toFixed(1)
  const hasCryptoResults = cryptoCount > 0
  if (hasCryptoResults) {
    blake3VsSha256Crypto = (blake3VsSha256Crypto / cryptoCount).toFixed(1)
  }

  const blake3Faster = hasCryptoResults ? blake3VsSha256Crypto > 1 : true

  const deviceNote = device.isIPhone
    ? `Your ${device.deviceLabel} has <strong>${device.chip}</strong> with dedicated SHA-2 hardware acceleration — giving SHA-256 every possible advantage.`
    : `Your ${device.deviceLabel} was used for this test.`

  const noHttpsNote = !hasCryptoResults
    ? `<p class="verdict-note">Note: Hardware-accelerated SHA-256 (Web Crypto API) requires HTTPS. Deploy to Vercel to see the full 3-way comparison.</p>`
    : ''

  verdict.innerHTML = `
    <div class="verdict-card">
      <h3 class="verdict-title">${blake3Faster ? 'BLAKE3 wins.' : 'A close fight.'}</h3>

      <div class="verdict-stats">
        <div class="verdict-stat">
          <span class="verdict-number" style="color: #00ff88">${blake3VsSha256Wasm}x</span>
          <span class="verdict-desc">faster than SHA-256<br><small>software vs software (fair comparison)</small></span>
        </div>
        ${hasCryptoResults ? `
        <div class="verdict-stat">
          <span class="verdict-number" style="color: ${blake3Faster ? '#00ff88' : '#ff8800'}">${blake3VsSha256Crypto}x</span>
          <span class="verdict-desc">${blake3Faster ? 'faster' : 'vs'} SHA-256 with hardware<br><small>BLAKE3 in software vs SHA-256 with HW acceleration</small></span>
        </div>
        ` : ''}
      </div>

      ${noHttpsNote}
      <p class="verdict-context">${deviceNote}</p>

      ${blake3Faster ? `
        <p class="verdict-highlight">BLAKE3 is faster <em>even without any hardware help</em> — purely through better algorithm design.</p>
      ` : `
        <p class="verdict-highlight">SHA-256's hardware acceleration keeps it competitive on this device. But BLAKE3 achieves similar performance <em>entirely in software</em> — no special chip required.</p>
      `}

      <div class="verdict-why">
        <h4>Why BLAKE3 matters beyond speed</h4>
        <ul>
          <li><strong>Parallel by design</strong> — tree structure scales with cores; SHA-256 is forever sequential</li>
          <li><strong>No length extension attacks</strong> — a fundamental SHA-256 vulnerability BLAKE3 avoids entirely</li>
          <li><strong>Verified streaming</strong> — verify data as it downloads, not after</li>
          <li><strong>Hardware independent</strong> — fast on every device, not just those with crypto extensions</li>
        </ul>
      </div>

      <div class="verdict-cta">
        <a href="https://github.com/BLAKE3-team/BLAKE3" target="_blank" rel="noopener" class="cta-button">Explore BLAKE3 on GitHub</a>
        <a href="https://blake3.io" target="_blank" rel="noopener" class="cta-link">blake3.io</a>
      </div>
    </div>
  `
}
