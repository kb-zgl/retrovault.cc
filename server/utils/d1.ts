import Database from 'better-sqlite3'
import { join } from 'node:path'

let _db: any = null
let _isBetterSqlite = false

export function useD1(): any {
  if (_db) return _db

  // 1. Production / wrangler dev: D1 binding via process.env
  if ((process.env as any).DB) {
    _db = (process.env as any).DB
    _isBetterSqlite = false
    return _db
  }

  // 2. Local dev: use better-sqlite3
  try {
    const dbPath = join(process.cwd(), '.data', 'retro-vault.sqlite')
    const sqlite = new Database(dbPath)
    sqlite.pragma('journal_mode = WAL')
    sqlite.exec(`CREATE TABLE IF NOT EXISTS games (
      slug TEXT PRIMARY KEY, title TEXT NOT NULL, platform TEXT NOT NULL,
      year INTEGER, genre TEXT, developer TEXT, publisher TEXT, series TEXT,
      isHack INTEGER DEFAULT 0, coverUrl TEXT, defaultRom TEXT,
      ejsCore TEXT, ejsBiosUrl TEXT, tags TEXT, description TEXT,
      langs TEXT, roms TEXT, status TEXT DEFAULT 'draft',
      source TEXT DEFAULT 'scraped', createdAt TEXT, updatedAt TEXT
    )`)
    _db = sqlite
    _isBetterSqlite = true
    return _db
  } catch (e) {
    throw createError({
      statusCode: 500,
      statusMessage: `D1 not available and local SQLite failed: ${e instanceof Error ? e.message : e}`,
    })
  }
}

export async function sql(query: string, ...bindings: any[]) {
  const db = useD1()
  if (_isBetterSqlite) {
    const result = db.prepare(query).run(...bindings)
    return { success: true, meta: { changes: result.changes } }
  }
  // D1
  const stmt = db.prepare(query)
  const bound = bindings.length ? stmt.bind(...bindings) : stmt
  return await bound.run()
}

export async function sqlAll<T = any>(query: string, ...bindings: any[]): Promise<T[]> {
  const db = useD1()
  if (_isBetterSqlite) {
    return db.prepare(query).all(...bindings) as T[]
  }
  // D1
  const stmt = db.prepare(query)
  const bound = bindings.length ? stmt.bind(...bindings) : stmt
  const { results } = await bound.all<T>()
  return results
}

export async function sqlOne<T = any>(query: string, ...bindings: any[]): Promise<T | null> {
  const results = await sqlAll<T>(query, ...bindings)
  return results.length ? results[0] : null
}
