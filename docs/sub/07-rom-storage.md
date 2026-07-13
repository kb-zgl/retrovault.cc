# 07 — ROM 存储方案

> 存储：Cloudflare R2  
> 访问：自定义域名 roms.retrovault.online  
> 原则：ROM文件与前端完全分离，前端只拿URL不直接暴露R2路径

---

## R2 Bucket 结构

```
retrovault-roms/                     ← R2 Bucket名称
├── roms/
│   ├── arcade/
│   │   ├── mslug.zip
│   │   ├── mslug2.zip
│   │   └── ...
│   ├── nes/
│   │   ├── super-mario-bros.nes
│   │   ├── super-mario-bros-lost-levels.nes
│   │   └── ...
│   ├── snes/
│   ├── gba/
│   │   ├── pokemon-ruby.gba
│   │   ├── pokemon-ruby-ja.gba
│   │   ├── pokemon-ruby-zh-cn.gba
│   │   └── ...
│   ├── n64/
│   ├── ps/
│   ├── genesis/
│   ├── gb/
│   ├── nds/
│   ├── game-gear/
│   ├── sms/
│   ├── pce/
│   ├── ss/
│   ├── sega-cd/
│   ├── sega-32x/
│   ├── jaguar/
│   ├── ws/
│   ├── ngp/
│   ├── vb/
│   ├── fds/
│   ├── msx2/
│   ├── coleco/
│   └── c64/
├── covers/
│   ├── super-mario-bros.webp
│   ├── pokemon-ruby.webp
│   └── ...
└── bios/
    ├── scph1001.bin            ← PS1 BIOS
    ├── bios_CD_U.bin           ← Sega CD BIOS
    ├── syscard3.pce            ← PC Engine CD BIOS
    ├── saturn_bios.bin         ← Sega Saturn BIOS
    ├── colecovision.rom        ← ColecoVision BIOS
    └── neogeo.zip              ← NeoGeo BIOS
```

---

## 访问域名配置

```
roms.retrovault.online  →  R2 Bucket（公开读取）
```

### Cloudflare R2 自定义域名配置

1. R2 Bucket 设置 → 公开访问
2. 添加自定义域名 `roms.retrovault.online`
3. Cloudflare DNS 自动创建 CNAME 记录

访问示例：
```
https://roms.retrovault.online/roms/nes/super-mario-bros.nes
https://roms.retrovault.online/roms/gba/pokemon-ruby.gba
https://roms.retrovault.online/covers/super-mario-bros.webp
```

---

## R2 Key 命名规范

| 类型 | Key格式 | 示例 |
|------|---------|------|
| ROM（单版本） | `roms/{platform}/{slug}.{ext}` | `roms/nes/super-mario-bros.nes` |
| ROM（多语言） | `roms/{platform}/{slug}-{lang}.{ext}` | `roms/gba/pokemon-ruby-ja.gba` |
| ROM（多碟） | `roms/{platform}/{slug}-{disc}.{ext}` | `roms/ps/ff7-disc1.psx` |
| 封面图 | `covers/{slug}.webp` | `covers/super-mario-bros.webp` |
| BIOS | `bios/{filename}` | `bios/scph1001.bin` |

---

## Nuxt 服务端 ROM URL 接口

前端不直接拼接 R2 URL，通过 API 获取，方便后续切换存储位置。

```typescript
// server/api/games/[slug]/rom.get.ts
export default defineEventHandler(async (event) => {
  const slug   = getRouterParam(event, 'slug')
  const lang   = getQuery(event).lang as string || 'default'
  const db     = useD1(event)

  // 查询游戏ROM版本
  const rom = await db
    .prepare(`
      SELECT rel_path, r2_key, file_ext, lang
      FROM game_rom_versions
      WHERE game_id = ?
        AND (lang = ? OR lang = 'default')
        AND status = 'available'
      ORDER BY is_default DESC, lang ASC
      LIMIT 1
    `)
    .bind(slug, lang)
    .first()

  if (!rom) {
    throw createError({ statusCode: 404, message: 'ROM not found' })
  }

  return {
    url:  `https://roms.retrovault.online/${rom.rel_path}`,
    lang: rom.lang,
    ext:  rom.file_ext,
  }
})
```

```typescript
// server/api/games/[slug]/roms.get.ts  (获取所有版本)
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const db   = useD1(event)

  const { results } = await db
    .prepare(`
      SELECT lang, rel_path, file_ext, file_size, is_default
      FROM game_rom_versions
      WHERE game_id = ? AND status = 'available'
      ORDER BY is_default DESC, lang ASC
    `)
    .bind(slug)
    .all()

  return results.map(rom => ({
    lang:      rom.lang,
    url:       `https://roms.retrovault.online/${rom.rel_path}`,
    ext:       rom.file_ext,
    sizeMB:    rom.file_size ? (rom.file_size / 1024 / 1024).toFixed(1) : null,
    isDefault: rom.is_default === 1,
  }))
})
```

---

## R2 CORS 配置

R2 Bucket 需要配置 CORS，允许游戏站域名加载 ROM：

```json
[
  {
    "AllowedOrigins": [
      "https://retrovault.online",
      "https://www.retrovault.online",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["Content-Length", "Content-Type"],
    "MaxAgeSeconds": 86400
  }
]
```

---

## 封面图访问

封面图同样存储在 R2，通过 `roms.retrovault.online/covers/` 访问。

Nuxt 中使用：

```vue
<img
  :src="`https://roms.retrovault.online/covers/${game.slug}.webp`"
  :alt="game.title"
  loading="lazy"
/>
```

备用图片（封面不存在时）：

```vue
<img
  :src="`https://roms.retrovault.online/covers/${game.slug}.webp`"
  :alt="game.title"
  loading="lazy"
  @error="onImageError"
/>

<script setup>
function onImageError(e: Event) {
  const img = e.target as HTMLImageElement
  img.src = '/images/cover-placeholder.webp'
}
</script>
```

---

## DMCA 应对预案

ROM 存储在 R2，被投诉时的处理流程：

1. 收到 DMCA 投诉邮件
2. 在 D1 中将对应游戏的 ROM 状态标记为 `removed`：
   ```sql
   UPDATE game_rom_versions SET status = 'removed' WHERE game_id = 'xxx';
   UPDATE games SET status = 'hidden' WHERE id = 'xxx';
   ```
3. 从 R2 删除对应 ROM 文件
4. 页面自动显示「ROM暂不可用」提示，游戏详情页保留（不删除页面，保留SEO权重）

ROM换位置时：
1. 上传到新位置
2. 更新 `game_rom_versions.rel_path` 和 `r2_key`
3. 将状态改回 `available`

---

## 存储成本估算

| 项目 | 估算 | 说明 |
|------|------|------|
| ROM文件总量 | ~50GB | 2000款游戏，含多语言版本 |
| 封面图总量 | ~500MB | 2000张 webp，平均250KB |
| R2存储费用 | $0/月 | R2免费额度10GB，超出$0.015/GB |
| R2出站流量 | 免费 | Cloudflare出站不收费 |
| 预估月费用 | $0-$1 | 取决于存储量 |
