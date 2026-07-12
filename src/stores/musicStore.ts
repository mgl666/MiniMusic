import { create } from 'zustand';
import { DEFAULT_MUSIC_ROOT, loadConfig, saveConfig, scanMusicRoot } from '../api/tauri';
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
      const rootPath = loadedConfig.musicRootPath || DEFAULT_MUSIC_ROOT;
      set({ config: loadedConfig, musicRootPath: rootPath });
      await get().scanRoot(rootPath);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : String(error),
        config: defaultConfig,
        musicRootPath: DEFAULT_MUSIC_ROOT,
      });
    }
  },

  scanRoot: async (rootPath: string) => {
    set({ isScanning: true, error: undefined });

    try {
      const playlists = await scanMusicRoot(rootPath);
      const selectedPlaylistId = pickInitialPlaylist(playlists, get().config.lastPlaylistId);
      set({ playlists, selectedPlaylistId, musicRootPath: rootPath, isScanning: false });
      await get().updateConfig({ musicRootPath: rootPath, lastPlaylistId: selectedPlaylistId });
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
