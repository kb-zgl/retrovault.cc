export interface BreadcrumbItem {
  label: string
  to?: string
}

/**
 * Reactive breadcrumb composable.
 *
 * - Returns breadcrumb items for template rendering
 * - Injects BreadcrumbList JSON-LD schema
 * - Accepts static array or computed ref (for async data pages)
 *
 * @example
 * ```ts
 * const breadcrumb = useBreadcrumb([
 *   { label: 'Home', to: '/' },
 *   { label: 'Games' },
 * ])
 * ```
 *
 * @example (reactive)
 * ```ts
 * const { data: game } = useFetch('/api/games/slug')
 * const breadcrumb = useBreadcrumb(computed(() => [
 *   { label: 'Home', to: '/' },
 *   { label: 'Games', to: '/games' },
 *   { label: game.value?.title || '…' },
 * ]))
 * ```
 */
export function useBreadcrumb(items: MaybeRefOrGetter<BreadcrumbItem[]>) {
  const resolved = computed(() => toValue(items))

  // BreadcrumbList JSON-LD
  const schemaItems = computed(() => {
    const list = resolved.value
    if (!list.length) return null

    return {
      '@type': 'BreadcrumbList',
      '@id': '#breadcrumb',
      itemListElement: list.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.label,
        ...(item.to
          ? { item: new URL(item.to, 'https://retrovault.cc').href }
          : {}),
      })),
    }
  })

  if (import.meta.client || process.server) {
    useSchemaOrg(
      computed(() => {
        const s = schemaItems.value
        return s ? [s] : []
      }),
    )
  }

  return resolved
}
