# 03 — EmulatorJS 集成方案

> 使用开源版 EmulatorJS（github.com/EmulatorJS/EmulatorJS），本地部署，不依赖任何第三方CDN

---

## 部署方式

EmulatorJS 核心文件托管在 Cloudflare R2 或随项目静态资源部署，通过 `/emulatorjs/data/` 路径访问。

```
public/
└── emulatorjs/
    └── data/
        ├── loader.js          ← 入口文件
        ├── emulator.min.js
        ├── emulator.min.css
        ├── cores/             ← 各平台核心文件
        │   ├── nes_libretro.wasm
        │   ├── snes_libretro.wasm
        │   ├── gba_libretro.wasm
        │   ├── mame2003_libretro.wasm
        │   └── ...
        └── localization/
            ├── en-US.json
            └── zh-CN.json
```

---

## 平台与 Core 对应关系

| 平台 | EJS Core | 说明 |
|------|----------|------|
| NES | `nes` | 默认用 nestopia |
| SNES | `snes` | |
| Genesis / Mega Drive | `segaMD` | |
| Game Boy | `gb` | |
| Game Boy Advance | `gba` | |
| Arcade (MAME) | `arcade` | MAME 2003 Plus |
| Nintendo 64 | `n64` | |
| NeoGeo Pocket | `ngp` | |
| Nintendo DS | `nds` | |
| Bandai WonderSwan | `ws` | |
| PlayStation | `psx` | 需要 BIOS |
| Game Gear | `segaGG` | |
| Atari Jaguar | `jaguar` | |
| Sega Master System | `segaMS` | |
| Sega CD | `segaCD` | 需要 BIOS |
| Sega 32X | `sega32x` | |
| PC Engine CD | `pce` | 需要 BIOS |
| MSX2 | `msx` | |
| Famicom Disk System | `nes` | 需要 BIOS |
| Virtual Boy | `vb` | |
| Sega Saturn | `segaSaturn` | 需要 BIOS |
| ColecoVision | `coleco` | 需要 BIOS |
| Commodore 64 | `c64` | |

---

## `GameEmulator.vue` 组件设计

### Props

```typescript
interface Props {
  game: {
    id:         string
    title:      string
    platform:   string
    ejsCore:    string
    ejsBiosUrl: string
    defaultRom: string        // R2 ROM路径
    localRoms:  RomVersion[]  // 所有版本
  }
  dictionary: Record<string, any>  // i18n文本
  onExit?:    () => void
}
```

### ROM加载逻辑

```
localRoms.length === 0
  → 无ROM，显示提示

localRoms.length === 1
  → 直接加载 localRoms[0]

localRoms.length > 1 且 lang 类型
  → 弹出语言选择弹窗（RomVersionSelector）

localRoms 含 disc1/disc2
  → 弹出碟片选择弹窗（DiscSelector）
```

### EJS 初始化代码

```javascript
// 在游戏加载时执行
function initEmulator(romUrl, game) {
  const gameEl = document.getElementById('game')
  if (!gameEl) return

  // 清空容器
  gameEl.innerHTML = ''

  // 设置全局变量
  window.EJS_player      = '#game'
  window.EJS_gameName    = game.title
  window.EJS_gameUrl     = romUrl               // R2 ROM 直链
  window.EJS_core        = game.ejsCore
  window.EJS_biosUrl     = game.ejsBiosUrl || ''
  window.EJS_pathtodata  = '/emulatorjs/data/'
  window.EJS_startOnLoaded = true
  window.EJS_volume      = 0.5
  window.EJS_language    = getEjsLocale()       // 根据当前语言

  // 广告配置（接入 Adsterra 时启用）
  window.EJS_AdUrl   = '/ad.html'
  window.EJS_AdTimer = 5000

  // 按钮配置
  window.EJS_Buttons = {
    saveSavFiles: true,
    loadSavFiles: true,
  }

  // 加载 loader
  const script    = document.createElement('script')
  script.src      = '/emulatorjs/data/loader.js'
  script.async    = true
  document.body.appendChild(script)
}
```

### 语言映射

```javascript
const EJS_LOCALE_MAP = {
  'en':    'en-US',
  'zh-cn': 'zh-CN',
  'ja':    'ja-JA',
  'ko':    'ko-KO',
  'es':    'es-ES',
  'pt':    'pt-BR',
  'fr':    'af-FR',
  'de':    'de-GER',
  'ru':    'ru-RU',
  'ar':    'ar-AR',
}
```

---

## ROM访问方式

ROM 文件存储在 Cloudflare R2，通过自定义域名访问：

```
https://roms.retrovault.online/roms/nes/super-mario-bros.nes
https://roms.retrovault.online/roms/gba/pokemon-ruby.gba
https://roms.retrovault.online/roms/arcade/mslug.zip
```

Nuxt 服务端 API 提供 ROM URL，不在前端直接暴露 R2 路径：

```
GET /api/games/[slug]/rom-url
→ { url: "https://roms.retrovault.online/roms/..." }
```

---

## iOS 特殊处理

iOS Safari 不支持标准全屏 API，需要特殊处理：

- 检测 iOS 设备：`/iPhone|iPad|iPod/i.test(navigator.userAgent)`
- iOS 上点击「游玩」→ 先进入全屏模式 → 再加载游戏
- 提供「退出全屏」按钮（固定在左下角）
- Arcade 平台在 iOS Safari 需要额外的 WebAssembly 线程权限处理

---

## 存档功能（预留）

初期关闭，预留接口：

```javascript
window.EJS_onSaveSave = (data) => {
  // data.save: ArrayBuffer
  // data.screenshot: ArrayBuffer
  // → 调用 /api/saves 保存到 D1
}

window.EJS_onLoadSave = () => {
  // → 从 /api/saves 读取存档
}
```

---

## 多碟游戏处理

PS1 等多碟游戏，ROM 数据格式：

```json
{
  "localRoms": [
    { "lang": "disc1", "relPath": "roms/ps/game-disc1.psx" },
    { "lang": "disc2", "relPath": "roms/ps/game-disc2.psx" }
  ]
}
```

点击游玩时弹出碟片选择弹窗，选择后加载对应 ROM。
