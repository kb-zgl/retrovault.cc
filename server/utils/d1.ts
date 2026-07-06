import Database from 'better-sqlite3'

let _db: D1Database | any = null

export function useD1(): D1Database {
  if (_db) return _db

  // 1. Production / wrangler dev: D1 binding via process.env
  if ((process.env as any).DB) {
    _db = (process.env as any).DB
    return _db
  }

  // 2. Local dev: use better-sqlite3 which is already in dependencies
  try {
    const { join } = require('node:path')
    const dbPath = join(process.cwd(), '.data', 'retro-vault.sqlite')
    const sqlite = new Database(dbPath)
    sqlite.pragma('journal_mode = WAL')
    // Auto-create table on first use
    sqlite.exec(`CREATE TABLE IF NOT EXISTS games (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      platform TEXT NOT NULL,
      year INTEGER, genre TEXT, developer TEXT, publisher TEXT, series TEXT,
      isHack INTEGER DEFAULT 0, coverUrl TEXT, defaultRom TEXT,
      ejsCore TEXT, ejsBiosUrl TEXT, tags TEXT, description TEXT,
      langs TEXT, roms TEXT, status TEXT DEFAULT 'draft',
      source TEXT DEFAULT 'scraped', createdAt TEXT, updatedAt TEXT
    )`)
    _db = sqlite
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
  // D1 API
  if (typeof db.prepare === 'function' && typeof db.prepare(query).bind === 'function') {
    const stmt = db.prepare(query)
    if (bindings.length) stmt.bind(...bindings)
    return await stmt.run()
  }
  // better-sqlite3 API
  const stmt = db.prepare(query)
  const result = stmt.run(...bindings)
  return { success: true, meta: { changes: result.changes } }
}

export async function sqlAll<T = any>(query: string, ...bindings: any[]): Promise<T[]> {
  const db = useD1()
  // D1 API
  if (typeof db.prepare === 'function' && typeof db.prepare(query).all === 'function') {
    const stmt = db.prepare(query)
    if (bindings.length) stmt.bind(...bindings)
    const { results } = await stmt.all<T>()
    return results
  }
  // better-sqlite3 API
  const stmt = db.prepare(query)
  return stmt.all(...bindings) as T[]
}

export async function sqlOne<T = any>(query: string, ...bindings: any[]): Promise<T | null> {
  const results = await sqlAll<T>(query, ...bindings)
  return results.length ? results[0] : null
}
