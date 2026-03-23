import { IPHONE_MODELS } from './data.js'

export function detectDevice() {
  const ua = navigator.userAgent
  const isIPhone = /iPhone/.test(ua)
  const isIPad = /iPad/.test(ua)
  const isMac = /Macintosh/.test(ua)
  const isAndroid = /Android/.test(ua)

  const width = window.screen.width
  const height = window.screen.height
  const dpr = window.devicePixelRatio
  const cores = navigator.hardwareConcurrency || 'unknown'

  // Normalize to portrait orientation
  const w = Math.min(width, height)
  const h = Math.max(width, height)
  const key = `${w}x${h}@${dpr}`

  const result = {
    isIPhone,
    raw: { width: w, height: h, dpr, cores, ua },
    model: null,
    chip: null,
    cores,
    shaHW: false,
    deviceLabel: 'Unknown device',
  }

  if (isIPhone) {
    const match = IPHONE_MODELS[key]
    if (match) {
      result.model = match.models[0]
      if (match.models.length > 1) {
        result.modelAlt = match.models.slice(1)
      }
      result.chip = match.chip
      result.cores = cores
      result.shaHW = match.shaHW
      result.deviceLabel = `iPhone ${match.models[0]}`
    } else {
      result.model = 'iPhone (unrecognized model)'
      result.chip = 'Apple A-series'
      result.shaHW = true // all modern iPhones have it
      result.deviceLabel = 'iPhone'
    }
  } else if (isIPad) {
    result.deviceLabel = 'iPad'
    result.chip = 'Apple Silicon'
    result.shaHW = true
  } else if (isMac) {
    result.deviceLabel = 'Mac'
    result.chip = navigator.platform === 'MacIntel' ? 'Intel / Apple Silicon' : 'Apple Silicon'
    result.shaHW = true
  } else if (isAndroid) {
    result.deviceLabel = 'Android device'
    result.shaHW = false // can't confirm
  } else {
    result.deviceLabel = 'Desktop / Other'
    result.shaHW = false
  }

  return result
}

export function renderDeviceCard(device) {
  const section = document.getElementById('device-info')
  if (!section) return

  const coreText = device.cores !== 'unknown' ? `${device.cores} cores` : ''
  const shaText = device.shaHW ? 'SHA-2 hardware acceleration' : 'No SHA-2 hardware acceleration'
  const altModels = device.modelAlt ? `<span class="device-alt">(or ${device.modelAlt.join(', ')})</span>` : ''

  section.innerHTML = `
    <div class="device-card">
      <div class="device-icon">${device.isIPhone ? '📱' : '💻'}</div>
      <h3 class="device-name">${device.deviceLabel} ${altModels}</h3>
      <div class="device-specs">
        ${device.chip ? `<span class="spec-chip">${device.chip}</span>` : ''}
        ${coreText ? `<span class="spec-cores">${coreText}</span>` : ''}
        <span class="spec-sha ${device.shaHW ? 'sha-yes' : 'sha-no'}">${shaText}</span>
      </div>
      <p class="device-note">Detected via screen dimensions ${device.raw.width}x${device.raw.height}@${device.raw.dpr}x</p>
    </div>
  `
}
