import { IPHONE_MODELS, ANDROID_MODELS } from './data'

export interface DeviceInfo {
  isIPhone: boolean
  isAndroid?: boolean
  raw: { width: number; height: number; dpr: number; cores: number | string; ua: string }
  model: string | null
  modelAlt?: string[]
  chip: string | null
  cores: number | string
  shaHW: boolean
  deviceLabel: string
  memory?: number
}

// Extract device model from Android Chrome user agent
// Format: "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/..."
function parseAndroidModel(ua: string): string | null {
  const match = ua.match(/Android\s[\d.]+;\s*(.+?)(?:\s*Build\/|\))/)
  return match ? match[1].trim() : null
}

export function detectDevice(): DeviceInfo {
  const ua = navigator.userAgent
  const isIPhone = /iPhone/.test(ua)
  const isIPad = /iPad/.test(ua)
  const isMac = /Macintosh/.test(ua)
  const isAndroid = /Android/.test(ua)

  const width = window.screen.width
  const height = window.screen.height
  const dpr = window.devicePixelRatio
  const cores: number | string = navigator.hardwareConcurrency || 'unknown'

  // Normalize to portrait orientation
  const w = Math.min(width, height)
  const h = Math.max(width, height)
  const key = `${w}x${h}@${dpr}`

  const result: DeviceInfo = {
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
    const androidModel = parseAndroidModel(ua)
    const match = androidModel ? ANDROID_MODELS[androidModel] : null
    const memory = (navigator as { deviceMemory?: number }).deviceMemory // Chrome-only, RAM in GB

    if (match) {
      const displayName = match.marketing || androidModel || 'Android device'
      result.model = androidModel
      result.chip = match.chip
      result.shaHW = match.shaHW
      result.deviceLabel = displayName
      result.isAndroid = true
    } else {
      // Unrecognized model — still show what we know
      result.model = androidModel || 'Unknown Android'
      result.deviceLabel = androidModel || 'Android device'
      result.shaHW = false // can't confirm without chip identification
      result.isAndroid = true
    }

    if (memory) {
      result.memory = memory
    }
  } else {
    result.deviceLabel = 'Desktop / Other'
    result.shaHW = false
  }

  return result
}

export function renderDeviceCard(device: DeviceInfo): void {
  const section = document.getElementById('device-info')
  if (!section) return

  const coreText = device.cores !== 'unknown' ? `${device.cores} cores` : ''
  const shaText = device.shaHW
    ? 'SHA-2 hardware acceleration'
    : device.isAndroid && !device.chip
      ? 'SHA-2 hardware acceleration unknown'
      : 'No SHA-2 hardware acceleration'
  const shaClass = device.shaHW
    ? 'sha-yes'
    : device.isAndroid && !device.chip
      ? 'sha-unknown'
      : 'sha-no'
  const altModels = device.modelAlt ? `<span class="device-alt">(or ${device.modelAlt.join(', ')})</span>` : ''
  const memoryText = device.memory ? `<span class="spec-memory">${device.memory} GB RAM</span>` : ''
  const isMobile = device.isIPhone || device.isAndroid
  const icon = isMobile ? '📱' : '💻'

  // Detection method note
  let detectionNote: string
  if (device.isAndroid && device.chip) {
    detectionNote = `Detected via user agent model identifier`
  } else if (device.isAndroid) {
    detectionNote = `Model: ${device.model || 'not exposed'} — chip not in database yet`
  } else {
    detectionNote = `Detected via screen dimensions ${device.raw.width}x${device.raw.height}@${device.raw.dpr}x`
  }

  section.innerHTML = `
    <div class="device-card">
      <div class="device-icon">${icon}</div>
      <h3 class="device-name">${device.deviceLabel} ${altModels}</h3>
      <div class="device-specs">
        ${device.chip ? `<span class="spec-chip">${device.chip}</span>` : ''}
        ${coreText ? `<span class="spec-cores">${coreText}</span>` : ''}
        ${memoryText}
        <span class="spec-sha ${shaClass}">${shaText}</span>
      </div>
      <p class="device-note">${detectionNote}</p>
    </div>
  `
}
