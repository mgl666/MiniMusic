import { create } from 'zustand';
import { DEFAULT_MUSIC_ROOT, getDefaultMusicDir, loadConfig, saveConfig, scanMusicRoot } from '../api/tauri';
import type { AppConfig, Playlist, PlayMode } from '../types/music';

interface MusicState {
  config: AppConfig;
  musicRootPath: string;
  playlists: Playlist[];
  selectedPlaylistId?: string;
  isScanning: boolean;
  error?: string;
  loadInitialLibrary: () => Promise<void>;
  scanRoot: (rootPath: string) => Promise<void>;
  selectPlaylist: (playlistId: string) => void;
  updateConfig: (patch: Partial<AppConfig>) => Promise<void>;
}

const defaultConfig: AppConfig = {
  musicRootPath: DEFAULT_MUSIC_ROOT,
  volume: 0.8,
  playMode: 'listLoop',
  theme: 'system',
};

const LAST_MUSIC_ROOT_STORAGE_KEY = 'minimusic:last-music-root';

function loadSavedMusicRoot(): string | undefined {
  try {
    const rootPath = window.localStorage.getItem(LAST_MUSIC_ROOT_STORAGE_KEY)?.trim();
    return rootPath || undefined;
  } catch {
    return undefined;
  }
}

function saveMusicRoot(rootPath: string) {
  try {
    window.localStorage.setItem(LAST_MUSIC_ROOT_STORAGE_KEY, rootPath);
  } catch {
    // The Rust config remains the primary persistence mechanism.
  }
}

function normalizePlayMode(mode: unknown): PlayMode {
  return mode === 'singleLoop' || mode === 'shuffle' ? mode : 'listLoop';
}

function normalizeConfig(config: AppConfig): AppConfig {
  return {
    ...config,
    playMode: normalizePlayMode(config.playMode),
    theme: config.theme === 'light' || config.theme === 'dark' ? config.theme : 'system',
  };
}

function pickInitialPlaylist(playlists: Playlist[], preferredId?: string) {
  if (preferredId && playlists.some((playlist) => playlist.id === preferredId)) {
    return preferredId;
  }

  if (playlists.some((playlist) => playlist.id === 'all')) {
    return 'all';
  }

  return playlists[0]?.id;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  config: defaultConfig,
  musicRootPath: DEFAULT_MUSIC_ROOT,
  playlists: [],
  selectedPlaylistId: undefined,
  isScanning: false,
  error: undefined,

  loadInitialLibrary: async () => {
    try {
      const loadedConfig = normalizeConfig({ ...defaultConfig, ...(await loadConfig()) });
      let rootPath = loadedConfig.musicRootPath || loadSavedMusicRoot() || DEFAULT_MUSIC_ROOT;
      if (!rootPath) {
        try {
          rootPath = await getDefaultMusicDir();
        } catch {
          // 获取系统默认音乐目录失败，保持空
        }
      }
      set({ config: loadedConfig, musicRootPath: rootPath });
      if (rootPath) {
        await get().scanRoot(rootPath);
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },

  scanRoot: async (rootPath: string) => {
    // Persist the selected folder before scanning it. Scanning a large library can
    // take time or fail because of a single unreadable file; neither case should
    // make the user's folder choice disappear on the next launch.
    const nextConfig = normalizeConfig({ ...get().config, musicRootPath: rootPath });
    saveMusicRoot(rootPath);
    set({ config: nextConfig, isScanning: true, error: undefined, musicRootPath: rootPath });

    try {
      await saveConfig(nextConfig);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : String(error),
      });
    }

    try {
      const playlists = await scanMusicRoot(rootPath);
      const selectedPlaylistId = pickInitialPlaylist(playlists, nextConfig.lastPlaylistId);
      set({ playlists, selectedPlaylistId, isScanning: false });
      await get().updateConfig({ lastPlaylistId: selectedPlaylistId });
    } catch (error) {
      set({
        isScanning: false,
        error: error instanceof Error ? error.message : String(error),
        playlists: [],
        selectedPlaylistId: undefined,
      });
    }
  },

  selectPlaylist: (playlistId: string) => {
    set({ selectedPlaylistId: playlistId });
    void get().updateConfig({ lastPlaylistId: playlistId });
  },

  updateConfig: async (patch: Partial<AppConfig>) => {
    const nextConfig = normalizeConfig({ ...get().config, ...patch });
    set({ config: nextConfig });

    try {
      await saveConfig(nextConfig);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) });
    }
  },
}));

export function getSelectedPlaylist() {
  const { playlists, selectedPlaylistId } = useMusicStore.getState();
  return playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? playlists[0];
}
