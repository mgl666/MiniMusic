# MiniMusic

MiniMusic 是一个轻量级的本地音乐播放器，用 **Tauri 2 + React 18 + TypeScript + Rust** 构建，当前面向 macOS。

它不做在线音乐，专注于把本地 MP3 的管理、播放和歌词体验做得简洁、稳定。

## 三个工具，一条链路

MiniMusic 可以与 [Netease_url](https://github.com/Suxiaoqinx/Netease_url) 和 OneDrive 搭配使用，搭建一套完整的个人音乐工作流 — **一个负责下载，一个负责同步，一个负责播放**：

```
  Netease_url           OneDrive              MiniMusic
（下载工具）────────▶（同步工具）────────▶（播放工具）
      │                    │                     │
      ▼                    ▼                     ▼
  搜索网易云           跨设备自动同步         扫描本地文件
  解析曲库             保持音乐库一致         按文件夹分歌单
  下载 MP3/FLAC        覆盖所有设备           展示封面和歌词
```

### 1️⃣ Netease_url — 下载音乐

[Netease_url](https://github.com/Suxiaoqinx/Netease_url) 是一个 Python + Flask 项目（2478 Stars，MIT 许可），通过 Web 界面或 RESTful API 搜索和解析网易云音乐曲库，支持下载多种音质：

| 音质等级 | 说明 |
|---|---|
| `standard` | 标准音质（128kbps） |
| `exhigh` | 极高音质（320kbps） |
| `lossless` | 无损音质（FLAC） |
| `hires` | Hi-Res 音质（24bit/96kHz） |
| `jyeffect` / `sky` / `jymaster` | 环绕声 / 沉浸声 / 超清母带 |

下载的歌曲文件包括 ID3 标签（标题、歌手、专辑），MiniMusic 可自动识别。

### 2️⃣ OneDrive — 同步音乐

将 Netease_url 的下载目录设为 OneDrive 中的音乐文件夹（即 MiniMusic 的默认扫描目录）。OneDrive 负责：
- 下载的文件自动同步到云端
- 登录同一 OneDrive 账号的任意设备自动获取相同音乐库
- MiniMusic 直接在本地读取同步后的文件，无需网络

### 3️⃣ MiniMusic — 播放音乐

MiniMusic 扫描 OneDrive 音乐目录后：
- 自动识别所有 MP3 文件，按文件夹结构生成歌单
- 提取歌曲信息（标题、歌手、专辑、时长）
- 读取专辑封面并在播放界面展示
- 识别同目录下的 `.lrc` 歌词文件或 MP3 内嵌歌词，时间轴同步高亮

### 完整流程

1. 本地或服务器运行 `python main.py` 启动 Netease_url
2. 通过浏览器访问 `http://localhost:5000`，搜索并下载歌曲到 OneDrive 音乐目录
3. OneDrive 自动将新文件同步到所有设备
4. 在任意设备上打开 MiniMusic，歌曲自动出现在歌单中，即点即播

## 功能

- **自动扫描** — 选择一个本地音乐目录，自动识别其中的 MP3 文件，按文件夹结构生成歌单
- **播放控制** — 播放/暂停、上一首、下一首、进度拖拽、音量调节
- **播放模式** — 列表循环、单曲循环、随机播放
- **歌词展示** — 支持同名的 `.lrc` 文件歌词和 MP3 内嵌歌词，时间轴同步高亮
- **专辑封面** — 自动从 MP3 文件中提取封面图片并展示
- **歌曲信息** — 读取 ID3 标签中的标题、歌手、专辑、时长等信息
- **明暗主题** — 支持浅色、深色、跟随系统三种主题
- **配置持久化** — 记住上次播放的歌单、歌曲、音量和播放模式，下次启动自动恢复
- **Now Playing 全屏模式** — 大尺寸封面和歌词沉浸式播放视图

## 技术栈

| 模块 | 技术 |
|---|---|
| 桌面外壳 | [Tauri 2](https://v2.tauri.app) |
| 前端框架 | [React 18](https://react.dev) + [TypeScript](https://www.typescriptlang.org) |
| 构建工具 | [Vite](https://vite.dev) |
| 状态管理 | [Zustand](https://github.com/pmndrs/zustand) |
| 后端能力 | [Rust](https://www.rust-lang.org) — 目录扫描、ID3 标签解析、封面提取、歌词读取 |
| 音频播放 | 浏览器原生 `HTMLAudioElement` |
| 样式方案 | 全局 CSS（支持 CSS 变量实现主题切换） |

## 快速开始

```bash
# 安装前端依赖
npm install

# 以开发模式启动
npm run tauri dev

# 构建生产版本
npm run tauri build
```

> 构建前需要确保本地已安装 Rust 和 Tauri 的系统依赖，详见 [Tauri 环境配置](https://v2.tauri.app/start/prerequisites/)。

## 项目结构

```
MiniMusic/
├── src/                    # 前端源码（React + TypeScript）
│   ├── api/                # Tauri 命令调用
│   ├── components/         # UI 组件
│   ├── hooks/              # 自定义 Hooks
│   ├── stores/             # Zustand 状态管理
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   └── styles/             # 全局样式
├── src-tauri/              # 后端源码（Rust）
│   ├── src/
│   │   ├── scanner.rs      # 歌曲目录扫描
│   │   ├── media.rs        # 封面提取
│   │   ├── lyrics.rs       # 歌词读取
│   │   ├── config.rs       # 配置读写
│   │   └── models.rs       # 数据结构
│   └── tauri.conf.json     # Tauri 配置
├── logo/                   # 应用图标
└── package.json
```
