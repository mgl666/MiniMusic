import { useCallback, useEffect, useRef } from 'react';
import { readCoverArt, toAudioUrl, toCoverUrl } from '../api/tauri';
import { getNextSong, getPreviousSong } from '../utils/player';
import { useMusicStore } from '../stores/musicStore';
import { usePlayerStore } from '../stores/playerStore';
import type { Song } from '../types/music';

export interface AudioControls {
  togglePlay: () => void;
  playSong: (song: Song, playlistId?: string) => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (time: number) => void;
  changeVolume: (volume: number) => void;
}

export function useAudioPlayer(): AudioControls {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentSong = usePlayerStore((state) => state.currentSong);
  const currentPlaylistId = usePlayerStore((state) => state.currentPlaylistId);
  const playMode = usePlayerStore((state) => state.playMode);
  const volume = usePlayerStore((state) => state.volume);
  const playlists = useMusicStore((state) => state.playlists);
  const updateConfig = useMusicStore((state) => state.updateConfig);

  const getCurrentSongs = useCallback(() => {
    const playlistId = usePlayerStore.getState().currentPlaylistId || 'all';
    return playlists.find((playlist) => playlist.id === playlistId)?.songs ?? [];
  }, [playlists]);

  const playSong = useCallback((song: Song, playlistId?: string) => {
    const state = usePlayerStore.getState();
    const audio = audioRef.current;

    if (state.currentSong?.id === song.id) {
      if (audio) {
        audio.currentTime = 0;
        state.setCurrentTime(0);
        void audio.play().catch((error) => {
          usePlayerStore.getState().setError(error instanceof Error ? error.message : String(error));
        });
      }
      return;
    }

    state.setCurrentSong(song, playlistId);
    void updateConfig({ lastSongId: song.id, lastPlaylistId: playlistId ?? song.playlistId });
  }, [updateConfig]);

  const playNext = useCallback(() => {
    const state = usePlayerStore.getState();
    const songs = getCurrentSongs();
    const nextSong = getNextSong({ songs, currentSong: state.currentSong, playMode: state.playMode });

    if (nextSong) {
      playSong(nextSong, state.currentPlaylistId);
    } else {
      state.setIsPlaying(false);
    }
  }, [getCurrentSongs, playSong]);

  const playPrevious = useCallback(() => {
    const state = usePlayerStore.getState();
    const previousSong = getPreviousSong(getCurrentSongs(), state.currentSong);

    if (previousSong) {
      playSong(previousSong, state.currentPlaylistId);
    }
  }, [getCurrentSongs, playSong]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      void audio.play().catch((error) => {
        usePlayerStore.getState().setError(error instanceof Error ? error.message : String(error));
      });
    } else {
      audio.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const safeTime = Math.min(Math.max(time, 0), Number.isFinite(audio.duration) ? audio.duration : time);
    audio.currentTime = safeTime;
    usePlayerStore.getState().setCurrentTime(safeTime);
  }, []);

  const changeVolume = useCallback((nextVolume: number) => {
    const safeVolume = Math.min(1, Math.max(0, nextVolume));
    const audio = audioRef.current;

    if (audio) {
      audio.volume = safeVolume;
    }

    usePlayerStore.getState().setVolume(safeVolume);
    void updateConfig({ volume: safeVolume });
  }, [updateConfig]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = volume;
    audioRef.current = audio;

    const handleLoadedMetadata = () => usePlayerStore.getState().setDuration(audio.duration || 0);
    const handleTimeUpdate = () => usePlayerStore.getState().setCurrentTime(audio.currentTime || 0);
    const handlePlay = () => usePlayerStore.getState().setIsPlaying(true);
    const handlePause = () => usePlayerStore.getState().setIsPlaying(false);
    const handleEnded = () => playNext();
    const handleError = () => usePlayerStore.getState().setError('音频播放失败');

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
    };
  }, [playNext]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) {
      return;
    }

    audio.src = toAudioUrl(currentSong.filePath);
    audio.currentTime = 0;
    void audio.play().catch((error) => {
      usePlayerStore.getState().setError(error instanceof Error ? error.message : String(error));
    });
  }, [currentSong]);

  useEffect(() => {
    let cancelled = false;

    async function loadCover(song: Song) {
      try {
        const cover = await readCoverArt(song.filePath);
        if (!cancelled && usePlayerStore.getState().currentSong?.id === song.id) {
          usePlayerStore.getState().setCurrentCoverUrl(toCoverUrl(cover), song.id);
        }
      } catch {
        if (!cancelled && usePlayerStore.getState().currentSong?.id === song.id) {
          usePlayerStore.getState().setCurrentCoverUrl(undefined);
        }
      }
    }

    if (currentSong) {
      void loadCover(currentSong);
    } else {
      usePlayerStore.getState().setCurrentCoverUrl(undefined);
    }

    return () => {
      cancelled = true;
    };
  }, [currentSong]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    void updateConfig({ playMode });
  }, [playMode, updateConfig]);

  return {
    togglePlay,
    playSong,
    playNext,
    playPrevious,
    seek,
    changeVolume,
  };
}
