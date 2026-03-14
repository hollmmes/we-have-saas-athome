use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConvertedImage {
    id: String,
    original_name: String,
    converted_name: String,
    original_format: String,
    converted_format: String,
    file_size: u64,
    output_path: String,
    created_at: String,
}

#[tauri::command]
async fn convert_image(
    file_path: String,
    output_format: String,
    output_dir: Option<String>,
    app_handle: tauri::AppHandle,
) -> Result<ConvertedImage, String> {
    use image::ImageFormat;
    use std::fs;
    use uuid::Uuid;
    
    // Dosyayı aç
    let img = image::open(&file_path).map_err(|e| format!("Resim açılamadı: {}", e))?;
    
    // Output klasörünü belirle
    let output_path_base = if let Some(custom_dir) = output_dir {
        PathBuf::from(custom_dir)
    } else {
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("App data dizini alınamadı: {}", e))?;
        app_data_dir.join("converted_images")
    };
    
    fs::create_dir_all(&output_path_base).map_err(|e| format!("Klasör oluşturulamadı: {}", e))?;
    
    // Dosya bilgilerini al
    let original_path = PathBuf::from(&file_path);
    let original_name = original_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();
    
    let original_format = original_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("unknown")
        .to_uppercase();
    
    // Yeni dosya adı oluştur
    let id = Uuid::new_v4().to_string();
    let file_stem = original_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("converted");
    let converted_name = format!("{}_{}.{}", file_stem, &id[..8], output_format.to_lowercase());
    let output_path = output_path_base.join(&converted_name);
    
    // Format belirle
    let format = match output_format.to_lowercase().as_str() {
        "png" => ImageFormat::Png,
        "jpg" | "jpeg" => ImageFormat::Jpeg,
        "webp" => ImageFormat::WebP,
        "gif" => ImageFormat::Gif,
        "bmp" => ImageFormat::Bmp,
        "ico" => ImageFormat::Ico,
        "tiff" | "tif" => ImageFormat::Tiff,
        _ => return Err(format!("Desteklenmeyen format: {}", output_format)),
    };
    
    // Resmi kaydet
    img.save_with_format(&output_path, format)
        .map_err(|e| format!("Resim kaydedilemedi: {}", e))?;
    
    // Dosya boyutunu al
    let file_size = fs::metadata(&output_path)
        .map(|m| m.len())
        .unwrap_or(0);
    
    // Timestamp oluştur
    let created_at = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    
    Ok(ConvertedImage {
        id,
        original_name,
        converted_name,
        original_format,
        converted_format: output_format.to_uppercase(),
        file_size,
        output_path: output_path.display().to_string(),
        created_at,
    })
}

#[tauri::command]
async fn delete_converted_image(
    _id: String,
    file_path: String,
) -> Result<(), String> {
    use std::fs;
    
    // Dosyayı sil
    let path = PathBuf::from(&file_path);
    if path.exists() {
        fs::remove_file(&path)
            .map_err(|e| format!("Dosya silinemedi: {}", e))?;
    }
    
    Ok(())
}

#[tauri::command]
async fn open_file_location(file_path: String) -> Result<(), String> {
    use std::process::Command;
    
    let path = PathBuf::from(&file_path);
    
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg("/select,")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Klasör açılamadı: {}", e))?;
    }
    
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("-R")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Klasör açılamadı: {}", e))?;
    }
    
    #[cfg(target_os = "linux")]
    {
        let parent = path.parent().ok_or("Klasör bulunamadı")?;
        Command::new("xdg-open")
            .arg(parent)
            .spawn()
            .map_err(|e| format!("Klasör açılamadı: {}", e))?;
    }
    
    Ok(())
}

#[tauri::command]
async fn get_default_output_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("App data dizini alınamadı: {}", e))?;
    
    let output_dir = app_data_dir.join("converted_images");
    Ok(output_dir.display().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            convert_image,
            delete_converted_image,
            open_file_location,
            get_default_output_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

