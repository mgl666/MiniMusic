import { useEffect, useMemo, useRef, useState } from 'react';
import { readLyric } from '../api/tauri';
import { usePlayerStore } from '../stores/playerStore';
import type { LyricLine } from '../types/music';
import { getActiveLyricIndex, parseLrc, parsePlainLyric } from '../utils/lyric';

type LyricMode = 'synced' | 'plain';

export function LyricPanel({ compact = false }: { compact?: boolean }) {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const currentTime = usePlayerStore((state) => state.currentTime);
  const [lines, setLines] = useState<LyricLine[]>([]);
  const [plainLines, setPlainLines] = useState<string[]>([]);
  const [mode, setMode] = useState<LyricMode>('synced');
  const [status, setStatus] = useState('暂无歌词');
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const lyricsRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number>();
  const autoScrollTimerRef = useRef<number>();
  const userScrollTimerRef = useRef<number>();

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentLyric() {
      setLines([]);
      setPlainLines([]);
      setMode('synced');

      if (!currentSong) {
        setStatus('选择一首歌曲后显示歌词');
        return;
      }

      if (!currentSong.lyricSource) {
        setStatus('暂无歌词');
        return;
      }

      setStatus(currentSong.lyricSource.kind === 'embedded' ? '内嵌歌词加载中…' : '歌词加载中…');

      try {
        const content = await readLyric(currentSong.lyricSource);
        if (cancelled) return;

        const parsed = parseLrc(content);
        if (parsed.length) {
          setLines(parsed);
          setPlainLines([]);
          setMode('synced');
          setStatus('');
          return;
        }

        const plain = parsePlainLyric(content);
        setLines([]);
        setPlainLines(plain);
        setMode('plain');
        setStatus(plain.length ? '' : '歌词为空');
      } catch {
        if (!cancelled) {
          setStatus('歌词加载失败');
        }
      }
    }

    void loadCurrentLyric();

    return () => {
      cancelled = true;
    };
  }, [currentSong]);

  const activeIndex = useMemo(() => getActiveLyricIndex(lines, currentTime), [currentTime, lines]);

  useEffect(() => {
    if (mode !== 'synced' || activeIndex < 0) return;

    const container = lyricsRef.current;
    const line = activeLineRef.current;
    if (!container || !line) return;

    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      const targetTop = line.offsetTop - container.clientHeight / 2 + line.clientHeight / 2;
      if (Math.abs(container.scrollTop - targetTop) < 12) {
        return;
      }

      setIsAutoScrolling(true);
      if (autoScrollTimerRef.current) {
        window.clearTimeout(autoScrollTimerRef.current);
      }

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      container.scrollTo({
        top: Math.max(0, targetTop),
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });

      autoScrollTimerRef.current = window.setTimeout(() => setIsAutoScrolling(false), prefersReducedMotion ? 120 : 900);
    });

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [activeIndex, mode]);

  useEffect(() => () => {
    if (autoScrollTimerRef.current) {
      window.clearTimeout(autoScrollTimerRef.current);
    }
    if (userScrollTimerRef.current) {
      window.clearTimeout(userScrollTimerRef.current);
    }
  }, []);

  const showUserScrollbar = () => {
    setIsUserScrolling(true);
    if (userScrollTimerRef.current) {
      window.clearTimeout(userScrollTimerRef.current);
    }
    userScrollTimerRef.current = window.setTimeout(() => setIsUserScrolling(false), 1200);
  };

  return (
    <section className={`lyric-panel ${compact ? 'compact-panel' : ''}`}>
      <div className="panel-header">
        <div>
          <h2>歌词</h2>
          <p>{currentSong?.title ?? '未播放'}</p>
        </div>
      </div>
      <div
        className={`lyrics ${isAutoScrolling ? 'auto-scrolling' : ''} ${isUserScrolling ? 'user-scrolling' : ''}`}
        ref={lyricsRef}
        onPointerDown={showUserScrollbar}
        onTouchStart={showUserScrollbar}
        onWheel={showUserScrollbar}
      >
        {status ? (
          <div className="empty-state compact">{status}</div>
        ) : mode === 'plain' ? (
          plainLines.map((line, index) => (
            <div className="lyric-line plain" key={`${line}-${index}`}>
              {line}
            </div>
          ))
        ) : (
          lines.map((line, index) => (
            <div
              className={`lyric-line ${index === activeIndex ? 'active' : ''}`}
              key={`${line.time}-${line.text}-${index}`}
              ref={index === activeIndex ? activeLineRef : undefined}
            >
              <span>{line.text}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
