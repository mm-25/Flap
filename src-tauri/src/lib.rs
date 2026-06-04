use serde::Serialize;
use std::fs;

#[derive(Serialize)]
pub struct FileEntry {
    name: String,
    path: String,
    is_dir: bool,
    size: u64,
    extension: String,
}

#[tauri::command]
fn read_dir(path: String) -> Result<Vec<FileEntry>, String> {
    let entries = fs::read_dir(&path).map_err(|e| e.to_string())?;
    let mut result: Vec<FileEntry> = entries
        .filter_map(|e| e.ok())
        .filter_map(|entry| {
            let name = entry.file_name().to_string_lossy().to_string();
            // skip hidden files
            if name.starts_with('.') {
                return None;
            }
            let meta = entry.metadata().ok()?;
            let path = entry.path().to_string_lossy().to_string();
            let extension = entry
                .path()
                .extension()
                .map(|e| e.to_string_lossy().to_string())
                .unwrap_or_default();
            Some(FileEntry {
                name,
                path,
                is_dir: meta.is_dir(),
                size: if meta.is_file() { meta.len() } else { 0 },
                extension,
            })
        })
        .collect();

    // folders first, then alphabetical
    result.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    // cap at 200 entries per directory
    result.truncate(200);
    Ok(result)
}

#[tauri::command]
fn get_home_dir() -> String {
    std::env::var("HOME").unwrap_or_else(|_| "/".to_string())
}

// macOS Quick Look: spawn the native preview panel for a path (spacebar preview).
#[tauri::command]
fn quick_look(path: String) -> Result<(), String> {
    std::process::Command::new("qlmanage")
        .arg("-p")
        .arg(&path)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![read_dir, get_home_dir, quick_look])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
