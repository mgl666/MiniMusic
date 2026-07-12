use std::{fs, path::PathBuf};

use tauri::{AppHandle, Manager};

use crate::models::AppConfig;

const CONFIG_FILE_NAME: &str = "config.json";

#[tauri::command]
pub fn load_config(app: AppHandle) -> Result<AppConfig, String> {
    let path = config_path(&app)?;

    if !path.exists() {
        return Ok(AppConfig::default());
    }

    let content = fs::read_to_string(&path).map_err(|_| "配置读取失败".to_string())?;
    let mut config: AppConfig = serde_json::from_str(&content).map_err(|_| "配置格式不正确".to_string())?;
    normalize_config(&mut config);
    Ok(config)
}

#[tauri::command]
pub fn save_config(app: AppHandle, mut config: AppConfig) -> Result<(), String> {
    normalize_config(&mut config);
    let path = config_path(&app)?;

    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|_| "配置目录创建失败".to_string())?;
    }

    let content = serde_json::to_string_pretty(&config).map_err(|_| "配置序列化失败".to_string())?;
    fs::write(path, content).map_err(|_| "配置保存失败".to_string())
}

fn config_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|_| "无法获取应用配置目录".to_string())?;
    Ok(dir.join(CONFIG_FILE_NAME))
}

fn normalize_config(config: &mut AppConfig) {
    if config.volume.is_nan() || config.volume < 0.0 {
        config.volume = 0.0;
    }

    if config.volume > 1.0 {
        config.volume = 1.0;
    }

    if !matches!(
        config.play_mode.as_str(),
        "listLoop" | "singleLoop" | "shuffle"
    ) {
        config.play_mode = "listLoop".to_string();
    }

    if !matches!(config.theme.as_str(), "light" | "dark" | "system") {
        config.theme = "system".to_string();
    }
}
