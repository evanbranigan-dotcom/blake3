import { blake3 } from 'hash-wasm'

self.onmessage = async (e: MessageEvent<{ chunk: Uint8Array; index: number }>) => {
  const { chunk, index } = e.data
  const hash = await blake3(chunk)
  self.postMessage({ hash, index })
}
