use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

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

// Reveal a path in Finder, selecting it.
#[tauri::command]
fn reveal_in_finder(path: String) -> Result<(), String> {
    std::process::Command::new("open")
        .arg("-R")
        .arg(&path)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

// Move a file or folder to the macOS Trash (recoverable — never a hard delete).
#[tauri::command]
fn move_to_trash(path: String) -> Result<(), String> {
    trash::delete(&path).map_err(|e| e.to_string())
}

// Rename an entry within its parent directory. Returns the new absolute path.
#[tauri::command]
fn rename_entry(path: String, new_name: String) -> Result<String, String> {
    let name = new_name.trim();
    if name.is_empty() || name.contains('/') {
        return Err("Invalid name.".into());
    }
    let p = Path::new(&path);
    let parent = p.parent().ok_or("No parent directory.")?;
    let new_path = parent.join(name);
    if new_path.exists() {
        return Err(format!("An item named \"{}\" already exists.", name));
    }
    fs::rename(p, &new_path).map_err(|e| e.to_string())?;
    Ok(new_path.to_string_lossy().into_owned())
}

// Recursively copy a file or directory.
fn copy_recursively(src: &Path, dst: &Path) -> std::io::Result<()> {
    if src.is_dir() {
        fs::create_dir_all(dst)?;
        for entry in fs::read_dir(src)? {
            let entry = entry?;
            let from = entry.path();
            let to = dst.join(entry.file_name());
            if from.is_dir() {
                copy_recursively(&from, &to)?;
            } else {
                fs::copy(&from, &to)?;
            }
        }
    } else {
        fs::copy(src, dst)?;
    }
    Ok(())
}

// Non-colliding path in `dir` for `file_name`: keep the name if free, else
// fall back to Finder-style "<name> copy" / "<name> copy N".
fn unique_destination(dir: &Path, file_name: &str) -> PathBuf {
    let direct = dir.join(file_name);
    if !direct.exists() {
        return direct;
    }
    let op = Path::new(file_name);
    let stem = op
        .file_stem()
        .map(|s| s.to_string_lossy().into_owned())
        .unwrap_or_default();
    let ext = op.extension().map(|e| e.to_string_lossy().into_owned());
    let make = |suffix: &str| -> PathBuf {
        let name = match &ext {
            Some(e) => format!("{}{}.{}", stem, suffix, e),
            None => format!("{}{}", stem, suffix),
        };
        dir.join(name)
    };
    let first = make(" copy");
    if !first.exists() {
        return first;
    }
    let mut n = 2;
    loop {
        let cand = make(&format!(" copy {}", n));
        if !cand.exists() {
            return cand;
        }
        n += 1;
    }
}

// Guard against copying/moving a folder into itself or one of its descendants.
fn is_into_self(src: &Path, dest_dir: &Path) -> bool {
    if !src.is_dir() {
        return false;
    }
    match (src.canonicalize(), dest_dir.canonicalize()) {
        (Ok(s), Ok(d)) => d == s || d.starts_with(&s),
        _ => false,
    }
}

// Duplicate an entry in place. Returns the new absolute path.
#[tauri::command]
fn duplicate_entry(path: String) -> Result<String, String> {
    let p = Path::new(&path);
    let parent = p.parent().ok_or("No parent directory.")?;
    let name = p
        .file_name()
        .ok_or("No file name.")?
        .to_string_lossy()
        .into_owned();
    let dest = unique_destination(parent, &name);
    copy_recursively(p, &dest).map_err(|e| e.to_string())?;
    Ok(dest.to_string_lossy().into_owned())
}

// Copy a file or folder into `dest_dir`. Never overwrites (unique name on
// collision). Returns the new absolute path.
#[tauri::command]
fn copy_entry(src: String, dest_dir: String) -> Result<String, String> {
    let s = Path::new(&src);
    let dir = Path::new(&dest_dir);
    if !dir.is_dir() {
        return Err("Destination is not a folder.".into());
    }
    if is_into_self(s, dir) {
        return Err("Can't copy a folder into itself.".into());
    }
    let name = s.file_name().ok_or("No file name.")?.to_string_lossy().into_owned();
    let dest = unique_destination(dir, &name);
    copy_recursively(s, &dest).map_err(|e| e.to_string())?;
    Ok(dest.to_string_lossy().into_owned())
}

// Move a file or folder into `dest_dir`. Falls back to copy+delete across
// volumes. Never overwrites. Returns the new absolute path.
#[tauri::command]
fn move_entry(src: String, dest_dir: String) -> Result<String, String> {
    let s = Path::new(&src);
    let dir = Path::new(&dest_dir);
    if !dir.is_dir() {
        return Err("Destination is not a folder.".into());
    }
    if let Some(parent) = s.parent() {
        if parent == dir {
            return Err("Already in this folder.".into());
        }
    }
    if is_into_self(s, dir) {
        return Err("Can't move a folder into itself.".into());
    }
    let name = s.file_name().ok_or("No file name.")?.to_string_lossy().into_owned();
    let dest = unique_destination(dir, &name);
    if fs::rename(s, &dest).is_err() {
        // cross-volume: copy then remove the source
        copy_recursively(s, &dest).map_err(|e| e.to_string())?;
        if s.is_dir() {
            fs::remove_dir_all(s).map_err(|e| e.to_string())?;
        } else {
            fs::remove_file(s).map_err(|e| e.to_string())?;
        }
    }
    Ok(dest.to_string_lossy().into_owned())
}

// Create a new folder inside `parent_dir`, suffixing on collision.
#[tauri::command]
fn create_folder(parent_dir: String, name: String) -> Result<String, String> {
    let base = name.trim();
    if base.is_empty() || base.contains('/') {
        return Err("Invalid folder name.".into());
    }
    let dir = Path::new(&parent_dir);
    let mut target = dir.join(base);
    if target.exists() {
        let mut n = 2;
        loop {
            let cand = dir.join(format!("{} {}", base, n));
            if !cand.exists() {
                target = cand;
                break;
            }
            n += 1;
        }
    }
    fs::create_dir(&target).map_err(|e| e.to_string())?;
    Ok(target.to_string_lossy().into_owned())
}

#[derive(Serialize)]
pub struct ItemInfo {
    name: String,
    path: String,
    is_dir: bool,
    size: u64,
    extension: String,
    item_count: Option<u32>,
    modified: Option<u64>,
    created: Option<u64>,
}

// Metadata for the "Get Info" panel.
#[tauri::command]
fn get_info(path: String) -> Result<ItemInfo, String> {
    let p = Path::new(&path);
    let meta = fs::metadata(p).map_err(|e| e.to_string())?;
    let name = p
        .file_name()
        .map(|s| s.to_string_lossy().into_owned())
        .unwrap_or_default();
    let extension = p
        .extension()
        .map(|e| e.to_string_lossy().into_owned())
        .unwrap_or_default();
    let to_secs = |t: std::io::Result<std::time::SystemTime>| -> Option<u64> {
        t.ok()
            .and_then(|st| st.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs())
    };
    let item_count = if meta.is_dir() {
        fs::read_dir(p)
            .map(|rd| {
                rd.filter(|e| {
                    e.as_ref()
                        .map(|e| !e.file_name().to_string_lossy().starts_with('.'))
                        .unwrap_or(false)
                })
                .count() as u32
            })
            .ok()
    } else {
        None
    };
    Ok(ItemInfo {
        name,
        path: path.clone(),
        is_dir: meta.is_dir(),
        size: if meta.is_file() { meta.len() } else { 0 },
        extension,
        item_count,
        modified: to_secs(meta.modified()),
        created: to_secs(meta.created()),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            read_dir,
            get_home_dir,
            quick_look,
            reveal_in_finder,
            move_to_trash,
            rename_entry,
            duplicate_entry,
            copy_entry,
            move_entry,
            create_folder,
            get_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
