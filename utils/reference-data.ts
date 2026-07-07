// Shared reference-data utility — accessible from both Vue components and server routes.
// Imported via ESM at build time; data is inlined into the bundle.

import platforms from '../data/platforms.json'
import genres from '../data/genres.json'
import developers from '../data/developers.json'
import publishers from '../data/publishers.json'
import series from '../data/series.json'
import tags from '../data/tags.json'

export interface RefEntry {
  key: string
  label: string
}

export interface AllReferenceData {
  platforms: RefEntry[]
  genres: RefEntry[]
  developers: RefEntry[]
  publishers: RefEntry[]
  series: RefEntry[]
  tags: RefEntry[]
}

type RefDataSet = Record<string, Record<string, string>>
type LocaleMap = Record<string, string>

const allData = {
  platforms,
  genres,
  developers,
  publishers,
  series,
  tags,
} as const satisfies Record<string, RefDataSet>

const LOCALE_PRIORITY = ['en', 'zh', 'ja']

/**
 * Resolve a label for a given key + locale across all known locales.
 * Fallback: requested locale → en → key itself.
 */
function resolveLabel(
  dataSet: RefDataSet,
  key: string,
  locale: string,
): string {
  // Try requested locale
  if (dataSet[locale]?.[key]) return dataSet[locale][key]
  // Try en fallback
  if (dataSet.en?.[key]) return dataSet.en[key]
  // Try any known locale
  for (const l of LOCALE_PRIORITY) {
    if (dataSet[l]?.[key]) return dataSet[l][key]
  }
  // Last resort: return the key itself
  return key
}

function toRefEntries(
  dataSet: RefDataSet,
  locale: string,
): RefEntry[] {
  const seen = new Set<string>()
  const entries: RefEntry[] = []

  // Collect keys from all locales (deduplicated)
  const allKeys = new Set<string>()
  for (const l of LOCALE_PRIORITY) {
    if (dataSet[l]) Object.keys(dataSet[l]).forEach(k => allKeys.add(k))
  }

  for (const key of allKeys) {
    if (seen.has(key)) continue
    seen.add(key)
    entries.push({ key, label: resolveLabel(dataSet, key, locale) })
  }

  // Sort by label
  entries.sort((a, b) => a.label.localeCompare(b.label))
  return entries
}

/**
 * Get all reference data for a given locale, each category as RefEntry[].
 */
export function getReferenceData(locale: string = 'zh'): AllReferenceData {
  return {
    platforms: toRefEntries(allData.platforms, locale),
    genres: toRefEntries(allData.genres, locale),
    developers: toRefEntries(allData.developers, locale),
    publishers: toRefEntries(allData.publishers, locale),
    series: toRefEntries(allData.series, locale),
    tags: toRefEntries(allData.tags, locale),
  }
}

/**
 * Look up the display name for a single key + category + locale.
 * If the key doesn't exist in the reference data, returns the raw key.
 */
export function lookupDisplayName(
  category: string,
  key: string,
  locale: string = 'en',
): string {
  const dataSet = (allData as Record<string, RefDataSet>)[category]
  if (!dataSet) return key
  return resolveLabel(dataSet, key, locale)
}

/**
 * Check whether a key exists in the given category.
 */
export function isValidKey(category: string, key: string): boolean {
  const dataSet = (allData as Record<string, RefDataSet>)[category]
  if (!dataSet) return false
  for (const l of LOCALE_PRIORITY) {
    if (dataSet[l]?.[key] !== undefined) return true
  }
  return false
}
