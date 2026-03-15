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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConvertedVideo {
    id: String,
    original_name: String,
    converted_name: String,
    file_size: u64,
    output_path: String,
    duration: String,
    created_at: String,
}

#[tauri::command]
async fn convert_image(
    file_path: String,
    output_format: String,
    output_dir: Option<String>,
    quality: Option<u8>,
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
    
    // Format belirle ve kaydet
    let quality_value = quality.unwrap_or(85);
    
    match output_format.to_lowercase().as_str() {
        "png" => {
            // PNG için compression level ayarla
            use image::codecs::png::{PngEncoder, CompressionType, FilterType};
            
            let file = fs::File::create(&output_path)
                .map_err(|e| format!("Dosya oluşturulamadı: {}", e))?;
            
            // Quality düşükse daha fazla sıkıştır
            let compression = if quality_value < 50 {
                CompressionType::Best
            } else if quality_value < 80 {
                CompressionType::Default
            } else {
                CompressionType::Fast
            };
            
            let encoder = PngEncoder::new_with_quality(
                file,
                compression,
                FilterType::Adaptive
            );
            
            img.write_with_encoder(encoder)
                .map_err(|e| format!("PNG kaydedilemedi: {}", e))?;
        },
        "jpg" | "jpeg" => {
            // JPEG için optimize edilmiş encoder
            use image::codecs::jpeg::JpegEncoder;
            
            let file = fs::File::create(&output_path)
                .map_err(|e| format!("Dosya oluşturulamadı: {}", e))?;
            
            let mut encoder = JpegEncoder::new_with_quality(file, quality_value);
            
            // RGB formatına çevir ve encode et
            let rgb_img = img.to_rgb8();
            encoder.encode(
                rgb_img.as_raw(),
                rgb_img.width(),
                rgb_img.height(),
                image::ExtendedColorType::Rgb8
            ).map_err(|e| format!("JPEG kaydedilemedi: {}", e))?;
        },
        "webp" => {
            // WebP için optimize edilmiş encoder kullan
            use webp::Encoder;
            
            // RGB formatına çevir
            let rgb_img = img.to_rgb8();
            let (width, height) = rgb_img.dimensions();
            
            // WebP encoder oluştur
            let encoder = Encoder::from_rgb(&rgb_img, width, height);
            
            // Quality'ye göre encode et (0-100)
            let webp_data = if quality_value >= 100 {
                encoder.encode_lossless()
            } else {
                encoder.encode(quality_value as f32)
            };
            
            // Dosyaya yaz
            fs::write(&output_path, &*webp_data)
                .map_err(|e| format!("WebP kaydedilemedi: {}", e))?;
        },
        "gif" => {
            img.save_with_format(&output_path, ImageFormat::Gif)
                .map_err(|e| format!("GIF kaydedilemedi: {}", e))?;
        },
        "bmp" => {
            img.save_with_format(&output_path, ImageFormat::Bmp)
                .map_err(|e| format!("BMP kaydedilemedi: {}", e))?;
        },
        "ico" => {
            img.save_with_format(&output_path, ImageFormat::Ico)
                .map_err(|e| format!("ICO kaydedilemedi: {}", e))?;
        },
        "tiff" | "tif" => {
            img.save_with_format(&output_path, ImageFormat::Tiff)
                .map_err(|e| format!("TIFF kaydedilemedi: {}", e))?;
        },
        _ => return Err(format!("Desteklenmeyen format: {}", output_format)),
    };
    
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

#[tauri::command]
async fn get_image_data_url(file_path: String) -> Result<String, String> {
    use std::fs;
    
    // Dosyayı oku
    let path = PathBuf::from(&file_path);
    let bytes = fs::read(&path)
        .map_err(|e| format!("Dosya okunamadı: {}", e))?;
    
    // MIME type belirle
    let mime_type = match path.extension().and_then(|e| e.to_str()) {
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("webp") => "image/webp",
        Some("gif") => "image/gif",
        Some("bmp") => "image/bmp",
        Some("ico") => "image/x-icon",
        Some("tiff") | Some("tif") => "image/tiff",
        _ => "image/png",
    };
    
    // Base64 encode
    let base64_data = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &bytes);
    
    Ok(format!("data:{};base64,{}", mime_type, base64_data))
}

#[tauri::command]
async fn optimize_video(
    file_path: String,
    output_dir: Option<String>,
    quality: Option<String>,
    app_handle: tauri::AppHandle,
) -> Result<ConvertedVideo, String> {
    use std::fs;
    use std::process::Command;
    use uuid::Uuid;
    
    // FFmpeg path'ini al (bundle'dan veya dev'den)
    let ffmpeg_path = if cfg!(debug_assertions) {
        // Dev mode: src-tauri/ffmpeg/ffmpeg.exe kullan
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        let ffmpeg = std::path::PathBuf::from(manifest_dir)
            .join("ffmpeg")
            .join("ffmpeg.exe");
        ffmpeg.to_str().unwrap().to_string()
    } else {
        // Production: bundle'dan al
        app_handle
            .path()
            .resolve("ffmpeg.exe", tauri::path::BaseDirectory::Resource)
            .ok()
            .and_then(|p| p.to_str().map(|s| s.to_string()))
            .unwrap_or_else(|| "ffmpeg".to_string())
    };
    
    let ffprobe_path = if cfg!(debug_assertions) {
        // Dev mode: src-tauri/ffmpeg/ffprobe.exe kullan
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        let ffprobe = std::path::PathBuf::from(manifest_dir)
            .join("ffmpeg")
            .join("ffprobe.exe");
        ffprobe.to_str().unwrap().to_string()
    } else {
        // Production: bundle'dan al
        app_handle
            .path()
            .resolve("ffprobe.exe", tauri::path::BaseDirectory::Resource)
            .ok()
            .and_then(|p| p.to_str().map(|s| s.to_string()))
            .unwrap_or_else(|| "ffprobe".to_string())
    };
    
    println!("FFmpeg path: {}", ffmpeg_path);
    println!("FFprobe path: {}", ffprobe_path);
    println!("FFmpeg exists: {}", std::path::Path::new(&ffmpeg_path).exists());
    
    // Path'in var olup olmadığını kontrol et
    if !std::path::Path::new(&ffmpeg_path).exists() {
        return Err(format!("FFmpeg bulunamadı: {}. Lütfen src-tauri/ffmpeg/ klasörüne ffmpeg.exe dosyasını ekleyin.", ffmpeg_path));
    }
    
    // Output klasörünü belirle
    let output_path_base = if let Some(custom_dir) = output_dir {
        PathBuf::from(custom_dir)
    } else {
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("App data dizini alınamadı: {}", e))?;
        app_data_dir.join("converted_videos")
    };
    
    fs::create_dir_all(&output_path_base).map_err(|e| format!("Klasör oluşturulamadı: {}", e))?;
    
    // Dosya bilgilerini al
    let original_path = PathBuf::from(&file_path);
    let original_name = original_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();
    
    // Yeni dosya adı oluştur
    let id = Uuid::new_v4().to_string();
    let file_stem = original_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("converted");
    let converted_name = format!("{}_{}.mp4", file_stem, &id[..8]);
    let output_path = output_path_base.join(&converted_name);
    
    // Quality preset belirle (CRF: düşük = yüksek kalite, yüksek = düşük kalite)
    let (crf, preset, tune) = match quality.as_deref() {
        Some("ultra") => ("15", "slow", "film"),      // En yüksek kalite, yavaş encode
        Some("high") => ("18", "medium", "film"),     // Yüksek kalite
        Some("medium") => ("23", "medium", "film"),   // Dengeli (önerilen)
        Some("low") => ("28", "fast", ""),            // Düşük kalite, hızlı encode
        Some("verylow") => ("32", "veryfast", ""),    // En düşük kalite, çok hızlı
        _ => ("23", "medium", "film"),                // default medium
    };
    
    // FFmpeg komutu - daha iyi optimizasyon parametreleri
    let mut args = vec![
        "-i", &file_path,
        "-c:v", "libx264",                // H.264 codec
        "-crf", crf,                       // Quality
        "-preset", preset,                 // Encoding speed/compression
    ];
    
    // Tune parametresi varsa ekle
    if !tune.is_empty() {
        args.push("-tune");
        args.push(tune);
    }
    
    // Diğer optimizasyon parametreleri
    args.extend_from_slice(&[
        "-profile:v", "high",              // H.264 profile
        "-level", "4.1",                   // H.264 level
        "-pix_fmt", "yuv420p",             // Pixel format (uyumluluk için)
        "-c:a", "aac",                     // Audio codec
        "-b:a", "128k",                    // Audio bitrate
        "-ar", "48000",                    // Audio sample rate
        "-movflags", "+faststart",         // Web optimize (metadata başa)
        "-max_muxing_queue_size", "1024",  // Büyük dosyalar için
        "-y",                              // Overwrite
        output_path.to_str().unwrap()
    ]);
    
    // FFmpeg komutu çalıştır
    let output = Command::new(&ffmpeg_path)
        .args(&args)
        .output()
        .map_err(|e| format!("FFmpeg çalıştırılamadı: {}. Lütfen uygulamayı yeniden başlatın.", e))?;
    
    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Video dönüştürme hatası: {}", error));
    }
    
    // Dosya boyutunu al
    let file_size = fs::metadata(&output_path)
        .map(|m| m.len())
        .unwrap_or(0);
    
    // Video süresini al
    let duration_output = Command::new(&ffprobe_path)
        .args(&[
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            output_path.to_str().unwrap()
        ])
        .output()
        .ok();
    
    let duration = if let Some(out) = duration_output {
        let dur_str = String::from_utf8_lossy(&out.stdout);
        let seconds: f64 = dur_str.trim().parse().unwrap_or(0.0);
        format!("{:.1}s", seconds)
    } else {
        "Unknown".to_string()
    };
    
    // Timestamp oluştur
    let created_at = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    
    Ok(ConvertedVideo {
        id,
        original_name,
        converted_name,
        file_size,
        output_path: output_path.display().to_string(),
        duration,
        created_at,
    })
}

#[tauri::command]
async fn get_video_thumbnail(
    file_path: String,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    use std::fs;
    use std::process::Command;
    use uuid::Uuid;
    
    // Dosyanın var olup olmadığını kontrol et
    let input_path = std::path::PathBuf::from(&file_path);
    if !input_path.exists() {
        return Err(format!("Video dosyası bulunamadı: {}", file_path));
    }
    
    // FFmpeg path'ini al
    let ffmpeg_path = if cfg!(debug_assertions) {
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        let ffmpeg = std::path::PathBuf::from(manifest_dir)
            .join("ffmpeg")
            .join("ffmpeg.exe");
        ffmpeg.to_str().unwrap().to_string()
    } else {
        app_handle
            .path()
            .resolve("ffmpeg.exe", tauri::path::BaseDirectory::Resource)
            .ok()
            .and_then(|p| p.to_str().map(|s| s.to_string()))
            .unwrap_or_else(|| "ffmpeg".to_string())
    };
    
    // Thumbnail klasörünü oluştur
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("App data dizini alınamadı: {}", e))?;
    let thumbnail_dir = app_data_dir.join("thumbnails");
    fs::create_dir_all(&thumbnail_dir).map_err(|e| format!("Klasör oluşturulamadı: {}", e))?;
    
    // Thumbnail dosya adı oluştur
    let id = Uuid::new_v4().to_string();
    let thumbnail_name = format!("thumb_{}.jpg", &id[..8]);
    let thumbnail_path = thumbnail_dir.join(&thumbnail_name);
    
    // Windows için path'i düzelt - forward slash kullan
    let file_path_normalized = file_path.replace("\\", "/");
    
    println!("FFmpeg path: {}", ffmpeg_path);
    println!("Input file: {}", file_path_normalized);
    println!("Output file: {}", thumbnail_path.display());
    
    // FFmpeg ile ilk frame'i al (1 saniyeden)
    let output = Command::new(&ffmpeg_path)
        .args(&[
            "-ss", "00:00:01",              // 1. saniyeden (input'tan önce daha hızlı)
            "-i", &file_path_normalized,
            "-vframes", "1",                 // 1 frame
            "-vf", "scale=320:-1",          // 320px genişlik, yükseklik otomatik
            "-q:v", "2",                     // Yüksek kalite JPEG
            "-y",
            thumbnail_path.to_str().unwrap()
        ])
        .output()
        .map_err(|e| format!("FFmpeg çalıştırılamadı: {}", e))?;
    
    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        println!("FFmpeg error: {}", error);
        return Err(format!("Thumbnail oluşturulamadı: {}", error));
    }
    
    // Thumbnail'in oluştuğunu kontrol et
    if !thumbnail_path.exists() {
        return Err("Thumbnail dosyası oluşturulamadı".to_string());
    }
    
    // Thumbnail'i base64 olarak döndür
    let bytes = fs::read(&thumbnail_path)
        .map_err(|e| format!("Thumbnail okunamadı: {}", e))?;
    
    let base64_data = base64::Engine::encode(&base64::engine::general_purpose::STANDARD, &bytes);
    
    Ok(format!("data:image/jpeg;base64,{}", base64_data))
}

#[tauri::command]
async fn merge_videos(
    file_paths: Vec<String>,
    output_dir: Option<String>,
    app_handle: tauri::AppHandle,
) -> Result<ConvertedVideo, String> {
    use std::fs;
    use std::io::Write;
    use std::process::Command;
    use uuid::Uuid;
    
    if file_paths.is_empty() {
        return Err("En az bir video seçmelisiniz".to_string());
    }
    
    // FFmpeg path'ini al
    let ffmpeg_path = if cfg!(debug_assertions) {
        // Dev mode: src-tauri/ffmpeg/ffmpeg.exe kullan
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        let ffmpeg = std::path::PathBuf::from(manifest_dir)
            .join("ffmpeg")
            .join("ffmpeg.exe");
        ffmpeg.to_str().unwrap().to_string()
    } else {
        // Production: bundle'dan al
        app_handle
            .path()
            .resolve("ffmpeg.exe", tauri::path::BaseDirectory::Resource)
            .ok()
            .and_then(|p| p.to_str().map(|s| s.to_string()))
            .unwrap_or_else(|| "ffmpeg".to_string())
    };
    
    let ffprobe_path = if cfg!(debug_assertions) {
        // Dev mode: src-tauri/ffmpeg/ffprobe.exe kullan
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        let ffprobe = std::path::PathBuf::from(manifest_dir)
            .join("ffmpeg")
            .join("ffprobe.exe");
        ffprobe.to_str().unwrap().to_string()
    } else {
        // Production: bundle'dan al
        app_handle
            .path()
            .resolve("ffprobe.exe", tauri::path::BaseDirectory::Resource)
            .ok()
            .and_then(|p| p.to_str().map(|s| s.to_string()))
            .unwrap_or_else(|| "ffprobe".to_string())
    };
    
    // Output klasörünü belirle
    let output_path_base = if let Some(custom_dir) = output_dir {
        PathBuf::from(custom_dir)
    } else {
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("App data dizini alınamadı: {}", e))?;
        app_data_dir.join("converted_videos")
    };
    
    fs::create_dir_all(&output_path_base).map_err(|e| format!("Klasör oluşturulamadı: {}", e))?;
    
    // Yeni dosya adı oluştur
    let id = Uuid::new_v4().to_string();
    let converted_name = format!("merged_{}.mp4", &id[..8]);
    let output_path = output_path_base.join(&converted_name);
    
    // Geçici concat dosyası oluştur
    let concat_file_path = output_path_base.join(format!("concat_{}.txt", &id[..8]));
    let mut concat_file = fs::File::create(&concat_file_path)
        .map_err(|e| format!("Concat dosyası oluşturulamadı: {}", e))?;
    
    for path in &file_paths {
        writeln!(concat_file, "file '{}'", path.replace("\\", "/"))
            .map_err(|e| format!("Concat dosyasına yazılamadı: {}", e))?;
    }
    drop(concat_file);
    
    // FFmpeg ile birleştir - re-encode ile daha iyi kalite
    let output = Command::new(&ffmpeg_path)
        .args(&[
            "-f", "concat",
            "-safe", "0",
            "-i", concat_file_path.to_str().unwrap(),
            "-c:v", "libx264",              // Video codec
            "-crf", "18",                    // Yüksek kalite
            "-preset", "medium",             // Encoding speed
            "-profile:v", "high",            // H.264 profile
            "-level", "4.1",                 // H.264 level
            "-pix_fmt", "yuv420p",           // Pixel format
            "-c:a", "aac",                   // Audio codec
            "-b:a", "192k",                  // Daha yüksek audio bitrate
            "-ar", "48000",                  // Audio sample rate
            "-movflags", "+faststart",       // Web optimize
            "-max_muxing_queue_size", "1024",
            "-y",
            output_path.to_str().unwrap()
        ])
        .output()
        .map_err(|e| format!("FFmpeg çalıştırılamadı: {}", e))?;
    
    // Geçici dosyayı sil
    let _ = fs::remove_file(&concat_file_path);
    
    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Video birleştirme hatası: {}", error));
    }
    
    // Dosya boyutunu al
    let file_size = fs::metadata(&output_path)
        .map(|m| m.len())
        .unwrap_or(0);
    
    // Video süresini al
    let duration_output = Command::new(&ffprobe_path)
        .args(&[
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            output_path.to_str().unwrap()
        ])
        .output()
        .ok();
    
    let duration = if let Some(out) = duration_output {
        let dur_str = String::from_utf8_lossy(&out.stdout);
        let seconds: f64 = dur_str.trim().parse().unwrap_or(0.0);
        format!("{:.1}s", seconds)
    } else {
        "Unknown".to_string()
    };
    
    let created_at = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();
    
    Ok(ConvertedVideo {
        id,
        original_name: format!("{} videos merged", file_paths.len()),
        converted_name,
        file_size,
        output_path: output_path.display().to_string(),
        duration,
        created_at,
    })
}

#[tauri::command]
async fn get_video_duration(
    file_path: String,
    app_handle: tauri::AppHandle,
) -> Result<f64, String> {
    use std::process::Command;
    
    // Dosyanın var olup olmadığını kontrol et
    let input_path = std::path::PathBuf::from(&file_path);
    if !input_path.exists() {
        return Err(format!("Video dosyası bulunamadı: {}", file_path));
    }
    
    // FFprobe path'ini al
    let ffprobe_path = if cfg!(debug_assertions) {
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        let ffprobe = std::path::PathBuf::from(manifest_dir)
            .join("ffmpeg")
            .join("ffprobe.exe");
        ffprobe.to_str().unwrap().to_string()
    } else {
        app_handle
            .path()
            .resolve("ffprobe.exe", tauri::path::BaseDirectory::Resource)
            .ok()
            .and_then(|p| p.to_str().map(|s| s.to_string()))
            .unwrap_or_else(|| "ffprobe".to_string())
    };
    
    // Windows için path'i düzelt
    let file_path_normalized = file_path.replace("\\", "/");
    
    // FFprobe ile süreyi al
    let output = Command::new(&ffprobe_path)
        .args(&[
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            &file_path_normalized
        ])
        .output()
        .map_err(|e| format!("FFprobe çalıştırılamadı: {}", e))?;
    
    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Video süresi alınamadı: {}", error));
    }
    
    let duration_str = String::from_utf8_lossy(&output.stdout);
    let duration: f64 = duration_str.trim().parse().unwrap_or(0.0);
    
    Ok(duration)
}

#[derive(Debug, serde::Deserialize)]
struct TimelineClipData {
    path: String,
    trim_start: f64,
    trim_end: f64,
    track: String,
}

#[tauri::command]
async fn export_timeline(
    clips: Vec<TimelineClipData>,
    quality: String,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    use std::fs;
    use std::io::Write;
    use std::process::Command;
    use uuid::Uuid;
    
    if clips.is_empty() {
        return Err("Timeline boş!".to_string());
    }
    
    // FFmpeg path'ini al
    let ffmpeg_path = if cfg!(debug_assertions) {
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        let ffmpeg = std::path::PathBuf::from(manifest_dir)
            .join("ffmpeg")
            .join("ffmpeg.exe");
        ffmpeg.to_str().unwrap().to_string()
    } else {
        app_handle
            .path()
            .resolve("ffmpeg.exe", tauri::path::BaseDirectory::Resource)
            .ok()
            .and_then(|p| p.to_str().map(|s| s.to_string()))
            .unwrap_or_else(|| "ffmpeg".to_string())
    };
    
    // Output klasörünü belirle
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("App data dizini alınamadı: {}", e))?;
    let output_dir = app_data_dir.join("exported_videos");
    fs::create_dir_all(&output_dir).map_err(|e| format!("Klasör oluşturulamadı: {}", e))?;
    
    // Temp klasör
    let temp_dir = app_data_dir.join("temp");
    fs::create_dir_all(&temp_dir).map_err(|e| format!("Temp klasör oluşturulamadı: {}", e))?;
    
    let id = Uuid::new_v4().to_string();
    
    // Her clip'i trim et ve temp dosyalara kaydet
    let mut trimmed_files = Vec::new();
    
    for (i, clip) in clips.iter().enumerate() {
        let temp_file = temp_dir.join(format!("clip_{}_{}.mp4", &id[..8], i));
        
        // Trim işlemi
        let duration = clip.trim_end - clip.trim_start;
        
        let output = Command::new(&ffmpeg_path)
            .args(&[
                "-ss", &clip.trim_start.to_string(),
                "-i", &clip.path,
                "-t", &duration.to_string(),
                "-c", "copy",
                "-y",
                temp_file.to_str().unwrap()
            ])
            .output()
            .map_err(|e| format!("FFmpeg trim hatası: {}", e))?;
        
        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Clip trim hatası: {}", error));
        }
        
        trimmed_files.push(temp_file);
    }
    
    // Concat dosyası oluştur
    let concat_file = temp_dir.join(format!("concat_{}.txt", &id[..8]));
    let mut concat_content = fs::File::create(&concat_file)
        .map_err(|e| format!("Concat dosyası oluşturulamadı: {}", e))?;
    
    for file in &trimmed_files {
        writeln!(concat_content, "file '{}'", file.to_str().unwrap().replace("\\", "/"))
            .map_err(|e| format!("Concat yazma hatası: {}", e))?;
    }
    drop(concat_content);
    
    // Final output
    let output_name = format!("export_{}.mp4", &id[..8]);
    let output_path = output_dir.join(&output_name);
    
    // Quality ayarları
    let (crf, preset) = match quality.as_str() {
        "ultra" => ("15", "slow"),
        "high" => ("18", "medium"),
        "medium" => ("23", "medium"),
        "low" => ("28", "fast"),
        _ => ("23", "medium"),
    };
    
    // Final encode
    let output = Command::new(&ffmpeg_path)
        .args(&[
            "-f", "concat",
            "-safe", "0",
            "-i", concat_file.to_str().unwrap(),
            "-c:v", "libx264",
            "-crf", crf,
            "-preset", preset,
            "-c:a", "aac",
            "-b:a", "192k",
            "-movflags", "+faststart",
            "-y",
            output_path.to_str().unwrap()
        ])
        .output()
        .map_err(|e| format!("FFmpeg encode hatası: {}", e))?;
    
    // Temp dosyaları temizle
    for file in trimmed_files {
        let _ = fs::remove_file(file);
    }
    let _ = fs::remove_file(concat_file);
    
    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Export hatası: {}", error));
    }
    
    Ok(output_path.display().to_string())
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
            get_default_output_path,
            get_image_data_url,
            optimize_video,
            merge_videos,
            get_video_thumbnail,
            get_video_duration,
            export_timeline
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

