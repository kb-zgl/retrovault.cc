import { getEnv } from './env'

let _db: any = null

/** Get D1 binding from the current request event or cached binding. */
export function useD1(event?: any): any {
  if (_db) return _db

  // If event is provided, get binding from Cloudflare runtime context
  if (event) {
    try {
      const env = getEnv(event)
      if (env.DB) {
        _db = env.DB
        return _db
      }
    } catch {
      // No CF bindings available — fall through
    }
  }

  throw createError({ statusCode: 500, statusMessage: 'D1 not available in current context' })
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
