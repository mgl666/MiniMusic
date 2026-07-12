use std::{fs, path::{Path, PathBuf}, time::Duration};

use id3::{Tag, TagLike};

use crate::{
    lyrics::has_embedded_lyrics,
    models::{LyricSource, Playlist, Song},
};

const ALL_PLAYLIST_ID: &str = "all";
const UNCATEGORIZED_PLAYLIST_ID: &str = "uncategorized";

#[tauri::command]
pub fn scan_music_root(root_path: String) -> Result<Vec<Playlist>, String> {
    let root = PathBuf::from(root_path);

    if !root.exists() {
        return Err("音乐目录不存在".to_string());
    }

    if !root.is_dir() {
        return Err("不是有效目录".to_string());
    }

    let mut playlists = Vec::new();
    let mut all_songs = Vec::new();

    let uncategorized_songs = scan_songs_in_folder(&root, UNCATEGORIZED_PLAYLIST_ID)?;
    all_songs.extend(uncategorized_songs.iter().cloned());

    let mut folder_playlists = scan_child_playlists(&root)?;
    folder_playlists.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    for playlist in &folder_playlists {
        all_songs.extend(playlist.songs.iter().cloned());
    }

    playlists.push(Playlist {
        id: ALL_PLAYLIST_ID.to_string(),
        name: "全部歌曲".to_string(),
        folder_path: path_to_string(&root),
        songs: all_songs,
    });

    if !uncategorized_songs.is_empty() {
        playlists.push(Playlist {
            id: UNCATEGORIZED_PLAYLIST_ID.to_string(),
            name: "未分类".to_string(),
            folder_path: path_to_string(&root),
            songs: uncategorized_songs,
        });
    }

    playlists.extend(folder_playlists);
    Ok(playlists)
}

fn scan_child_playlists(root: &Path) -> Result<Vec<Playlist>, String> {
    let entries = fs::read_dir(root).map_err(|_| "音乐目录无法读取".to_string())?;
    let mut playlists = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|_| "音乐目录中存在无法读取的项目".to_string())?;
        let path = entry.path();

        if !path.is_dir() {
            continue;
        }

        let name = path
            .file_name()
            .map(|value| value.to_string_lossy().to_string())
            .unwrap_or_else(|| "未命名歌单".to_string());
        let id = path_to_string(&path);
        let songs = scan_songs_in_folder(&path, &id)?;

        playlists.push(Playlist {
            id,
            name,
            folder_path: path_to_string(&path),
            songs,
        });
    }

    Ok(playlists)
}

fn scan_songs_in_folder(folder: &Path, playlist_id: &str) -> Result<Vec<Song>, String> {
    let entries = fs::read_dir(folder).map_err(|_| format!("无法读取目录：{}", path_to_string(folder)))?;
    let mut songs = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|_| format!("目录中存在无法读取的项目：{}", path_to_string(folder)))?;
        let path = entry.path();

        if !path.is_file() || !has_extension(&path, "mp3") {
            continue;
        }

        let fallback_title = path
            .file_stem()
            .map(|value| value.to_string_lossy().to_string())
            .unwrap_or_else(|| "未知歌曲".to_string());
        let tag = Tag::read_from_path(&path).ok();
        let title = tag
            .as_ref()
            .and_then(|tag| clean_tag_value(tag.title()))
            .unwrap_or(fallback_title);
        let artist = tag.as_ref().and_then(|tag| clean_tag_value(tag.artist()));
        let album = tag.as_ref().and_then(|tag| clean_tag_value(tag.album()));
        let duration = read_mp3_duration(&path);
        let lyric_path = find_matching_lyric(&path);
        let file_path = path_to_string(&path);
        let lyric_source = match &lyric_path {
            Some(path) => Some(LyricSource::Sidecar {
                path: path_to_string(path),
            }),
            None if has_embedded_lyrics(&path) => Some(LyricSource::Embedded {
                audio_path: file_path.clone(),
            }),
            None => None,
        };

        songs.push(Song {
            id: file_path.clone(),
            title,
            artist,
            album,
            duration,
            file_path,
            lyric_path: lyric_path.map(|value| path_to_string(&value)),
            lyric_source,
            playlist_id: playlist_id.to_string(),
        });
    }

    songs.sort_by(|a, b| a.title.to_lowercase().cmp(&b.title.to_lowercase()));
    Ok(songs)
}

fn find_matching_lyric(audio_path: &Path) -> Option<PathBuf> {
    let direct = audio_path.with_extension("lrc");
    if direct.exists() && direct.is_file() {
        return Some(direct);
    }

    let folder = audio_path.parent()?;
    let stem = audio_path.file_stem()?.to_string_lossy();
    let entries = fs::read_dir(folder).ok()?;

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() || !has_extension(&path, "lrc") {
            continue;
        }

        let Some(candidate_stem) = path.file_stem() else {
            continue;
        };

        if candidate_stem.to_string_lossy() == stem {
            return Some(path);
        }
    }

    None
}

fn clean_tag_value(value: Option<&str>) -> Option<String> {
    value
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToString::to_string)
}

fn read_mp3_duration(path: &Path) -> Option<f64> {
    mp3_duration::from_path(path)
        .ok()
        .map(duration_to_seconds)
}

fn duration_to_seconds(duration: Duration) -> f64 {
    duration.as_secs_f64()
}

fn has_extension(path: &Path, expected: &str) -> bool {
    path.extension()
        .map(|value| value.to_string_lossy().eq_ignore_ascii_case(expected))
        .unwrap_or(false)
}

fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().to_string()
}
