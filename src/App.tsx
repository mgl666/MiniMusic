import { useEffect, useState } from 'react';
import { LyricPanel } from './components/LyricPanel';
import { NowPlayingPage } from './components/NowPlayingPage';
import { PlayerBar } from './components/PlayerBar';
import { Sidebar } from './components/Sidebar';
import { SongList } from './components/SongList';
import { TopBar } from './components/TopBar';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useMusicStore } from './stores/musicStore';
import { usePlayerStore } from './stores/playerStore';
import './styles/global.css';

function getResolvedTheme(theme: 'light' | 'dark' | 'system') {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function App() {
  const controls = useAudioPlayer();
  const loadInitialLibrary = useMusicStore((state) => state.loadInitialLibrary);
  const config = useMusicStore((state) => state.config);
  const error = useMusicStore((state) => state.error);
  const currentSong = usePlayerStore((state) => state.currentSong);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const setPlayMode = usePlayerStore((state) => state.setPlayMode);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState(() => getResolvedTheme(config.theme));

  useEffect(() => {
    void loadInitialLibrary();
  }, [loadInitialLibrary]);

  useEffect(() => {
    setVolume(config.volume);
    setPlayMode(config.playMode);
  }, [config.playMode, config.volume, setPlayMode, setVolume]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const applyTheme = () => setResolvedTheme(getResolvedTheme(config.theme));

    applyTheme();

    if (config.theme !== 'system') return;

    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [config.theme]);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    if (!currentSong) {
      setIsNowPlayingOpen(false);
    }
  }, [currentSong]);

  return (
    <div className="app-shell">
      <TopBar />
      {error && <div className="app-error">{error}</div>}
      <main className="app-main">
        {isNowPlayingOpen ? (
          <NowPlayingPage onClose={() => setIsNowPlayingOpen(false)} />
        ) : (
          <>
            <Sidebar />
            <div className="content-area">
              <SongList controls={controls} />
              <LyricPanel />
            </div>
          </>
        )}
      </main>
      <PlayerBar controls={controls} onOpenNowPlaying={() => currentSong && setIsNowPlayingOpen(true)} />
    </div>
  );
}

export default App;
