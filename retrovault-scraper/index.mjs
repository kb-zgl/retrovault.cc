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

import 'dotenv/config';
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
const SKIP_R2     = ARGS.has('--skip-r2');

// --test <path> : 本地调试模式，解析单个 HTML 文件后退出
const TEST_FILE_IDX = RAW_ARGS.indexOf('--test');
const TEST_FILE     = TEST_FILE_IDX !== -1 ? RAW_ARGS[TEST_FILE_IDX + 1] : null;

// --slug <slug> : 只处理单个游戏（测试用）
const SLUG_FILTER_IDX = RAW_ARGS.indexOf('--slug');
const SLUG_FILTER     = SLUG_FILTER_IDX !== -1 ? RAW_ARGS[SLUG_FILTER_IDX + 1] : null;

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

// ─── 环境变量 ─────────────────────────────────────────────────────────────────

const ENV = {
  accountId:   process.env.CLOUDFLARE_ACCOUNT_ID       || '',
  d1Token:     process.env.CLOUDFLARE_D1_TOKEN         || '',
  d1DbId:      process.env.CLOUDFLARE_D1_DATABASE_ID   || process.env.CLOUDFLARE_D1_DB_ID || '',
  r2AccessKey: process.env.R2_ACCESS_KEY_ID            || '',
  r2SecretKey: process.env.R2_SECRET_ACCESS_KEY        || '',
  r2Bucket:    process.env.R2_BUCKET_NAME              || '',
};

// 环境变量不完整时自动降级
const HAS_D1 = ENV.accountId && ENV.d1Token && ENV.d1DbId;
const HAS_R2 = ENV.r2AccessKey && ENV.r2SecretKey && ENV.r2Bucket;

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

// 平台映射注入小写键（兼容 key 化后的平台值）
for (const map of [PLATFORM_CORE, PLATFORM_EXT, CDN_MAP, PLATFORM_BIOS, PLATFORM_URL_SLUG]) {
  for (const [key, val] of Object.entries(map)) {
    map[key.toLowerCase()] = val;
  }
}

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

// ─── D1 HTTP API ──────────────────────────────────────────────────────────────

async function queryD1(sql, params = []) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${ENV.accountId}/d1/database/${ENV.d1DbId}/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ENV.d1Token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });
  if (!res.ok) throw new Error(`D1 HTTP ${res.status}`);
  const body = await res.json();
  if (!body.success) throw new Error(`D1 API 失败: ${JSON.stringify(body.errors)}`);
  return body.result;
}

/** 查 D1 获取已有游戏状态，返回 Map<slug, status> */
async function fetchGameStatusMap() {
  if (!HAS_D1) {
    log.info('D1 未配置，跳过云端检查');
    return new Map();
  }
  try {
    const result = await queryD1("SELECT slug, status FROM games WHERE status IN ('success','failed')");
    const map = new Map();
    for (const row of (result[0]?.results || [])) {
      map.set(row.slug, row.status);
    }
    log.ok(`D1 已有: ${map.size} 条记录（${[...map.values()].filter(s => s === 'success').length} 成功）`);
    return map;
  } catch (err) {
    log.warn(`D1 查询失败，继续本地模式: ${err.message}`);
    return new Map();
  }
}

/** 单游戏写入/更新 D1 */
async function writeGameToD1(game, status, failReason = '') {
  if (!HAS_D1) return;
  const now = new Date().toISOString();
  const tags = JSON.stringify(game.tags || []);
  const roms = JSON.stringify(game.localRoms?.map(r => ({ lang: r.lang, path: r.r2Key || r.relPath, size: r.size })) || []);
  try {
    await queryD1(
      `INSERT OR REPLACE INTO games
       (slug, title, platform, year, genre, developer, publisher, series,
        isHack, language, imageUrl, coverUrl, defaultRom, ejsCore, ejsBiosUrl,
        tags, description, roms, status, source, createdAt, updatedAt)
       VALUES (?,?,?,?,?,?,?,?, ?,?,?,?,?,?,?, ?,?,?,?,?,?,?)`,
      [game.slug, game.title, game.platform, game.year, game.genre,
       game.developer || '', game.publisher || '', game.series || '',
       game.isHack ? 1 : 0, game.language || 'English',
       game.imageUrl || '', game.localCover || '',
       game.defaultRom || '', game.ejs?.core || '', game.ejs?.biosUrl || '',
       tags, game.description || '', roms,
       status, game._source || 'scraped', now, now]
    );
  } catch (err) {
    log.warn(`D1 写入失败 [${game.slug}]: ${err.message}`);
  }
}

// ─── R2 S3 上传 ────────────────────────────────────────────────────────────────

let _r2Client = null;

async function getR2Client() {
  if (_r2Client) return _r2Client;
  if (!HAS_R2) return null;
  try {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${ENV.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: ENV.r2AccessKey, secretAccessKey: ENV.r2SecretKey },
    });
    _r2Client = { client, bucket: ENV.r2Bucket, PutObjectCommand };
    return _r2Client;
  } catch (err) {
    log.warn(`R2 SDK 加载失败（需安装 @aws-sdk/client-s3）: ${err.message}`);
    return null;
  }
}

async function uploadToR2(key, body, contentType) {
  const r2 = await getR2Client();
  if (!r2) return false;
  try {
    const cmd = new r2.PutObjectCommand({
      Bucket: r2.bucket, Key: key, Body: body, ContentType: contentType,
    });
    await r2.client.send(cmd);
    return true;
  } catch (err) {
    log.warn(`R2 上传失败 [${key}]: ${err.message}`);
    return false;
  }
}

// ─── Taxonomy 工具 ────────────────────────────────────────────────────────────

const TAXONOMY_DIR = join(process.cwd(), '..', 'data');
const TAXONOMY_FILES = ['platforms', 'genres', 'developers', 'publishers', 'series'];

/** 加载 taxonomy JSON 并构建反向映射（显示名 → key） */
async function loadReverseMaps() {
  const reverseMaps = {};
  for (const name of TAXONOMY_FILES) {
    const map = {};
    try {
      const data = await readJson(join(TAXONOMY_DIR, `${name}.json`));
      for (const locale of Object.keys(data)) {
        for (const [key, display] of Object.entries(data[locale] || {})) {
          map[String(display).toLowerCase().trim()] = key;
        }
      }
    } catch { log.warn(`加载 ${name}.json 失败，使用空映射`); }
    reverseMaps[name] = map;
  }
  return reverseMaps;
}

/** 显示名 → key。未找到时自动 slugify */
function nameToKey(raw, reverseMap) {
  if (!raw) return '';
  return reverseMap[String(raw).toLowerCase().trim()]
    || String(raw).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** 收集新增 taxonomy 条目，Step 5 时回写 JSON */
function collectNewEntry(acc, type, key, display) {
  if (!key || !display) return;
  if (!acc[type]) acc[type] = {};
  if (!acc[type][key]) acc[type][key] = display;
}

/** 合并新增 taxonomy → 写回 JSON */
async function flushTaxonomies(acc) {
  if (!acc || !Object.keys(acc).length) return;
  for (const name of TAXONOMY_FILES) {
    const additions = acc[name];
    if (!additions || !Object.keys(additions).length) continue;
    try {
      const fp = join(TAXONOMY_DIR, `${name}.json`);
      let data = {};
      try { data = await readJson(fp); } catch { data = { en: {} }; }
      if (!data.en) data.en = {};
      let changed = false;
      for (const [key, display] of Object.entries(additions)) {
        if (!data.en[key]) { data.en[key] = display; changed = true; }
      }
      if (changed) await writeJson(fp, data);
    } catch (err) { log.warn(`写回 ${name}.json 失败: ${err.message}`); }
  }
}

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
  // 在原始 HTML 中找含 $L29 的 RSC chunk
  // 结构: self.__next_f.push([1, "...20:[\"$\",\"$L29\",null,{\"game\":{...}}]\n"])
  // 内容解码后: 20:["$","$L29",null,{"game":{...}}]\n
  const re = /self\.__next_f\.push\(\[1,\s*"((?:[^"\\]|\\.)*)"\]\)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    if (!m[1].includes('$L29')) continue;

    const decoded = m[1]
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\\\/g, '\x00BS\x00')
      .replace(/\\"/g, '"')
      .replace(/\x00BS\x00/g, '\\');

    // 去掉行号前缀 "20:"，剩 ["$","$L29",null,{"game":{...}}]
    const colonIdx = decoded.indexOf(':');
    if (colonIdx === -1) return null;

    try {
      const arr = JSON.parse(decoded.slice(colonIdx + 1));
      if (Array.isArray(arr) && arr.length >= 4 && arr[3]?.game) {
        return { ...arr[3].game, _method: 'rsc' };
      }
    } catch { return null; }
  }
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
async function downloadGameRoms(game, gamesDir) {
  const { slug, platform } = game;
  const entries = getRomEntries(game);

  if (entries.length === 0) return { files: [], defaultRom: null };

  const gameDir = join(gamesDir, slug);
  await ensureDir(gameDir);

  const files = [];

  for (const { lang, url } of entries) {
    if (!url) continue;

    const filename  = romFilename(url, slug, lang);
    const localPath = join(gameDir, filename);
    const r2Key     = `${slug}/${filename}`;

    // 已存在且非空 → 跳过
    if (await pathExists(localPath)) {
      const info = await stat(localPath);
      if (info.size > 0) {
        files.push({ lang, filename, localPath, r2Key, url, size: info.size, status: 'cached' });
        continue;
      }
    }

    log.info(`  ROM ↓ [${slug}] ${lang}: ${filename}`);
    log.info(`  下载地址：${url}`)
    const result = await downloadFile(url, localPath);

    if (result.ok) {
      files.push({ lang, filename, localPath, r2Key, url, size: result.size, status: 'downloaded' });
      log.ok(`  ROM ✓ [${slug}] ${lang}: ${(result.size / 1024 / 1024).toFixed(2)}MB`);
    } else {
      log.warn(`  ROM ✗ [${slug}] ${lang}: ${result.reason}`);
      files.push({ lang, filename, localPath: null, r2Key: null, url, size: 0, status: result.reason });
    }
  }

  // defaultRom：优先级最高的成功文件（R2 key）
  const successful = files.filter(f => f.localPath);
  const defaultRom = successful.length > 0 ? successful[0].r2Key : null;

  return { files, defaultRom };
}

// ─── Step 4: 封面下载 ─────────────────────────────────────────────────────────

async function downloadCover(imageUrl, slug, gamesDir) {
  if (!imageUrl) return null;

  const fullUrl = imageUrl.startsWith('http')
    ? imageUrl
    : `${CONFIG.baseUrl}${imageUrl}`;

  const ext       = fullUrl.split('.').pop().split('?')[0] || 'webp';
  const filename  = `${slug}.${ext}`;
  const gameDir   = join(gamesDir, slug);
  await ensureDir(gameDir);
  const localPath = join(gameDir, filename);
  const r2Key     = `${slug}/${filename}`;

  if (await pathExists(localPath)) {
    const info = await stat(localPath);
    if (info.size > 0) return r2Key;
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
    return r2Key;
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
    const raw  = parseDetail(html, slug);

    if (!raw || !raw.title) {
      console.warn('[WARN] parseDetail returned no valid data');
    }

    console.log(JSON.stringify(raw, null, 2));
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
  const outDir   = CONFIG.outputDir;
  const gamesDir = join(outDir, 'games');
  const indexDir = join(outDir, 'indexes');

  await ensureDir(outDir);
  await ensureDir(gamesDir);
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
  // Step 2 + 3 + 4: 详情页 + ROM下载 + 封面下载 + R2上传 + D1写入（合并为一次遍历）
  // ══════════════════════════════════════════════════════════════════════════

  log.info('=== Step 2/3/4: 详情 + ROM + 封面 + R2 + D1 ===');
  if (SKIP_ROMS)   log.info('  [--skip-roms] ROM下载已跳过');
  if (SKIP_COVERS) log.info('  [--skip-covers] 封面下载已跳过');
  if (SKIP_R2)     log.info('  [--skip-r2] R2上传已跳过');

  // 本地进度过滤
  let pending = allSlugs.filter(
    s => !progress.completedSlugs.includes(s) && !progress.failedSlugs.includes(s)
  );

  // D1 云端状态过滤（增量断点）
  if (HAS_D1) {
    const d1StatusMap = await fetchGameStatusMap();
    if (d1StatusMap.size > 0) {
      const before = pending.length;
      pending = pending.filter(s => {
        const st = d1StatusMap.get(s);
        return !st || st === 'failed';
      });
      const skipped = before - pending.length;
      if (skipped > 0) log.ok(`D1 跳过 ${skipped} 个已成功游戏`);
    }
  }

  // --slug 单游戏过滤
  if (SLUG_FILTER) {
    pending = pending.filter(s => s === SLUG_FILTER);
    if (pending.length === 0) {
      log.error(`--slug ${SLUG_FILTER} 未找到，检查拼写`);
      return;
    }
    log.info(`单游戏模式: ${SLUG_FILTER}`);
  }

  // 加载 taxonomy 反向映射（显示名 → key）
  log.info('加载 taxonomy 映射...');
  const reverseMaps = await loadReverseMaps();
  const newTaxonomyEntries = {};  // 收集新增条目，Step 5 回写

  log.info(`待处理: ${pending.length} / ${allSlugs.length}`);

  const limit    = pLimit(CONFIG.detailConcurrency);
  const romLimit = pLimit(CONFIG.romConcurrency);
  let doneCount  = 0;

  await Promise.all(pending.map(slug => limit(async () => {
    const card = progress.slugCardMap[slug] || {};
    let game = null;

    try {
      // ── 2a: 抓取详情页 ──────────────────────────────────────────────────
      let html;
      try {
        html = await fetchText(`${CONFIG.baseUrl}/games/${slug}`);
      } catch (err) {
        throw new Error(`详情页请求失败: ${err.message}`);
      }

      const raw = parseDetail(html, slug);
      if (!raw || !raw.title) throw new Error('详情解析失败');

      // ── 2b: 下载ROM ─────────────────────────────────────────────────────
      let romResult = null;
      if (!SKIP_ROMS) {
        romResult = await romLimit(() => downloadGameRoms(
          { ...raw, slug, platform: raw.platform || card.platform },
          gamesDir
        ));
        progress.romMap[slug] = {
          files:      romResult.files,
          defaultRom: romResult.defaultRom,
        };
      }

      // ── 2b1: 转换 5 个分类字段为 key ────────────────────────────────────
      const rawPlat  = raw.platform   || card.platform   || '';
      const rawGenre = raw.genre      || card.genre      || '';
      const rawDev   = raw.developer  || '';
      const rawPub   = raw.publisher  || '';
      const rawSer   = raw.enSeries || raw.series || card.series || card.enSeries || '';
      raw.platform   = nameToKey(rawPlat,  reverseMaps.platforms);
      raw.genre      = nameToKey(rawGenre, reverseMaps.genres);
      raw.developer  = nameToKey(rawDev,   reverseMaps.developers);
      raw.publisher  = nameToKey(rawPub,   reverseMaps.publishers);
      raw.series     = nameToKey(rawSer,   reverseMaps.series);
      raw.enSeries   = raw.series;     // 同步 enSeries，防止 normalizeGame 取旧值
      // 收集新增条目，Step 5 回写 JSON（保留原始显示名）
      collectNewEntry(newTaxonomyEntries, 'platforms',  raw.platform,  rawPlat);
      collectNewEntry(newTaxonomyEntries, 'genres',     raw.genre,    rawGenre);
      collectNewEntry(newTaxonomyEntries, 'developers', raw.developer, rawDev);
      collectNewEntry(newTaxonomyEntries, 'publishers', raw.publisher, rawPub);
      collectNewEntry(newTaxonomyEntries, 'series',     raw.series,   rawSer);

      // ── 2c: 下载封面 ─────────────────────────────────────────────────────
      let coverPath = null;
      if (!SKIP_COVERS) {
        const imgUrl = raw.imageUrl || card.coverImg;
        if (imgUrl) coverPath = await downloadCover(imgUrl, slug, gamesDir);
      }

      // ── 2d: 上传至 R2 ───────────────────────────────────────────────────
      if (!SKIP_R2 && HAS_R2) {
        // 上传 ROM
        if (romResult?.files) {
          for (const f of romResult.files) {
            if (f.localPath && f.r2Key) {
              const buf = await readFile(f.localPath);
              const ct = f.filename.endsWith('.zip') ? 'application/zip' : 'application/octet-stream';
              await uploadToR2(f.r2Key, buf, ct);
            }
          }
        }
        // 上传封面
        if (coverPath) {
          const coverFile = coverPath.split('/').pop();
          const coverLocal = join(gamesDir, slug, coverFile);
          if (await pathExists(coverLocal)) {
            const buf = await readFile(coverLocal);
            await uploadToR2(coverPath, buf, 'image/webp');
          }
        }
      }

      // ── 2e: 标准化 & 写入 game.json 到 slug 目录 ──────────────────────
      game = normalizeGame(raw, slug, card, romResult, coverPath);
      const gameDir = join(gamesDir, slug);
      await ensureDir(gameDir);
      await writeJson(join(gameDir, 'game.json'), game);

      // ── 2f: 写入 D1（成功）─────────────────────────────────────────────
      await writeGameToD1(game, 'success');

      progress.completedSlugs.push(slug);
      doneCount++;

      if (doneCount % 20 === 0) {
        await saveProgress();
        log.ok(`进度: ${doneCount}/${pending.length}  失败: ${progress.failedSlugs.length}`);
      }

    } catch (err) {
      log.warn(`处理失败 [${slug}]: ${err.message}`);
      progress.failedSlugs.push(slug);
      // 尽量写入 D1 失败状态
      if (game) await writeGameToD1(game, 'failed', err.message);
      await saveProgress();
    }
  })));

  await saveProgress();
  log.ok(`详情/ROM/封面处理完成  成功: ${progress.completedSlugs.length}  失败: ${progress.failedSlugs.length}`);

  // ══════════════════════════════════════════════════════════════════════════
  // Step 5: 合并数据 + 构建索引 + 生成EJS配置
  // ══════════════════════════════════════════════════════════════════════════

  log.info('=== Step 5: 合并 & 构建索引 ===');

  // 回写新增的 taxonomy 条目到 JSON
  const nTax = Object.keys(newTaxonomyEntries).reduce((n, k) => n + Object.keys(newTaxonomyEntries[k] || {}).length, 0);
  if (nTax > 0) {
    log.info(`回写 ${nTax} 个新增 taxonomy 条目`);
    await flushTaxonomies(newTaxonomyEntries);
  }

  // 兼容新旧格式：旧 = *.json 散放，新 = {slug}/game.json
  const gameEntries = await readdir(gamesDir, { withFileTypes: true });
  const allGames = [];
  for (const entry of gameEntries) {
    if (entry.isFile() && entry.name.endsWith('.json')) {
      allGames.push(await readJson(join(gamesDir, entry.name)));
    } else if (entry.isDirectory()) {
      try {
        allGames.push(await readJson(join(gamesDir, entry.name, 'game.json')));
      } catch { /* skip */ }
    }
  }

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
        allVersions: (g.localRoms || []).map(r => ({ lang: r.lang, path: r.r2Key || r.relPath })),
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
  log.ok(`  ${outDir}/games/*/game.json   单游戏元数据`);
  log.ok(`  ${outDir}/games/*/             ROM + 封面（按 slug 目录）`);
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
