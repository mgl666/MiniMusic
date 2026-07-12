import { useEffect, useRef, useState } from 'react';
import { selectMusicRoot } from '../api/tauri';
import { useMusicStore } from '../stores/musicStore';
import type { AppTheme } from '../types/music';
import { folderNameFromPath } from '../utils/format';

const themeOptions: Array<{ value: AppTheme; label: string; icon: string }> = [
  { value: 'light', label: '白天模式', icon: '☀' },
  { value: 'dark', label: '夜间模式', icon: '☾' },
  { value: 'system', label: '随系统模式', icon: '◐' },
];

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19.4 13.5a7.9 7.9 0 0 0 .1-1.5 7.9 7.9 0 0 0-.1-1.5l2-1.5-2-3.5-2.4 1a8 8 0 0 0-2.6-1.5L14 2h-4l-.4 2.5A8 8 0 0 0 7 6L4.6 5l-2 3.5 2 1.5a7.9 7.9 0 0 0-.1 1.5 7.9 7.9 0 0 0 .1 1.5l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 2.6 1.5L10 22h4l.4-2.5A8 8 0 0 0 17 18l2.4 1 2-3.5zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5z" />
    </svg>
  );
}

export function TopBar() {
  const musicRootPath = useMusicStore((state) => state.musicRootPath);
  const isScanning = useMusicStore((state) => state.isScanning);
  const scanRoot = useMusicStore((state) => state.scanRoot);
  const config = useMusicStore((state) => state.config);
  const updateConfig = useMusicStore((state) => state.updateConfig);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!settingsRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setIsThemeMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setIsThemeMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const handleSelectFolder = async () => {
    const selected = await selectMusicRoot();
    if (selected) {
      await scanRoot(selected);
    }
    setIsMenuOpen(false);
    setIsThemeMenuOpen(false);
  };

  const setTheme = async (theme: AppTheme) => {
    await updateConfig({ theme });
    setIsMenuOpen(false);
    setIsThemeMenuOpen(false);
  };

  const currentTheme = themeOptions.find((option) => option.value === config.theme)?.label ?? '随系统模式';

  return (
    <header className="top-bar">
      <div>
        <h1>MiniMusic</h1>
        <p>本地音乐库：{folderNameFromPath(musicRootPath)}</p>
      </div>
      <div className="top-actions">
        <div className="settings-wrap" ref={settingsRef}>
          <button
            className="settings-button"
            type="button"
            aria-label="设置"
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            title="设置"
            onClick={() => {
              setIsMenuOpen((open) => !open);
              setIsThemeMenuOpen(false);
            }}
          >
            <SettingsIcon />
          </button>
          {isMenuOpen && (
            <div className="settings-menu" role="menu">
              <div className="settings-submenu-wrap">
                <button
                  className="settings-menu-item"
                  type="button"
                  role="menuitem"
                  aria-haspopup="menu"
                  aria-expanded={isThemeMenuOpen}
                  onClick={() => setIsThemeMenuOpen((open) => !open)}
                  onMouseEnter={() => setIsThemeMenuOpen(true)}
                >
                  <span>主题</span>
                  <em>{currentTheme} ›</em>
                </button>
                {isThemeMenuOpen && (
                  <div className="settings-submenu" role="menu">
                    {themeOptions.map((option) => (
                      <button
                        className={`settings-menu-item ${config.theme === option.value ? 'active' : ''}`}
                        key={option.value}
                        type="button"
                        role="menuitemradio"
                        aria-checked={config.theme === option.value}
                        onClick={() => void setTheme(option.value)}
                      >
                        <span>{option.label}</span>
                        <em>{config.theme === option.value ? '✓' : option.icon}</em>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="settings-menu-divider" />
              <button className="settings-menu-item" type="button" role="menuitem" onClick={() => void handleSelectFolder()} disabled={isScanning}>
                <span>{isScanning ? '扫描中…' : '选择音乐目录'}</span>
                <em>⌘</em>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
