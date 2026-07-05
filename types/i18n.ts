// types/i18n.ts
type TranslationKey =
  | `nav.${'home' | 'games' | 'tags' | 'news' | 'about'}`
  | `hero.${'title' | 'sub' | 'count'}`
  | `section.${'recent' | 'featured' | 'emulators' | 'viewAll'}`
  | `game.${'playNow' | 'inQueue' | 'addQueue' | 'removeQueue' | 'comments' | 'noComments' | 'post' | 'genre' | 'platform' | 'year' | 'developer' | 'publisher' | 'loadingEmulator'}`
  | `comment.${'placeholderName' | 'placeholderContent' | 'anonymous'}`
  | `filter.${'genre' | 'platform' | 'year' | 'all' | 'clear' | 'results'}`
  | `platformPage.${'title' | 'description' | 'browseAll'}`
  | `tagCloud.${'title' | 'description'}`
  | `fab.${'nowPlaying' | 'playing' | 'random' | 'queue' | 'history' | 'resume' | 'pause' | 'quickPlay' | 'emptyQueue'}`
  | `footer.${'playersOnline' | 'login' | 'about' | 'privacy' | 'guestbook'}`
  | `auth.${'login' | 'logout' | 'magicLink' | 'emailPlaceholder' | 'sendLink' | 'checkEmail' | 'username'}`
  | `theme.${'light' | 'dark'}`
  | `common.${'loading' | 'error' | 'notFound' | 'notFoundDesc'}`
  | `seo.${'tagline' | 'homeTitle' | 'homeDesc' | 'gamesTitle' | 'gamesDesc' | 'privacyTitle' | 'privacyDesc' | 'aboutTitle' | 'aboutDesc' | 'newsTitle' | 'newsDesc' | 'tagsTitle' | 'tagsDesc' | 'ogTypeHome' | 'ogTypeCategory' | 'ogTypeDetail' | 'ogTypeBlog' | 'ogTypePage'}`

export type { TranslationKey }
