mod config;
mod lyrics;
mod media;
mod models;
mod scanner;

use tauri::{Manager, RunEvent, WindowEvent};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind, MessageDialogResult};

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let window = window.clone();
                let app = window.app_handle().clone();

                app.dialog()
                    .message("你想把 MiniMusic 最小化到 Dock，还是直接退出应用？")
                    .title("关闭 MiniMusic")
                    .kind(MessageDialogKind::Info)
                    .buttons(MessageDialogButtons::OkCancelCustom(
                        "最小化到 Dock".to_string(),
                        "退出应用".to_string(),
                    ))
                    .parent(&window)
                    .show_with_result(move |result| match result {
                        MessageDialogResult::Custom(action) if action == "退出应用" => app.exit(0),
                        _ => {
                            let _ = window.hide();
                        }
                    });
            }
        })
        .invoke_handler(tauri::generate_handler![
            scanner::scan_music_root,
            lyrics::read_lyric,
            media::read_cover_art,
            config::load_config,
            config::save_config
        ])
        .build(tauri::generate_context!())
        .expect("error while building MiniMusic")
        .run(|app, event| {
            #[cfg(target_os = "macos")]
            if let RunEvent::Reopen { .. } = event {
                show_main_window(app);
            }
        });
}
