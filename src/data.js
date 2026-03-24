// iPhone model detection lookup table
// Key format: "{width}x{height}@{pixelRatio}" using screen.width/height (CSS points)
// Multiple models may share the same screen signature — we list the most likely

export const IPHONE_MODELS = {
  // iPhone SE (2nd gen, 2020) / iPhone 8 / iPhone 7 / iPhone 6s
  '375x667@2': {
    models: ['iPhone SE (2nd gen)', 'iPhone 8', 'iPhone 7'],
    chip: 'A13 Bionic',
    chipGen: 'A13',
    cores: 6,
    shaHW: true,
  },
  // iPhone SE (3rd gen, 2022)
  // Same screen as SE 2nd gen — distinguished by hardwareConcurrency if possible
  // A15 has 6 cores same as A13, so we note both possibilities

  // iPhone 8 Plus / 7 Plus / 6s Plus
  '414x736@3': {
    models: ['iPhone 8 Plus', '7 Plus'],
    chip: 'A10 Fusion / A11 Bionic',
    chipGen: 'A10',
    cores: 6,
    shaHW: true,
  },

  // iPhone X / XS / 11 Pro
  '375x812@3': {
    models: ['iPhone X', 'XS', '11 Pro'],
    chip: 'A12–A13 Bionic',
    chipGen: 'A12',
    cores: 6,
    shaHW: true,
  },

  // iPhone XR / 11
  '414x896@2': {
    models: ['iPhone XR', '11'],
    chip: 'A12–A13 Bionic',
    chipGen: 'A12',
    cores: 6,
    shaHW: true,
  },

  // iPhone XS Max / 11 Pro Max
  '414x896@3': {
    models: ['iPhone XS Max', '11 Pro Max'],
    chip: 'A12–A13 Bionic',
    chipGen: 'A12',
    cores: 6,
    shaHW: true,
  },

  // iPhone 12 mini / 13 mini
  '375x812@3_mini': null, // same as X/XS — see resolution logic below

  // iPhone 12 / 12 Pro / 13 / 13 Pro / 14
  '390x844@3': {
    models: ['iPhone 12', '12 Pro', '13', '13 Pro', '14'],
    chip: 'A14–A16 Bionic',
    chipGen: 'A14',
    cores: 6,
    shaHW: true,
  },

  // iPhone 12 Pro Max / 13 Pro Max / 14 Plus
  '428x926@3': {
    models: ['iPhone 12 Pro Max', '13 Pro Max', '14 Plus'],
    chip: 'A14–A16 Bionic',
    chipGen: 'A14',
    cores: 6,
    shaHW: true,
  },

  // iPhone 14 Pro
  '393x852@3': {
    models: ['iPhone 14 Pro', '15', '15 Pro'],
    chip: 'A16–A17 Pro',
    chipGen: 'A16',
    cores: 6,
    shaHW: true,
  },

  // iPhone 14 Pro Max / 15 Plus / 15 Pro Max
  '430x932@3': {
    models: ['iPhone 14 Pro Max', '15 Plus', '15 Pro Max'],
    chip: 'A16–A17 Pro',
    chipGen: 'A16',
    cores: 6,
    shaHW: true,
  },

  // iPhone 16 / 16 Pro
  '402x874@3': {
    models: ['iPhone 16', '16 Pro'],
    chip: 'A18 / A18 Pro',
    chipGen: 'A18',
    cores: 6,
    shaHW: true,
  },

  // iPhone 16 Plus / 16 Pro Max
  '440x956@3': {
    models: ['iPhone 16 Plus', '16 Pro Max'],
    chip: 'A18 / A18 Pro',
    chipGen: 'A18',
    cores: 6,
    shaHW: true,
  },

  // iPhone 16e
  '375x667@2_16e': null, // same as SE — see core count logic
}

// Android model detection lookup table
// Key: model string extracted from user agent (e.g., "Pixel 8 Pro", "SM-S928B")
// Android Chrome UA format: "... Android 14; Pixel 8 Pro) ..."
// We match against both marketing names and model numbers
export const ANDROID_MODELS = {
  // Google Pixel — Tensor chips
  'Pixel 9 Pro XL':   { chip: 'Tensor G4', shaHW: true },
  'Pixel 9 Pro':      { chip: 'Tensor G4', shaHW: true },
  'Pixel 9':          { chip: 'Tensor G4', shaHW: true },
  'Pixel 8a':         { chip: 'Tensor G3', shaHW: true },
  'Pixel 8 Pro':      { chip: 'Tensor G3', shaHW: true },
  'Pixel 8':          { chip: 'Tensor G3', shaHW: true },
  'Pixel 7a':         { chip: 'Tensor G2', shaHW: true },
  'Pixel 7 Pro':      { chip: 'Tensor G2', shaHW: true },
  'Pixel 7':          { chip: 'Tensor G2', shaHW: true },
  'Pixel 6a':         { chip: 'Tensor',    shaHW: true },
  'Pixel 6 Pro':      { chip: 'Tensor',    shaHW: true },
  'Pixel 6':          { chip: 'Tensor',    shaHW: true },

  // Samsung Galaxy S series — Snapdragon (US/global variants)
  'SM-S928B': { chip: 'Snapdragon 8 Gen 3', shaHW: true, marketing: 'Galaxy S24 Ultra' },
  'SM-S928U': { chip: 'Snapdragon 8 Gen 3', shaHW: true, marketing: 'Galaxy S24 Ultra' },
  'SM-S926B': { chip: 'Snapdragon 8 Gen 3', shaHW: true, marketing: 'Galaxy S24+' },
  'SM-S926U': { chip: 'Snapdragon 8 Gen 3', shaHW: true, marketing: 'Galaxy S24+' },
  'SM-S921B': { chip: 'Snapdragon 8 Gen 3', shaHW: true, marketing: 'Galaxy S24' },
  'SM-S921U': { chip: 'Snapdragon 8 Gen 3', shaHW: true, marketing: 'Galaxy S24' },
  'SM-S918B': { chip: 'Snapdragon 8 Gen 2', shaHW: true, marketing: 'Galaxy S23 Ultra' },
  'SM-S918U': { chip: 'Snapdragon 8 Gen 2', shaHW: true, marketing: 'Galaxy S23 Ultra' },
  'SM-S916B': { chip: 'Snapdragon 8 Gen 2', shaHW: true, marketing: 'Galaxy S23+' },
  'SM-S911B': { chip: 'Snapdragon 8 Gen 2', shaHW: true, marketing: 'Galaxy S23' },
  'SM-S908B': { chip: 'Snapdragon 8 Gen 1', shaHW: true, marketing: 'Galaxy S22 Ultra' },
  'SM-S908U': { chip: 'Snapdragon 8 Gen 1', shaHW: true, marketing: 'Galaxy S22 Ultra' },
  'SM-S906B': { chip: 'Snapdragon 8 Gen 1', shaHW: true, marketing: 'Galaxy S22+' },
  'SM-S901B': { chip: 'Snapdragon 8 Gen 1', shaHW: true, marketing: 'Galaxy S22' },

  // Samsung Galaxy S — marketing name fallbacks (some UAs use these)
  'Galaxy S24 Ultra':  { chip: 'Snapdragon 8 Gen 3', shaHW: true },
  'Galaxy S24+':       { chip: 'Snapdragon 8 Gen 3', shaHW: true },
  'Galaxy S24':        { chip: 'Snapdragon 8 Gen 3', shaHW: true },
  'Galaxy S23 Ultra':  { chip: 'Snapdragon 8 Gen 2', shaHW: true },
  'Galaxy S23+':       { chip: 'Snapdragon 8 Gen 2', shaHW: true },
  'Galaxy S23':        { chip: 'Snapdragon 8 Gen 2', shaHW: true },

  // Samsung Galaxy Z Fold/Flip
  'SM-F956B': { chip: 'Snapdragon 8 Gen 3', shaHW: true, marketing: 'Galaxy Z Fold6' },
  'SM-F741B': { chip: 'Snapdragon 8 Gen 3', shaHW: true, marketing: 'Galaxy Z Flip6' },
  'SM-F946B': { chip: 'Snapdragon 8 Gen 2', shaHW: true, marketing: 'Galaxy Z Fold5' },
  'SM-F731B': { chip: 'Snapdragon 8 Gen 2', shaHW: true, marketing: 'Galaxy Z Flip5' },

  // Samsung Galaxy A series (mid-range)
  'SM-A556B': { chip: 'Exynos 1480', shaHW: true, marketing: 'Galaxy A55' },
  'SM-A546B': { chip: 'Exynos 1380', shaHW: true, marketing: 'Galaxy A54' },
  'SM-A356B': { chip: 'Exynos 1480', shaHW: true, marketing: 'Galaxy A35' },

  // OnePlus
  'CPH2581': { chip: 'Snapdragon 8 Gen 3', shaHW: true, marketing: 'OnePlus 12' },
  'CPH2449': { chip: 'Snapdragon 8 Gen 2', shaHW: true, marketing: 'OnePlus 11' },

  // Xiaomi
  '2311DRK48C': { chip: 'Snapdragon 8 Gen 3', shaHW: true, marketing: 'Xiaomi 14' },
  '2210132G':   { chip: 'Snapdragon 8 Gen 2', shaHW: true, marketing: 'Xiaomi 13' },
}

// Chip details for the verdict section
export const CHIP_INFO = {
  A11: { year: 2017, nm: '10nm', shaAccel: 'ARMv8.2 Crypto Extensions' },
  A12: { year: 2018, nm: '7nm', shaAccel: 'ARMv8.3 Crypto Extensions' },
  A13: { year: 2019, nm: '7nm', shaAccel: 'ARMv8.3 Crypto Extensions' },
  A14: { year: 2020, nm: '5nm', shaAccel: 'ARMv8.4 Crypto Extensions' },
  A15: { year: 2021, nm: '5nm', shaAccel: 'ARMv8.5 Crypto Extensions' },
  A16: { year: 2022, nm: '4nm', shaAccel: 'ARMv8.6 Crypto Extensions' },
  A17: { year: 2023, nm: '3nm', shaAccel: 'ARMv8.6 Crypto Extensions' },
  A18: { year: 2024, nm: '3nm', shaAccel: 'ARMv9.2 Crypto Extensions' },
}
