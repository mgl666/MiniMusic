import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { AppConfig, CoverArt, LyricSource, Playlist } from '../types/music';

export const DEFAULT_MUSIC_ROOT = '/Users/magl/Library/CloudStorage/OneDrive-个人/音乐';

export function loadConfig(): Promise<AppConfig> {
  return invoke<AppConfig>('load_config');
}

export function saveConfig(config: AppConfig): Promise<void> {
  return invoke<void>('save_config', { config });
}

export function scanMusicRoot(rootPath: string): Promise<Playlist[]> {
  return invoke<Playlist[]>('scan_music_root', { rootPath });
}

export function readLyric(source: LyricSource): Promise<string> {
  return invoke<string>('read_lyric', { source });
}

export function readCoverArt(audioPath: string): Promise<CoverArt | null> {
  return invoke<CoverArt | null>('read_cover_art', { audioPath });
}

export async function selectMusicRoot(): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
    title: '选择音乐目录',
  });

  return typeof selected === 'string' ? selected : null;
}

export function toAudioUrl(filePath: string): string {
  return convertFileSrc(filePath);
}

export function toCoverUrl(cover: CoverArt | null | undefined): string | undefined {
  if (!cover) return undefined;
  return `data:${cover.mimeType};base64,${cover.data}`;
}
