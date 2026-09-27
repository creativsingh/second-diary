use std::fs;
use std::path::PathBuf;
use tauri::Manager;

fn sanitize_filename(title: &str) -> String {
    let clean: String = title
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == ' ' || c == '-' || c == '_' {
                c
            } else {
                '_'
            }
        })
        .collect();
    let trimmed = clean.trim();
    let truncated: String = trimmed.chars().take(50).collect();
    let final_clean = truncated.trim();
    if final_clean.is_empty() {
        "Untitled".to_string()
    } else {
        final_clean.to_string()
    }
}

fn get_diary_folder(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let docs = app
        .path()
        .document_dir()
        .map_err(|e| format!("Failed to resolve documents directory: {}", e))?;
    let diary_dir = docs.join("Second Diary");
    if !diary_dir.exists() {
        fs::create_dir_all(&diary_dir)
            .map_err(|e| format!("Failed to create Second Diary directory: {}", e))?;
    }
    Ok(diary_dir)
}

#[tauri::command]
fn save_markdown_entry(
    app: tauri::AppHandle,
    id: String,
    date: String,
    time_str: String,
    title: String,
    content: String,
    tags: Vec<String>,
    created_at: String,
    updated_at: String,
) -> Result<String, String> {
    let dir = get_diary_folder(&app)?;

    // Scan existing files in directory to remove any old file for this entry id (e.g. if title changed)
    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() && path.extension().map_or(false, |ext| ext == "md") {
                if let Ok(file_content) = fs::read_to_string(&path) {
                    if file_content.contains(&format!("id: \"{}\"", id))
                        || file_content.contains(&format!("id: {}", id))
                    {
                        let _ = fs::remove_file(&path);
                    }
                }
            }
        }
    }

    // Build filename: YYYY-MM-DD_HHMM_Title_shortid.md
    let clean_time = time_str.replace(':', "");
    let clean_title = sanitize_filename(&title);
    let short_id = if id.len() >= 8 { &id[..8] } else { &id };
    let filename = format!("{}_{}_{}_{}.md", date, clean_time, clean_title, short_id);
    let file_path = dir.join(filename);

    let tags_yaml = if tags.is_empty() {
        "[]".to_string()
    } else {
        format!(
            "[{}]",
            tags.iter()
                .map(|t| format!("\"{}\"", t))
                .collect::<Vec<_>>()
                .join(", ")
        )
    };

    let title_display = if title.trim().is_empty() {
        "Untitled Entry"
    } else {
        title.trim()
    };

    let md_text = format!(
        r#"---
id: "{}"
date: "{}"
time: "{}"
title: "{}"
tags: {}
createdAt: "{}"
updatedAt: "{}"
---

# {}

{}
"#,
        id,
        date,
        time_str,
        title.replace('"', "\\\""),
        tags_yaml,
        created_at,
        updated_at,
        title_display,
        content
    );

    fs::write(&file_path, md_text)
        .map_err(|e| format!("Failed to write markdown file: {}", e))?;

    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn delete_markdown_entry(app: tauri::AppHandle, id: String) -> Result<bool, String> {
    let dir = get_diary_folder(&app)?;
    let mut deleted = false;
    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() && path.extension().map_or(false, |ext| ext == "md") {
                if let Ok(file_content) = fs::read_to_string(&path) {
                    if file_content.contains(&format!("id: \"{}\"", id))
                        || file_content.contains(&format!("id: {}", id))
                    {
                        let _ = fs::remove_file(&path);
                        deleted = true;
                    }
                }
            }
        }
    }
    Ok(deleted)
}

#[tauri::command]
fn open_markdown_folder(app: tauri::AppHandle) -> Result<String, String> {
    let dir = get_diary_folder(&app)?;
    let path_str = dir.to_string_lossy().to_string();
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open").arg(&path_str).spawn();
    }
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("explorer")
            .arg(&path_str)
            .spawn();
    }
    #[cfg(target_os = "linux")]
    {
        let _ = std::process::Command::new("xdg-open")
            .arg(&path_str)
            .spawn();
    }
    Ok(path_str)
}

#[tauri::command]
fn reveal_markdown_file(app: tauri::AppHandle, id: String) -> Result<String, String> {
    let dir = get_diary_folder(&app)?;
    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() && path.extension().map_or(false, |ext| ext == "md") {
                if let Ok(file_content) = fs::read_to_string(&path) {
                    if file_content.contains(&format!("id: \"{}\"", id))
                        || file_content.contains(&format!("id: {}", id))
                    {
                        let path_str = path.to_string_lossy().to_string();
                        #[cfg(target_os = "macos")]
                        {
                            let _ = std::process::Command::new("open")
                                .arg("-R")
                                .arg(&path_str)
                                .spawn();
                        }
                        #[cfg(target_os = "windows")]
                        {
                            let _ = std::process::Command::new("explorer")
                                .arg(format!("/select,{}", path_str))
                                .spawn();
                        }
                        #[cfg(target_os = "linux")]
                        {
                            let _ = std::process::Command::new("xdg-open")
                                .arg(dir.to_string_lossy().to_string())
                                .spawn();
                        }
                        return Ok(path_str);
                    }
                }
            }
        }
    }
    open_markdown_folder(app)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            save_markdown_entry,
            delete_markdown_entry,
            open_markdown_folder,
            reveal_markdown_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
