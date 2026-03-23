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
    chip: 'A11 Bionic',
    chipGen: 'A11',
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
