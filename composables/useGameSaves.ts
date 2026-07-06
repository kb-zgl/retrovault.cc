/**
 * Game save states — IndexedDB-backed binary storage.
 * Stores emulator snapshot data (Uint8Array) for "continue" feature.
 */

const DB_NAME = 'RetroVaultSaves'
const STORE_NAME = 'saveStates'
const DB_VERSION = 1

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'slug' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => {
      dbPromise = null
      reject(req.error)
    }
  })
  return dbPromise
}

export function useGameSaves() {
  async function saveState(slug: string, data: Uint8Array): Promise<void> {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put({ slug, data, savedAt: Date.now() })
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    } catch {
      // silent fail — save state is best-effort
    }
  }

  async function loadState(slug: string): Promise<Uint8Array | null> {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(slug)
      return await new Promise<Uint8Array | null>((resolve) => {
        req.onsuccess = () => resolve(req.result?.data ?? null)
        req.onerror = () => resolve(null)
      })
    } catch {
      return null
    }
  }

  async function remove(slug: string): Promise<void> {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(slug)
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    } catch { /* ignore */ }
  }

  async function hasSave(slug: string): Promise<boolean> {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_NAME, 'readonly')
      const count = tx.objectStore(STORE_NAME).count(slug)
      return await new Promise<boolean>((resolve) => {
        count.onsuccess = () => resolve(count.result > 0)
        count.onerror = () => resolve(false)
      })
    } catch {
      return false
    }
  }

  return { saveState, loadState, remove, hasSave }
}
