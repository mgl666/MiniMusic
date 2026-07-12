import { useMusicStore } from '../stores/musicStore';

export function Sidebar() {
  const playlists = useMusicStore((state) => state.playlists);
  const selectedPlaylistId = useMusicStore((state) => state.selectedPlaylistId);
  const selectPlaylist = useMusicStore((state) => state.selectPlaylist);

  return (
    <aside className="sidebar">
      <div className="section-title">歌单</div>
      <div className="playlist-list">
        {playlists.map((playlist) => (
          <button
            className={`playlist-item ${playlist.id === selectedPlaylistId ? 'active' : ''}`}
            key={playlist.id}
            type="button"
            onClick={() => selectPlaylist(playlist.id)}
          >
            <span>{playlist.name}</span>
            <em>{playlist.songs.length}</em>
          </button>
        ))}
      </div>
    </aside>
  );
}
