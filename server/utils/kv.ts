// KV storage abstraction.
// Production: Cloudflare KV binding via process.env.RETROVAULT_KV
// Dev: in-memory Map fallback so pnpm dev works without a real KV namespace

interface KvStore {
  get(key: string): Promise<string | null>
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

let devStore: Map<string, { value: string; expiresAt?: number }> | null = null

function getDevStore(): KvStore {
  if (!devStore) devStore = new Map()

  return {
    async get(key) {
      const entry = devStore!.get(key)
      if (!entry) return null
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        devStore!.delete(key)
        return null
      }
      return entry.value
    },
    async put(key, value, opts) {
      devStore!.set(key, {
        value,
        expiresAt: opts?.expirationTtl ? Date.now() + opts.expirationTtl * 1000 : undefined,
      })
    },
    async delete(key) {
      devStore!.delete(key)
    },
  }
}

let prodKv: KvStore | null = null

function getProdKv(): KvStore {
  if (prodKv) return prodKv

  // In Cloudflare Workers, the KV binding is on process.env
  const binding = (process.env as any).RETROVAULT_KV
  if (!binding) {
    console.warn('[kv] RETROVAULT_KV binding not found, falling back to dev store')
    return getDevStore()
  }

  prodKv = {
    get: (key: string) => binding.get(key),
    put: (key: string, value: string, opts?: { expirationTtl?: number }) =>
      binding.put(key, value, opts),
    delete: (key: string) => binding.delete(key),
  }
  return prodKv
}

export function useKv(): KvStore {
  const isCf = typeof process !== 'undefined' && (process.env as any).RETROVAULT_KV
  return isCf ? getProdKv() : getDevStore()
}
