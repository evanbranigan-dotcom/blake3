import { detectDevice, renderDeviceCard } from './device'
import { runBenchmark, hasWebCrypto } from './benchmark'
import { renderResults, renderVerdict } from './results'

// Detect device on load
const device = detectDevice()
renderDeviceCard(device)

// Scroll reveal
const sections = document.querySelectorAll('.section')
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
      }
    })
  },
  { threshold: 0.1 }
)
sections.forEach((s) => observer.observe(s))

// Show notice if Web Crypto unavailable (HTTP, not HTTPS)
if (!hasWebCrypto) {
  const intro = document.querySelector('.benchmark-intro')
  if (intro) {
    intro.insertAdjacentHTML('afterend',
      '<p class="webcrypto-notice">Web Crypto API unavailable (requires HTTPS). Running BLAKE3 vs SHA-256 software comparison only.</p>'
    )
  }
}

// Accordion: only one item open at a time within each group
function setupAccordion(selector: string): void {
  const items = document.querySelectorAll<HTMLDetailsElement>(selector)
  items.forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        items.forEach((other) => {
          if (other !== item) other.removeAttribute('open')
        })
      }
    })
  })
}
setupAccordion('details.question-card')

// Section accordion: toggle "Show" / "Hide" text
document.querySelectorAll<HTMLDetailsElement>('.section-accordion').forEach((accordion) => {
  const toggle = accordion.querySelector('.section-accordion-toggle span:first-child')
  if (!toggle) return
  const showText = toggle.textContent ?? ''
  const hideText = showText.replace('Show', 'Hide')
  accordion.addEventListener('toggle', () => {
    toggle.textContent = accordion.open ? hideText : showText
  })
})

// Benchmark
const runBtn = document.getElementById('run-btn') as HTMLButtonElement
const progressEl = document.getElementById('benchmark-progress')!
const progressFill = document.getElementById('progress-fill') as HTMLElement
const progressLabel = document.getElementById('progress-label')!

runBtn.addEventListener('click', async () => {
  runBtn.disabled = true
  runBtn.querySelector('.run-text')!.textContent = 'Running...'
  progressEl.classList.remove('hidden')

  try {
    const results = await runBenchmark(({ step, totalSteps, current }) => {
      const pct = (step / totalSteps) * 100
      progressFill.style.width = `${pct}%`
      progressLabel.textContent = current
    })

    progressEl.classList.add('hidden')
    runBtn.querySelector('.run-text')!.textContent = 'Run again'
    runBtn.disabled = false

    renderResults(results)
    renderVerdict(results, device)

    // Scroll to results
    document.getElementById('results-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  } catch (err) {
    console.error('Benchmark failed:', err)
    progressLabel.textContent = `Error: ${err instanceof Error ? err.message : String(err)}`
    runBtn.querySelector('.run-text')!.textContent = 'Try again'
    runBtn.disabled = false
  }
})
