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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DomainInfo {
    id: String,
    domain: String,
    ssl_status: String,
    ssl_start: String,
    ssl_end: String,
    ssl_days: i64,
    ssl_issuer: String,
    domain_status: String,
    domain_start: String,
    domain_end: String,
    domain_days: i64,
    last_checked: String,
}

fn resolve_binary_path(app_handle: &tauri::AppHandle, file_name: &str) -> Result<PathBuf, String> {
    let mut candidates = Vec::new();
    let bundled_relative_path = format!("ffmpeg/{}", file_name);

    if let Ok(manifest_dir) = std::env::var("CARGO_MANIFEST_DIR") {
        candidates.push(PathBuf::from(&manifest_dir).join("ffmpeg").join(file_name));
        candidates.push(
            PathBuf::from(&manifest_dir)
                .join("target")
                .join("release")
                .join("ffmpeg")
                .join(file_name),
        );
    }

    if let Ok(path) = app_handle
        .path()
        .resolve(&bundled_relative_path, tauri::path::BaseDirectory::Resource)
    {
        candidates.push(path);
    }

    if let Ok(path) = app_handle
        .path()
        .resolve(file_name, tauri::path::BaseDirectory::Resource)
    {
        candidates.push(path);
    }

    if let Ok(current_exe) = std::env::current_exe() {
        if let Some(exe_dir) = current_exe.parent() {
            candidates.push(exe_dir.join("ffmpeg").join(file_name));
            candidates.push(exe_dir.join("resources").join("ffmpeg").join(file_name));
            candidates.push(exe_dir.join("resources").join(file_name));
            candidates.push(exe_dir.join(file_name));
        }
    }

    candidates.push(PathBuf::from(file_name));

    candidates
        .into_iter()
        .find(|candidate| candidate.exists())
        .ok_or_else(|| {
            format!(
                "{} bulunamadi. Paket icinde ffmpeg kaynaklarinin bulundugunu dogrulayin.",
                file_name
            )
        })
}

fn escape_ffmpeg_concat_path(path: &str) -> String {
    path.replace('\\', "/").replace('\'', "'\\''")
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

    let img = image::open(&file_path).map_err(|e| format!("Resim acilamadi: {}", e))?;

    let output_path_base = if let Some(custom_dir) = output_dir {
        PathBuf::from(custom_dir)
    } else {
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("App data dizini alinamadi: {}", e))?;
        app_data_dir.join("converted_images")
    };

    fs::create_dir_all(&output_path_base).map_err(|e| format!("Klasor olusturulamadi: {}", e))?;

    let original_path = PathBuf::from(&file_path);
    let original_name = original_path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("unknown")
        .to_string();

    let original_format = original_path
        .extension()
        .and_then(|extension| extension.to_str())
        .unwrap_or("unknown")
        .to_uppercase();

    let id = Uuid::new_v4().to_string();
    let file_stem = original_path
        .file_stem()
        .and_then(|stem| stem.to_str())
        .unwrap_or("converted");
    let converted_name = format!(
        "{}_{}.{}",
        file_stem,
        &id[..8],
        output_format.to_lowercase()
    );
    let output_path = output_path_base.join(&converted_name);

    let quality_value = quality.unwrap_or(85);

    match output_format.to_lowercase().as_str() {
        "png" => {
            use image::codecs::png::{CompressionType, FilterType, PngEncoder};

            let file = fs::File::create(&output_path)
                .map_err(|e| format!("Dosya olusturulamadi: {}", e))?;

            let compression = if quality_value < 50 {
                CompressionType::Best
            } else if quality_value < 80 {
                CompressionType::Default
            } else {
                CompressionType::Fast
            };

            let encoder = PngEncoder::new_with_quality(file, compression, FilterType::Adaptive);
            img.write_with_encoder(encoder)
                .map_err(|e| format!("PNG kaydedilemedi: {}", e))?;
        }
        "jpg" | "jpeg" => {
            use image::codecs::jpeg::JpegEncoder;

            let file = fs::File::create(&output_path)
                .map_err(|e| format!("Dosya olusturulamadi: {}", e))?;
            let mut encoder = JpegEncoder::new_with_quality(file, quality_value);
            let rgb_img = img.to_rgb8();

            encoder
                .encode(
                    rgb_img.as_raw(),
                    rgb_img.width(),
                    rgb_img.height(),
                    image::ExtendedColorType::Rgb8,
                )
                .map_err(|e| format!("JPEG kaydedilemedi: {}", e))?;
        }
        "webp" => {
            use webp::Encoder;

            let rgb_img = img.to_rgb8();
            let (width, height) = rgb_img.dimensions();
            let encoder = Encoder::from_rgb(&rgb_img, width, height);
            let webp_data = if quality_value >= 100 {
                encoder.encode_lossless()
            } else {
                encoder.encode(quality_value as f32)
            };

            fs::write(&output_path, &*webp_data)
                .map_err(|e| format!("WebP kaydedilemedi: {}", e))?;
        }
        "gif" => img
            .save_with_format(&output_path, ImageFormat::Gif)
            .map_err(|e| format!("GIF kaydedilemedi: {}", e))?,
        "bmp" => img
            .save_with_format(&output_path, ImageFormat::Bmp)
            .map_err(|e| format!("BMP kaydedilemedi: {}", e))?,
        "ico" => img
            .save_with_format(&output_path, ImageFormat::Ico)
            .map_err(|e| format!("ICO kaydedilemedi: {}", e))?,
        "tiff" | "tif" => img
            .save_with_format(&output_path, ImageFormat::Tiff)
            .map_err(|e| format!("TIFF kaydedilemedi: {}", e))?,
        _ => return Err(format!("Desteklenmeyen format: {}", output_format)),
    }

    let file_size = fs::metadata(&output_path)
        .map(|metadata| metadata.len())
        .unwrap_or(0);
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
async fn delete_converted_image(_id: String, file_path: String) -> Result<(), String> {
    use std::fs;

    let path = PathBuf::from(&file_path);
    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("Dosya silinemedi: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
async fn delete_converted_video(_id: String, file_path: String) -> Result<(), String> {
    use std::fs;

    let path = PathBuf::from(&file_path);
    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("Dosya silinemedi: {}", e))?;
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
            .arg(format!("/select,{}", path.display()))
            .spawn()
            .map_err(|e| format!("Klasor acilamadi: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("-R")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Klasor acilamadi: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        let parent = path.parent().ok_or("Klasor bulunamadi")?;
        Command::new("xdg-open")
            .arg(parent)
            .spawn()
            .map_err(|e| format!("Klasor acilamadi: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
async fn get_default_output_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("App data dizini alinamadi: {}", e))?;

    Ok(app_data_dir.join("converted_images").display().to_string())
}

#[tauri::command]
async fn get_database_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("App data dizini alinamadi: {}", e))?;

    Ok(app_data_dir.join("images.db").display().to_string())
}

#[tauri::command]
async fn get_image_data_url(file_path: String) -> Result<String, String> {
    use std::fs;

    let path = PathBuf::from(&file_path);
    let bytes = fs::read(&path).map_err(|e| format!("Dosya okunamadi: {}", e))?;

    let mime_type = match path.extension().and_then(|extension| extension.to_str()) {
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("webp") => "image/webp",
        Some("gif") => "image/gif",
        Some("bmp") => "image/bmp",
        Some("ico") => "image/x-icon",
        Some("tiff") | Some("tif") => "image/tiff",
        _ => "image/png",
    };

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

    let ffmpeg_path = resolve_binary_path(&app_handle, "ffmpeg.exe")?;
    let ffprobe_path = resolve_binary_path(&app_handle, "ffprobe.exe")?;

    let output_path_base = if let Some(custom_dir) = output_dir {
        PathBuf::from(custom_dir)
    } else {
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("App data dizini alinamadi: {}", e))?;
        app_data_dir.join("converted_videos")
    };

    fs::create_dir_all(&output_path_base).map_err(|e| format!("Klasor olusturulamadi: {}", e))?;

    let original_path = PathBuf::from(&file_path);
    let original_name = original_path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("unknown")
        .to_string();

    let id = Uuid::new_v4().to_string();
    let file_stem = original_path
        .file_stem()
        .and_then(|stem| stem.to_str())
        .unwrap_or("converted");
    let converted_name = format!("{}_{}.mp4", file_stem, &id[..8]);
    let output_path = output_path_base.join(&converted_name);
    let output_path_str = output_path
        .to_str()
        .ok_or_else(|| "Gecersiz output path".to_string())?
        .to_string();

    let (crf, preset, tune) = match quality.as_deref() {
        Some("ultra") => ("15", "slow", "film"),
        Some("high") => ("18", "medium", "film"),
        Some("medium") => ("23", "medium", "film"),
        Some("low") => ("28", "fast", ""),
        Some("verylow") => ("32", "veryfast", ""),
        _ => ("23", "medium", "film"),
    };

    let mut args = vec![
        "-i".to_string(),
        file_path.clone(),
        "-c:v".to_string(),
        "libx264".to_string(),
        "-crf".to_string(),
        crf.to_string(),
        "-preset".to_string(),
        preset.to_string(),
    ];

    if !tune.is_empty() {
        args.push("-tune".to_string());
        args.push(tune.to_string());
    }

    args.extend_from_slice(&[
        "-profile:v".to_string(),
        "high".to_string(),
        "-level".to_string(),
        "4.1".to_string(),
        "-pix_fmt".to_string(),
        "yuv420p".to_string(),
        "-c:a".to_string(),
        "aac".to_string(),
        "-b:a".to_string(),
        "128k".to_string(),
        "-ar".to_string(),
        "48000".to_string(),
        "-movflags".to_string(),
        "+faststart".to_string(),
        "-max_muxing_queue_size".to_string(),
        "1024".to_string(),
        "-y".to_string(),
        output_path_str.clone(),
    ]);

    let output = Command::new(&ffmpeg_path)
        .args(&args)
        .output()
        .map_err(|e| format!("FFmpeg calistirilamadi: {}", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Video donusturme hatasi: {}", error));
    }

    let file_size = fs::metadata(&output_path)
        .map(|metadata| metadata.len())
        .unwrap_or(0);

    let duration_output = Command::new(&ffprobe_path)
        .args(&[
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            output_path_str.as_str(),
        ])
        .output()
        .ok();

    let duration = if let Some(output) = duration_output {
        let duration_text = String::from_utf8_lossy(&output.stdout);
        let seconds: f64 = duration_text.trim().parse().unwrap_or(0.0);
        format!("{:.1}s", seconds)
    } else {
        "Unknown".to_string()
    };

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

    let input_path = PathBuf::from(&file_path);
    if !input_path.exists() {
        return Err(format!("Video dosyasi bulunamadi: {}", file_path));
    }

    let ffmpeg_path = resolve_binary_path(&app_handle, "ffmpeg.exe")?;
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("App data dizini alinamadi: {}", e))?;
    let thumbnail_dir = app_data_dir.join("thumbnails");
    fs::create_dir_all(&thumbnail_dir).map_err(|e| format!("Klasor olusturulamadi: {}", e))?;

    let id = Uuid::new_v4().to_string();
    let thumbnail_name = format!("thumb_{}.jpg", &id[..8]);
    let thumbnail_path = thumbnail_dir.join(&thumbnail_name);
    let thumbnail_path_str = thumbnail_path
        .to_str()
        .ok_or_else(|| "Gecersiz thumbnail path".to_string())?
        .to_string();

    let output = Command::new(&ffmpeg_path)
        .args(&[
            "-ss",
            "0",
            "-i",
            file_path.as_str(),
            "-vframes",
            "1",
            "-vf",
            "thumbnail,scale=320:-1",
            "-q:v",
            "2",
            "-y",
            thumbnail_path_str.as_str(),
        ])
        .output()
        .map_err(|e| format!("FFmpeg calistirilamadi: {}", e))?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Thumbnail olusturulamadi: {}", error));
    }

    if !thumbnail_path.exists() {
        return Err("Thumbnail dosyasi olusturulamadi".to_string());
    }

    let bytes = fs::read(&thumbnail_path).map_err(|e| format!("Thumbnail okunamadi: {}", e))?;
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
        return Err("En az bir video secmelisiniz".to_string());
    }

    let ffmpeg_path = resolve_binary_path(&app_handle, "ffmpeg.exe")?;
    let ffprobe_path = resolve_binary_path(&app_handle, "ffprobe.exe")?;

    let output_path_base = if let Some(custom_dir) = output_dir {
        PathBuf::from(custom_dir)
    } else {
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("App data dizini alinamadi: {}", e))?;
        app_data_dir.join("converted_videos")
    };

    fs::create_dir_all(&output_path_base).map_err(|e| format!("Klasor olusturulamadi: {}", e))?;

    let id = Uuid::new_v4().to_string();
    let converted_name = format!("merged_{}.mp4", &id[..8]);
    let output_path = output_path_base.join(&converted_name);
    let output_path_str = output_path
        .to_str()
        .ok_or_else(|| "Gecersiz output path".to_string())?
        .to_string();

    let concat_file_path = output_path_base.join(format!("concat_{}.txt", &id[..8]));
    let concat_file_path_str = concat_file_path
        .to_str()
        .ok_or_else(|| "Gecersiz concat path".to_string())?
        .to_string();
    let mut concat_file = fs::File::create(&concat_file_path)
        .map_err(|e| format!("Concat dosyasi olusturulamadi: {}", e))?;

    for path in &file_paths {
        writeln!(concat_file, "file '{}'", escape_ffmpeg_concat_path(path))
            .map_err(|e| format!("Concat dosyasina yazilamadi: {}", e))?;
    }
    drop(concat_file);

    let output = Command::new(&ffmpeg_path)
        .args(&[
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            concat_file_path_str.as_str(),
            "-c:v",
            "libx264",
            "-crf",
            "18",
            "-preset",
            "medium",
            "-profile:v",
            "high",
            "-level",
            "4.1",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-ar",
            "48000",
            "-movflags",
            "+faststart",
            "-max_muxing_queue_size",
            "1024",
            "-y",
            output_path_str.as_str(),
        ])
        .output()
        .map_err(|e| format!("FFmpeg calistirilamadi: {}", e))?;

    let _ = fs::remove_file(&concat_file_path);

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Video birlestirme hatasi: {}", error));
    }

    let file_size = fs::metadata(&output_path)
        .map(|metadata| metadata.len())
        .unwrap_or(0);

    let duration_output = Command::new(&ffprobe_path)
        .args(&[
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            output_path_str.as_str(),
        ])
        .output()
        .ok();

    let duration = if let Some(output) = duration_output {
        let duration_text = String::from_utf8_lossy(&output.stdout);
        let seconds: f64 = duration_text.trim().parse().unwrap_or(0.0);
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
async fn check_ssl_certificate(domain: String) -> Result<DomainInfo, String> {
    use uuid::Uuid;

    let clean_domain = domain
        .replace("http://", "")
        .replace("https://", "")
        .replace("/", "")
        .trim()
        .to_string();

    if clean_domain.is_empty() {
        return Err("Gecersiz domain".to_string());
    }

    let id = Uuid::new_v4().to_string();
    let last_checked = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let (ssl_status, ssl_start, ssl_end, ssl_days, ssl_issuer) =
        match check_ssl_info(&clean_domain).await {
            Ok(info) => info,
            Err(_) => (
                "? Durmus / Yok".to_string(),
                "-".to_string(),
                "-".to_string(),
                0,
                "Bilinmiyor".to_string(),
            ),
        };

    let (domain_status, domain_start, domain_end, domain_days) =
        match check_whois_info(&clean_domain).await {
            Ok(info) => info,
            Err(_) => (
                "? Bilinmiyor".to_string(),
                "-".to_string(),
                "-".to_string(),
                0,
            ),
        };

    Ok(DomainInfo {
        id,
        domain: clean_domain,
        ssl_status,
        ssl_start,
        ssl_end,
        ssl_days,
        ssl_issuer,
        domain_status,
        domain_start,
        domain_end,
        domain_days,
        last_checked,
    })
}

async fn check_ssl_info(domain: &str) -> Result<(String, String, String, i64, String), String> {
    use native_tls::TlsConnector;
    use std::net::TcpStream;
    use x509_parser::prelude::*;

    let stream = TcpStream::connect(format!("{}:443", domain))
        .map_err(|e| format!("Baglanti hatasi: {}", e))?;
    let connector = TlsConnector::new().map_err(|e| format!("TLS connector hatasi: {}", e))?;
    let tls_stream = connector
        .connect(domain, stream)
        .map_err(|e| format!("TLS baglanti hatasi: {}", e))?;

    let cert_der = tls_stream
        .peer_certificate()
        .map_err(|e| format!("Sertifika alinamadi: {}", e))?
        .ok_or("Sertifika bulunamadi")?
        .to_der()
        .map_err(|e| format!("DER donusum hatasi: {}", e))?;

    let (_, cert) = X509Certificate::from_der(&cert_der)
        .map_err(|e| format!("Sertifika parse hatasi: {}", e))?;

    let start_time = cert.validity().not_before.timestamp();
    let ssl_start = chrono::DateTime::from_timestamp(start_time, 0)
        .map(|date_time| date_time.format("%d.%m.%Y").to_string())
        .unwrap_or("-".to_string());

    let end_time = cert.validity().not_after.timestamp();
    let ssl_end = chrono::DateTime::from_timestamp(end_time, 0)
        .map(|date_time| date_time.format("%d.%m.%Y").to_string())
        .unwrap_or("-".to_string());

    let now = chrono::Utc::now().timestamp();
    let ssl_days = (end_time - now) / 86400;
    let ssl_status = if ssl_days > 0 {
        "OK Calisiyor".to_string()
    } else {
        "? Suresi Bitmis".to_string()
    };

    let ssl_issuer = cert
        .issuer()
        .iter_organization()
        .next()
        .and_then(|attribute| attribute.as_str().ok())
        .unwrap_or("Bilinmiyor")
        .to_string();

    Ok((ssl_status, ssl_start, ssl_end, ssl_days, ssl_issuer))
}

async fn check_whois_info(domain: &str) -> Result<(String, String, String, i64), String> {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    use tokio::net::TcpStream;
    use tokio::time::{timeout, Duration};

    let whois_server = "whois.iana.org:43";

    let stream = timeout(Duration::from_secs(5), TcpStream::connect(whois_server))
        .await
        .map_err(|_| "WHOIS baglanti zaman asimi")?
        .map_err(|e| format!("WHOIS baglanti hatasi: {}", e))?;
    let mut stream = stream;

    stream
        .write_all(format!("{}\r\n", domain).as_bytes())
        .await
        .map_err(|e| format!("WHOIS yazma hatasi: {}", e))?;

    let mut response = String::new();
    stream
        .read_to_string(&mut response)
        .await
        .map_err(|e| format!("WHOIS okuma hatasi: {}", e))?;

    let actual_whois = if let Some(line) = response
        .lines()
        .find(|line| line.to_lowercase().starts_with("refer:"))
    {
        line.split(':').nth(1).unwrap_or("").trim().to_string()
    } else {
        return Err("WHOIS sunucusu bulunamadi".to_string());
    };

    let stream = timeout(
        Duration::from_secs(5),
        TcpStream::connect(format!("{}:43", actual_whois)),
    )
    .await
    .map_err(|_| "WHOIS baglanti zaman asimi")?
    .map_err(|e| format!("WHOIS baglanti hatasi: {}", e))?;
    let mut stream = stream;

    stream
        .write_all(format!("{}\r\n", domain).as_bytes())
        .await
        .map_err(|e| format!("WHOIS yazma hatasi: {}", e))?;

    let mut response = String::new();
    stream
        .read_to_string(&mut response)
        .await
        .map_err(|e| format!("WHOIS okuma hatasi: {}", e))?;

    let domain_start = parse_whois_date(
        &response,
        &[
            "creation date",
            "created on",
            "registration time",
            "created",
        ],
    )
    .unwrap_or("-".to_string());

    let domain_end = parse_whois_date(
        &response,
        &[
            "expiry date",
            "expiration date",
            "registry expiry date",
            "expires",
        ],
    )
    .unwrap_or("-".to_string());

    let domain_days = if domain_end != "-" {
        calculate_days_until(&domain_end)
    } else {
        0
    };

    let domain_status = if domain_days > 1 {
        "OK Calisiyor".to_string()
    } else {
        "? Suresi Bitmis".to_string()
    };

    Ok((domain_status, domain_start, domain_end, domain_days))
}

fn parse_whois_date(response: &str, keywords: &[&str]) -> Option<String> {
    for line in response.lines() {
        let line_lower = line.to_lowercase();
        for keyword in keywords {
            if line_lower.starts_with(keyword) {
                if let Some(date_str) = line.split(':').nth(1) {
                    let date_str = date_str.trim().split_whitespace().next()?;
                    if let Ok(parsed) = chrono::DateTime::parse_from_rfc3339(date_str) {
                        return Some(parsed.format("%d.%m.%Y").to_string());
                    }
                    if let Ok(parsed) =
                        chrono::NaiveDateTime::parse_from_str(date_str, "%Y-%m-%dT%H:%M:%SZ")
                    {
                        return Some(parsed.format("%d.%m.%Y").to_string());
                    }
                    if let Ok(parsed) = chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
                        return Some(parsed.format("%d.%m.%Y").to_string());
                    }
                }
            }
        }
    }

    None
}

fn calculate_days_until(date_str: &str) -> i64 {
    if let Ok(date) = chrono::NaiveDate::parse_from_str(date_str, "%d.%m.%Y") {
        let now = chrono::Local::now().date_naive();
        (date - now).num_days()
    } else {
        0
    }
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
            delete_converted_video,
            open_file_location,
            get_default_output_path,
            get_database_path,
            get_image_data_url,
            optimize_video,
            merge_videos,
            get_video_thumbnail,
            check_ssl_certificate
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
