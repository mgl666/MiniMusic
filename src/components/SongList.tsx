import type { AudioControls } from '../hooks/useAudioPlayer';
import { useMusicStore } from '../stores/musicStore';
import { usePlayerStore } from '../stores/playerStore';
import { formatTime } from '../utils/format';

interface SongListProps {
  controls: AudioControls;
}

function formatDuration(duration?: number) {
  return Number.isFinite(duration) && duration && duration > 0 ? formatTime(duration) : '--:--';
}

export function SongList({ controls }: SongListProps) {
  const playlists = useMusicStore((state) => state.playlists);
  const selectedPlaylistId = useMusicStore((state) => state.selectedPlaylistId);
  const isScanning = useMusicStore((state) => state.isScanning);
  const currentSong = usePlayerStore((state) => state.currentSong);
  const selectedPlaylist = playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? playlists[0];

  if (isScanning) {
    return <div className="empty-state">正在扫描音乐目录…</div>;
  }

  if (!selectedPlaylist) {
    return <div className="empty-state">请选择音乐目录开始使用 MiniMusic</div>;
  }

  if (!selectedPlaylist.songs.length) {
    return <div className="empty-state">这个歌单还没有 MP3 文件</div>;
  }

  return (
    <section className="song-list-panel">
      <div className="panel-header">
        <div>
          <h2>{selectedPlaylist.name}</h2>
          <p>{selectedPlaylist.songs.length} 首歌曲</p>
        </div>
      </div>
      <div className="song-list">
        <div className="song-list-head">
          <span>#</span>
          <span>歌曲</span>
          <span>歌手</span>
          <span>时长</span>
        </div>
        {selectedPlaylist.songs.map((song, index) => (
          <button
            className={`song-row ${currentSong?.id === song.id ? 'active' : ''}`}
            key={song.id}
            type="button"
            onClick={() => controls.playSong(song, selectedPlaylist.id)}
          >
            <span className="song-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="song-title">{song.title}</span>
            <span className="song-artist">{song.artist || '未知歌手'}</span>
            <span className="song-meta">{formatDuration(song.duration)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
