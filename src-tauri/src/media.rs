use std::path::{Path, PathBuf};

use base64::{engine::general_purpose, Engine as _};
use id3::Tag;

use crate::models::CoverArt;

#[tauri::command]
pub fn read_cover_art(audio_path: String) -> Result<Option<CoverArt>, String> {
    let path = PathBuf::from(audio_path);

    if !path.exists() {
        return Err("音频文件不存在".to_string());
    }

    if !path.is_file() {
        return Err("音频路径不是文件".to_string());
    }

    if !has_extension(&path, "mp3") {
        return Err("只支持读取 MP3 封面".to_string());
    }

    let tag = match Tag::read_from_path(path) {
        Ok(tag) => tag,
        Err(_) => return Ok(None),
    };

    let Some(picture) = tag.pictures().next() else {
        return Ok(None);
    };

    Ok(Some(CoverArt {
        mime_type: picture.mime_type.clone(),
        data: general_purpose::STANDARD.encode(&picture.data),
    }))
}

fn has_extension(path: &Path, expected: &str) -> bool {
    path.extension()
        .map(|value| value.to_string_lossy().eq_ignore_ascii_case(expected))
        .unwrap_or(false)
}
