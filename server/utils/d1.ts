import { createError } from 'h3'
import { getEnv } from './env'

let _db: any = null
let _httpClient: any = null

// ---------------------------------------------------------------------------
// D1 HTTP API client — fallback for local dev without wrangler
// Reads env: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_TOKEN, CLOUDFLARE_D1_DATABASE_ID
// ---------------------------------------------------------------------------

function getHttpClient() {
  if (_httpClient) return _httpClient

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const apiToken = process.env.CLOUDFLARE_D1_TOKEN
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID

  if (!accountId || !apiToken || !databaseId) {
    throw createError({
      statusCode: 500,
      statusMessage:
        'D1 not available. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_TOKEN, CLOUDFLARE_D1_DATABASE_ID in .env',
    })
  }

  const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`

  _httpClient = {
    prepare(sql: string) {
      return new D1HttpStatement(apiUrl, apiToken, sql)
    },
  }

  return _httpClient
}

class D1HttpStatement {
  private apiUrl: string
  private apiToken: string
  private sql: string
  private params: any[] = []

  constructor(apiUrl: string, apiToken: string, sql: string) {
    this.apiUrl = apiUrl
    this.apiToken = apiToken
    this.sql = sql
  }

  bind(...args: any[]) {
    this.params = args
    return this
  }

  async run() {
    this.guardReadOnly()
    return this.query()
  }

  async all<T = any>() {
    this.guardReadOnly()
    const res = await this.query()
    return { results: (res as any).results ?? [] } as { results: T[] }
  }

  async first<T = any>() {
    const { results } = await this.all<T>()
    return results.length ? results[0] : null
  }

  /** Block writes in local dev — the HTTP API hits the production DB directly. */
  private guardReadOnly() {
    const first = this.sql.trim().toUpperCase().split(/\s+/)[0]
    if (first !== 'SELECT' && first !== 'PRAGMA') {
      throw createError({
        statusCode: 403,
        statusMessage:
          'D1 write blocked in local dev (read-only via HTTP API). ' +
          'Set CLOUDFLARE_D1_TOKEN to a read-only token, or use wrangler dev for writes.',
      })
    }
  }

  private async query() {
    const res = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: this.sql, params: this.params }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw createError({
        statusCode: 502,
        statusMessage: `D1 HTTP API error (${res.status}): ${text.slice(0, 500)}`,
      })
    }

    const json: any = await res.json()
    if (!json.success) {
      const msg = json.errors?.[0]?.message ?? JSON.stringify(json.errors)
      throw createError({ statusCode: 502, statusMessage: `D1 query failed: ${msg}` })
    }

    // D1 HTTP API returns result[0] as the statement result
    return json.result[0]
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Get D1 binding — CF runtime → HTTP API fallback (local dev). */
export function useD1(event?: any): any {
  if (_db) return _db

  // 1. CF runtime context (production or wrangler dev)
  if (event) {
    try {
      const env = getEnv(event)
      if (env.DB) {
        _db = env.DB
        return _db
      }
    } catch {
      // fall through
    }
  }

  // 2. D1 HTTP API fallback (local dev without wrangler)
  return getHttpClient()
}

export async function sql(event: any, query: string, ...bindings: any[]) {
  const db = useD1(event)
  const stmt = db.prepare(query)
  const bound = bindings.length ? stmt.bind(...bindings) : stmt
  return await bound.run()
}

export async function sqlAll<T = any>(event: any, query: string, ...bindings: any[]) {
  const db = useD1(event)
  const stmt = db.prepare(query)
  const bound = bindings.length ? stmt.bind(...bindings) : stmt
  const { results } = await bound.all<T>()
  return results as T[]
}

export async function sqlOne<T = any>(event: any, query: string, ...bindings: any[]) {
  const results = await sqlAll<T>(event, query, ...bindings)
  return results.length ? results[0] : null
}
