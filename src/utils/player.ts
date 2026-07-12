import type { PlayMode, Song } from '../types/music';

interface NextSongOptions {
  songs: Song[];
  currentSong?: Song;
  playMode: PlayMode;
}

export function getNextSong({ songs, currentSong, playMode }: NextSongOptions): Song | undefined {
  if (!songs.length) {
    return undefined;
  }

  if (!currentSong) {
    return songs[0];
  }

  if (playMode === 'singleLoop') {
    return currentSong;
  }

  if (playMode === 'shuffle') {
    if (songs.length === 1) {
      return songs[0];
    }

    const candidates = songs.filter((song) => song.id !== currentSong.id);
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  const currentIndex = songs.findIndex((song) => song.id === currentSong.id);
  const nextIndex = currentIndex + 1;

  return nextIndex < songs.length ? songs[nextIndex] : songs[0];
}

export function getPreviousSong(songs: Song[], currentSong?: Song): Song | undefined {
  if (!songs.length) {
    return undefined;
  }

  if (!currentSong) {
    return songs[0];
  }

  const currentIndex = songs.findIndex((song) => song.id === currentSong.id);
  if (currentIndex <= 0) {
    return songs[songs.length - 1];
  }

  return songs[currentIndex - 1];
}

export function nextPlayMode(mode: PlayMode): PlayMode {
  if (mode === 'listLoop') return 'singleLoop';
  if (mode === 'singleLoop') return 'shuffle';
  return 'listLoop';
}

export function playModeLabel(mode: PlayMode) {
  if (mode === 'listLoop') return '顺序循环';
  if (mode === 'singleLoop') return '单曲循环';
  return '随机播放';
}
