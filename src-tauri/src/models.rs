use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum LyricSource {
    Sidecar { path: String },
    Embedded { #[serde(rename = "audioPath")] audio_path: String },
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CoverArt {
    pub mime_type: String,
    pub data: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Song {
    pub id: String,
    pub title: String,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub duration: Option<f64>,
    pub file_path: String,
    pub lyric_path: Option<String>,
    pub lyric_source: Option<LyricSource>,
    pub playlist_id: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Playlist {
    pub id: String,
    pub name: String,
    pub folder_path: String,
    pub songs: Vec<Song>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub music_root_path: Option<String>,
    pub last_playlist_id: Option<String>,
    pub last_song_id: Option<String>,
    pub volume: f64,
    pub play_mode: String,
    pub theme: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            music_root_path: None,
            last_playlist_id: None,
            last_song_id: None,
            volume: 0.8,
            play_mode: "listLoop".to_string(),
            theme: "system".to_string(),
        }
    }
}
