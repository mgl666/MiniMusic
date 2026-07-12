export type PlayMode = 'listLoop' | 'singleLoop' | 'shuffle';

export type AppTheme = 'light' | 'dark' | 'system';

export type LyricSource =
  | { kind: 'sidecar'; path: string }
  | { kind: 'embedded'; audioPath: string };

export interface CoverArt {
  mimeType: string;
  data: string;
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  duration?: number;
  filePath: string;
  lyricPath?: string;
  lyricSource?: LyricSource;
  playlistId: string;
}

export interface Playlist {
  id: string;
  name: string;
  folderPath: string;
  songs: Song[];
}

export interface AppConfig {
  musicRootPath?: string;
  lastPlaylistId?: string;
  lastSongId?: string;
  volume: number;
  playMode: PlayMode;
  theme: AppTheme;
}

export interface LyricLine {
  time: number;
  text: string;
}
