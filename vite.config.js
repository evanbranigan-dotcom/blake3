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
      },
    },
  },
  server: {
    host: true,
  },
})
