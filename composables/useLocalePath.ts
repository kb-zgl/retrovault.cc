// composables/useLocalePath.ts
export function useLocalePath() {
  const { locale } = useAppI18n()

  function localePath(path: string): string {
    if (locale.value === 'zh' && !path.startsWith('/zh')) {
      return `/zh${path === '/' ? '' : path}`
    }
    return path
  }

  return { localePath }
}
