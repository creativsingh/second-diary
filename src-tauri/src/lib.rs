use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct MarkdownEntry {
    pub id: String,
    pub date: String,
    pub hour: f64,
    pub title: String,
    pub content: String,
    pub tags: Vec<String>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct SearchResult {
    pub id: String,
    pub date: String,
    pub title: String,
    pub snippet: String,
    pub rank: f64,
}

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

fn parse_tags_yaml(yaml: &str) -> Vec<String> {
    let trimmed = yaml.trim();
    if !trimmed.starts_with('[') || !trimmed.ends_with(']') {
        return Vec::new();
    }
    let inner = &trimmed[1..trimmed.len() - 1];
    inner
        .split(',')
        .map(|t| t.trim().trim_matches('"').trim_matches('\'').to_string())
        .filter(|t| !t.is_empty())
        .collect()
}

fn parse_markdown_entry(raw_content: &str, fallback_id: &str) -> Option<MarkdownEntry> {
    let normalized = raw_content.replace("\r\n", "\n");
    if !normalized.starts_with("---") {
        return None;
    }

    let rest = &normalized[3..];
    let end_idx = rest.find("\n---\n")?;
    let frontmatter = &rest[..end_idx];
    let body_part = &rest[end_idx + 5..]; // Skip "\n---\n"

    let mut id = String::new();
    let mut date = String::new();
    let mut time_str = String::new();
    let mut title = String::new();
    let mut tags = Vec::new();
    let mut created_at = String::new();
    let mut updated_at = String::new();

    for line in frontmatter.lines() {
        let line = line.trim();
        if let Some(val) = line.strip_prefix("id:") {
            id = val.trim().trim_matches('"').trim_matches('\'').to_string();
        } else if let Some(val) = line.strip_prefix("date:") {
            date = val.trim().trim_matches('"').trim_matches('\'').to_string();
        } else if let Some(val) = line.strip_prefix("time:") {
            time_str = val.trim().trim_matches('"').trim_matches('\'').to_string();
        } else if let Some(val) = line.strip_prefix("title:") {
            title = val.trim().trim_matches('"').trim_matches('\'').replace("\\\"", "\"").to_string();
        } else if let Some(val) = line.strip_prefix("tags:") {
            tags = parse_tags_yaml(val);
        } else if let Some(val) = line.strip_prefix("createdAt:") {
            created_at = val.trim().trim_matches('"').trim_matches('\'').to_string();
        } else if let Some(val) = line.strip_prefix("updatedAt:") {
            updated_at = val.trim().trim_matches('"').trim_matches('\'').to_string();
        }
    }

    if id.is_empty() {
        id = fallback_id.to_string();
    }

    let hour = if !time_str.is_empty() && time_str.contains(':') {
        let parts: Vec<&str> = time_str.split(':').collect();
        let h = parts.first().and_then(|s| s.parse::<f64>().ok()).unwrap_or(12.0);
        let m = parts.get(1).and_then(|s| s.parse::<f64>().ok()).unwrap_or(0.0);
        h + (m / 60.0)
    } else {
        12.0
    };

    // Strip leading `# Title` header if present so editor content is pure body
    let mut content = body_part.trim().to_string();
    if content.starts_with("# ") {
        if let Some(newline_idx) = content.find('\n') {
            content = content[newline_idx + 1..].trim().to_string();
        } else {
            content = String::new();
        }
    }

    Some(MarkdownEntry {
        id,
        date,
        hour: (hour * 10.0).round() / 10.0,
        title,
        content,
        tags,
        created_at,
        updated_at,
    })
}

#[tauri::command]
fn read_all_markdown_entries(app: tauri::AppHandle) -> Result<Vec<MarkdownEntry>, String> {
    let dir = get_diary_folder(&app)?;
    let mut entries = Vec::new();

    if let Ok(dir_entries) = fs::read_dir(&dir) {
        for entry in dir_entries.flatten() {
            let path = entry.path();
            if path.is_file() && path.extension().map_or(false, |ext| ext == "md") {
                if let Ok(file_content) = fs::read_to_string(&path) {
                    let file_stem = path
                        .file_stem()
                        .map(|s| s.to_string_lossy().to_string())
                        .unwrap_or_default();
                    if let Some(parsed) = parse_markdown_entry(&file_content, &file_stem) {
                        entries.push(parsed);
                    }
                }
            }
        }
    }

    // Sort chronologically: newest date first, then highest hour first
    entries.sort_by(|a, b| {
        let date_cmp = b.date.cmp(&a.date);
        if date_cmp != std::cmp::Ordering::Equal {
            return date_cmp;
        }
        b.hour.partial_cmp(&a.hour).unwrap_or(std::cmp::Ordering::Equal)
    });

    Ok(entries)
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
fn search_markdown_entries(app: tauri::AppHandle, query: String) -> Result<Vec<SearchResult>, String> {
    let entries = read_all_markdown_entries(app)?;
    let q = query.trim().to_lowercase();
    if q.is_empty() {
        return Ok(Vec::new());
    }

    let tokens: Vec<&str> = q.split_whitespace().collect();
    let mut results = Vec::new();

    for entry in entries {
        let title_lower = entry.title.to_lowercase();
        let content_lower = entry.content.to_lowercase();
        let tags_joined = entry.tags.join(" ").to_lowercase();

        // Check if all search tokens match title, content, or tags
        let all_match = tokens.iter().all(|t| {
            title_lower.contains(t) || content_lower.contains(t) || tags_joined.contains(t)
        });

        if all_match {
            let mut score = 0.0;
            if title_lower.contains(&q) {
                score -= 10.0; // Higher rank (lower score value)
            }
            if content_lower.contains(&q) {
                score -= 5.0;
            }

            // Create snippet with <mark>...</mark>
            let snippet = if let Some(pos) = content_lower.find(&tokens[0]) {
                let start = if pos > 30 { pos - 30 } else { 0 };
                let end = (pos + tokens[0].len() + 60).min(entry.content.len());
                let snippet_raw = &entry.content[start..end];
                let prefix = if start > 0 { "..." } else { "" };
                let suffix = if end < entry.content.len() { "..." } else { "" };

                // Highlight token case-insensitively
                let highlighted = snippet_raw.replace(
                    &tokens[0],
                    &format!("<mark>{}</mark>", tokens[0]),
                );
                format!("{}{}{}", prefix, highlighted, suffix)
            } else if !entry.content.is_empty() {
                let take_len = entry.content.len().min(80);
                format!("{}...", &entry.content[..take_len])
            } else {
                format!("Matched in title: {}", entry.title)
            };

            results.push(SearchResult {
                id: entry.id,
                date: entry.date,
                title: entry.title,
                snippet,
                rank: score,
            });
        }
    }

    results.sort_by(|a, b| a.rank.partial_cmp(&b.rank).unwrap_or(std::cmp::Ordering::Equal));
    Ok(results)
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
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            read_all_markdown_entries,
            save_markdown_entry,
            delete_markdown_entry,
            search_markdown_entries,
            open_markdown_folder,
            reveal_markdown_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_markdown_entry() {
        let md = r#"---
id: "entry-123"
date: "2026-09-28"
time: "14:30"
title: "Afternoon Reflection"
tags: ["reflection", "tea"]
createdAt: "2026-09-28T09:00:00.000Z"
updatedAt: "2026-09-28T09:00:00.000Z"
---

# Afternoon Reflection

Writing with tea on the desk.
"#;
        let parsed = parse_markdown_entry(md, "fallback").expect("Failed to parse");
        assert_eq!(parsed.id, "entry-123");
        assert_eq!(parsed.date, "2026-09-28");
        assert_eq!(parsed.hour, 14.5);
        assert_eq!(parsed.title, "Afternoon Reflection");
        assert_eq!(parsed.tags, vec!["reflection", "tea"]);
        assert_eq!(parsed.content, "Writing with tea on the desk.");
    }
}

