// ---------------------------------------------------------------------------
// Application types — customize for your project
// ---------------------------------------------------------------------------

/** Base entity — replace with your actual data model */
export interface AppItem {
  id?: number
  slug: string
  name: string
  category: string
  status: 'active' | 'draft' | 'archived'
  created_at: string
  updated_at?: string
  meta_description?: string
  // Nuxt Content fields
  body?: unknown
  title?: string
}

/** Paginated list response */
export interface ListResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/** Search results */
export interface SearchResult<T> {
  items: T[]
  query: string
}
