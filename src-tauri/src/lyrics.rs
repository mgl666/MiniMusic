use std::{fs, path::{Path, PathBuf}};

use id3::{Content, Tag};

use crate::models::LyricSource;

const MAX_LYRIC_BYTES: u64 = 2 * 1024 * 1024;

#[tauri::command]
pub fn read_lyric(source: LyricSource) -> Result<String, String> {
    match source {
        LyricSource::Sidecar { path } => read_sidecar_lyric(PathBuf::from(path)),
        LyricSource::Embedded { audio_path } => read_embedded_lyric(PathBuf::from(audio_path)),
    }
}

pub(crate) fn has_embedded_lyrics(audio_path: &Path) -> bool {
    read_embedded_lyric(audio_path.to_path_buf())
        .map(|content| !content.trim().is_empty())
        .unwrap_or(false)
}

fn read_sidecar_lyric(path: PathBuf) -> Result<String, String> {
    if !path.exists() {
        return Err("歌词文件不存在".to_string());
    }

    if !path.is_file() {
        return Err("歌词路径不是文件".to_string());
    }

    let is_lrc = path
        .extension()
        .map(|value| value.to_string_lossy().eq_ignore_ascii_case("lrc"))
        .unwrap_or(false);

    if !is_lrc {
        return Err("只支持读取 .lrc 歌词文件".to_string());
    }

    let metadata = fs::metadata(&path).map_err(|_| "歌词文件无法读取".to_string())?;
    if metadata.len() > MAX_LYRIC_BYTES {
        return Err("歌词文件过大".to_string());
    }

    fs::read_to_string(path).map_err(|_| "歌词读取失败".to_string())
}

fn read_embedded_lyric(path: PathBuf) -> Result<String, String> {
    if !path.exists() {
        return Err("音频文件不存在".to_string());
    }

    if !path.is_file() {
        return Err("音频路径不是文件".to_string());
    }

    let is_mp3 = path
        .extension()
        .map(|value| value.to_string_lossy().eq_ignore_ascii_case("mp3"))
        .unwrap_or(false);

    if !is_mp3 {
        return Err("只支持读取 MP3 内嵌歌词".to_string());
    }

    let tag = Tag::read_from_path(path).map_err(|_| "未找到内嵌歌词".to_string())?;
    let lyrics = best_embedded_lyrics(&tag).ok_or_else(|| "未找到内嵌歌词".to_string())?;

    if lyrics.trim().is_empty() {
        return Err("内嵌歌词为空".to_string());
    }

    Ok(lyrics)
}

fn best_embedded_lyrics(tag: &Tag) -> Option<String> {
    let mut fallback = None;
    let preferred_languages = ["chi", "zho", "cmn", "chs", "cht", "und", "eng"];

    for frame in tag.frames() {
        let Content::Lyrics(lyrics) = frame.content() else {
            continue;
        };

        let text = lyrics.text.trim();
        if text.is_empty() {
            continue;
        }

        if preferred_languages
            .iter()
            .any(|language| lyrics.lang.eq_ignore_ascii_case(language))
        {
            return Some(text.to_string());
        }

        if fallback.is_none() {
            fallback = Some(text.to_string());
        }
    }

    fallback
}
