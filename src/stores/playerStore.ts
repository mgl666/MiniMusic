import { create } from 'zustand';
import type { PlayMode, Song } from '../types/music';

interface PlayerState {
  currentSong?: Song;
  currentPlaylistId?: string;
  currentCoverUrl?: string;
  currentCoverSongId?: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playMode: PlayMode;
  error?: string;
  setCurrentSong: (song: Song | undefined, playlistId?: string) => void;
  setCurrentCoverUrl: (currentCoverUrl?: string, songId?: string) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (currentTime: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setPlayMode: (playMode: PlayMode) => void;
  setError: (error?: string) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentSong: undefined,
  currentPlaylistId: undefined,
  currentCoverUrl: undefined,
  currentCoverSongId: undefined,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  playMode: 'listLoop',
  error: undefined,

  setCurrentSong: (song, playlistId) => set({
    currentSong: song,
    currentPlaylistId: playlistId ?? song?.playlistId,
    currentTime: 0,
    duration: 0,
    error: undefined,
  }),
  setCurrentCoverUrl: (currentCoverUrl, songId) => set({ currentCoverUrl, currentCoverSongId: currentCoverUrl ? songId : undefined }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setPlayMode: (playMode) => set({ playMode }),
  setError: (error) => set({ error }),
}));
