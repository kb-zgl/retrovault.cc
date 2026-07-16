/** EmulatorJS 核心配置 */
export interface EJSConfig {
  core: string
  biosUrl: string
  gameUrl?: string
  gameName?: string
}

/** ROM 文件信息 */
export interface LocalRom {
  lang: string
  filename: string
  localPath: string
  relPath: string
  url: string
  size: number
  status: 'downloaded' | 'missing' | 'pending'
}

/** 游戏控制键位 */
export type Controls = Record<string, string>

/** 游戏详情数据（来自 /api/games/:slug） */
export interface GameData {
  id: string
  slug: string
  title: string
  platform: string
  platformName?: string
  year: number
  genre: string
  genreName?: string
  developer: string
  developerName?: string
  publisher: string
  publisherName?: string
  series: string
  seriesName?: string
  isHack: string | boolean
  language?: string
  tags: string[]
  imageUrl: string
  localCover: string
  romUrl: string[]
  localRoms: LocalRom[]
  defaultRom: string
  ejs: EJSConfig
  description: string
  longDescription: string[]
  controls: Controls
  translations?: Record<string, any>
  relatedGames: string[]
  related?: GameSummary[]
}

/** 游戏列表条目（来自 /api/games） */
export interface GameSummary {
  slug: string
  title: string
  platform: string
  platformKey?: string
  year: number
  genre: string
  genreKey?: string
  series: string
  coverImg: string
  description: string
  isHack: string
}

/** 游戏列表 API 响应 */
export interface GameListResponse {
  total: number
  totalAll: number
  page: number
  limit: number
  hasMore: boolean
  platforms: string[]
  genres: string[]
  games: GameSummary[]
}

/** 游戏历史记录（localStorage） */
export interface GameHistoryEntry {
  gameId: string
  lastPlayedAt: number
  totalPlayTime: number
  highScore: number
  playCount: number
  completed: boolean
}

/** 用户评论（localStorage） */
export interface GameComment {
  id: number
  username: string
  content: string
  time: number
  avatar: string
}
