import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    target: 'es2020',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        methodology: resolve(__dirname, 'methodology.html'),
        cryptobench: resolve(__dirname, 'cryptobench.html'),
        devicebench: resolve(__dirname, 'devicebench.html'),
        hashmeter: resolve(__dirname, 'hashmeter.html'),
        'eli5/index': resolve(__dirname, 'eli5/index.html'),
        'eli5/sha-256': resolve(__dirname, 'eli5/sha-256.html'),
        'eli5/how-sha256-works': resolve(__dirname, 'eli5/how-sha256-works.html'),
        'eli5/blake3': resolve(__dirname, 'eli5/blake3.html'),
        'eli5/how-blake3-works': resolve(__dirname, 'eli5/how-blake3-works.html'),
        'eli5/compliance': resolve(__dirname, 'eli5/compliance.html'),
        'eli5/private-sector': resolve(__dirname, 'eli5/private-sector.html'),
        'eli5/adoption': resolve(__dirname, 'eli5/adoption.html'),
      },
    },
  },
  server: {
    host: true,
  },
})
