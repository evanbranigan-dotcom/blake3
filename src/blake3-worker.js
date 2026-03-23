import { blake3 } from 'hash-wasm'

self.onmessage = async (e) => {
  const { chunk, index } = e.data
  const hash = await blake3(chunk)
  self.postMessage({ hash, index })
}
