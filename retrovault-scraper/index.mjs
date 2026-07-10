/**
 * RetroVault Scraper — 完整一体化版本
 * ─────────────────────────────────────
 * 功能：
 *   Step 1  抓取 /games 分页列表，收集所有游戏 slug
 *   Step 2  逐个抓取详情页，解析完整游戏数据（RSC → JSON-LD → HTML fallback）
 *   Step 3  下载 ROM 文件到本地，维护 slug → 本地路径映射
 *   Step 4  下载封面图到本地
 *   Step 5  合并所有数据，生成索引文件 + EJS配置
 *
 * 用法：
 *   node scraper.mjs
 *   node scraper.mjs --skip-roms      跳过ROM下载（只抓数据）
 *   node scraper.mjs --skip-covers    跳过封面下载
 *   node scraper.mjs --resume         断点续跑（默认已支持）
 */

import { readdir, readFile, writeFile, mkdir, access, stat } from 'node:fs/promises';
import { createWriteStream }                                  from 'node:fs';
import { join, extname }                                      from 'node:path';
import { setTimeout as sleep }                                from 'node:timers/promises';
import { pipeline }                                           from 'node:stream/promises';

// ─── CLI 参数 ─────────────────────────────────────────────────────────────────

const RAW_ARGS    = process.argv.slice(2);
const ARGS        = new Set(RAW_ARGS);
const SKIP_ROMS   = ARGS.has('--skip-roms');
const SKIP_COVERS = ARGS.has('--skip-covers');

// --test <path> : 本地调试模式，解析单个 HTML 文件后退出
const TEST_FILE_IDX = RAW_ARGS.indexOf('--test');
const TEST_FILE     = TEST_FILE_IDX !== -1 ? RAW_ARGS[TEST_FILE_IDX + 1] : null;

// ─── 配置 ─────────────────────────────────────────────────────────────────────

const CONFIG = {
  baseUrl:         'https://classicgamezone.com',
  romCdnUrl:       'https://roms.classicgamezone.com',

  // 并发数
  listConcurrency:   2,   // 列表页
  detailConcurrency: 3,   // 详情页
  romConcurrency:    2,   // ROM下载（大文件，保守）
  coverConcurrency:  4,   // 封面下载

  // 请求间隔
  delay:       1200,
  delayJitter:  400,
  retries:        3,

  // 超时
  detailTimeoutMs:  20_000,
  romTimeoutMs:    180_000,   // ROM可能很大
  coverTimeoutMs:   15_000,

  // 输出目录
  outputDir:   './data',

  // ROM语言优先级（选默认版本时按此顺序）
  langPriority: ['en', 'ja', 'zh-cn', 'zh-tw', 'es', 'pt', 'fr', 'de', 'ko', 'it', 'ru', 'ar'],

  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      + '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept':          'text/html,application/xhtml+xml,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control':   'no-cache',
  },

  romHeaders: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      + '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://classicgamezone.com/',
    'Accept':  '*/*',
  },
};

// ─── 平台映射（来自 classicgamezone 源码）────────────────────────────────────

// 平台名 → EmulatorJS core
const PLATFORM_CORE = {
  'NES':                 'nes',
  'SNES':                'snes',
  'Genesis':             'segaMD',
  'Game Boy':            'gb',
  'Game Boy Advance':    'gba',
  'Arcade':              'arcade',
  'Nintendo 64':         'n64',
  'NeoGeo Pocket':       'ngp',
  'Nintendo DS':         'nds',
  'Bandai WonderSwan':   'ws',
  'PlayStation':         'psx',
  'Game Gear':           'segaGG',
  'Atari Jaguar':        'jaguar',
  'Sega Master System':  'segaMS',
  'Sega CD':             'segaCD',
  'Sega 32X':            'sega32x',
  'PC Engine CD':        'pce',
  'MSX2':                'msx',
  'Famicom Disk System': 'nes',
  'Virtual Boy':         'vb',
  'Sega Saturn':         'segaSaturn',
  'ColecoVision':        'coleco',
  'Commodore 64':        'c64',
};

// 平台名 → 默认文件扩展名（无 romUrl 时拼接用）
const PLATFORM_EXT = {
  'NES':                 'nes',
  'SNES':                'smc',
  'Genesis':             'md',
  'Game Boy':            'zip',
  'Game Boy Advance':    'gba',
  'Arcade':              'zip',
  'Nintendo 64':         'n64',
  'NeoGeo Pocket':       'ngc',
  'Nintendo DS':         'nds',
  'Bandai WonderSwan':   'ws',
  'PlayStation':         'psx',
  'Game Gear':           'gg',
  'Atari Jaguar':        'zip',
  'Sega Master System':  'zip',
  'Sega CD':             'zip',
  'Sega 32X':            'zip',
  'PC Engine CD':        'zip',
  'MSX2':                '7z',
  'Famicom Disk System': 'zip',
  'Virtual Boy':         'zip',
  'Sega Saturn':         'zip',
  'ColecoVision':        'zip',
  'Commodore 64':        'zip',
};

// 走 CDN 的平台 + CDN子目录
const CDN_MAP = {
  'PlayStation':      'ps',
  'Sega Saturn':      'ss',
  'Nintendo DS':      'nds',
  'Nintendo 64':      'n64',
  'Game Boy Advance': 'gba',
  'Arcade':           'arcade',
};

// 平台 BIOS（部分平台需要）
const PLATFORM_BIOS = {
  'PlayStation':     '/bios/scph1001.bin',
  'Sega CD':         '/bios/bios_CD_U.bin',
  'PC Engine CD':    '/bios/syscard3.pce',
  'Sega Saturn':     '/bios/saturn_bios.bin',
  'ColecoVision':    '/bios/colecovision.rom',
  'NeoGeo Pocket':   '/bios/neogeo.zip',
};

// 平台名 → URL slug前缀（列表页路径）
const PLATFORM_URL_SLUG = {
  'Arcade':              'arcade',
  'SNES':                'snes',
  'NES':                 'nes',
  'PlayStation':         'ps',
  'Game Boy Advance':    'gba',
  'Nintendo 64':         'n64',
  'Genesis':             'genesis',
  'Game Boy':            'gb',
  'Nintendo DS':         'nds',
  'Sega Master System':  'sms',
  'PC Engine CD':        'pce',
  'Game Gear':           'game-gear',
  'Atari Jaguar':        'jaguar',
  'Bandai WonderSwan':   'ws',
  'Sega CD':             'sega-cd',
  'Sega 32X':            'sega-32x',
  'NeoGeo Pocket':       'ngp',
  'Virtual Boy':         'vb',
  'Sega Saturn':         'ss',
  'Famicom Disk System': 'fds',
  'MSX2':                'msx2',
  'ColecoVision':        'coleco-vision',
  'Commodore 64':        'c64',
};

// ─── 日志 ─────────────────────────────────────────────────────────────────────

const ts  = () => new Date().toISOString();
const log = {
  info:  (m) => console.log(`[INFO]  ${ts()} ${m}`),
  ok:    (m) => console.log(`[OK]    ${ts()} ${m}`),
  warn:  (m) => console.warn(`[WARN]  ${ts()} ${m}`),
  error: (m) => console.error(`[ERROR] ${ts()} ${m}`),
};

// ─── 文件工具 ─────────────────────────────────────────────────────────────────

const ensureDir  = (d) => mkdir(d, { recursive: true });
const pathExists = (p) => access(p).then(() => true).catch(() => false);
const readJson   = (p) => readFile(p, 'utf8').then(JSON.parse);
const writeJson  = (p, v) => writeFile(p, JSON.stringify(v, null, 2), 'utf8');

// ─── 并发限制 ─────────────────────────────────────────────────────────────────

function pLimit(concurrency) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= concurrency || queue.length === 0) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    Promise.resolve().then(fn).then(resolve, reject)
      .finally(() => { active--; next(); });
  };
  return (fn) => new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    next();
  });
}

// ─── HTTP 工具 ────────────────────────────────────────────────────────────────

async function fetchText(url, timeoutMs = CONFIG.detailTimeoutMs, retries = CONFIG.retries) {
  for (let i = 0; i < retries; i++) {
    await sleep(CONFIG.delay + Math.random() * CONFIG.delayJitter);
    try {
      const res = await fetch(url, {
        headers: CONFIG.headers,
        signal:  AbortSignal.timeout(timeoutMs),
        redirect: 'follow',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      log.warn(`fetchText 失败 (${i + 1}/${retries}) ${url} — ${err.message}`);
      if (i === retries - 1) throw err;
      await sleep(3000 * (i + 1));
    }
  }
}

/**
 * 流式下载文件，返回 { ok, reason, size }
 */
async function downloadFile(url, destPath, retries = CONFIG.retries) {
  for (let i = 0; i < retries; i++) {
    await sleep(CONFIG.delay + Math.random() * CONFIG.delayJitter);
    try {
      const res = await fetch(url, {
        headers: CONFIG.romHeaders,
        signal:  AbortSignal.timeout(CONFIG.romTimeoutMs),
        redirect: 'follow',
      });

      if (res.status === 404) return { ok: false, reason: '404',           size: 0 };
      if (res.status === 403) return { ok: false, reason: '403_forbidden', size: 0 };
      if (!res.ok)            throw new Error(`HTTP ${res.status}`);

      const fileStream = createWriteStream(destPath);
      await pipeline(res.body, fileStream);

      const info = await stat(destPath);
      if (info.size === 0) {
        await safeUnlink(destPath);
        throw new Error('downloaded file is empty');
      }
      return { ok: true, reason: 'ok', size: info.size };

    } catch (err) {
      await safeUnlink(destPath);
      log.warn(`downloadFile 失败 (${i + 1}/${retries}) ${url} — ${err.message}`);
      if (i === retries - 1) return { ok: false, reason: err.message, size: 0 };
      await sleep(3000 * (i + 1));
    }
  }
}

async function safeUnlink(p) {
  try { await import('node:fs').then(m => m.promises.unlink(p)); } catch { /* ignore */ }
}

// ─── RSC payload 解码 ─────────────────────────────────────────────────────────

function decodeRSC(html) {
  const chunks = [];
  const re = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const decoded = m[1]
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\\\/g, '\x00BS\x00')
        .replace(/\\"/g, '"')
        .replace(/\x00BS\x00/g, '\\');
      chunks.push(decoded);
    } catch { /* skip */ }
  }
  return chunks.join('');
}

/**
 * 括号计数法提取 key 后的第一个完整 JSON 对象或数组
 */
function extractJsonValue(text, key, openChar = '{') {
  const closeChar = openChar === '{' ? '}' : ']';
  const keyIdx    = text.indexOf(key);
  if (keyIdx === -1) return null;

  let depth = 0, inStr = false, escaped = false, start = -1;
  for (let i = keyIdx + key.length; i < text.length; i++) {
    const c = text[i];
    if (escaped)             { escaped = false; continue; }
    if (c === '\\' && inStr) { escaped = true;  continue; }
    if (c === '"')           { inStr = !inStr;  continue; }
    if (inStr)               continue;
    if (c === openChar)      { if (depth++ === 0) start = i; }
    else if (c === closeChar) {
      if (--depth === 0 && start !== -1) {
        try   { return JSON.parse(text.substring(start, i + 1)); }
        catch { return null; }
      }
    }
  }
  return null;
}

// ─── Step 1: 列表页抓取 ───────────────────────────────────────────────────────

/**
 * 解析单个列表页，返回 { games: CardItem[], totalPages }
 */
function parseListPage(html) {
  const rsc = decodeRSC(html);

  // 总页数
  let totalPages = 1;
  const tpMatch = rsc.match(/"totalPages"\s*:\s*(\d+)/);
  if (tpMatch) {
		totalPages = parseInt(tpMatch[1]);
		// totalPages = 1
	}
  if (totalPages === 1) {
    const htmlTp = html.match(/\d+\s*\/\s*(\d+)/);
    if (htmlTp) totalPages = parseInt(htmlTp[1]);
  }

  // 游戏数组：RSC里是 [{"id":...}] 格式
  let gamesArr = null;
  const arrIdx = rsc.indexOf('[{"id":');
  if (arrIdx !== -1) {
    const sub = rsc.slice(arrIdx);
    let d = 0, inStr = false, esc = false;
    for (let i = 0; i < sub.length; i++) {
      const c = sub[i];
      if (esc)             { esc = false; continue; }
      if (c === '\\' && inStr) { esc = true; continue; }
      if (c === '"')       { inStr = !inStr; continue; }
      if (inStr)           continue;
      if (c === '[')       d++;
      else if (c === ']') {
        if (--d === 0) {
          try   { gamesArr = JSON.parse(sub.slice(0, i + 1)); }
          catch { /* ignore */ }
          break;
        }
      }
    }
  }
  if (!gamesArr) gamesArr = extractJsonValue(rsc, '"games":', '[');

  const games = [];
  if (Array.isArray(gamesArr)) {
    for (const g of gamesArr) {
      const slug = g.id || g.slug || '';
      if (!slug) continue;
      games.push({
        slug,
        title:       g.title       || '',
        platform:    g.platform    || '',
        year:        g.year        || null,
        genre:       g.genre       || '',
        series:      g.enSeries    || g.series || '',
        coverImg:    g.imageUrl    || '',
        description: g.description || '',
        isHack:      g.isHack      || false,
      });
    }
  }

  // HTML fallback（RSC失败时）
  if (games.length === 0) {
    log.warn('RSC游戏数组未找到，回退HTML解析');
    const slugSet = new Set();
    for (const m of html.matchAll(/href="\/games\/([a-z0-9][a-z0-9-]*)"/g)) {
      const slug = m[1];
      if (!slugSet.has(slug)) {
        slugSet.add(slug);
        games.push({ slug, title: '', platform: '', year: null, genre: '', series: '', coverImg: '', description: '', isHack: false });
      }
    }
  }

  return { games, totalPages };
}

async function scrapeAllListPages() {
  log.info('=== Step 1: 抓取游戏列表 ===');

  const firstHtml = await fetchText(`${CONFIG.baseUrl}/games`);
  const { games: first, totalPages } = parseListPage(firstHtml);
  log.ok(`第1页: ${first.length} 个游戏，共 ${totalPages} 页`);

  const cardMap = new Map();
  for (const g of first) cardMap.set(g.slug, g);

  const limit = pLimit(CONFIG.listConcurrency);
  const pages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

  await Promise.all(pages.map(page => limit(async () => {
    const url = `${CONFIG.baseUrl}/games?page=${page}`;
    let html;
    try   { html = await fetchText(url); }
    catch (err) { log.error(`列表页 ${page} 失败: ${err.message}`); return; }

    const { games } = parseListPage(html);
    for (const g of games) if (!cardMap.has(g.slug)) cardMap.set(g.slug, g);

    if (page % 10 === 0)
      log.ok(`列表进度: ${page}/${totalPages}页，已收集 ${cardMap.size} 个slug`);
  })));

  log.ok(`列表完成，共 ${cardMap.size} 个唯一游戏`);
  return cardMap;
}

// ─── Step 2: 详情页解析 ───────────────────────────────────────────────────────

function parseDetailFromRSC(html) {
  const text = decodeRSC(html);
  const game = extractJsonValue(text, '"game":', '{');
  if (game?.title) return { ...game, _method: 'rsc' };
  return null;
}

function parseDetailFromJsonLd(html) {
  try {
    const m  = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!m) return null;
    const ld = JSON.parse(m[1]);
    return {
      title:           ld.name,
      description:     ld.description,
      platform:        ld.gameEmulator,
      year:            parseInt(ld.datePublished) || null,
      genre:           Array.isArray(ld.genre) ? ld.genre[0] : ld.genre,
      developer:       ld.author?.name    || '',
      publisher:       ld.publisher?.name || '',
      imageUrl:        ld.image           || '',
      longDescription: ld.additionalProperty?.[0]?.value
                          ?.split('\n').filter(Boolean) ?? [],
      romUrl:          [],
      controls:        {},
      tags:            [],
      _method:         'json-ld',
    };
  } catch { return null; }
}


function parseDetailFromHTML(html, slug) {
  try {
    const titleM = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const platM  = html.match(/href="\/([a-z0-9-]+)-games"[^>]*>([A-Za-z0-9 ]+)<\/a>/);
    const yearM  = html.match(/href="\/yearly-games\/(\d{4})(?:-games)?"[^>]*>(\d{4})</);
    const genreM = html.match(/href="\/game-genres\/[^"]+">([^<]+)<\/a>/);
    const devM   = html.match(/href="\/game-developer\/[^"]+">([^<]+)<\/a>/);
    const descM  = html.match(/<p[^>]*>([A-Z][^<]{40,600})<\/p>/);
		
		const tagsMatch = html.match(/\\"tags\\"\s*:\s*(\[[\s\S]*?\])/);
		let tags = null;
		if (tagsMatch && tagsMatch[1]) {
				try {
						// 将字符串中的 \" 替换为 "（还原为标准 JSON）
						let tagsStr = tagsMatch[1].replace(/\\"/g, '"');
						tags = JSON.parse(tagsStr);
				} catch(e) {
						console.error("Failed to parse tags", e);
				}
		}

		// 匹配转义后的 "controls" 对象
		const controlsMatch = html.match(/\\"controls\\"\s*:\s*(\{[\s\S]*?\})/);
		let controls = null;
		if (controlsMatch && controlsMatch[1]) {
				try {
						let controlsStr = controlsMatch[1].replace(/\\"/g, '"');
						controls = JSON.parse(controlsStr);
				} catch(e) {
						console.error("Failed to parse controls", e);
				}
		}

    return {
      id:              slug,
      title:           titleM?.[1]?.trim()  || '',
      platform:        platM?.[2]?.trim()   || '',
      year:            yearM ? parseInt(yearM[1]) : null,
      genre:           genreM?.[1]?.trim()  || '',
      developer:       devM?.[1]?.trim()    || '',
      description:     descM?.[1]?.trim()   || '',
      imageUrl:        `${CONFIG.baseUrl}/games/covers/${slug}.webp`,
      romUrl:          [],
      controls:        controls,
      tags:            tags,
      longDescription: [],
      _method:         'html-fallback',
    };
  } catch { return null; }
}
/**
 * 判断一个值是否被视为“无有效数据”
 * - undefined / null / '' → 无效
 * - 空数组 [] → 无效
 * - 空对象 {} → 无效
 * - 其他任何值（包括 0、false、非空数组/对象） → 有效
 */
function isValidValue(val) {
    if (val === undefined || val === null || val === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    if (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0) return false;
    return true;
}

function mergeGameData(...sources) {
    const result = {};

    // 收集所有字段名
    const allKeys = new Set();
    for (const src of sources) {
        if (src && typeof src === 'object') {
            Object.keys(src).forEach(k => allKeys.add(k));
        }
    }

    for (const key of allKeys) {
        for (const src of sources) {
            const val = src?.[key];
            if (isValidValue(val)) {
                result[key] = val;
                break; // 取第一个有效值
            }
        }
    }

    return result;
}

function parseDetail(html, slug) {
  const rscData = parseDetailFromRSC(html);
    const jsonLdData = parseDetailFromJsonLd(html);
    const htmlData = parseDetailFromHTML(html, slug);
    const merged = mergeGameData(rscData, jsonLdData, htmlData);
    // 如果合并后仍然是空对象，返回 null
    return Object.keys(merged).length > 0 ? merged : null;
}

// ─── Step 3: ROM URL 解析 & 下载 ─────────────────────────────────────────────

/**
 * 将相对路径 → 完整URL，并按平台做 CDN 替换
 */
function resolveRomUrl(raw, platform) {
  if (!raw) return null;
  if (raw.startsWith('http')) {
    // 已是绝对URL，仍做CDN替换（以防来自主站路径）
    const cdnDir = CDN_MAP[platform];
    if (cdnDir) {
      const mainPrefix = `${CONFIG.baseUrl}/games/roms/${cdnDir}/`;
      if (raw.startsWith(mainPrefix))
        return raw.replace(mainPrefix, `${CONFIG.romCdnUrl}/${cdnDir}/`);
    }
    return raw;
  }

  // 相对路径
  const cdnDir = CDN_MAP[platform];
  if (cdnDir) {
    const mainPrefix = `/games/roms/${cdnDir}/`;
    if (raw.startsWith(mainPrefix))
      return `${CONFIG.romCdnUrl}/${cdnDir}/${raw.slice(mainPrefix.length)}`;
    // 路径格式不规则，取文件名直接拼CDN
    const filename = raw.split('/').pop();
    return `${CONFIG.romCdnUrl}/${cdnDir}/${filename}`;
  }

  return `${CONFIG.baseUrl}${raw}`;
}

/**
 * 根据游戏数据返回所有需要下载的ROM条目
 * @returns [{ lang, url }]
 */
function getRomEntries(game) {
  const { slug, platform, romUrl } = game;
  const entries = [];
	console.info('romUrl:', romUrl, '--')

  // ── 无 romUrl：自动拼接 ──────────────────────────────────────────────────
  if (!romUrl || (Array.isArray(romUrl) && romUrl.length === 0)) {
    const cdnDir = CDN_MAP[platform];
    const ext    = PLATFORM_EXT[platform] || 'rom';
    const url    = cdnDir
      ? `${CONFIG.romCdnUrl}/${cdnDir}/${slug}.${ext}`
      : `${CONFIG.baseUrl}/games/roms/${(platform || '').toLowerCase().replace(/\s+/g, '-')}/${slug}.${ext}`;
    return [{ lang: 'default', url }];
  }

  // ── 数组：多语言版本 ─────────────────────────────────────────────────────
  if (Array.isArray(romUrl)) {
    for (const item of romUrl) {
      if (typeof item === 'string') {
        entries.push({ lang: 'default', url: resolveRomUrl(item, platform) });
      } else if (item && typeof item === 'object') {
        const rawUrl = item.url || item.romUrl;
        if (rawUrl) {
          entries.push({ lang: item.name || 'unknown', url: resolveRomUrl(rawUrl, platform) });
        }
      }
    }
    // 按语言优先级排序（影响 defaultRom 选取）
    entries.sort((a, b) => {
      const pa = CONFIG.langPriority.indexOf(a.lang);
      const pb = CONFIG.langPriority.indexOf(b.lang);
      return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
    });
    return entries;
  }

  // ── 对象多碟：disc1, disc2… ──────────────────────────────────────────────
  if (typeof romUrl === 'object' && romUrl !== null && romUrl.disc1) {
    for (const [key, val] of Object.entries(romUrl)) {
      if (key.startsWith('disc') && typeof val === 'string')
        entries.push({ lang: key, url: resolveRomUrl(val, platform) });
    }
    entries.sort((a, b) => a.lang.localeCompare(b.lang));
    return entries;
  }

  // ── 字符串 ───────────────────────────────────────────────────────────────
  if (typeof romUrl === 'string') {
    return [{ lang: 'default', url: resolveRomUrl(romUrl, platform) }];
  }

  return [];
}

/**
 * 从URL或slug推断本地文件名
 */
function romFilename(url, slug, lang) {
  try {
    const pathname = new URL(url).pathname;
    const name     = pathname.split('/').pop();
    if (name && name.includes('.')) return name;
  } catch { /* ignore */ }

  const ext = url.split('.').pop().split('?')[0] || 'rom';
  return lang === 'default' ? `${slug}.${ext}` : `${slug}-${lang}.${ext}`;
}

/**
 * 下载一个游戏的所有ROM版本
 * @returns { files: [{lang, filename, localPath, relPath, url, size}], defaultRom }
 */
async function downloadGameRoms(game, romBaseDir) {
  const { slug, platform } = game;
  const entries = getRomEntries(game);

  if (entries.length === 0) return { files: [], defaultRom: null };

  // 平台子目录
  const platDir = (platform || 'unknown').toLowerCase().replace(/[\s/]+/g, '-');
  const destDir = join(romBaseDir, platDir);
  await ensureDir(destDir);

  const files = [];

  for (const { lang, url } of entries) {
    if (!url) continue;

    const filename  = romFilename(url, slug, lang);
    const localPath = join(destDir, filename);
    const relPath   = `roms/${platDir}/${filename}`;

    // 已存在且非空 → 跳过
    if (await pathExists(localPath)) {
      const info = await stat(localPath);
      if (info.size > 0) {
        files.push({ lang, filename, localPath, relPath, url, size: info.size, status: 'cached' });
        continue;
      }
    }

    log.info(`  ROM ↓ [${slug}] ${lang}: ${filename}`);
		log.info(`  下载地址：${url}`)
    const result = await downloadFile(url, localPath);

    if (result.ok) {
      files.push({ lang, filename, localPath, relPath, url, size: result.size, status: 'downloaded' });
      log.ok(`  ROM ✓ [${slug}] ${lang}: ${(result.size / 1024 / 1024).toFixed(2)}MB`);
    } else {
      log.warn(`  ROM ✗ [${slug}] ${lang}: ${result.reason}`);
      files.push({ lang, filename, localPath: null, relPath: null, url, size: 0, status: result.reason });
    }
  }

  // defaultRom：优先级最高的成功文件
  const successful = files.filter(f => f.localPath);
  const defaultRom = successful.length > 0 ? successful[0].relPath : null;

  return { files, defaultRom };
}

// ─── Step 4: 封面下载 ─────────────────────────────────────────────────────────

async function downloadCover(imageUrl, slug, coverDir) {
  if (!imageUrl) return null;

  const fullUrl = imageUrl.startsWith('http')
    ? imageUrl
    : `${CONFIG.baseUrl}${imageUrl}`;

  const ext       = fullUrl.split('.').pop().split('?')[0] || 'webp';
  const filename  = `${slug}.${ext}`;
  const localPath = join(coverDir, filename);
  const relPath   = `covers/${filename}`;

  if (await pathExists(localPath)) {
    const info = await stat(localPath);
    if (info.size > 0) return relPath;
  }

  try {
    await sleep(300 + Math.random() * 200);
    const res = await fetch(fullUrl, {
      headers: CONFIG.headers,
      signal:  AbortSignal.timeout(CONFIG.coverTimeoutMs),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    await writeFile(localPath, Buffer.from(buf));
    return relPath;
  } catch (err) {
    log.warn(`封面下载失败 [${slug}]: ${err.message}`);
    return null;
  }
}

// ─── 数据标准化 ───────────────────────────────────────────────────────────────

function normalizeGame(raw, slug, card = {}, romResult = null, coverPath = null) {
  return {
    // ── 标识 ──────────────────────────────────────────────────────────────
    id:   raw.id   || slug,
    slug: raw.slug || slug,

    // ── 元数据 ────────────────────────────────────────────────────────────
    title:     raw.title     || card.title     || '',
    platform:  raw.platform  || card.platform  || '',
    year:      raw.year      || card.year      || null,
    genre:     raw.genre     || card.genre     || '',
    developer: raw.developer || '',
    publisher: raw.publisher || '',
    series:    raw.enSeries  || raw.series || card.series || '',
    isHack:    raw.isHack    || card.isHack || false,
    language:  raw.language  || 'English',
    tags:      Array.isArray(raw.tags) ? raw.tags : [],

    // ── 媒体 ──────────────────────────────────────────────────────────────
    imageUrl:   raw.imageUrl || card.coverImg || '',
    localCover: coverPath    || null,

    // ── ROM ───────────────────────────────────────────────────────────────
    // 原始 romUrl（保留，供调试用）
    romUrl: Array.isArray(raw.romUrl)
      ? raw.romUrl
      : (raw.romUrl ? [raw.romUrl] : []),

    // 本地ROM文件列表
    localRoms:  romResult?.files.filter(f => f.localPath) ?? [],
    // 默认ROM路径（EJS_gameUrl直接用）
    defaultRom: romResult?.defaultRom ?? null,

    // ── EmulatorJS 配置 ───────────────────────────────────────────────────
    ejs: {
      core:    raw.romCore || PLATFORM_CORE[raw.platform || card.platform] || 'nes',
      biosUrl: PLATFORM_BIOS[raw.platform || card.platform] || '',
    },

    // ── 内容 ──────────────────────────────────────────────────────────────
    description:     raw.description     || card.description || '',
    longDescription: Array.isArray(raw.longDescription) ? raw.longDescription : [],
    controls:        (raw.controls && typeof raw.controls === 'object') ? raw.controls : {},
    translations:    raw.translations    || {},

    relatedGames: Array.isArray(raw.relatedGames)
      ? raw.relatedGames.map(g => g?.id || g?.slug || g).filter(Boolean)
      : [],

    // ── 元信息 ────────────────────────────────────────────────────────────
    _scraped_at:     new Date().toISOString(),
    _source:         'classicgamezone.com',
    _detail_method:  raw._method || 'unknown',
  };
}

// ─── 本地调试模式 ──────────────────────────────────────────────────────────────

async function runTestMode(filePath) {
  try {
    const html = await readFile(filePath, 'utf8');
    const slug = filePath.replace(/\.html$/i, '').split('/').pop();

    const rscData      = parseDetailFromRSC(html);
    const jsonLdData   = parseDetailFromJsonLd(html);
    const htmlData     = parseDetailFromHTML(html, slug);
    const merged       = mergeGameData(rscData, jsonLdData, htmlData);
    const raw          = Object.keys(merged).length > 0 ? merged : null;

    // 输出四个部分，用 === 分割
    const sep = '='.repeat(60);
    const sections = [];

    sections.push(sep + '\n[1] RSC parsed\n' + sep);
    sections.push(JSON.stringify(rscData, null, 2) || '(null)');

    sections.push(sep + '\n[2] JSON-LD parsed\n' + sep);
    sections.push(JSON.stringify(jsonLdData, null, 2) || '(null)');

    sections.push(sep + '\n[3] HTML fallback parsed\n' + sep);
    sections.push(JSON.stringify(htmlData, null, 2) || '(null)');

    sections.push(sep + '\n[4] Merged result\n' + sep);
    sections.push(JSON.stringify(raw, null, 2));

    if (!raw || !raw.title) {
      sections.push('\n[WARN] Merged result has no title — parser may need adjustment');
    }

    console.log(sections.join('\n\n'));
  } catch (err) {
    log.error(`测试模式失败: ${err.message}`);
    process.exit(1);
  }
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────

async function main() {
  // 本地测试模式：读取本地 HTML → 解析 → 输出 JSON → 退出
  if (TEST_FILE) {
    log.info(`测试模式: ${TEST_FILE}`);
    await runTestMode(TEST_FILE);
    log.ok('解析完成');
    return;
  }
  const outDir    = CONFIG.outputDir;
  const gamesDir  = join(outDir, 'games');
  const romsDir   = join(outDir, 'roms');
  const coversDir = join(outDir, 'covers');
  const indexDir  = join(outDir, 'indexes');

  await ensureDir(outDir);
  await ensureDir(gamesDir);
  await ensureDir(romsDir);
  await ensureDir(coversDir);
  await ensureDir(indexDir);

  // ── 进度文件（支持断点续跑）─────────────────────────────────────────────

  const progressFile = join(outDir, 'progress.json');
  let progress = {
    slugCardMap:    {},   // slug → listCard
    completedSlugs: [],
    failedSlugs:    [],
    romMap:         {},   // slug → { files, defaultRom }
  };

  if (await pathExists(progressFile)) {
    progress = await readJson(progressFile);
    log.info([
      '恢复进度:',
      `slug总数=${Object.keys(progress.slugCardMap).length}`,
      `已完成=${progress.completedSlugs.length}`,
      `失败=${progress.failedSlugs.length}`,
    ].join('  '));
  }

  const saveProgress = () => writeJson(progressFile, progress);

  // ══════════════════════════════════════════════════════════════════════════
  // Step 1: 列表页
  // ══════════════════════════════════════════════════════════════════════════

  if (Object.keys(progress.slugCardMap).length === 0) {
    const cardMap = await scrapeAllListPages();

    await writeJson(join(outDir, 'game_list.json'), {
      total:      cardMap.size,
      scraped_at: new Date().toISOString(),
      games:      Object.fromEntries(cardMap),
    });

    progress.slugCardMap = Object.fromEntries(cardMap);
    await saveProgress();
  } else {
    log.info(`跳过列表抓取，使用已有 ${Object.keys(progress.slugCardMap).length} 个slug`);
  }

  const allSlugs = Object.keys(progress.slugCardMap);

  // ══════════════════════════════════════════════════════════════════════════
  // Step 2 + 3 + 4: 详情页 + ROM下载 + 封面下载（合并为一次遍历）
  // ══════════════════════════════════════════════════════════════════════════

  log.info('=== Step 2/3/4: 详情 + ROM + 封面 ===');
  if (SKIP_ROMS)   log.info('  [--skip-roms] ROM下载已跳过');
  if (SKIP_COVERS) log.info('  [--skip-covers] 封面下载已跳过');

  const pending = allSlugs.filter(
    s => !progress.completedSlugs.includes(s) && !progress.failedSlugs.includes(s)
  );
  log.info(`待处理: ${pending.length} / ${allSlugs.length}`);

  const limit    = pLimit(CONFIG.detailConcurrency);
  const romLimit = pLimit(CONFIG.romConcurrency);
  let doneCount  = 0;

  await Promise.all(pending.map(slug => limit(async () => {
    const card = progress.slugCardMap[slug] || {};

    // ── 2a: 抓取详情页 ──────────────────────────────────────────────────
    let html;
    try {
      html = await fetchText(`${CONFIG.baseUrl}/games/${slug}`);
    } catch (err) {
      log.error(`详情页请求失败 [${slug}]: ${err.message}`);
      progress.failedSlugs.push(slug);
      await saveProgress();
      return;
    }

    const raw = parseDetail(html, slug);
    if (!raw || !raw.title) {
      log.warn(`详情解析失败 [${slug}]`);
      progress.failedSlugs.push(slug);
      await saveProgress();
      return;
    }

    // ── 2b: 下载ROM ─────────────────────────────────────────────────────
    let romResult = null;
    if (!SKIP_ROMS) {
      romResult = await romLimit(() => downloadGameRoms(
        { ...raw, slug, platform: raw.platform || card.platform },
        romsDir
      ));
      // 记录romMap
      progress.romMap[slug] = {
        files:      romResult.files,
        defaultRom: romResult.defaultRom,
      };
    }

    // ── 2c: 下载封面 ─────────────────────────────────────────────────────
    let coverPath = null;
    if (!SKIP_COVERS) {
      const imgUrl = raw.imageUrl || card.coverImg;
      if (imgUrl) coverPath = await downloadCover(imgUrl, slug, coversDir);
    }

    // ── 2d: 标准化 & 写入单文件 ─────────────────────────────────────────
    const game = normalizeGame(raw, slug, card, romResult, coverPath);
    await writeJson(join(gamesDir, `${slug}.json`), game);

    progress.completedSlugs.push(slug);
    doneCount++;

    if (doneCount % 20 === 0) {
      await saveProgress();
      log.ok(`进度: ${doneCount}/${pending.length}  失败: ${progress.failedSlugs.length}`);
    }
  })));

  await saveProgress();
  log.ok(`详情/ROM/封面处理完成  成功: ${progress.completedSlugs.length}  失败: ${progress.failedSlugs.length}`);

  // ══════════════════════════════════════════════════════════════════════════
  // Step 5: 合并数据 + 构建索引 + 生成EJS配置
  // ══════════════════════════════════════════════════════════════════════════

  log.info('=== Step 5: 合并 & 构建索引 ===');

  const gameFiles = (await readdir(gamesDir)).filter(f => f.endsWith('.json'));
  const allGames  = await Promise.all(
    gameFiles.map(f => readJson(join(gamesDir, f)))
  );

  // ── 索引 ────────────────────────────────────────────────────────────────

  function addIdx(map, key, slug) {
    if (!key) return;
    const k = String(key).trim();
    if (!k) return;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(slug);
  }

  const idxPlatform  = new Map();
  const idxGenre     = new Map();
  const idxSeries    = new Map();
  const idxDeveloper = new Map();
  const idxYear      = new Map();
  const idxHack      = new Map();
  const idxTags      = new Map();

  for (const g of allGames) {
    const s = g.slug;
    addIdx(idxPlatform,  g.platform,  s);
    addIdx(idxGenre,     g.genre,     s);
    addIdx(idxSeries,    g.series,    s);
    addIdx(idxDeveloper, g.developer, s);
    addIdx(idxYear,      g.year ? String(g.year) : '', s);
    addIdx(idxHack,      g.isHack ? 'hack' : 'official', s);
    for (const tag of (g.tags || [])) addIdx(idxTags, tag, s);
  }

  function serializeIndex(map) {
    return Object.fromEntries(
      [...map.entries()]
        .sort((a, b) => b[1].length - a[1].length)
        .map(([k, slugs]) => [k, { count: slugs.length, slugs }])
    );
  }

  const indexes = {
    platform:  serializeIndex(idxPlatform),
    genre:     serializeIndex(idxGenre),
    series:    serializeIndex(idxSeries),
    developer: serializeIndex(idxDeveloper),
    year:      serializeIndex(idxYear),
    hack:      serializeIndex(idxHack),
    tags:      serializeIndex(idxTags),
  };

  for (const [dim, data] of Object.entries(indexes)) {
    await writeJson(join(indexDir, `${dim}.json`), {
      dimension:  dim,
      total_keys: Object.keys(data).length,
      built_at:   new Date().toISOString(),
      index:      data,
    });
  }

  // ── EJS 配置（Nuxt直接用）────────────────────────────────────────────────

  const ejsConfig = {};
  for (const g of allGames) {
    if (!g.defaultRom && g.localRoms?.length === 0) continue;
    ejsConfig[g.slug] = {
      id:       g.slug,
      title:    g.title,
      platform: g.platform,
      ejs: {
        gameUrl:    g.defaultRom,
        allVersions: (g.localRoms || []).map(r => ({ lang: r.lang, path: r.relPath })),
        core:       g.ejs?.core    || 'nes',
        biosUrl:    g.ejs?.biosUrl || '',
        gameName:   g.title,
      },
    };
  }

  await writeJson(join(outDir, 'ejs_config.json'), {
    total:        Object.keys(ejsConfig).length,
    generated_at: new Date().toISOString(),
    games:        ejsConfig,
  });

  // ── ROM 映射汇总 ─────────────────────────────────────────────────────────

  const romMapSummary = {};
  for (const g of allGames) {
    if (!g.localRoms?.length && !g.defaultRom) continue;
    romMapSummary[g.slug] = {
      platform:    g.platform,
      title:       g.title,
      defaultRom:  g.defaultRom,
      files:       g.localRoms || [],
    };
  }

  await writeJson(join(outDir, 'rom_map.json'), {
    total:        Object.keys(romMapSummary).length,
    generated_at: new Date().toISOString(),
    map:          romMapSummary,
  });

  // ── all_games.json ───────────────────────────────────────────────────────

  const indexSummary = {};
  for (const [dim, data] of Object.entries(indexes))
    indexSummary[dim] = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.count]));

  await writeJson(join(outDir, 'all_games.json'), {
    total:         allGames.length,
    failed:        progress.failedSlugs.length,
    scraped_at:    new Date().toISOString(),
    index_summary: indexSummary,
    games:         allGames,
  });

  // ── 统计输出 ─────────────────────────────────────────────────────────────

  const totalRomFiles = Object.values(romMapSummary).reduce((n, v) => n + v.files.length, 0);
  const totalRomSize  = Object.values(romMapSummary).reduce((n, v) =>
    n + v.files.reduce((s, f) => s + (f.size || 0), 0), 0);

  log.ok('');
  log.ok('════════════ 完成 ════════════');
  log.ok(`游戏总数:       ${allGames.length}`);
  log.ok(`失败数:         ${progress.failedSlugs.length}`);
  log.ok(`ROM文件数:      ${totalRomFiles}`);
  log.ok(`ROM总大小:      ${(totalRomSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
  log.ok('');
  log.ok('输出文件：');
  log.ok(`  ${outDir}/all_games.json      完整游戏数据`);
  log.ok(`  ${outDir}/game_list.json      列表页数据（轻量）`);
  log.ok(`  ${outDir}/rom_map.json        ROM路径映射`);
  log.ok(`  ${outDir}/ejs_config.json     EmulatorJS配置（Nuxt直接用）`);
  log.ok(`  ${outDir}/games/*.json        单游戏文件`);
  log.ok(`  ${outDir}/roms/**             ROM文件（按平台分目录）`);
  log.ok(`  ${outDir}/covers/*            封面图片`);
  log.ok(`  ${outDir}/indexes/*.json      各维度索引`);
  log.ok('');
  log.ok('索引维度：');
  for (const [dim, data] of Object.entries(indexes))
    log.ok(`  ${dim.padEnd(12)} ${Object.keys(data).length} 个分类`);
}

main().catch(err => {
  log.error(`致命错误: ${err.message}`);
  console.error(err);
  process.exit(1);
});
