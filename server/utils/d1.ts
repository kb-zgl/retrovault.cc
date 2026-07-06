let _db: D1Database | null = null

export function useD1(): D1Database {
  if (_db) return _db
  // In development with wrangler, hubDatabase() or process.env.DB binding
  // In production, the D1 binding is available via process.env.DB
  const binding = (process.env as any).DB
  if (!binding) {
    throw createError({ statusCode: 500, statusMessage: 'D1 database not configured' })
  }
  _db = binding
  return binding
}

export async function sql(query: string, ...bindings: any[]) {
  const db = useD1()
  const stmt = db.prepare(query)
  if (bindings.length) stmt.bind(...bindings)
  const result = await stmt.run()
  return result
}

export async function sqlAll<T = any>(query: string, ...bindings: any[]): Promise<T[]> {
  const db = useD1()
  const stmt = db.prepare(query)
  if (bindings.length) stmt.bind(...bindings)
  const { results } = await stmt.all<T>()
  return results
}

export async function sqlOne<T = any>(query: string, ...bindings: any[]): Promise<T | null> {
  const db = useD1()
  const stmt = db.prepare(query)
  if (bindings.length) stmt.bind(...bindings)
  const { results } = await stmt.all<T>()
  return (results.length ? results[0] : null) as T | null
}
