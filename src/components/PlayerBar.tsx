import { useEffect, useState } from 'react';
import type { AudioControls } from '../hooks/useAudioPlayer';
import { usePlayerStore } from '../stores/playerStore';
import { formatTime } from '../utils/format';
import { nextPlayMode, playModeLabel } from '../utils/player';
import type { PlayMode } from '../types/music';

interface PlayerBarProps {
  controls: AudioControls;
  onOpenNowPlaying: () => void;
}

interface IconProps {
  name: 'previous' | 'play' | 'pause' | 'next' | PlayMode;
}

function ControlIcon({ name }: IconProps) {
  if (name === 'previous') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6zM19 6v12L9 12z" /></svg>;
  }

  if (name === 'next') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2zM5 18V6l10 6z" /></svg>;
  }

  if (name === 'play') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>;
  }

  if (name === 'pause') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>;
  }

  if (name === 'shuffle') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3l4 4-4 4V8h-2.2c-1.1 0-1.9.4-2.6 1.3l-5.4 7.2A4.8 4.8 0 0 1 3 18H2v-2h1c1.1 0 1.9-.4 2.6-1.3L11 7.5A4.8 4.8 0 0 1 14.8 6H17zm0 10l4 4-4 4v-3h-2.2a4.8 4.8 0 0 1-3.8-1.9l-1-1.3 1.3-1.7 1.3 1.7c.6.8 1.4 1.2 2.4 1.2H17zM2 6h1c1.5 0 2.8.7 3.8 1.9l1 1.3-1.3 1.7-1.3-1.7A2.8 2.8 0 0 0 3 8H2z" /></svg>;
  }

  if (name === 'singleLoop') {
    return (
      <svg className="stroke-icon loop-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.3 6.5h-7.8a6 6 0 1 0 5.2 9" />
        <path d="M15.6 3.8 18.6 6.5l-3 2.8" />
        <circle className="one-badge" cx="8.2" cy="8.1" r="4.6" />
        <path className="one-mark" d="M8.2 5.9v4.4" />
      </svg>
    );
  }

  return (
    <svg className="stroke-icon loop-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.3 6.5h-7.8a6 6 0 1 0 5.2 9" />
      <path d="M15.6 3.8 18.6 6.5l-3 2.8" />
    </svg>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function PlayerBar({ controls, onOpenNowPlaying }: PlayerBarProps) {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const currentCoverUrl = usePlayerStore((state) => state.currentCoverUrl);
  const currentCoverSongId = usePlayerStore((state) => state.currentCoverSongId);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);
  const volume = usePlayerStore((state) => state.volume);
  const playMode = usePlayerStore((state) => state.playMode);
  const error = usePlayerStore((state) => state.error);
  const setPlayMode = usePlayerStore((state) => state.setPlayMode);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const displayTime = isScrubbing ? scrubTime : currentTime;
  const playLabel = isPlaying ? '暂停' : '播放';
  const modeLabel = playModeLabel(playMode);
  const coverUrl = currentCoverSongId === currentSong?.id ? currentCoverUrl : undefined;

  useEffect(() => {
    if (!isScrubbing) {
      setScrubTime(clamp(currentTime, 0, safeDuration || currentTime));
    }
  }, [currentTime, isScrubbing, safeDuration]);

  const handleProgressChange = (value: number) => {
    if (!currentSong || !safeDuration) return;
    const nextTime = clamp(value, 0, safeDuration);
    setScrubTime(nextTime);
    controls.seek(nextTime);
  };

  return (
    <footer className="player-bar">
      <button className="now-playing now-playing-button" type="button" onClick={onOpenNowPlaying} disabled={!currentSong} title="打开播放详情">
        <div className={`cover-placeholder ${coverUrl ? 'has-cover' : ''}`}>
          {coverUrl ? <img src={coverUrl} alt="当前歌曲封面" /> : '♪'}
        </div>
        <div>
          <strong>{currentSong?.title ?? '未选择歌曲'}</strong>
          <p>{error || currentSong?.artist || '本地音乐播放'}</p>
        </div>
      </button>

      <div className="player-center">
        <div className="player-controls">
          <button className="icon-button" type="button" aria-label="上一首" title="上一首" onClick={controls.playPrevious} disabled={!currentSong}>
            <ControlIcon name="previous" />
          </button>
          <button className="icon-button primary-control" type="button" aria-label={playLabel} title={playLabel} onClick={controls.togglePlay} disabled={!currentSong}>
            <ControlIcon name={isPlaying ? 'pause' : 'play'} />
          </button>
          <button className="icon-button" type="button" aria-label="下一首" title="下一首" onClick={controls.playNext} disabled={!currentSong}>
            <ControlIcon name="next" />
          </button>
          <button className="icon-button" type="button" aria-label={`播放模式：${modeLabel}`} title={modeLabel} onClick={() => setPlayMode(nextPlayMode(playMode))}>
            <ControlIcon name={playMode} />
          </button>
        </div>
        <div className="progress-row">
          <span>{formatTime(displayTime)}</span>
          <input
            aria-label="播放进度"
            max={safeDuration}
            min={0}
            step={0.1}
            type="range"
            value={clamp(displayTime, 0, safeDuration)}
            onPointerDown={() => setIsScrubbing(true)}
            onPointerUp={() => setIsScrubbing(false)}
            onMouseUp={() => setIsScrubbing(false)}
            onTouchEnd={() => setIsScrubbing(false)}
            onBlur={() => setIsScrubbing(false)}
            onChange={(event) => handleProgressChange(Number(event.target.value))}
            disabled={!currentSong || !safeDuration}
          />
          <span>{formatTime(safeDuration)}</span>
        </div>
      </div>

      <div className="volume-control">
        <span>音量</span>
        <input
          aria-label="音量"
          max={1}
          min={0}
          step={0.01}
          type="range"
          value={volume}
          onChange={(event) => controls.changeVolume(Number(event.target.value))}
        />
      </div>
    </footer>
  );
}
