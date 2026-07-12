import { LyricPanel } from './LyricPanel';
import { useMusicStore } from '../stores/musicStore';
import { usePlayerStore } from '../stores/playerStore';

interface NowPlayingPageProps {
  onClose: () => void;
}

export function NowPlayingPage({ onClose }: NowPlayingPageProps) {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const currentCoverUrl = usePlayerStore((state) => state.currentCoverUrl);
  const currentCoverSongId = usePlayerStore((state) => state.currentCoverSongId);
  const playlists = useMusicStore((state) => state.playlists);
  const coverUrl = currentCoverSongId === currentSong?.id ? currentCoverUrl : undefined;
  const sourcePlaylist = playlists.find((playlist) => playlist.id === currentSong?.playlistId);
  const sourceName = sourcePlaylist?.name ?? (currentSong ? '本地音乐' : '未选择');

  return (
    <section className="now-playing-page">
      {coverUrl && <div className="now-playing-bg" style={{ backgroundImage: `url(${coverUrl})` }} />}
      <div className="now-playing-page-header">
        <button className="detail-close" type="button" onClick={onClose}>返回歌单</button>
      </div>
      <div className="now-playing-detail">
        <div className="record-wrap">
          <div className="tonearm" />
          <div className="record-disc">
            <div className="record-cover">
              {coverUrl ? <img src={coverUrl} alt="专辑封面" /> : <span>♪</span>}
            </div>
          </div>
        </div>
        <div className="detail-side">
          <div className="detail-meta">
            <h2>{currentSong?.title ?? '未选择歌曲'}</h2>
            <p>
              <span>歌手：{currentSong?.artist || '未知歌手'}</span>
              <span>专辑：{currentSong?.album || '未知专辑'}</span>
              <span>来源：{sourceName}</span>
            </p>
          </div>
          <LyricPanel compact />
        </div>
      </div>
    </section>
  );
}
